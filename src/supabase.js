import { createClient } from "@supabase/supabase-js";

const URL  = process.env.REACT_APP_SUPABASE_URL  || "";
const KEY  = process.env.REACT_APP_SUPABASE_ANON_KEY || "";
const ready = URL && !URL.includes("your-project");

export const supabase = ready ? createClient(URL, KEY) : null;

// ── helpers ────────────────────────────────────────────────────────────────────

function userEmail() {
  try { return JSON.parse(localStorage.getItem("revery_user"))?.email || null; }
  catch { return null; }
}

export async function saveWish(content, lang) {
  if (!supabase) return;
  await supabase.from("wishes").insert({
    content,
    lang,
    user_email: userEmail(),
  });
}

export async function saveInterestEmail(email, lang) {
  if (!supabase) return;
  await supabase.from("interest_emails").insert({
    email: email.trim().toLowerCase(),
    lang: lang || "zh",
    created_at: new Date().toISOString(),
  });
}

// 阶段2 复诊提醒：写入独立表 rx_reminders（与 interest_emails 完全分离、无外键、不联表）。
// 仅当用户主动勾选「到期提醒我复诊」时调用；未勾选不写本表。anon 仅 INSERT（RLS）。
export async function saveRxReminder(email, sign) {
  if (!supabase) return;
  await supabase.from("rx_reminders").insert({
    email: email.trim().toLowerCase(),
    sign,
    opted_in: true,
    created_at: new Date().toISOString(),
  });
}

// ── 漏斗埋点（Phase 1.1）─────────────────────────────────────────────────────────
// 隔离铁律：combo 与选择值只进 funnel_events，绝不写入 interest_emails，两表永不关联。
function uuidv4() {
  try { if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID(); } catch { /* noop */ }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// 首次进入生成 session_id，存 sessionStorage（每标签页会话一个）
export function getFunnelSessionId() {
  try {
    let sid = sessionStorage.getItem("revery_sid");
    if (!sid) { sid = uuidv4(); sessionStorage.setItem("revery_sid", sid); }
    return sid;
  } catch {
    return uuidv4();
  }
}

// fire-and-forget：失败静默、不阻塞 UI、不重试
export function logFunnelEvent(event, payload) {
  try {
    if (!supabase) return;
    const insert = supabase.from("funnel_events").insert({
      session_id: getFunnelSessionId(),
      event,
      payload: payload ?? null,
    });
    if (insert && typeof insert.then === "function") insert.then(() => {}, () => {});
  } catch { /* swallow: 埋点绝不影响用户流程 */ }
}

export async function saveUser(info) {
  if (!supabase) return;
  await supabase.from("users").upsert({
    email:      info.email,
    name:       info.name,
    is_paid:    true,
    updated_at: new Date().toISOString(),
  }, { onConflict: "email" });
}

export async function saveSession({ type, personaName, target, lang, messages, analysisText }) {
  if (!supabase) return;
  await supabase.from("sessions").insert({
    user_email:   userEmail(),
    type,
    persona_name: personaName || null,
    target:       target || null,
    lang:         lang || null,
    messages:     messages  || null,
    analysis:     analysisText || null,
  });
}

// ── auth ───────────────────────────────────────────────────────────────────────

export async function signUpUser({ email, password, name }) {
  if (!supabase) return { error: "Supabase not configured" };
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return { error: error.message };
  await supabase.from("users").upsert(
    { email, name, is_paid: true, updated_at: new Date().toISOString() },
    { onConflict: "email" }
  );
  return { data: { email, name } };
}

export async function signInUser({ email, password }) {
  if (!supabase) return { error: "Supabase not configured" };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  const { data: profile } = await supabase
    .from("users")
    .select("name, email, is_paid")
    .eq("email", email)
    .single();
  if (!profile?.is_paid) return { error: "no_access" };
  return { data: { email: profile.email, name: profile.name } };
}

export async function signOutUser() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSessionUser() {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.email) return null;
  const { data } = await supabase
    .from("users")
    .select("name, email, is_paid")
    .eq("email", session.user.email)
    .single();
  return data?.is_paid ? { email: data.email, name: data.name } : null;
}
