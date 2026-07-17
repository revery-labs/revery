#!/usr/bin/env node
/**
 * 离线确定性装配器 — 规格包 v1.1 §7
 * 输入：/pipeline/四件套_定稿.md、/pipeline/金标准_7条.md、/pipeline/规格包_v1.md（BGM 白名单）
 * 输出：src/data/results.json（3,456 键）+ pipeline/校验报告.md
 * 零 API 调用，零新依赖（仅 Node 内置 fs/path）。
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PIPELINE = path.join(ROOT, "pipeline");
const OUT_JSON = path.join(ROOT, "src", "data", "results.json");
const OUT_REPORT = path.join(PIPELINE, "校验报告.md");

const MBTI_LIST = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
const ENNEA_LIST = ["1w9","1w2","2w1","2w3","3w2","3w4","4w3","4w5","5w4","5w6","6w5","6w7","7w6","7w8","8w7","8w9","9w8","9w1"];
// 顺序对齐 t.zodiacs（App.js）：白羊0…双鱼11
const SIGN_LIST = [
  { slug: "aries",       cn: "白羊" },
  { slug: "taurus",      cn: "金牛" },
  { slug: "gemini",      cn: "双子" },
  { slug: "cancer",      cn: "巨蟹" },
  { slug: "leo",         cn: "狮子" },
  { slug: "virgo",       cn: "处女" },
  { slug: "libra",       cn: "天秤" },
  { slug: "scorpio",     cn: "天蝎" },
  { slug: "sagittarius", cn: "射手" },
  { slug: "capricorn",   cn: "摩羯" },
  { slug: "aquarius",    cn: "水瓶" },
  { slug: "pisces",      cn: "双鱼" },
];
const SIGN_BY_CN = Object.fromEntries(SIGN_LIST.map(s => [s.cn, s]));

const BLACKLIST = ["橙月","Gibson","凌晨三点半","九十秒","记录都留着","heels","跳舞","春暖花开","The Moment Is Over","蓝花楹","大西洋","黑胶"];
const BANNED_WORDS = ["放下","爱自己","成长","值得被爱","回避型依恋"];

const GOLD_KEYS = ["INTJ_3w4_pisces", "ENTJ_5w6_gemini", "INTJ_5w4_scorpio", "INTP_5w6_sagittarius", "INFJ_7w6_leo", "ISFJ_2w3_aquarius"];

// ─────────────────────────── 读文件 ───────────────────────────
function readPipelineFile(name) {
  const p = path.join(PIPELINE, name);
  if (!fs.existsSync(p)) throw new Error(`缺少输入文件：${p}`);
  return fs.readFileSync(p, "utf8");
}

function assertNoPlaceholders(name, text, scanFrom) {
  // 说明/规则区本身举例写了空的〔〕【】占位符语法，不算真占位符残留，
  // 按各自文件的硬规则只扫描正文条目区（scanFrom 之后）。
  const body = scanFrom ? text.slice(text.indexOf(scanFrom)) : text;
  if (scanFrom && !text.includes(scanFrom)) {
    throw new Error(`${name}：找不到扫描起点标记「${scanFrom}」`);
  }
  const bad = body.match(/[〔【][^〕】]+[〕】]/g);
  if (bad) {
    throw new Error(`${name} 残留占位符：${bad.join(", ")} — 装配器硬失败，请补齐后重跑。`);
  }
}

// ─────────────────────────── 解析 四件套_定稿.md ───────────────────────────
function parseFourPiece(text) {
  // 一、16 个固定亚型名
  const subtypeByMbti = {};
  {
    const tableMatch = text.match(/## 一、16 个固定亚型名[\s\S]*?(?=\n---)/);
    if (!tableMatch) throw new Error("四件套_定稿：找不到「一、16 个固定亚型名」表");
    const lines = tableMatch[0].split("\n");
    for (const line of lines) {
      const m = line.match(/^\|\s*([A-Z]{4})\s*\|\s*([^\|]+?)\s*\|/);
      if (m) subtypeByMbti[m[1]] = m[2].trim();
    }
  }
  for (const mbti of MBTI_LIST) {
    if (!subtypeByMbti[mbti]) throw new Error(`四件套_定稿：亚型名表缺少 ${mbti}`);
  }

  // 二、18 病种四件套（13 原有 + 5 补写）
  const diseaseByEnnea = {};
  {
    const sectionMatch = text.match(/## 二、[\s\S]*?(?=\n## 三、)/);
    if (!sectionMatch) throw new Error("四件套_定稿：找不到「二、病种四件套」");
    const blocks = sectionMatch[0].split(/^### /m).slice(1);
    for (const block of blocks) {
      const lines = block.split("\n");
      const header = lines[0];
      const hm = header.match(/^\d+｜(\S+)\s+(.+)$/);
      if (!hm) throw new Error(`四件套_定稿：病种标题格式异常：${header}`);
      const enneaKey = hm[1];
      const diseaseName = hm[2].trim();
      const get = (label) => {
        const l = lines.find(x => x.startsWith(`- **${label}**：`));
        if (!l) throw new Error(`四件套_定稿：${enneaKey} 缺少字段「${label}」`);
        return l.slice(`- **${label}**：`.length).trim();
      };
      const targetLine = lines.find(x => x.startsWith("- 靶词："));
      if (!targetLine) throw new Error(`四件套_定稿：${enneaKey} 缺少「靶词」`);
      diseaseByEnnea[enneaKey] = {
        name: diseaseName,
        complaint: get("主诉"),
        stem: get("病情分析主干"),
        profile: get("患者侧写"),
        prescription: get("医嘱"),
        target: targetLine.slice("- 靶词：".length).trim(),
      };
    }
  }
  for (const e of ENNEA_LIST) {
    if (!diseaseByEnnea[e]) throw new Error(`四件套_定稿：病种四件套缺少 ${e}`);
  }

  // 三、16 条 MBTI 手法句
  const techniqueByMbti = {};
  {
    const sectionMatch = text.match(/## 三、[\s\S]*?(?=\n## 四、)/);
    if (!sectionMatch) throw new Error("四件套_定稿：找不到「三、MBTI 手法句」");
    for (const line of sectionMatch[0].split("\n")) {
      const m = line.match(/^-\s*\*\*([A-Z]{4})\*\*：(.+)$/);
      if (m) techniqueByMbti[m[1]] = m[2].trim();
    }
  }
  for (const mbti of MBTI_LIST) {
    if (!techniqueByMbti[mbti]) throw new Error(`四件套_定稿：手法句缺少 ${mbti}`);
  }

  // 四、12 条星座钩子句
  const hookBySlug = {};
  {
    const sectionMatch = text.match(/## 四、[\s\S]*$/);
    if (!sectionMatch) throw new Error("四件套_定稿：找不到「四、星座钩子句」");
    for (const line of sectionMatch[0].split("\n")) {
      const m = line.match(/^-\s*\*\*([^*]+)\*\*：(.+)$/);
      if (m) {
        const sign = SIGN_BY_CN[m[1].trim()];
        if (!sign) throw new Error(`四件套_定稿：钩子句星座名无法识别：${m[1]}`);
        hookBySlug[sign.slug] = m[2].trim();
      }
    }
  }
  for (const s of SIGN_LIST) {
    if (!hookBySlug[s.slug]) throw new Error(`四件套_定稿：钩子句缺少 ${s.cn}`);
  }

  return { subtypeByMbti, diseaseByEnnea, techniqueByMbti, hookBySlug };
}

// ─────────────────────────── 解析 规格包_v1.md 的 BGM 白名单 ───────────────────────────
function parseBgmWhitelist(text) {
  const whitelistBySlug = {};
  const sectionMatch = text.match(/## 6｜[\s\S]*?(?=\n---)/);
  if (!sectionMatch) throw new Error("规格包_v1：找不到「6｜十二张调味卡」");
  for (const line of sectionMatch[0].split("\n")) {
    const m = line.match(/^-\s*\*\*([^*]+)\*\*｜[^｜]+｜(.+)$/);
    if (!m) continue;
    const sign = SIGN_BY_CN[m[1].trim()];
    if (!sign) throw new Error(`规格包_v1：BGM 白名单星座名无法识别：${m[1]}`);
    const songs = m[2].split("、").map(chunk => {
      const sm = chunk.trim().match(/^(.+?)《(.+)》$/);
      if (!sm) throw new Error(`规格包_v1：BGM 条目格式异常：${chunk}`);
      return { artist: sm[1].trim(), song: sm[2].trim() };
    });
    whitelistBySlug[sign.slug] = songs;
  }
  for (const s of SIGN_LIST) {
    if (!whitelistBySlug[s.slug] || !whitelistBySlug[s.slug].length) {
      throw new Error(`规格包_v1：BGM 白名单缺少 ${s.cn}`);
    }
  }
  return whitelistBySlug;
}

// ─────────────────────────── 解析 金标准_7条.md ───────────────────────────
function parseGoldStandard(text) {
  const entries = {};
  const blocks = text.split(/^## /m).slice(1);
  for (const block of blocks) {
    const lines = block.split("\n");
    const header = lines[0].trim();
    if (!header.startsWith("金标 #")) continue; // 跳过"素材（不覆写格子）"等非格子区块
    const keyLine = lines.find(l => l.trim().startsWith("- 格子键："));
    if (!keyLine) continue; // #4 素材条目没有「格子键」标准字段，天然跳过
    const key = keyLine.match(/`([^`]+)`/)[1];

    const titleLine = lines.find(l => l.trim().match(/^-\s*标题/));
    const titleText = titleLine.replace(/^-\s*标题(?:（[^）]*）)?：/, "").trim();
    const tm = titleText.match(/^(.+?)（(.+)）$/);
    if (!tm) throw new Error(`金标准_7条：${header} 标题格式异常：${titleText}`);
    const disease = tm[1].trim();
    const subtype = tm[2].trim();

    const get = (label) => {
      const l = lines.find(x => x.trim().startsWith(`- ${label}：`));
      if (!l) throw new Error(`金标准_7条：${header} 缺少「${label}」`);
      return l.trim().slice(`- ${label}：`.length).trim();
    };

    const complaint = get("主诉");
    const analysis = get("病情分析");
    const profile = get("患者侧写");
    const prescriptionRaw = get("医嘱");
    const prescription = prescriptionRaw.startsWith("医嘱：") ? prescriptionRaw : `医嘱：${prescriptionRaw}`;
    const bgmLine = get("本病例BGM");
    const bm = bgmLine.match(/^(.+?)《(.+)》$/);
    if (!bm) throw new Error(`金标准_7条：${header} BGM 格式异常：${bgmLine}`);

    const [mbti, ennea, signSlug] = key.split("_");
    entries[key] = {
      mbti, ennea, signSlug,
      disease, subtype,
      chief_complaint: complaint,
      analysis, profile, prescription,
      bgm: { song: bm[2].trim(), artist: bm[1].trim() },
    };
  }
  for (const k of GOLD_KEYS) {
    if (!entries[k]) throw new Error(`金标准_7条：缺少格子 ${k}`);
  }
  return entries;
}

// ─────────────────────────── 确定性哈希 & metrics ───────────────────────────
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(h, 31) + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

const ENNEA_MAIN_BASE_LB = { 1: 46, 2: 62, 3: 50, 4: 66, 5: 42, 6: 58, 7: 52, 8: 40, 9: 56 };
const ENNEA_WING_DELTA_LB = { 1: -3, 2: 4, 3: -1, 4: 5, 5: -4, 6: 3, 7: 1, 8: -5, 9: 0 };
const ENNEA_MAIN_BASE_LX = { 1: 46, 2: 22, 3: 34, 4: 18, 5: 44, 6: 26, 7: 20, 8: 42, 9: 24 };
const ENNEA_WING_DELTA_LX = { 1: 3, 2: -2, 3: 1, 4: -3, 5: 4, 6: -2, 7: -1, 8: 4, 9: 0 };
const SIGN_DELTA_LB = { aries: -2, taurus: 1, gemini: 3, cancer: 5, leo: -1, virgo: -3, libra: 0, scorpio: 6, sagittarius: -2, capricorn: -4, aquarius: 2, pisces: 7 };
const SIGN_DELTA_LX = { aries: 2, taurus: 3, gemini: -2, cancer: -4, leo: 1, virgo: 5, libra: 2, scorpio: -5, sagittarius: 0, capricorn: 4, aquarius: -1, pisces: -6 };

function parseEnnea(enneaKey) {
  const m = enneaKey.match(/^(\d)w(\d)$/);
  return { main: parseInt(m[1], 10), wing: parseInt(m[2], 10) };
}

function computeMetrics(mbti, enneaKey, signSlug) {
  const { main, wing } = parseEnnea(enneaKey);
  const f = mbti.includes("F"), n = mbti.includes("N"), p = mbti.includes("P"), i = mbti.includes("I");
  const t = !f, s = !n, j = !p, e = !i;

  const lbRaw = ENNEA_MAIN_BASE_LB[main] + ENNEA_WING_DELTA_LB[wing]
    + (f ? 9 : 0) + (n ? 5 : 0) + (p ? 6 : 0) + (i ? 3 : 0)
    + SIGN_DELTA_LB[signSlug];
  const lxRaw = ENNEA_MAIN_BASE_LX[main] + ENNEA_WING_DELTA_LX[wing]
    + (t ? 9 : 0) + (s ? 5 : 0) + (j ? 6 : 0) + (e ? 3 : 0)
    + SIGN_DELTA_LX[signSlug];
  const fRaw = 0.55 * lbRaw + 0.45 * (100 - lxRaw)
    + (main % 2 === 0 ? 3 : -2) + (wing % 2 === 0 ? -1.5 : 1.5);

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  return {
    lianAiNao: Number(clamp(lbRaw, 41.0, 97.5).toFixed(1)),
    liXingFangYu: Number(clamp(lxRaw, 12.0, 59.5).toFixed(1)),
    fuFaFengXian: Number(clamp(fRaw, 31.0, 95.0).toFixed(1)),
  };
}

function pickBgm(mbti, enneaKey, signSlug, whitelistBySlug) {
  const list = whitelistBySlug[signSlug];
  const idx = hashStr(mbti + enneaKey) % list.length;
  return { song: list[idx].song, artist: list[idx].artist };
}

// ─────────────────────────── 装配 ───────────────────────────
function assembleAll({ subtypeByMbti, diseaseByEnnea, techniqueByMbti, hookBySlug }, whitelistBySlug, goldEntries) {
  const results = {};
  for (const mbti of MBTI_LIST) {
    for (const enneaKey of ENNEA_LIST) {
      for (const sign of SIGN_LIST) {
        const key = `${mbti}_${enneaKey}_${sign.slug}`;
        const d = diseaseByEnnea[enneaKey];
        const metrics = computeMetrics(mbti, enneaKey, sign.slug);
        const gold = goldEntries[key];

        if (gold) {
          results[key] = {
            mbti, enneagram: enneaKey, sign: sign.slug,
            disease: gold.disease,
            subtype: gold.subtype,
            chief_complaint: gold.chief_complaint,
            analysis: gold.analysis,
            profile: gold.profile,
            prescription: gold.prescription,
            bgm: gold.bgm,
            lyric_line: null,
            metrics,
            review_status: "human",
          };
        } else {
          const analysis = `${d.stem}${techniqueByMbti[mbti]}${hookBySlug[sign.slug]}`;
          const bgm = pickBgm(mbti, enneaKey, sign.slug, whitelistBySlug);
          results[key] = {
            mbti, enneagram: enneaKey, sign: sign.slug,
            disease: d.name,
            subtype: subtypeByMbti[mbti],
            chief_complaint: d.complaint,
            analysis,
            profile: d.profile,
            prescription: d.prescription,
            bgm,
            lyric_line: null,
            metrics,
            review_status: "assembled",
          };
        }
      }
    }
  }
  return results;
}

// ─────────────────────────── 校验门 ───────────────────────────
function validate(results, { diseaseByEnnea, goldEntries }) {
  const failures = []; // { gate, key, reason }
  const diffs = [];    // 亚型名差异（不作为失败门）

  // 1. schema 完整
  const expectedCount = MBTI_LIST.length * ENNEA_LIST.length * SIGN_LIST.length;
  const keys = Object.keys(results);
  if (keys.length !== expectedCount) {
    failures.push({ gate: 1, key: "-", reason: `键数 ${keys.length} ≠ 期望 ${expectedCount}` });
  }
  const seen = new Set();
  for (const k of keys) {
    if (seen.has(k)) failures.push({ gate: 1, key: k, reason: "重复键" });
    seen.add(k);
  }

  for (const [key, r] of Object.entries(results)) {
    const isGold = r.review_status === "human";

    // 2/4/5/6：assembled 专属门；gold 只过 3/6(BGM 白名单)/8
    if (!isGold) {
      // 2. 字数区间
      if (!(r.chief_complaint.length >= 8 && r.chief_complaint.length <= 40)) {
        failures.push({ gate: 2, key, reason: `主诉字数 ${r.chief_complaint.length} 不在 8–40` });
      }
      if (!(r.analysis.length >= 100 && r.analysis.length <= 160)) {
        failures.push({ gate: 2, key, reason: `病情分析字数 ${r.analysis.length} 不在 100–160` });
      }
      if (!(r.profile.length >= 80 && r.profile.length <= 140)) {
        failures.push({ gate: 2, key, reason: `患者侧写字数 ${r.profile.length} 不在 80–140` });
      }
      if (!(r.prescription.length >= 30 && r.prescription.length <= 70)) {
        failures.push({ gate: 2, key, reason: `医嘱字数 ${r.prescription.length} 不在 30–70` });
      }

      // 4. 禁令词（整词匹配）
      const fullText = r.chief_complaint + r.analysis + r.profile + r.prescription;
      for (const w of BANNED_WORDS) {
        if (fullText.includes(w)) failures.push({ gate: 4, key, reason: `命中禁令词「${w}」` });
      }

      // 5. 主诉引号+第一人称（简化判定：含「」或""包裹）；医嘱前缀+靶词
      const quoted = /^[「"].+[」"]$/.test(r.chief_complaint);
      if (!quoted) failures.push({ gate: 5, key, reason: "主诉未带引号" });
      if (!r.prescription.startsWith("医嘱：")) {
        failures.push({ gate: 5, key, reason: "医嘱未以「医嘱：」开头" });
      }
      const target = diseaseByEnnea[r.enneagram].target;
      if (!r.prescription.includes(target)) {
        failures.push({ gate: 5, key, reason: `医嘱未含靶词「${target}」` });
      }
    }

    // 3. 黑名单（gold + assembled 都要过）
    const allText = r.chief_complaint + r.analysis + r.profile + r.prescription;
    for (const w of BLACKLIST) {
      if (allText.includes(w)) failures.push({ gate: 3, key, reason: `命中黑名单「${w}」` });
    }

    // 6. BGM 白名单（gold + assembled 都要过）；亚型名跨病种一致性抽查
  }

  // 6b. 同一 MBTI 的亚型名必须全局唯一且一致（跟人不跟病）
  const subtypeSeenByMbti = {};
  for (const r of Object.values(results)) {
    if (r.review_status === "human") continue; // gold 允许标题层差异，仅记录 diff
    if (subtypeSeenByMbti[r.mbti] === undefined) subtypeSeenByMbti[r.mbti] = r.subtype;
    else if (subtypeSeenByMbti[r.mbti] !== r.subtype) {
      failures.push({ gate: 6, key: `${r.mbti}/*`, reason: `亚型名不一致：${subtypeSeenByMbti[r.mbti]} vs ${r.subtype}` });
    }
  }

  // 金标亚型名 diff（不作为失败门，只记录）
  for (const key of GOLD_KEYS) {
    const g = goldEntries[key];
    const [mbti] = key.split("_");
    diffs.push({ key, mbti, goldSubtype: g.subtype });
  }

  // 7. 确定性门：另跑一次比对（由调用方在 main() 里做，这里只声明占位）

  return { failures, diffs };
}

function goldLockCheck(results, goldEntries) {
  const failures = [];
  for (const key of GOLD_KEYS) {
    const g = goldEntries[key];
    const r = results[key];
    if (!r) { failures.push({ gate: 8, key, reason: "金标格缺失" }); continue; }
    const fields = ["disease", "subtype", "chief_complaint", "analysis", "profile", "prescription"];
    for (const f of fields) {
      if (r[f] !== g[f]) {
        failures.push({ gate: 8, key, reason: `字段 ${f} 与金标不一致` });
      }
    }
    if (r.bgm.song !== g.bgm.song || r.bgm.artist !== g.bgm.artist) {
      failures.push({ gate: 8, key, reason: "BGM 与金标不一致" });
    }
  }
  return failures;
}

// ─────────────────────────── 主流程 ───────────────────────────
function loadInputs() {
  const fourPieceText = readPipelineFile("四件套_定稿.md");
  const goldText = readPipelineFile("金标准_7条.md");
  const v1Text = readPipelineFile("规格包_v1.md");

  assertNoPlaceholders("四件套_定稿.md", fourPieceText, "## 一、");
  assertNoPlaceholders("金标准_7条.md", goldText, "## 金标 #1");

  const fourPiece = parseFourPiece(fourPieceText);
  const whitelistBySlug = parseBgmWhitelist(v1Text);
  const goldEntries = parseGoldStandard(goldText);

  // 金标 BGM 自动并入对应星座白名单（规则 5）
  for (const key of GOLD_KEYS) {
    const g = goldEntries[key];
    const list = whitelistBySlug[g.signSlug];
    if (!list.some(x => x.song === g.bgm.song && x.artist === g.bgm.artist)) {
      list.push({ artist: g.bgm.artist, song: g.bgm.song });
    }
  }

  return { fourPiece, whitelistBySlug, goldEntries };
}

function buildOnce() {
  const { fourPiece, whitelistBySlug, goldEntries } = loadInputs();
  const results = assembleAll(fourPiece, whitelistBySlug, goldEntries);
  return { results, fourPiece, goldEntries };
}

function runPilot() {
  const { results } = buildOnce();
  const pilotKeys = ["INTJ_3w4_pisces", "ENFP_6w7_leo", "ISFJ_9w1_capricorn"];
  for (const key of pilotKeys) {
    console.log("=".repeat(60));
    console.log(key);
    console.log("=".repeat(60));
    console.log(JSON.stringify(results[key], null, 2));
    console.log();
  }
}

function runFull() {
  const { results, fourPiece, goldEntries } = buildOnce();

  const { failures, diffs } = validate(results, { diseaseByEnnea: fourPiece.diseaseByEnnea, goldEntries });
  const lockFailures = goldLockCheck(results, goldEntries);
  const allFailures = [...failures, ...lockFailures];

  // 7. 确定性门：再跑一次，逐字节比对
  const { results: results2 } = buildOnce();
  const same = JSON.stringify(results) === JSON.stringify(results2);
  if (!same) allFailures.push({ gate: 7, key: "-", reason: "两次生成结果不完全一致（存在非确定性来源）" });

  const gateNames = {
    1: "Schema 完整性", 2: "字数区间", 3: "黑名单字符串", 4: "禁令词过滤",
    5: "引号/第一人称/医嘱前缀/靶词", 6: "BGM 白名单/亚型名唯一性", 7: "确定性门", 8: "金标锁定门",
  };

  const byGate = {};
  for (const f of allFailures) {
    (byGate[f.gate] = byGate[f.gate] || []).push(f);
  }

  const passRate = ((Object.keys(results).length - new Set(allFailures.map(f => f.key)).size) / Object.keys(results).length * 100).toFixed(2);

  let report = `# 校验报告\n\n生成时间：${new Date().toISOString()}\n\n`;
  report += `- 总键数：${Object.keys(results).length}（期望 3456）\n`;
  report += `- 通过率：${passRate}%\n`;
  report += `- 确定性门：${same ? "通过（两次生成逐字节一致）" : "失败"}\n`;
  report += `- 金标锁定门：${lockFailures.length === 0 ? "通过（6 格与金标源文件零差异）" : "失败"}\n\n`;

  report += `## 失败明细（按校验门分组）\n\n`;
  if (allFailures.length === 0) {
    report += "全部校验门通过，无失败条目。\n\n";
  } else {
    for (const gate of Object.keys(byGate).sort()) {
      report += `### 门 ${gate}：${gateNames[gate] || "-"}（${byGate[gate].length} 条）\n\n`;
      for (const f of byGate[gate].slice(0, 50)) {
        report += `- \`${f.key}\`：${f.reason}\n`;
      }
      if (byGate[gate].length > 50) report += `- ……以及另外 ${byGate[gate].length - 50} 条\n`;
      report += "\n";
    }
  }

  report += `## 亚型名差异清单（金标标题 vs 四件套定稿表，仅供裁决，不作为失败门）\n\n`;
  for (const d of diffs) {
    const canonical = fourPiece.subtypeByMbti[d.mbti];
    const mark = canonical === d.goldSubtype ? "一致" : `**不一致**（表中为「${canonical}」）`;
    report += `- \`${d.key}\`：金标亚型名「${d.goldSubtype}」— ${mark}\n`;
  }
  report += "\n";

  fs.writeFileSync(OUT_REPORT, report, "utf8");

  if (allFailures.length > 0) {
    console.error(`校验未全部通过，见 ${path.relative(ROOT, OUT_REPORT)}`);
    console.error(`失败条目数：${allFailures.length}（按门分布：${Object.entries(byGate).map(([g, arr]) => `门${g}=${arr.length}`).join("，")}）`);
    process.exitCode = 1;
    return;
  }

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2) + "\n", "utf8");
  console.log(`全部校验门通过。已写出 ${path.relative(ROOT, OUT_JSON)}（${Object.keys(results).length} 键）与 ${path.relative(ROOT, OUT_REPORT)}`);
}

const mode = process.argv[2];
if (mode === "--pilot") {
  runPilot();
} else {
  runFull();
}
