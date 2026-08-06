// ─────────────────────────────────────────────────────────────────────────────
// 合盘映射表（阶段3·数据层）· 读取 + 校验 + 纯查表，无渲染、无计算。
// 数据为人工写死的静态文件 src/data/合盘映射表.json：
//   关系病理 = f(我方九型含侧翼, 对方 MBTI)，288 格全部显式写死。
// 运行时只查表：禁止计算、禁止 fallback、禁止随机、禁止默认值。
// 模块加载即校验，任一不合格直接抛错（不 fallback、不跳过）。
// _note / _rule / _axes 三字段忽略，不参与校验。
// ─────────────────────────────────────────────────────────────────────────────
import COMPAT from "./data/合盘映射表.json";

// 我方九型（含侧翼，18）与对方 MBTI（16）；键形如 `${enneagram}_${mbti}`，共 18×16=288 格。
const ENNEA = [
  "1w9", "1w2", "2w1", "2w3", "3w2", "3w4", "4w3", "4w5", "5w4",
  "5w6", "6w5", "6w7", "7w6", "7w8", "8w7", "8w9", "9w8", "9w1",
];
const MBTI = [
  "INTJ", "INTP", "ENTJ", "ENTP", "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ", "ISTP", "ISFP", "ESTP", "ESFP",
];
const EXPECTED_CELLS = ENNEA.length * MBTI.length; // 288

// 校验整份映射表，返回校验通过的 map；任一不合格立即抛错。
export function validateCompat(data) {
  if (!data || typeof data !== "object") {
    throw new Error("合盘映射表：顶层不是对象");
  }
  // types 恰好 8 个且无重复
  if (!Array.isArray(data.types) || data.types.length !== 8) {
    throw new Error(`合盘映射表：types 需恰好 8 个，实际 ${Array.isArray(data.types) ? data.types.length : "非数组"}`);
  }
  const typeSet = new Set(data.types);
  if (typeSet.size !== 8) {
    throw new Error("合盘映射表：types 存在重复");
  }
  // map 存在且恰好 288 格
  const map = data.map;
  if (!map || typeof map !== "object") {
    throw new Error("合盘映射表：缺少 map 对象");
  }
  const keys = Object.keys(map);
  if (keys.length !== EXPECTED_CELLS) {
    throw new Error(`合盘映射表：map 需恰好 ${EXPECTED_CELLS} 格，实际 ${keys.length}`);
  }
  // 288 格逐一齐全，且每格的值都在 types 内
  for (const enn of ENNEA) {
    for (const mbti of MBTI) {
      const key = `${enn}_${mbti}`;
      if (!Object.prototype.hasOwnProperty.call(map, key)) {
        throw new Error(`合盘映射表：缺少格子 ${key}`);
      }
      if (!typeSet.has(map[key])) {
        throw new Error(`合盘映射表：${key} 的值不在 types 内：${JSON.stringify(map[key])}`);
      }
    }
  }
  return map;
}

// 模块加载即读取并校验（失败直接抛错，不 fallback）。
export const COMPAT_MAP = validateCompat(COMPAT);

// 纯查表：只按 `${myEnneagram}_${theirMbti}` 取值；禁计算/默认值/随机；查不到直接抛错。
export function lookupCompat(myEnneagram, theirMbti) {
  const key = `${myEnneagram}_${theirMbti}`;
  const type = COMPAT_MAP[key];
  if (type === undefined) {
    throw new Error(`合盘映射表：查不到 ${key}`);
  }
  return type;
}
