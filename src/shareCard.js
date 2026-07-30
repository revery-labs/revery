// ─────────────────────────────────────────────────────────────────────────────
// 分享卡 v1（Phase 2.2）· 竖版 3:4，Canvas 直绘导出 PNG。
// 直绘而非 html2canvas：无新依赖、导出尺寸固定、CJK 用系统字体即时渲染不糊。
// 配色：#101010 底 / #F2ECE4 字；卡内红色恰好 3 处：已确诊章 / 病历编号 / 红字压底句。
// 渲染层规则（均不改 results.json 正文）：
//   - 主诉/医嘱内双引号统一显示为「」；医嘱正文 strip「医嘱：」前缀（label 保留）。
//   - 理智留存读 metrics.liXingFangYu（results.json 实际字段名）。
//   - 域名行与病历编号行用 Latin 优先字体栈，避免 ASCII 连字符被 CJK 字体渲染成长划。
//   - incidence 改人数口径「每 N 人中 1 例」。
//   - 确诊日期为渲染当日，不入 results.json，不参与"同组合逐字节一致"断言。
// ─────────────────────────────────────────────────────────────────────────────
import { COPY } from "./copy";
import { pickVerdict } from "./verdicts";

const BG = "#101010";
const FG = "#F2ECE4";
const DIM = "#B8B0A6";
const LINE = "#3A362E";
const RED = "#C8402F";
const SANS = '"PingFang SC","Helvetica Neue","Microsoft YaHei",sans-serif';
const SERIF = '"Songti SC","Noto Serif SC",serif';
// Latin 优先字体栈：ASCII 连字符走 Helvetica/-apple-system 渲染，CJK 兜底
const LATIN = '-apple-system,"Helvetica Neue",Helvetica,Arial,"PingFang SC",sans-serif';

const SIGN_CN = {
  aries: "白羊", taurus: "金牛", gemini: "双子", cancer: "巨蟹",
  leo: "狮子", virgo: "处女", libra: "天秤", scorpio: "天蝎",
  sagittarius: "射手", capricorn: "摩羯", aquarius: "水瓶", pisces: "双鱼",
};

export const CARD_W = 1080;
export const CARD_H = 1440;

// 避头尾（禁则）：行首禁标点「下推」；行末句读「悬挂」；两者不混用。
const HANG      = new Set(["。", "，", "、", "；", "：", "？", "！"]);          // 行末句读悬挂
const HEAD_PUSH = new Set(["）", "】", "》", "」", "』", "’", "”", "%"]);        // 行首禁 → 下推
const TAIL_PUSH = new Set(["（", "【", "《", "「", "『", "‘", "“"]);            // 行尾禁 → 下推

function wrapLines(ctx, text, maxWidth) {
  const chars = [...String(text)];
  const lines = [];
  let line = "";
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "\n") { lines.push(line); line = ""; continue; }
    if (line && ctx.measureText(line + ch).width > maxWidth) {
      if (HANG.has(ch)) {                       // 行末句读：悬挂在本行，随后断行
        lines.push(line + ch); line = ""; continue;
      }
      let cur = line, nl = ch;
      if (HEAD_PUSH.has(ch)) {                  // 标点不能在行首 → 连同前一字符下推
        cur = line.slice(0, -1); nl = line.slice(-1) + ch;
      } else if (TAIL_PUSH.has(line.slice(-1))) { // 左括号/引号不能在行尾 → 下推
        cur = line.slice(0, -1); nl = line.slice(-1) + ch;
      }
      lines.push(cur); line = nl;
    } else {
      line += ch;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// 主诉/医嘱内双引号（U+0022 / U+201C / U+201D）统一显示为「」
function toCornerQuotes(s) {
  let open = true, out = "";
  for (const ch of String(s)) {
    if (ch === "“") out += "「";        // 左双引号 “
    else if (ch === "”") out += "」";   // 右双引号 ”
    else if (ch.charCodeAt(0) === 34) { out += open ? "「" : "」"; open = !open; } // 直双引号 U+0022
    else out += ch;
  }
  return out;
}

// incidence(百分比字符串) → 人数口径「每 N 人中 1 例」的 N 显示串（三位有效数字）
function incidenceToPeople(incidenceStr) {
  const pct = parseFloat(incidenceStr);
  if (!pct || pct <= 0) return null;
  let n = 100 / pct;                                   // = 1 / (pct/100)
  const mag = Math.pow(10, Math.floor(Math.log10(n)) - 2);
  n = Math.round(n / mag) * mag;                       // 三位有效数字
  if (n >= 10000) return String(Number((n / 10000).toFixed(2))) + "万"; // 万位以下同样三位有效
  return String(n);
}

function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

// data: { profile, patientName }
export function drawShareCard(canvas, data) {
  const { profile, patientName } = data;
  const ctx = canvas.getContext("2d");
  canvas.width = CARD_W;
  canvas.height = CARD_H;

  const PAD = 80;
  const CW = CARD_W - PAD * 2;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CARD_W - 2, CARD_H - 2);

  let y = PAD;

  // 1｜头部：水印 + 确诊日期（渲染当日）
  ctx.font = `700 26px ${SANS}`;
  ctx.fillStyle = DIM;
  ctx.fillText("REVERY LABS · 恋爱脑诊断中心", PAD, y);
  ctx.textAlign = "right";
  ctx.fillText(todayStr(), CARD_W - PAD, y);
  ctx.textAlign = "left";
  y += 50;

  // 标题
  ctx.font = `900 54px ${SERIF}`;
  ctx.fillStyle = FG;
  ctx.fillText("恋爱脑病例报告", PAD, y);
  // 「已确诊」章（红 1/3）· 放大约 1.3 倍
  ctx.font = `800 34px ${SANS}`;
  const stampText = "已确诊";
  const stampW = ctx.measureText(stampText).width + 36;
  const stampX = CARD_W - PAD - stampW;
  ctx.strokeStyle = RED;
  ctx.lineWidth = 4;
  ctx.strokeRect(stampX, y - 6, stampW, 60);
  ctx.fillStyle = RED;
  ctx.fillText(stampText, stampX + 18, y + 6);
  y += 86;

  // 病历编号（红 2/3）· Latin 优先字体，ASCII 连字符渲染正常
  ctx.font = `600 28px ${LATIN}`;
  ctx.fillStyle = RED;
  ctx.fillText(`病历编号 ${profile.case_id || "-"}`, PAD, y);
  y += 56;

  ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(CARD_W - PAD, y); ctx.stroke();
  y += 40;

  // 2｜患者行：填了称呼显示称呼；未填显示类型代号
  const who = (patientName && patientName.trim())
    ? patientName.trim()
    : `${profile.mbti} · ${profile.enneagram} · ${SIGN_CN[profile.sign] || profile.sign}`;
  ctx.font = `600 30px ${SANS}`;
  ctx.fillStyle = FG;
  ctx.fillText(`患者：${who}`, PAD, y);
  y += 64;

  // 3｜病名（亚型）
  ctx.font = `900 58px ${SERIF}`;
  ctx.fillStyle = FG;
  for (const l of wrapLines(ctx, `${profile.disease}（${profile.subtype}）`, CW)) { ctx.fillText(l, PAD, y); y += 72; }
  y += 22;

  // 4｜主诉 / 医嘱：上下堆叠单栏，宽度撑满
  const drawBlock = (label, body) => {
    ctx.font = `700 27px ${SANS}`;
    ctx.fillStyle = DIM;
    ctx.fillText(label, PAD, y);
    y += 42;
    ctx.font = `400 30px ${SERIF}`;
    ctx.fillStyle = FG;
    for (const l of wrapLines(ctx, body, CW)) { ctx.fillText(l, PAD, y); y += 44; }
    y += 26;
  };
  drawBlock("主诉", toCornerQuotes(profile.chief_complaint));
  drawBlock("医嘱", toCornerQuotes(String(profile.prescription).replace(/^医嘱：/, "")));

  ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(CARD_W - PAD, y); ctx.stroke();
  y += 30;

  // 红字压底句（红 3/3）· 置于发病率行上方，克制字号、红色衬线
  ctx.font = `700 24px ${SERIF}`;
  ctx.fillStyle = RED;
  for (const l of wrapLines(ctx, "本报告由 Revery Labs 恋爱脑诊断中心出具 · 如有雷同，说明你确实病了", CW)) { ctx.fillText(l, PAD, y); y += 34; }
  y += 14;

  // 5｜发病率行（人数口径）
  const people = incidenceToPeople(profile.incidence);
  ctx.font = `500 28px ${SANS}`;
  ctx.fillStyle = DIM;
  ctx.fillText(people ? `全球约每${people}人中1例确诊` : "", PAD, y);
  y += 62;

  // 6｜恋爱脑浓度 / 理智留存 + 判词
  const m = profile.metrics || {};
  const metricBlock = (label, value, verdict) => {
    ctx.font = `700 30px ${SANS}`;
    ctx.fillStyle = FG;
    ctx.fillText(label, PAD, y);
    ctx.textAlign = "right";
    ctx.font = `800 34px ${SANS}`;
    ctx.fillText(`${Math.round(value)}`, CARD_W - PAD, y);
    ctx.textAlign = "left";
    y += 48;
    ctx.font = `400 26px ${SANS}`;
    ctx.fillStyle = DIM;
    for (const l of wrapLines(ctx, verdict, CW)) { ctx.fillText(l, PAD, y); y += 38; }
    y += 20;
  };
  metricBlock("恋爱脑浓度", m.lianAiNao ?? 0, pickVerdict("lianAiNao", m.lianAiNao));
  metricBlock("理智留存",   m.liXingFangYu ?? 0, pickVerdict("liZhi", m.liXingFangYu));

  // 7｜本病例 BGM（模板取值，暖白，不占红色名额）
  if (profile.bgm && profile.bgm.song) {
    ctx.font = `500 26px ${SANS}`;
    ctx.fillStyle = FG;
    ctx.fillText(`本病例BGM  ${profile.bgm.song} · ${profile.bgm.artist}`, PAD, y);
    y += 46;
  }

  // 底部：娱乐声明 + 域名（固定贴底；域名 Latin 优先字体）
  ctx.font = `400 22px ${SANS}`;
  ctx.fillStyle = DIM;
  const discLines = wrapLines(ctx, COPY.disclaimer, CW);
  let by = CARD_H - PAD - discLines.length * 32 - 36;
  for (const l of discLines) { ctx.fillText(l, PAD, by); by += 32; }
  ctx.font = `600 24px ${LATIN}`;
  ctx.fillStyle = FG;
  ctx.fillText("revery-labs.com", PAD, by + 4);
}
