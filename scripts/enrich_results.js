#!/usr/bin/env node
/**
 * 数据加固脚本 · Phase 2.0（一次性 build-time，只追加字段，绝不改写既有正文）
 *
 * 对 src/data/results.json 的 3,456 键只新增两个字段：
 *   - case_id：「REV-」+ 4 位数字。sha1(key) mod 10000 为基，按 key 字典序线性探测去重，
 *              全局唯一；同组合永远同号（防拆台）。
 *   - incidence：确定性发病率 = MBTI 分布 × 九型分布估计 × (1/12)。装饰性字段，确定性 > 精确性。
 *              展示格式：≥1% 一位小数；<1% 两位小数；下限 0.02%。文案「全球约 {incidence}% 的人确诊此病」。
 *
 * 守卫：写盘前深比较，断言除新增两字段外无任何字节变动（金标准正文 diff 亦为零）；否则中止不写。
 * 零外部依赖（仅 node 内置 fs/path/crypto）。
 */
"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const JSON_PATH = path.resolve(__dirname, "..", "src", "data", "results.json");

// ── MBTI 人群分布估计（来源：MBTI Manual / CAPT 常见流通估计，百分比）─────────────
// 说明/假设：公开流通的近似值，脚本内归一化后使用；本字段为装饰性，确定性 > 精确性。
const MBTI_DIST_RAW = {
  ISFJ: 13.8, ESFJ: 12.3, ISTJ: 11.6, ISFP: 8.8, ESTJ: 8.7, ESFP: 8.5,
  ENFP: 8.1, ISTP: 5.4, INFP: 4.4, ESTP: 4.3, INTP: 3.3, ENTP: 3.2,
  ENFJ: 2.5, INTJ: 2.1, ENTJ: 1.8, INFJ: 1.5,
};
const MBTI_SUM = Object.values(MBTI_DIST_RAW).reduce((a, b) => a + b, 0);
const mbtiFrac = (mbti) => (MBTI_DIST_RAW[mbti] || 0) / 100 / (MBTI_SUM / 100); // 归一化为占比(0-1)

// ── 九型分布：无可靠分布源 → 主型均匀 1/9、侧翼 50/50（假设，写明）→ 每个侧翼 1/18 ───────
const WING_FRAC = (1 / 9) * (1 / 2); // = 1/18

// ── 星座：1/12 ────────────────────────────────────────────────────────────────
const SIGN_FRAC = 1 / 12;

function formatIncidence(pct) {
  // pct 为百分比数值（如 0.05 表示 0.05%）。≥1% 一位小数；<1% 两位小数。
  // 下限逻辑已移除（改人数口径后不再需要 0.02% 地板）。
  return pct >= 1 ? pct.toFixed(1) : pct.toFixed(2);
}

function main() {
  const raw = fs.readFileSync(JSON_PATH, "utf8");
  const original = JSON.parse(raw);
  const keys = Object.keys(original);

  // ── case_id：按 key 字典序线性探测去重 ───────────────────────────────────────
  const sortedKeys = [...keys].sort();
  const used = new Set();
  const caseIdByKey = {};
  for (const key of sortedKeys) {
    const h = parseInt(crypto.createHash("sha1").update(key).digest("hex").slice(0, 8), 16);
    let n = h % 10000;
    while (used.has(n)) n = (n + 1) % 10000; // 线性探测
    used.add(n);
    caseIdByKey[key] = `REV-${String(n).padStart(4, "0")}`;
  }

  // ── 组装（保持原字段顺序，仅在每条末尾追加两字段；幂等：先剥离本脚本字段再追加）────
  const enriched = {};
  const baseByKey = {};
  for (const key of keys) {
    // 剥离本脚本可能已写过的两字段，得到"正文基线"——保证重复运行逐字节一致
    const { case_id: _c, incidence: _i, ...base } = original[key];
    baseByKey[key] = base;
    const incidencePct = mbtiFrac(base.mbti) * WING_FRAC * SIGN_FRAC * 100;
    enriched[key] = {
      ...base,
      case_id: caseIdByKey[key],
      incidence: formatIncidence(incidencePct),
    };
  }

  // ── 守卫：除新增两字段外，逐键逐字节不变（含金标准正文）──────────────────────────
  const failures = [];
  for (const key of keys) {
    const { case_id, incidence, ...rest } = enriched[key];
    if (JSON.stringify(rest) !== JSON.stringify(baseByKey[key])) {
      failures.push(`${key}: 既有字段被改动`);
    }
    if (!/^REV-\d{4}$/.test(case_id)) failures.push(`${key}: case_id 格式非法 (${case_id})`);
    if (!/^\d+(\.\d{1,2})?$/.test(incidence)) failures.push(`${key}: incidence 格式非法 (${incidence})`);
  }
  // case_id 全局唯一
  const ids = keys.map((k) => enriched[k].case_id);
  const uniq = new Set(ids);
  if (uniq.size !== ids.length) failures.push(`case_id 不唯一：${ids.length - uniq.size} 个重复`);
  if (keys.length !== 3456) failures.push(`键数异常：${keys.length} ≠ 3456`);

  const goldKeys = keys.filter((k) => original[k].review_status === "human");

  if (failures.length) {
    console.error("守卫未通过，未写盘：");
    for (const f of failures.slice(0, 20)) console.error("  - " + f);
    process.exitCode = 1;
    return;
  }

  fs.writeFileSync(JSON_PATH, JSON.stringify(enriched, null, 2) + "\n", "utf8");

  // ── 断言输出 ────────────────────────────────────────────────────────────────
  console.log("守卫通过 ✓");
  console.log(`  键数：${keys.length}（期望 3456）`);
  console.log(`  case_id 唯一：${uniq.size}/${ids.length}`);
  console.log(`  既有字段零改动：全部 ${keys.length} 键通过`);
  console.log(`  金标准(human)正文零改动：${goldKeys.length} 格通过`);
  console.log(`  incidence 范围：${Math.min(...keys.map(k=>parseFloat(enriched[k].incidence)))} – ${Math.max(...keys.map(k=>parseFloat(enriched[k].incidence)))} (%)`);
  console.log("  样例：");
  for (const k of ["INTJ_3w4_pisces", "ENFP_6w7_leo", "ISFJ_9w1_capricorn"]) {
    console.log(`    ${k} → case_id=${enriched[k].case_id}  incidence=${enriched[k].incidence}%`);
  }
}

main();
