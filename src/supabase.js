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
