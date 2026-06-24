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
