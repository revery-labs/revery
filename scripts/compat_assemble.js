#!/usr/bin/env node
/**
 * 合盘内容装配器（阶段3）· 与 assemble.js 同构。
 * 输入：pipeline/关系病理_定稿.md（人工回填的 8 类型×4 字段 + 12 星座钩子）
 *       src/data/合盘映射表.json（仅取其 types 做「类型名逐字一致」校验）
 * 输出：src/data/关系病理.json（运行时数据，被打包；compat.js 读它）
 *
 * 校验门（任一失败直接抛错，不 fallback、不跳过坏条目）：
 *   1. 8 个类型齐全，且类型名与 合盘映射表.json 的 types 逐字一致（双向）。
 *   2. 每型 4 个字段（关系病名 / 双人主诉 / 病程预测 / 双人医嘱）非空。
 *   3. 12 段对方星座钩子齐全、非空。
 *   4. 任何〔占位〕/【占位】残留即失败。
 *   5. 黑名单字符串与禁令词过滤（沿用 enrich_results.js 现有列表）。
 *   6. 字段字数区间（区间值待定，见顶部 WORD_RANGES；null 表示暂不启用该项）。
 * 确定性：同一输入两次构建 byte-identical。
 *
 * 不碰 results.json，不碰 assemble.js 与 enrich_results.js。零新依赖（仅 fs/path）。
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PIPELINE = path.join(ROOT, "pipeline");
const OUT_JSON = path.join(ROOT, "src", "data", "关系病理.json");
const MAP_JSON = path.join(ROOT, "src", "data", "合盘映射表.json");

// ── 字段字数区间（待定：正文确定后填写 [下限, 上限]；[null, null] = 暂不启用该项字数门）──
const WORD_RANGES = {
  "病理定义": [40, 70],
  "双人主诉": [60, 100],
  "病程预测": [120, 180],
  "双人医嘱": [50, 80],
  "星座钩子": [40, 70],
};

// ── 黑名单 / 禁令词（镜像 enrich_results.js 的同名列表）──────────────────────────
const BLACKLIST = ["橙月","Gibson","凌晨三点半","九十秒","记录都留着","heels","跳舞","春暖花开","The Moment Is Over","蓝花楹","大西洋","黑胶"];
const BANNED_WORDS = ["放下","爱自己","成长","值得被爱","回避型依恋"];

const FIELDS = ["病理定义", "双人主诉", "病程预测", "双人医嘱"];
const SIGN_CN2SLUG = {
  "白羊": "aries", "金牛": "taurus", "双子": "gemini", "巨蟹": "cancer",
  "狮子": "leo", "处女": "virgo", "天秤": "libra", "天蝎": "scorpio",
  "射手": "sagittarius", "摩羯": "capricorn", "水瓶": "aquarius", "双鱼": "pisces",
};
const SIGN_SLUGS = Object.values(SIGN_CN2SLUG);

function readFile(p) {
  if (!fs.existsSync(p)) throw new Error(`缺少文件：${p}`);
  return fs.readFileSync(p, "utf8");
}

// ─────────────────────────── 解析 关系病理_定稿.md ───────────────────────────
function parse(text) {
  const section = (start, end) => {
    const from = text.indexOf(start);
    if (from < 0) throw new Error(`关系病理_定稿：找不到章节「${start}」`);
    const rest = text.slice(from + start.length);
    const to = end ? rest.indexOf(end) : -1;
    return to >= 0 ? rest.slice(0, to) : rest;
  };

  // §一 类型：### 类型名 + 4 行 `- **字段**：值`
  const types = {};
  for (const block of section("## 一、", "## 二、").split(/^### /m).slice(1)) {
    const nl = block.indexOf("\n");
    const name = block.slice(0, nl).trim();
    const body = block.slice(nl + 1);
    const fields = {};
    for (const f of FIELDS) {
      const m = body.match(new RegExp(`^- \\*\\*${f}\\*\\*：(.+)$`, "m"));
      if (!m) throw new Error(`关系病理_定稿：类型「${name}」缺少字段「${f}」`);
      fields[f] = m[1].trim();
    }
    types[name] = fields;
  }

  // §二 星座钩子：### 中文星座名 + 正文
  const signHooks = {};
  for (const block of section("## 二、", null).split(/^### /m).slice(1)) {
    const nl = block.indexOf("\n");
    const cn = block.slice(0, nl).trim();
    const slug = SIGN_CN2SLUG[cn];
    if (!slug) throw new Error(`关系病理_定稿：星座钩子标题无法识别：${cn}`);
    signHooks[slug] = block.slice(nl + 1).trim();
  }

  return { types, signHooks };
}

// ─────────────────────────── 校验门 ───────────────────────────
function assertNoPlaceholder(where, s) {
  const bad = String(s).match(/[〔【][^〕】]*[〕】]/g);
  if (bad) throw new Error(`关系病理：${where} 残留占位符：${bad.join(", ")}`);
}
function checkBanned(where, v) {
  for (const w of BLACKLIST) if (v.includes(w)) throw new Error(`关系病理：${where} 命中黑名单「${w}」`);
  for (const w of BANNED_WORDS) if (v.includes(w)) throw new Error(`关系病理：${where} 命中禁令词「${w}」`);
}
function checkWords(rangeKey, where, v) {
  const [lo, hi] = WORD_RANGES[rangeKey] || [null, null];
  if (lo == null && hi == null) return; // 未启用
  const n = [...v.replace(/\s/g, "")].length;
  if ((lo != null && n < lo) || (hi != null && n > hi)) {
    throw new Error(`关系病理：${where} 字数 ${n} 不在 ${lo}–${hi}`);
  }
}

function validate(parsed, mapTypes) {
  const { types, signHooks } = parsed;

  // 门1：8 类型齐全，且与映射表 types 逐字一致（双向）
  const names = Object.keys(types);
  if (names.length !== 8) throw new Error(`关系病理：类型数 ${names.length}，期望 8`);
  const mapSet = new Set(mapTypes);
  for (const n of names) if (!mapSet.has(n)) throw new Error(`关系病理：类型「${n}」不在 合盘映射表.json 的 types 内`);
  for (const n of mapTypes) if (!(n in types)) throw new Error(`关系病理：定稿缺少映射表 types 里的类型「${n}」`);

  // 门2：每型 4 字段 非空 / 占位 / 黑名单·禁令词 / 字数
  for (const [name, fields] of Object.entries(types)) {
    for (const f of FIELDS) {
      const v = fields[f];
      if (!v || !v.trim()) throw new Error(`关系病理：${name}.${f} 为空`);
      assertNoPlaceholder(`${name}.${f}`, v);
      checkBanned(`${name}.${f}`, v);
      checkWords(f, `${name}.${f}`, v);
    }
  }

  // 门3：12 星座钩子齐全 非空 / 占位 / 黑名单·禁令词 / 字数
  if (Object.keys(signHooks).length !== 12) throw new Error(`关系病理：星座钩子数 ${Object.keys(signHooks).length}，期望 12`);
  for (const slug of SIGN_SLUGS) {
    const v = signHooks[slug];
    if (v === undefined) throw new Error(`关系病理：缺少星座钩子 ${slug}`);
    if (!v.trim()) throw new Error(`关系病理：星座钩子 ${slug} 为空`);
    assertNoPlaceholder(`星座钩子.${slug}`, v);
    checkBanned(`星座钩子.${slug}`, v);
    checkWords("星座钩子", `星座钩子.${slug}`, v);
  }
}

// ─────────────────────────── 构建（确定性：键排序）───────────────────────────
function build(parsed) {
  const { types, signHooks } = parsed;
  const outTypes = {};
  for (const n of Object.keys(types).sort()) {
    const f = {};
    for (const k of FIELDS) f[k] = types[n][k];
    outTypes[n] = f;
  }
  const outHooks = {};
  for (const slug of Object.keys(signHooks).sort()) outHooks[slug] = signHooks[slug];
  return { types: outTypes, signHooks: outHooks };
}

function main() {
  const md = readFile(path.join(PIPELINE, "关系病理_定稿.md"));
  const mapTypes = JSON.parse(readFile(MAP_JSON)).types;

  const parsed = parse(md);
  validate(parsed, mapTypes);

  const s1 = JSON.stringify(build(parsed), null, 2);
  // 确定性门：再解析+构建一次，逐字节比对
  const s2 = JSON.stringify(build(parse(md)), null, 2);
  if (s1 !== s2) throw new Error("关系病理：两次构建不一致（存在非确定性来源）");

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, s1 + "\n", "utf8");
  const out = JSON.parse(s1);
  console.log(`已写出 ${path.relative(ROOT, OUT_JSON)}：${Object.keys(out.types).length} 类型 × ${FIELDS.length} 字段 + ${Object.keys(out.signHooks).length} 星座钩子`);
}

main();
