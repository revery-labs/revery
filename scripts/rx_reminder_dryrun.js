#!/usr/bin/env node
/**
 * rx_reminders 复诊提醒 · DRY-RUN（阶段2·邮件层）
 *
 * 本期不实现真实发信。本脚本只做「预演」：
 *   - 读取 rx_reminders（需 service_role key，绕过 RLS 的 no-SELECT）；
 *   - 对每个 opted_in 邮箱，按其 sign 取「下一个未过期天象窗口」（end >= today，多个取最早）；
 *   - 打印：将发给哪些邮箱、对应哪个窗口、正文模板。
 * 绝不发送任何邮件、绝不写库；发信服务商选型待定。
 *
 * 用法：
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/rx_reminder_dryrun.js
 *   （可选 RX_DRYRUN_TODAY=2026-08-05 覆盖“今天”，便于确定性预演）
 *
 * 零新依赖：用 Node 内置 fetch（Node 18+）与 fs/path。
 */
"use strict";

const path = require("path");

const URL = process.env.SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL || "";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TODAY = process.env.RX_DRYRUN_TODAY || new Date().toISOString().slice(0, 10);

const SIGN_CN = {
  aries: "白羊", taurus: "金牛", gemini: "双子", cancer: "巨蟹",
  leo: "狮子", virgo: "处女", libra: "天秤", scorpio: "天蝎",
  sagittarius: "射手", capricorn: "摩羯", aquarius: "水瓶", pisces: "双鱼",
};

// 本地静态天象日历（人工核验）。ISO 日期可直接字典序比较，不做时区推算、不联网。
const astro = require(path.resolve(__dirname, "..", "src", "data", "astro_calendar.json"));

function nextWindowForSign(sign, today) {
  const hits = astro.events.filter((e) => e.affected_signs.includes(sign) && e.end >= today);
  if (hits.length === 0) return null;
  return hits.reduce((best, e) => (e.start < best.start ? e : best));
}

function fmtRange(w) {
  const [sy, sm, sd] = w.start.split("-").map(Number);
  const [ey, em, ed] = w.end.split("-").map(Number);
  const startStr = `${sy}年${sm}月${sd}日`;
  const endStr = ey !== sy ? `${ey}年${em}月${ed}日` : `${em}月${ed}日`;
  return `${startStr} – ${endStr}`;
}

// 正文模板：正文由人工回填，此处仅拼装占位模板供预演查看。
function bodyTemplate(sign, w) {
  const cn = SIGN_CN[sign] || sign;
  return `【Revery Labs · 复诊提醒】${cn}座 复发高危期临近：${fmtRange(w)}（${w.type}）。〔提醒正文由人工回填〕`;
}

async function main() {
  if (!URL || !SERVICE_KEY) {
    console.error("缺少环境变量：SUPABASE_URL 与 SUPABASE_SERVICE_ROLE_KEY（service_role，用于绕过 RLS 读取 rx_reminders）。");
    console.error("用法：SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/rx_reminder_dryrun.js");
    process.exitCode = 1;
    return;
  }

  const endpoint = `${URL.replace(/\/$/, "")}/rest/v1/rx_reminders?select=email,sign,opted_in&opted_in=eq.true`;
  const res = await fetch(endpoint, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) {
    console.error(`查询 rx_reminders 失败：HTTP ${res.status}`, await res.text());
    process.exitCode = 1;
    return;
  }
  const rows = await res.json();

  console.log(`DRY-RUN（不发信）· today=${TODAY} · rx_reminders(opted_in) 行数=${rows.length}`);
  console.log("─".repeat(60));
  let willSend = 0, skipped = 0;
  for (const r of rows) {
    const w = nextWindowForSign(r.sign, TODAY);
    if (!w) {
      skipped++;
      console.log(`  [跳过] ${r.email}  sign=${r.sign}  无未过期窗口`);
      continue;
    }
    willSend++;
    console.log(`  [将发] ${r.email}  sign=${r.sign}  窗口=${fmtRange(w)}（${w.type}）`);
    console.log(`         正文模板：${bodyTemplate(r.sign, w)}`);
  }
  console.log("─".repeat(60));
  console.log(`汇总：将发 ${willSend} 封，跳过 ${skipped} 封（无窗口）。本次未发出任何邮件（dry-run）。`);
}

main();
