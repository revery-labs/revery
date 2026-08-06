// ─────────────────────────────────────────────────────────────────────────────
// 天象日历（阶段2·数据层）· 读取 + 校验，无渲染。
// 数据为人工核验的静态文件 src/data/astro_calendar.json：
//   本模块只读取与校验，绝不生成、推算或联网抓取任何日期。
// 校验失败直接抛错（不 fallback、不跳过坏条目）；_note / _source 两字段忽略，不参与校验。
// 校验项：type ∈ {retrograde, eclipse}；start/end 为合法历法日期且 start ≤ end；
//         affected_signs 为非空数组且每个元素在 12 星座 slug 枚举内。
// ─────────────────────────────────────────────────────────────────────────────
import ASTRO from "./data/astro_calendar.json";

// 12 星座 slug 枚举（与 results.json 的 sign 字段/key 末段一致：小写英文）
const SIGN_SLUGS = new Set([
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
]);
const EVENT_TYPES = new Set(["retrograde", "eclipse"]);
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 解析并校验一个日期字符串：必须是 YYYY-MM-DD 且为真实存在的历法日期（拒绝 2026-02-30 之类）。
// 仅解析既有日期用于比较，不生成/推算新日期。
function parseDate(value, where) {
  if (typeof value !== "string" || !DATE_RE.test(value)) {
    throw new Error(`astro_calendar：${where} 日期格式非法（需 YYYY-MM-DD）：${JSON.stringify(value)}`);
  }
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error(`astro_calendar：${where} 不是有效日期：${value}`);
  }
  return dt;
}

// 校验整份日历，返回校验通过的 events 数组；任一条不合格立即抛错。
export function validateAstroCalendar(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.events)) {
    throw new Error("astro_calendar：顶层缺少 events 数组");
  }
  data.events.forEach((e, i) => {
    const where = `events[${i}]`;
    if (!e || typeof e !== "object") {
      throw new Error(`astro_calendar：${where} 不是对象`);
    }
    if (!EVENT_TYPES.has(e.type)) {
      throw new Error(`astro_calendar：${where}.type 非法（只允许 retrograde / eclipse）：${JSON.stringify(e.type)}`);
    }
    const start = parseDate(e.start, `${where}.start`);
    const end = parseDate(e.end, `${where}.end`);
    if (start.getTime() > end.getTime()) {
      throw new Error(`astro_calendar：${where} start 晚于 end：${e.start} > ${e.end}`);
    }
    if (!Array.isArray(e.affected_signs) || e.affected_signs.length === 0) {
      throw new Error(`astro_calendar：${where}.affected_signs 需为非空数组`);
    }
    for (const s of e.affected_signs) {
      if (!SIGN_SLUGS.has(s)) {
        throw new Error(`astro_calendar：${where}.affected_signs 含未知星座 slug：${JSON.stringify(s)}`);
      }
    }
  });
  return data.events;
}

// 模块加载即读取并校验（失败直接抛错，不 fallback）。
export const ASTRO_EVENTS = validateAstroCalendar(ASTRO);

// 取某星座命中的「下一个未过期窗口」：end >= today 的命中里 start 最早的一个；无命中返回 null。
// today 为 "YYYY-MM-DD"（调用方传入，便于确定性）；ISO 日期可直接按字典序比较，不做时区推算。
export function nextWindowForSign(sign, today) {
  const hits = ASTRO_EVENTS.filter((e) => e.affected_signs.includes(sign) && e.end >= today);
  if (hits.length === 0) return null;
  return hits.reduce((best, e) => (e.start < best.start ? e : best));
}
