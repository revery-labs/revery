// ─────────────────────────────────────────────────────────────────────────────
// 分享卡 v1（Phase 2.2）· 竖版 3:4，Canvas 直绘导出 PNG。
// 直绘而非 html2canvas：无新依赖、导出尺寸固定、CJK 用系统字体即时渲染不糊
// （小红书内置浏览器 / iOS Safari 稳定）。
// 配色：#101010 底 / #F2ECE4 字；卡内红色恰好 3 处：已确诊章 / 病历编号 / 红字压底句。
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

export const CARD_W = 1080;
export const CARD_H = 1440;

function wrapLines(ctx, text, maxWidth) {
  const out = [];
  let line = "";
  for (const ch of String(text)) {
    if (ch === "\n") { out.push(line); line = ""; continue; }
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = ch; }
    else line = test;
  }
  if (line) out.push(line);
  return out;
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
  const CW = CARD_W - PAD * 2; // content width
  ctx.textBaseline = "top";
  ctx.textAlign = "left";

  // 底 + 细描边
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  ctx.strokeStyle = LINE;
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, CARD_W - 2, CARD_H - 2);

  let y = PAD;

  // 1｜头部：水印 + 日期
  ctx.font = `700 26px ${SANS}`;
  ctx.fillStyle = DIM;
  ctx.fillText("REVERY LABS · 恋爱脑诊断中心", PAD, y);
  ctx.textAlign = "right";
  ctx.fillText(todayStr(), CARD_W - PAD, y);
  ctx.textAlign = "left";
  y += 46;

  // 标题
  ctx.font = `900 54px ${SERIF}`;
  ctx.fillStyle = FG;
  ctx.fillText("恋爱脑病例报告", PAD, y);
  // 「已确诊」章（红色 1/3）· 放大约 1.3 倍
  ctx.font = `800 34px ${SANS}`;
  const stampText = "已确诊";
  const stampW = ctx.measureText(stampText).width + 36;
  const stampX = CARD_W - PAD - stampW;
  ctx.strokeStyle = RED;
  ctx.lineWidth = 4;
  ctx.strokeRect(stampX, y - 6, stampW, 60);
  ctx.fillStyle = RED;
  ctx.fillText(stampText, stampX + 18, y + 6);
  y += 84;

  // 病历编号（红色 2/3）
  ctx.font = `600 28px ${SANS}`;
  ctx.fillStyle = RED;
  ctx.fillText(`病历编号 ${profile.case_id || "—"}`, PAD, y);
  y += 54;

  // divider
  ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(CARD_W - PAD, y); ctx.stroke();
  y += 34;

  // 2｜患者行
  ctx.font = `600 30px ${SANS}`;
  ctx.fillStyle = FG;
  ctx.fillText(`患者：${patientName && patientName.trim() ? patientName.trim() : "匿名患者"}`, PAD, y);
  y += 58;

  // 3｜病名（亚型）
  ctx.font = `900 58px ${SERIF}`;
  ctx.fillStyle = FG;
  const titleLines = wrapLines(ctx, `${profile.disease}（${profile.subtype}）`, CW);
  for (const l of titleLines) { ctx.fillText(l, PAD, y); y += 70; }
  y += 14;

  // 4｜对照双栏：主诉 | 医嘱
  const colGap = 44;
  const colW = (CW - colGap) / 2;
  const leftX = PAD;
  const rightX = PAD + colW + colGap;
  const colTop = y;

  const drawCol = (x, label, body) => {
    let cy = colTop;
    ctx.font = `700 26px ${SANS}`;
    ctx.fillStyle = DIM;
    ctx.fillText(label, x, cy);
    cy += 42;
    ctx.font = `400 29px ${SERIF}`;
    ctx.fillStyle = FG;
    for (const l of wrapLines(ctx, body, colW)) { ctx.fillText(l, x, cy); cy += 42; }
    return cy;
  };
  const leftEnd = drawCol(leftX, "主诉", profile.chief_complaint);
  const rightEnd = drawCol(rightX, "医嘱", profile.prescription);
  y = Math.max(leftEnd, rightEnd) + 30;

  // divider
  ctx.strokeStyle = LINE; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(CARD_W - PAD, y); ctx.stroke();
  y += 30;

  // 红字压底句（红色 3/3）· 置于发病率行上方，克制字号、红色衬线
  ctx.font = `700 24px ${SERIF}`;
  ctx.fillStyle = RED;
  for (const l of wrapLines(ctx, "本报告由 Revery Labs 恋爱脑诊断中心出具 · 如有雷同，说明你确实病了", CW)) { ctx.fillText(l, PAD, y); y += 34; }
  y += 12;

  // 5｜发病率行
  ctx.font = `500 28px ${SANS}`;
  ctx.fillStyle = DIM;
  ctx.fillText(`全球约 ${profile.incidence || "—"}% 的人确诊此病`, PAD, y);
  y += 58;

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
    y += 46;
    ctx.font = `400 26px ${SANS}`;
    ctx.fillStyle = DIM;
    for (const l of wrapLines(ctx, verdict, CW)) { ctx.fillText(l, PAD, y); y += 38; }
    y += 16;
  };
  metricBlock("恋爱脑浓度", m.lianAiNao ?? 0, pickVerdict("lianAiNao", m.lianAiNao));
  metricBlock("理智留存",   m.liXingFangYu ?? 0, pickVerdict("liZhi", m.liXingFangYu));

  // 7｜底部：娱乐声明 + 域名（固定贴底）
  ctx.font = `400 22px ${SANS}`;
  ctx.fillStyle = DIM;
  const discLines = wrapLines(ctx, COPY.disclaimer, CW);
  let by = CARD_H - PAD - discLines.length * 32 - 34;
  for (const l of discLines) { ctx.fillText(l, PAD, by); by += 32; }
  ctx.font = `600 24px ${SANS}`;
  ctx.fillStyle = FG;
  ctx.fillText("revery-labs.com", PAD, by + 4);
}
