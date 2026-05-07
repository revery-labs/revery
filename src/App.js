import { useState, useRef, useEffect } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const CRIMSON    = "#8b2252";
const SANS       = '"Helvetica Neue", Helvetica, "PingFang SC", "苹方-简", -apple-system, sans-serif';
const MONO       = '"SF Mono", "DM Mono", ui-monospace, monospace';
const SERIF_LOGO = "'Cormorant Garamond', Georgia, serif";

const mkTh = (dark) => dark ? {
  bg: "#0d0a0f", surface: "#150f1a", card: "#1c1424",
  border: "rgba(180,100,120,0.15)", borderH: "rgba(180,100,120,0.35)",
  text: "#f0eaf0", mid: "rgba(240,234,240,0.80)", dim: "rgba(240,234,240,0.48)",
  input: "#1c1424", msgHer: "#1c1424", msgHerBorder: "rgba(180,100,120,0.2)",
} : {
  bg: "#faf5f6", surface: "#ffffff", card: "#f5eef0",
  border: "rgba(139,34,82,0.12)", borderH: "rgba(139,34,82,0.3)",
  text: "#111111", mid: "rgba(17,17,17,0.78)", dim: "rgba(17,17,17,0.50)",
  input: "#f5eef0", msgHer: "#f0e8eb", msgHerBorder: "rgba(139,34,82,0.12)",
};

// ─── I18N ─────────────────────────────────────────────────────────────────────
const TX = {
  zh: {
    nav:       ["测评", "蒸馏", "应用"],
    tagline:   "把她留在这里",
    dark: "◑", light: "☀",
    // assess
    aTitle:    "了解你的情感模式",
    aSub:      "免费 · 2分钟 · 无需注册",
    qs: [
      { q: "你现在的感情状态",         o: ["喜欢一个人", "恋爱中", "分手后", "想找到对的人"] },
      { q: "最让你困扰的是",           o: ["不知道对方的感受", "感情越来越淡", "分手想挽回", "想更了解对方"] },
      { q: "你怎么跟喜欢的人沟通",     o: ["总是我先开口", "等对方来找我", "想说又不敢", "很自然，不刻意"] },
      { q: "你希望 AI 帮你做什么",     o: ["分析对方说的话", "模拟和对方对话", "帮我想回复", "了解自己"] },
    ],
    next:      "继续",
    viewRes:   "查看测评结果",
    resTitle:  "你的情感档案",
    profiles: [
      { type: "敏感共情型", desc: "你对情感信号极度敏感，能捕捉别人忽略的细节。但过度解读有时让你陷入焦虑。Revery 把你的直觉变成洞察。" },
      { type: "理性分析型", desc: "你用逻辑处理情感，稳定但有时让对方感觉距离。Revery 帮你找到情绪与理性的平衡点。" },
      { type: "等待观望型", desc: "你习惯等待确定的信号，在观望中错过时机。Revery 帮你看清意图，减少不确定带来的焦虑。" },
      { type: "探索行动型", desc: "你愿意尝试，但有时冲动行事。Revery 给你行动前的数据支撑，让每一步更有把握。" },
    ],
    premTitle: "解锁完整功能",
    premSub:   "与她的蒸馏版本对话 · 深度情感分析",
    payCard:   "信用卡支付",
    payWX:     "微信支付",
    retake:    "重新测评",
    // assess - extended
    chooseTitle: "了解你的情感模式",
    chooseQuiz: "快速测评", chooseQuizSub: "4个问题 · 2分钟 · 免费",
    chooseExisting: "我有测评结果", chooseExistingSub: "直接输入 MBTI · 九型人格 · 星座",
    mbtiLabel: "MBTI 类型", mbtiPH: "选择 MBTI",
    ennLabel: "九型人格", ennPH: "选择类型（含侧翼）",
    zodLabel: "星座",
    zodiacs: ["白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天秤座","天蝎座","射手座","摩羯座","水瓶座","双鱼座"],
    submitExisting: "生成我的画像",
    profileLabel: "你的情感档案",
    sectionTitles: ["人格底色","反差洞察","人格镜像","适配伴侣","事业发展"],
    premCopy: "先理解自己，才能真正赢得关系。\n不是虚拟情侣，不是测评内容消费——是你在真实人际关系中的AI军师。\n基于你的性格数据，给出个性化的关系决策。",
    back: "← 返回",
    // distill
    herName:    "她叫什么",
    herNamePH:  "一个名字，或者只有你知道的称呼",
    herAvatar:  "对方头像",
    myAvatar:   "我的头像",
    meLabel:    "我",
    uploadPh:   "上传头像",
    zodPH:      "选择星座",
    clLabel:    "聊天记录",
    clHint:     "导出对话文本，效果最佳",
    clApps:     "微信 / Instagram / iMessage / WhatsApp / LINE",
    clFormats:  ".txt  /  .json  /  .csv  /  .html",
    dropHint:   "拖入文件，或点击选择",
    localHint:  "所有数据本地处理，不会上传至服务器",
    dHer:       "蒸馏她",
    dMe:        "蒸馏我",
    phases:     ["解析语言模式...", "提取情感特征...", "重建记忆碎片..."],
    histBtn:    "历史记录",
    histTitle:  "历史记录",
    histEmpty:  "暂无历史记录",
    histView:   "查看",
    histDelete: "删除",
    targetHer:  "她",
    targetMe:   "我",
    // app
    analyze:   "分析",
    chat:      "对话",
    redistill: "重新蒸馏",
    saveQ:     "是否保存当前对话记录？",
    saveY:     "保存",
    saveN:     "不保存",
    pastePH:   "粘贴想要具体分析的部分...",
    analyzeBtn:"开始分析",
    chatPH:    "说点什么...",
    analyzing: "分析中...",
    analyzeFollowPH: "针对以上分析继续提问...",
    clearAnalyze: "清除",
    noPersona: "请先完成蒸馏",
    clearChat: "清空对话",
    share: "分享", cs: "客服",
    csTitle: "联系我们", csEmail: "support@revery.app", csWX: "微信: revery_support",
    shareTitle: "分享 Revery", shareCopy: "复制链接", shareCopied: "已复制！",
    regTitle: "创建账号", regSub: "解锁蒸馏与应用功能",
    regName: "昵称", regEmail: "邮箱", regPw: "密码（至少6位）", regSubmit: "完成注册",
    paywallTitle: "解锁完整体验", paywallSub: "完成测评后付费，即可使用蒸馏与应用功能",
  },
  en: {
    nav:       ["Assess", "Distill", "Apply"],
    tagline:   "Keep her here",
    dark: "◑", light: "☀",
    aTitle:    "Understand Your Emotional Patterns",
    aSub:      "Free · 2 min · No sign up",
    qs: [
      { q: "Your relationship status",    o: ["Crushing on someone", "In a relationship", "After a breakup", "Looking for the right one"] },
      { q: "What's been on your mind",    o: ["Don't know how they feel", "Relationship fading", "Want to reconcile", "Want to understand them"] },
      { q: "How you communicate",         o: ["I always initiate", "Wait for them to reach out", "Want to but hesitant", "Natural, no pressure"] },
      { q: "What you want from AI",       o: ["Analyze what they say", "Simulate talking with them", "Help me reply", "Understand myself"] },
    ],
    next:      "Next",
    viewRes:   "View Results",
    resTitle:  "Your Emotional Profile",
    profiles: [
      { type: "Empathic Sensitive",  desc: "You pick up signals others miss. But overthinking can turn intuition into anxiety. Revery channels sensitivity into insight." },
      { type: "Rational Analyzer",   desc: "You process emotions logically. Stable, but can feel distant. Revery helps you bridge head and heart." },
      { type: "Patient Observer",    desc: "You wait for clear signals, missing windows along the way. Revery reads intent so you can act with confidence." },
      { type: "Action Explorer",     desc: "You're willing to try but sometimes act impulsively. Revery gives data-backed clarity before you move." },
    ],
    premTitle: "Unlock Full Features",
    premSub:   "Chat with her distilled version · Deep emotional analysis",
    payCard:   "Pay with Card",
    payWX:     "WeChat Pay",
    retake:    "Retake",
    // assess - extended
    chooseTitle: "Understand Your Emotional Patterns",
    chooseQuiz: "Quick Assessment", chooseQuizSub: "4 questions · 2 min · Free",
    chooseExisting: "I have results", chooseExistingSub: "Enter MBTI · Enneagram · Zodiac",
    mbtiLabel: "MBTI Type", mbtiPH: "Select MBTI",
    ennLabel: "Enneagram", ennPH: "Select type (with wing)",
    zodLabel: "Zodiac",
    zodiacs: ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"],
    submitExisting: "Build My Profile",
    profileLabel: "Your Emotional Profile",
    sectionTitles: ["Core Nature","Hidden Contrast","Personality Mirror","Ideal Partner","Career Path"],
    premCopy: "Understand yourself first — then truly win in relationships.\nNot a virtual partner. Not personality content. Your AI strategist for real human connections.\nPersonalized relationship decisions based on your personality data.",
    back: "← Back",
    herName:    "Their name",
    herNamePH:  "A name, or a nickname only you know",
    herAvatar:  "Their photo",
    myAvatar:   "My photo",
    meLabel:    "Me",
    uploadPh:   "Upload Photo",
    zodPH:      "Select Zodiac",
    clLabel:    "Chat logs",
    clHint:     "Exported text works best",
    clApps:     "WeChat / Instagram / iMessage / WhatsApp / LINE",
    clFormats:  ".txt  /  .json  /  .csv  /  .html",
    dropHint:   "Drop files here, or click to select",
    localHint:  "All data processed locally, never uploaded",
    dHer:       "Distill Her",
    dMe:        "Distill Me",
    phases:     ["Parsing language patterns...", "Extracting emotional traits...", "Rebuilding memory fragments..."],
    histBtn:    "History",
    histTitle:  "History",
    histEmpty:  "No history yet",
    histView:   "View",
    histDelete: "Delete",
    targetHer:  "Her",
    targetMe:   "Me",
    analyze:   "Analyze",
    chat:      "Chat",
    redistill: "Redistill",
    saveQ:     "Save current conversation?",
    saveY:     "Save",
    saveN:     "Don't Save",
    pastePH:   "Paste content to analyze...",
    analyzeBtn:"Analyze",
    chatPH:    "Say something...",
    analyzing: "Analyzing...",
    analyzeFollowPH: "Ask a follow-up about the analysis...",
    clearAnalyze: "Clear",
    noPersona: "Please complete distillation first",
    clearChat: "Clear Chat",
    share: "Share", cs: "Support",
    csTitle: "Contact Us", csEmail: "support@revery.app", csWX: "WeChat: revery_support",
    shareTitle: "Share Revery", shareCopy: "Copy Link", shareCopied: "Copied!",
    regTitle: "Create Account", regSub: "Unlock Distill & Apply",
    regName: "Name", regEmail: "Email", regPw: "Password (6+ chars)", regSubmit: "Register",
    paywallTitle: "Unlock Full Access", paywallSub: "Pay after your assessment to use Distill & Apply",
  },
};

// ─── FILE HELPERS (preserved) ─────────────────────────────────────────────────
function readFile(file) {
  return new Promise((resolve) => {
    const isText = file.name.endsWith(".txt") || file.name.endsWith(".json") || file.name.endsWith(".csv") || file.name.endsWith(".html");
    if (!isText) { resolve({ name: file.name, content: null }); return; }
    const reader = new FileReader();
    reader.onload  = (e) => resolve({ name: file.name, content: e.target.result });
    reader.onerror = ()  => resolve({ name: file.name, content: null });
    reader.readAsText(file, "utf-8");
  });
}

async function analyzeTraits(uploads, personName, target) {
  const combined = uploads
    .filter((f) => f.content)
    .map((f) => f.content)
    .join("\n\n---\n\n")
    .slice(0, 40000);
  if (!combined) return "";

  const subjectDesc = target === "her"
    ? `"${personName}"（聊天中叫"${personName}"的那个人）`
    : `除"${personName}"之外的另一个说话者（即"我"）`;

  const prompt = `以下是聊天记录。请完成两项分析：

一、${subjectDesc}的说话风格（6-10条，每条单独一行）：
重点分析：标点使用习惯（爱不爱用标点、用什么标点）、常用词/口头禅/语气词、句子长短和结构偏好、回复长短习惯（单字还是长句）、情绪表达方式、其他最显著的语言特征

二、聊天中的重要信息（5-8条，每条单独一行）：
包括：双方的关系和称呼、提到的人名/地点/事件、重要约定或共同习惯、情感状态和关系进展、聊天中的关键细节

格式（保留标题行）：
[说话风格]
（一条特征）

[重要记忆]
（一条记忆）

聊天记录：
${combined}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) return "";
  const data = await response.json();
  return data.content[0].text;
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

// Sliding segmented control
function Seg({ opts, val, onChange, th, sm = false, disabledVals = [], onDisabledClick }) {
  const n   = opts.length;
  const idx = Math.max(0, opts.findIndex((o) => o.v === val));
  return (
    <div style={{ position: "relative", display: "flex", background: th.card, borderRadius: 100, padding: 3, border: `0.5px solid ${th.border}` }}>
      <div style={{
        position: "absolute", top: 3, bottom: 3,
        width:  `calc(${100 / n}% - ${6 / n}px)`,
        left:   `calc(${idx * (100 / n)}% + ${3 - idx * (6 / n)}px)`,
        background: CRIMSON, borderRadius: 100,
        transition: "left 0.25s cubic-bezier(0.4,0,0.2,1)", pointerEvents: "none",
      }} />
      {opts.map((o) => {
        const dis = disabledVals.includes(o.v);
        return (
          <button key={o.v} onClick={() => { if (dis) { onDisabledClick?.(o.v); } else { onChange(o.v); } }} style={{
            flex: 1, position: "relative", zIndex: 1,
            background: "none", border: "none",
            padding: sm ? "6px 16px" : "8px 22px",
            fontSize: sm ? "13px" : "15px", letterSpacing: "0.04em",
            cursor: dis ? "not-allowed" : "pointer",
            color: val === o.v ? "white" : th.dim,
            opacity: dis ? 0.35 : 1,
            fontFamily: MONO, transition: "color 0.2s, opacity 0.2s", borderRadius: 100, whiteSpace: "nowrap",
          }}>{o.l}</button>
        );
      })}
    </div>
  );
}

// Overlay modal
function Modal({ show, onClose, th, children }) {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: th.surface, border: `0.5px solid ${th.border}`, borderRadius: 12, padding: "28px 32px", maxWidth: 360, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}>
        {children}
      </div>
    </div>
  );
}

// Small icon button
function IconBtn({ onClick, th, children, style = {} }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: `0.5px solid ${th.border}`, borderRadius: 6, padding: "7px 16px", fontSize: 14, cursor: "pointer", color: th.mid, fontFamily: MONO, letterSpacing: "0.04em", transition: "border-color 0.15s", ...style }}>
      {children}
    </button>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const ShareIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
    <polyline points="16 6 12 2 8 6"/>
    <line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
);
const HeadsetIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

// ─── PAYWALL MODAL ────────────────────────────────────────────────────────────
function PaywallModal({ show, onClose, onPay, th, t }) {
  return (
    <Modal show={show} onClose={onClose} th={th}>
      <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 6 }}>{t.paywallTitle}</div>
      <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS, marginBottom: 24, lineHeight: 1.6 }}>{t.paywallSub}</div>
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => onPay("stripe")} style={{ flex: 1, padding: "12px 0", background: "#635BFF", border: "none", borderRadius: 7, color: "white", fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>
          {t.payCard}
        </button>
        <button onClick={() => onPay("wechat")} style={{ flex: 1, padding: "12px 0", background: "#07C160", border: "none", borderRadius: 7, color: "white", fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>
          {t.payWX}
        </button>
      </div>
    </Modal>
  );
}

// ─── REGISTER MODAL ───────────────────────────────────────────────────────────
function RegisterModal({ show, onRegister, th, t }) {
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pw,    setPw]    = useState("");
  const [done,  setDone]  = useState(false);

  const canSubmit = name.trim() && email.includes("@") && pw.length >= 6;
  const fieldSt = { width: "100%", boxSizing: "border-box", background: th.input, border: `0.5px solid ${th.border}`, borderRadius: 6, padding: "11px 14px", color: th.text, fontSize: 14, fontFamily: SANS, outline: "none" };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const info = { name: name.trim(), email: email.trim() };
    try { localStorage.setItem("revery_user", JSON.stringify(info)); } catch {}
    setDone(true);
    setTimeout(() => onRegister(info), 900);
  };

  if (!show) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div style={{ background: th.surface, border: `0.5px solid ${th.border}`, borderRadius: 14, padding: "32px", maxWidth: 360, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: th.text, fontFamily: SANS }}>{t.regSubmit}</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 22, fontWeight: 700, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{t.regTitle}</div>
            <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS, marginBottom: 24 }}>{t.regSub}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input placeholder={t.regName} value={name} onChange={(e) => setName(e.target.value)} style={fieldSt} />
              <input placeholder={t.regEmail} value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={fieldSt} />
              <input placeholder={t.regPw} value={pw} onChange={(e) => setPw(e.target.value)} type="password" style={fieldSt} />
              <button onClick={handleSubmit} disabled={!canSubmit} style={{ padding: "13px 0", background: canSubmit ? CRIMSON : th.card, border: "none", borderRadius: 7, color: canSubmit ? "white" : th.dim, fontSize: 15, cursor: canSubmit ? "pointer" : "default", fontFamily: SANS, fontWeight: 600, marginTop: 4, transition: "all 0.2s" }}>
                {t.regSubmit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ page, onNavChange, dark, setDark, lang, setLang, th, t, isPaid, persona, onPaywall }) {
  const [showShare, setShowShare] = useState(false);
  const [showCS,    setShowCS]    = useState(false);
  const [copied,    setCopied]    = useState(false);

  const navOpts = t.nav.map((l, i) => ({ v: ["assess", "distill", "app"][i], l }));

  const disabledVals = !isPaid
    ? ["distill", "app"]
    : (!persona ? ["app"] : []);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Revery Labs", text: t.tagline, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
    }
  };

  return (
    <>
      <div style={{ height: 72, display: "flex", alignItems: "center", padding: "0 28px", borderBottom: `0.5px solid ${th.border}`, background: th.surface, flexShrink: 0, gap: 14, zIndex: 10, position: "relative" }}>
        {/* Logo */}
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="" style={{ height: 72, width: "auto", display: "block" }} />
          <div>
            <div style={{ fontSize: 26, lineHeight: 1 }}>
              <span style={{ fontFamily: SERIF_LOGO, fontStyle: "italic", fontWeight: 700, color: CRIMSON }}>Revery</span>
              <span style={{ fontFamily: "Arial, 'Helvetica Neue', sans-serif", color: th.mid, fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", marginLeft: 8 }}>LABS</span>
            </div>
            <div style={{ fontSize: 12, color: th.text, letterSpacing: "0.1em", marginTop: 5, fontFamily: SANS }}>{t.tagline}</div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Nav */}
        <Seg opts={navOpts} val={page} onChange={onNavChange} th={th}
          disabledVals={disabledVals}
          onDisabledClick={(v) => { if (!isPaid && (v === "distill" || v === "app")) onPaywall?.(); }}
        />

        {/* Lang */}
        <IconBtn onClick={() => setLang((l) => (l === "zh" ? "en" : "zh"))} th={th}>
          {lang === "zh" ? "EN" : "中"}
        </IconBtn>

        {/* Dark/Light */}
        <IconBtn onClick={() => setDark((d) => !d)} th={th}>
          {dark ? t.light : t.dark}
        </IconBtn>

        {/* CS */}
        <IconBtn onClick={() => setShowCS(true)} th={th}><HeadsetIcon /></IconBtn>

        {/* Share */}
        <IconBtn onClick={handleShare} th={th}>{copied ? "✓" : <ShareIcon />}</IconBtn>
      </div>

      {/* Share modal (fallback for non-native share) */}
      <Modal show={showShare} onClose={() => setShowShare(false)} th={th}>
        <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: th.text, marginBottom: 16 }}>{t.shareTitle}</div>
        <button onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => { setCopied(false); setShowShare(false); }, 1500); } catch {} }} style={{ width: "100%", padding: "12px 0", background: CRIMSON, border: "none", borderRadius: 7, color: "white", fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>
          {copied ? t.shareCopied : t.shareCopy}
        </button>
      </Modal>

      {/* CS modal */}
      <Modal show={showCS} onClose={() => setShowCS(false)} th={th}>
        <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: th.text, marginBottom: 16 }}>{t.csTitle}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 14, color: th.mid, fontFamily: SANS, padding: "10px 14px", background: th.card, borderRadius: 8 }}>{t.csEmail}</div>
          <div style={{ fontSize: 14, color: th.mid, fontFamily: SANS, padding: "10px 14px", background: th.card, borderRadius: 8 }}>{t.csWX}</div>
        </div>
      </Modal>
    </>
  );
}

// ─── ASSESS DATA ──────────────────────────────────────────────────────────────
const SECTION_KEYS = ["core", "contrast", "mirror", "partner", "career"];
const MBTI_TO_PROFILE = {
  INTJ:0, INFJ:0, ISTP:0, ISFP:0,
  ENFJ:1, ESFJ:1, ESTJ:1, ISFJ:1,
  INTP:2, INFP:2, ISTJ:2,
  ENTP:3, ENTJ:3, ESTP:3, ESFP:3, ENFP:3,
};
const ENNEA_TO_PROFILE = { "1":2,"2":1,"3":3,"4":0,"5":2,"6":2,"7":3,"8":3,"9":1 };
const ENNEA_OPTIONS = [
  "1w9","1w2",
  "2w1","2w3",
  "3w2","3w4",
  "4w3","4w5",
  "5w4","5w6",
  "6w5","6w7",
  "7w6","7w8",
  "8w7","8w9",
  "9w8","9w1",
];
const MBTI_OPTIONS = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
const PROFILES = {
  zh: [
    {
      name:"钻石直觉者", tagline:"情感场上的隐形棋手",
      core:    "你天生携带情感雷达，能在别人开口之前感知到房间里的张力。这不是天真，是一种稀缺的认知天赋。",
      contrast:"你看上去冷静，内心却运转着精密的情感计算机。你的「没事」背后，往往是懒得解释。",
      mirror:  "别人觉得你深不可测，你却觉得自己再普通不过。这种落差让你在关系里始终保持主动权——哪怕你自己没意识到。",
      partner: "你需要一个愿意慢下来陪你解码世界的人。对方不必多话，但必须够稳——你的敏感需要安全感作为土壤。",
      career:  "任何需要「读懂人」的赛道都适合你：咨询、创作、策略、用户研究。你最大的商业武器，是让人觉得「被懂了」的能力。",
    },
    {
      name:"磁场建构者", tagline:"让关系发光的隐秘发动机",
      core:    "你是关系里的发动机。不是因为外向，而是因为你天然知道如何让人感到被需要——这是一种罕见的人际智慧。",
      contrast:"你永远是那个撑起场面的人，但私下里，你其实渴望有人来撑一下你。",
      mirror:  "你吸引的往往是需要你的人，而不是能给你托底的人。认识到这个模式，是你关系进化的起点。",
      partner: "你需要一个不依赖你却真正欣赏你的人。对方要有自己的世界，这样你才有空间做回那个「被照顾的人」。",
      career:  "领导力、品牌、销售、社群运营——你的天花板取决于你愿意被多少人看见。你天生懂得如何让人信任你。",
    },
    {
      name:"深海思考者", tagline:"一个人想清楚，比所有人快一步",
      core:    "你的大脑是一台长焦镜头，能看到别人忽视的细节和长期格局。你不是慢，你是在精准蓄力。",
      contrast:"你的沉默被误读为冷漠，但你只是不愿意说没想清楚的话。这种自律，大多数人一辈子都学不来。",
      mirror:  "你会在心里把一段关系推演很多遍，然后选择不行动——这保护了你，也隔绝了你。",
      partner: "你需要一个不催你、但会轻轻推你一把的人。对方的安全感来自「懂你」，而不是「改变你」。",
      career:  "研究、写作、技术、金融——任何需要深度思考的领域都是你的主场。你最大的护城河是：别人放弃的时候，你还在想。",
    },
    {
      name:"光谱探索者", tagline:"把直觉变成决策的天才",
      core:    "你活在当下的能力让大多数人羡慕。你不是冲动，你是比别人更快地看到了「值得」二字。",
      contrast:"你的果敢背后，藏着一个极其敏感的内核——你只是不让人看见而已。",
      mirror:  "你在关系里往往先给出100分，然后期待对方匹配。当落差出现，你比任何人都更快感到失望。",
      partner: "你需要一个真实的人，不是完美的人。对方要能接住你的热情，也要敢于直接告诉你「不行」。",
      career:  "创业、创意方向、销售冲锋、团队激活——你是那种能在最短时间内让项目从0到1的人。",
    },
  ],
  en: [
    {
      name:"Diamond Intuitor", tagline:"The unseen player on the emotional board",
      core:    "You carry a built-in emotional radar — sensing tension before anyone speaks. That's not oversensitivity; that's a rare cognitive gift.",
      contrast:"You appear calm, but inside runs a precise emotional processor. Your 'I'm fine' often means you can't be bothered to explain.",
      mirror:  "Others find you unfathomable; you find yourself painfully ordinary. That gap quietly gives you the upper hand in every relationship.",
      partner: "You need someone willing to slow down and decode the world with you. Steady, not necessarily talkative — your sensitivity needs security as soil.",
      career:  "Any field that requires reading people: consulting, strategy, UX, creative direction. Your greatest asset is making others feel genuinely understood.",
    },
    {
      name:"Field Architect", tagline:"The hidden engine that makes relationships glow",
      core:    "You're the engine in every relationship — not because you're extroverted, but because you intuitively know how to make people feel needed.",
      contrast:"You're always the one holding the room together. Privately, you're waiting for someone to hold you.",
      mirror:  "You attract people who need you, not people who can anchor you. Recognizing this pattern is where your relational evolution begins.",
      partner: "You need someone who doesn't depend on you, but genuinely admires you. Someone with their own world — so you can finally be cared for.",
      career:  "Leadership, brand-building, sales, community — your ceiling is how visible you're willing to be. You're wired for trust.",
    },
    {
      name:"Deep-Sea Thinker", tagline:"One step ahead because you actually thought it through",
      core:    "Your mind is a long-lens camera — catching details and long arcs that others miss. You're not slow. You're building precision.",
      contrast:"Your silence gets mistaken for coldness. You just won't say something until you're sure. That discipline is rarer than it looks.",
      mirror:  "You've run a relationship through its outcomes a hundred times before acting. It protects you — and occasionally isolates you.",
      partner: "You need someone who won't rush you, but will gently push. Their security comes from understanding you — not from changing you.",
      career:  "Research, writing, engineering, finance — any domain that rewards depth. Your moat: you're still thinking when everyone else has quit.",
    },
    {
      name:"Spectrum Explorer", tagline:"Turning intuition into decisions — naturally",
      core:    "Your ability to live in the present is something most people spend years trying to learn. You're not impulsive; you just see 'worth it' faster.",
      contrast:"Behind the boldness is an extremely sensitive core that you rarely let anyone reach.",
      mirror:  "You often open at 100% in relationships and wait for the other person to match. When the gap appears, you feel it faster — and sharper.",
      partner: "You need someone real, not someone perfect. Someone who can catch your enthusiasm and isn't afraid to say no.",
      career:  "Entrepreneurship, creative direction, sales, team activation — you take things from zero to one faster than anyone.",
    },
  ],
};

// ─── ASSESS PAGE ──────────────────────────────────────────────────────────────
function AssessPage({ t, th, lang, onPaymentSuccess }) {
  const SAVED_KEY = "revery_profile_v2";
  const loadSaved = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY)); } catch { return null; } };

  const [savedData]  = useState(loadSaved);
  const [screen,     setScreen]    = useState(savedData ? "result" : "choose");
  const [picks,      setPicks]     = useState(Array(4).fill(null));
  const [mbti,       setMbti]      = useState("");
  const [enneagram,  setEnneagram] = useState("");
  const [zodiac,     setZodiac]    = useState("");
  const [profileId,  setProfileId] = useState(savedData?.profileId ?? null);
  const [extras,     setExtras]    = useState(savedData
    ? { mbti: savedData.mbti || "", enn: savedData.enneagram || "", zod: savedData.zodiac || "" }
    : { mbti: "", enn: "", zod: "" });

  const profile = profileId !== null ? (PROFILES[lang] ?? PROFILES.zh)[profileId] : null;

  const saveAndShow = (pid, mbtiVal, ennVal, zodVal) => {
    localStorage.setItem(SAVED_KEY, JSON.stringify({ profileId: pid, mbti: mbtiVal, enneagram: ennVal, zodiac: zodVal }));
    setProfileId(pid);
    setExtras({ mbti: mbtiVal, enn: ennVal, zod: zodVal });
    setScreen("result");
  };

  const retake = () => {
    localStorage.removeItem(SAVED_KEY);
    setScreen("choose");
    setProfileId(null);
    setPicks(Array(4).fill(null));
    setMbti("");
    setEnneagram("");
    setZodiac("");
    setExtras({ mbti: "", enn: "", zod: "" });
  };

  const finishQuiz = (finalPicks) =>
    saveAndShow(finalPicks.reduce((s, a) => s + a, 0) % 4, "", "", "");

  const submitExisting = () => {
    const upper = mbti.trim().toUpperCase();
    let pid = MBTI_TO_PROFILE[upper];
    if (pid === undefined) {
      const ennBase = enneagram.trim().replace(/w\d$/, "");
      pid = ENNEA_TO_PROFILE[ennBase];
    }
    saveAndShow(pid ?? 0, mbti.trim(), enneagram.trim(), zodiac);
  };

  // ── Result ────────────────────────────────────────────────────────────────
  if (screen === "result" && profile) {
    const extraTag = [extras.mbti, extras.enn, extras.zod].filter(Boolean).join(" · ");
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Fixed top: profile header only */}
        <div style={{ padding: "20px 24px 16px", flexShrink: 0, background: th.bg, borderBottom: `0.5px solid ${th.border}` }}>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: th.dim, fontFamily: MONO }}>
                {t.profileLabel.toUpperCase()}
              </div>
              {extraTag && <div style={{ fontSize: 10, color: th.dim, fontFamily: MONO }}>{extraTag}</div>}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 32, fontWeight: 700, color: CRIMSON, lineHeight: 1.1, marginBottom: 4 }}>
              {profile.name}
            </div>
            <div style={{ fontSize: 14, color: th.mid, fontFamily: SANS }}>
              {profile.tagline}
            </div>
          </div>
        </div>

        {/* Scrollable: sections → retake → payment */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 28px" }}>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            {t.sectionTitles.map((title, i) => (
              <div key={i} style={{ padding: "16px 0", borderTop: `0.5px solid ${th.border}` }}>
                <div style={{ fontSize: 10, letterSpacing: "0.18em", color: CRIMSON, fontFamily: MONO, marginBottom: 8, textTransform: "uppercase", opacity: 0.75 }}>
                  {title}
                </div>
                <div style={{ fontSize: 14, color: th.text, lineHeight: 1.9, fontFamily: SANS }}>
                  {profile[SECTION_KEYS[i]]}
                </div>
              </div>
            ))}

            {/* Retake — prominent, crimson, 15px */}
            <div style={{ paddingTop: 20, borderTop: `0.5px solid ${th.border}` }}>
              <button onClick={retake} style={{
                width: "100%", padding: "14px 0", background: CRIMSON, border: "none",
                borderRadius: 8, color: "white", fontSize: 15, cursor: "pointer",
                fontFamily: MONO, letterSpacing: "0.08em", transition: "opacity 0.15s",
              }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >{t.retake}</button>
            </div>

            {/* Payment CTA — below retake */}
            <div style={{ marginTop: 16, background: th.card, border: `0.5px solid ${th.border}`, borderRadius: 10, padding: "16px 18px" }}>
              {t.premCopy.split("\n").map((line, i) => (
                <p key={i} style={{
                  fontSize: i === 0 ? 14 : 12, fontWeight: i === 0 ? 600 : 400,
                  color: i === 0 ? th.text : th.mid,
                  lineHeight: 1.65, margin: "0 0 6px", fontFamily: SANS,
                }}>{line}</p>
              ))}
              <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                <button onClick={() => onPaymentSuccess?.("stripe")} style={{ flex: 1, padding: "10px 0", background: "#635BFF", border: "none", borderRadius: 7, color: "white", fontSize: 13, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>
                  {t.payCard}
                </button>
                <button onClick={() => onPaymentSuccess?.("wechat")} style={{ flex: 1, padding: "10px 0", background: "#07C160", border: "none", borderRadius: 7, color: "white", fontSize: 13, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>
                  {t.payWX}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Choose mode ───────────────────────────────────────────────────────────
  if (screen === "choose") return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", padding: 32, paddingTop: 64, gap: 28 }}>
      <div style={{ fontFamily: SANS, fontSize: 30, fontWeight: 700, color: th.text, textAlign: "center" }}>
        {t.chooseTitle}
      </div>
      <div style={{ display: "flex", gap: 16, width: "100%", maxWidth: 480 }}>
        {[
          { sc: "quiz",     title: t.chooseQuiz,     sub: t.chooseQuizSub },
          { sc: "existing", title: t.chooseExisting, sub: t.chooseExistingSub },
        ].map((opt) => (
          <button key={opt.sc} onClick={() => setScreen(opt.sc)} style={{
            flex: 1, padding: "22px 18px", background: th.card,
            border: `0.5px solid ${th.border}`, borderRadius: 10,
            cursor: "pointer", textAlign: "left", transition: "border-color 0.15s",
          }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = CRIMSON}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = th.border}
          >
            <div style={{ fontSize: 17, fontWeight: 600, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{opt.title}</div>
            <div style={{ fontSize: 13, color: th.text, fontFamily: SANS, lineHeight: 1.6 }}>{opt.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Enter existing results ────────────────────────────────────────────────
  if (screen === "existing") {
    const mbtiUpper = mbti.trim().toUpperCase();
    const mbtiValid = MBTI_TO_PROFILE[mbtiUpper] !== undefined;
    const ennBase   = enneagram.trim().replace(/w\d$/, "");
    const ennValid  = ["1","2","3","4","5","6","7","8","9"].includes(ennBase);
    const canSubmit = mbtiValid || ennValid;
    const fieldStyle = (active) => ({
      width: "100%", boxSizing: "border-box",
      background: th.input, border: `0.5px solid ${active ? CRIMSON : th.border}`,
      borderRadius: 6, padding: "11px 14px", color: th.text,
      fontSize: 14, fontFamily: MONO, outline: "none", transition: "border-color 0.2s",
    });
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <button onClick={() => setScreen("choose")} style={{ background: "none", border: "none", color: th.dim, cursor: "pointer", fontSize: 15, fontFamily: MONO, marginBottom: 24, padding: 0 }}>
            {t.back}
          </button>
          <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, color: th.text, marginBottom: 24 }}>
            {t.chooseExisting}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{t.mbtiLabel}</div>
              <select value={mbti} onChange={(e) => setMbti(e.target.value)}
                style={{ ...fieldStyle(mbti && mbtiValid), appearance: "none", cursor: "pointer", color: mbti ? th.text : th.dim }}>
                <option value="">{t.mbtiPH}</option>
                {MBTI_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{t.ennLabel}</div>
              <select value={enneagram} onChange={(e) => setEnneagram(e.target.value)}
                style={{ ...fieldStyle(ennValid && !!enneagram), appearance: "none", cursor: "pointer", color: enneagram ? th.text : th.dim }}>
                <option value="">{t.ennPH}</option>
                {ENNEA_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{t.zodLabel}</div>
              <select value={zodiac} onChange={(e) => setZodiac(e.target.value)}
                style={{ ...fieldStyle(false), appearance: "none", cursor: "pointer", color: zodiac ? th.text : th.dim }}>
                <option value="">{t.zodPH}</option>
                {t.zodiacs.map((z) => <option key={z} value={z}>{z}</option>)}
              </select>
            </div>
            <button onClick={submitExisting} disabled={!canSubmit} style={{
              width: "100%", padding: "13px 0", marginTop: 8,
              background: CRIMSON, border: "none", borderRadius: 7,
              color: "white", fontSize: 15,
              cursor: canSubmit ? "pointer" : "default", fontFamily: MONO, letterSpacing: "0.1em",
              opacity: canSubmit ? 1 : 0.38, transition: "opacity 0.2s",
            }}>
              {t.viewRes}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz — 2×2 quadrant layout ────────────────────────────────────────────
  const canSubmit = picks.every((p) => p !== null);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: "16px 24px" }}>
      <button onClick={() => setScreen("choose")} style={{
        background: "none", border: "none", color: th.dim, cursor: "pointer",
        fontSize: 15, fontFamily: MONO, marginBottom: 12, padding: 0, alignSelf: "flex-start",
      }}>{t.back}</button>

      <div style={{
        flex: 1,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "1fr 1fr",
        gridAutoFlow: "column",
        gap: 12,
        overflow: "hidden",
      }}>
        {t.qs.map((q, qi) => (
          <div key={qi} style={{ display: "flex", flexDirection: "column", overflow: "hidden", padding: "8px 6px" }}>
            <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: th.text, marginBottom: 8, lineHeight: 1.3, flexShrink: 0 }}>
              <span style={{ color: CRIMSON, fontFamily: MONO, fontSize: 15, marginRight: 6, opacity: 0.7 }}>{qi + 1}</span>
              {q.q}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {q.o.map((opt, oi) => {
                const sel = picks[qi] === oi;
                return (
                  <div key={oi} onClick={() => setPicks((prev) => { const n = [...prev]; n[qi] = oi; return n; })} style={{
                    flex: 1, padding: "0 10px",
                    background: sel ? "rgba(139,34,82,0.07)" : th.surface,
                    border: `0.5px solid ${sel ? CRIMSON : th.border}`,
                    borderRadius: 6, cursor: "pointer", fontSize: 15,
                    color: sel ? th.text : th.mid, transition: "all 0.15s",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${sel ? CRIMSON : th.border}`, background: sel ? CRIMSON : "none", transition: "all 0.15s" }} />
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", justifyContent: "center", paddingTop: 12 }}>
        <button onClick={() => canSubmit && finishQuiz(picks)} disabled={!canSubmit} style={{
          padding: "10px 28px",
          background: CRIMSON, border: "none", borderRadius: 8,
          color: "white", fontSize: 15,
          cursor: canSubmit ? "pointer" : "default", fontFamily: MONO, letterSpacing: "0.1em",
          opacity: canSubmit ? 1 : 0.38, transition: "opacity 0.2s",
        }}>
          {t.viewRes}
        </button>
      </div>
    </div>
  );
}

// ─── DISTILL PAGE ─────────────────────────────────────────────────────────────
function DistillPage({ t, th, onDistilled, triggerHistory }) {
  const [personName,  setPersonName]  = useState("");
  const [avatarUrl,   setAvatarUrl]   = useState(null);
  const [uploads,     setUploads]     = useState([]);
  const [distilling,  setDistilling]  = useState(null);
  const [phase,       setPhase]       = useState(-1);
  const [isDragging,  setIsDragging]  = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history,     setHistory]     = useState(() =>
    JSON.parse(localStorage.getItem("revery_history") || "[]")
  );

  const fileRef   = useRef();
  const avatarRef = useRef();

  useEffect(() => {
    if (triggerHistory) setShowHistory(true);
  }, [triggerHistory]);

  const addFiles = async (fileList) => {
    const results = await Promise.all(Array.from(fileList).map(readFile));
    setUploads((prev) => [...prev, ...results]);
  };

  const removeFile = (idx) => setUploads((prev) => prev.filter((_, i) => i !== idx));

  const handleDistill = async (target) => {
    if (!personName || distilling) return;
    setDistilling(target);
    setPhase(0);

    let phaseIdx = 0;
    const iv = setInterval(() => {
      phaseIdx = Math.min(phaseIdx + 1, t.phases.length - 1);
      setPhase(phaseIdx);
    }, 1100);

    try {
      const traits = await analyzeTraits(uploads, personName, target);
      clearInterval(iv);
      setPhase("done");

      const entry = { name: personName, target, traits, avatarUrl, date: new Date().toISOString().slice(0, 10) };
      const hist  = JSON.parse(localStorage.getItem("revery_history") || "[]");
      const newHist = [entry, ...hist].slice(0, 20);
      localStorage.setItem("revery_history", JSON.stringify(newHist));
      setHistory(newHist);

      setTimeout(() => onDistilled({ name: personName, traits, target, avatarUrl }), 700);
    } catch {
      clearInterval(iv);
      setDistilling(null);
      setPhase(-1);
    }
  };

  const handleAvatarUpload = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setAvatarUrl(e.target.result);
    reader.readAsDataURL(file);
  };

  const deleteHistoryEntry = (idx) => {
    const newHist = history.filter((_, i) => i !== idx);
    localStorage.setItem("revery_history", JSON.stringify(newHist));
    setHistory(newHist);
  };

  const viewHistoryEntry = (h) => {
    setShowHistory(false);
    onDistilled({ name: h.name, traits: h.traits, target: h.target, avatarUrl: h.avatarUrl || null, messages: h.messages || [], viewMode: true });
  };

  const btnLabel = (target) => {
    if (distilling !== target) return target === "her" ? t.dHer : t.dMe;
    if (phase === "done")      return "✓";
    if (phase >= 0)            return t.phases[phase];
    return target === "her" ? t.dHer : t.dMe;
  };

  const btnBg = (target) => {
    if (distilling === target && phase === "done") return "#2a6644";
    if (distilling === target) return CRIMSON;
    if (distilling && distilling !== target) return th.card;
    return CRIMSON;
  };

  return (
    <>
      {/* History modal */}
      <Modal show={showHistory} onClose={() => setShowHistory(false)} th={th}>
        <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: th.text, marginBottom: 16 }}>{t.histTitle}</div>
        {history.length === 0
          ? <div style={{ fontSize: 13, color: th.dim }}>{t.histEmpty}</div>
          : <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {history.map((h, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: `0.5px solid ${th.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: th.dim, fontFamily: MONO }}>{h.date}</div>
                    <div style={{ fontSize: 14, color: th.text, fontWeight: 500, marginTop: 2, fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                  </div>
                  <button onClick={() => viewHistoryEntry(h)} style={{ padding: "5px 12px", background: "#2a6644", border: "none", borderRadius: 5, color: "white", fontSize: 12, cursor: "pointer", fontFamily: MONO, flexShrink: 0 }}>
                    {t.histView}
                  </button>
                  <button onClick={() => deleteHistoryEntry(i)} style={{ padding: "5px 12px", background: "#8b2020", border: "none", borderRadius: 5, color: "white", fontSize: 12, cursor: "pointer", fontFamily: MONO, flexShrink: 0 }}>
                    {t.histDelete}
                  </button>
                </div>
              ))}
            </div>
        }
      </Modal>

      {/* Subheader: history button flush right, same style/size as header buttons */}
      <div style={{ padding: "10px 28px", borderBottom: `0.5px solid ${th.border}`, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
        <button onClick={() => setShowHistory(true)} style={{
          padding: "7px 16px", background: CRIMSON, border: "none",
          borderRadius: 6, color: "white", fontSize: 15, cursor: "pointer",
          fontFamily: MONO, letterSpacing: "0.04em",
        }}>{t.histBtn}</button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "14px 28px 20px", overflow: "hidden", gap: 12 }}>

        {/* ── Avatar (left) + Name row ── */}
        <div style={{ display: "flex", gap: 12, flexShrink: 0, alignItems: "flex-end" }}>
          {/* Avatar — left of name, label above, hint text inside when empty */}
          <div style={{ flexShrink: 0, width: 130 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{t.herAvatar}</div>
            <div
              onClick={() => !distilling && avatarRef.current?.click()}
              style={{
                width: "100%", height: 52, border: `0.5px dashed ${th.borderH}`,
                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: 14,
                cursor: distilling ? "default" : "pointer",
                background: avatarUrl ? "none" : th.card,
                overflow: "hidden", position: "relative",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleAvatarUpload(e.dataTransfer.files[0]); }}
            >
              <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleAvatarUpload(e.target.files[0])} />
              {avatarUrl ? (
                <>
                  <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button onClick={(e) => { e.stopPropagation(); setAvatarUrl(null); }} style={{
                    position: "absolute", top: 4, right: 4, width: 18, height: 18, borderRadius: "50%",
                    background: "rgba(0,0,0,0.55)", border: "none", color: "white", fontSize: 9,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>✕</button>
                </>
              ) : (
                <div style={{ fontSize: 16, color: th.dim, fontFamily: SANS, lineHeight: 1.4 }}>{t.uploadPh}</div>
              )}
            </div>
          </div>

          {/* Name */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{t.herName}</div>
            <input
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder={t.herNamePH}
              disabled={!!distilling}
              style={{
                width: "100%", boxSizing: "border-box", height: 52,
                background: th.input, border: `0.5px solid ${personName ? CRIMSON : th.border}`,
                borderRadius: 7, padding: "0 14px",
                color: th.text, fontSize: 16, fontFamily: SANS,
                outline: "none", transition: "border-color 0.2s",
              }}
            />
          </div>
        </div>

        {/* ── Chat logs label ── */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 5 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: th.text, fontFamily: SANS }}>{t.clLabel}</div>
            <span style={{ fontSize: 11, color: th.dim, fontFamily: MONO, marginLeft: 10 }}>{t.clHint}</span>
          </div>
          <div style={{ fontSize: 11, color: th.mid, fontFamily: MONO, lineHeight: 1.65 }}>{t.clApps}</div>
        </div>

        {/* ── Drop zone (flex:1 fills remaining space, bigger) ── */}
        <div
          onDrop={async (e) => { e.preventDefault(); setIsDragging(false); await addFiles(e.dataTransfer.files); }}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          style={{
            flex: 1,
            border: `0.5px dashed ${isDragging ? CRIMSON : th.borderH}`,
            borderRadius: 10, display: "flex", flexDirection: "column",
            background: isDragging ? "rgba(139,34,82,0.04)" : th.card,
            transition: "all 0.2s", padding: "14px 18px", overflow: "hidden",
          }}
        >
          <input ref={fileRef} type="file" multiple style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />
          {/* Row 1: uploaded file chips */}
          {uploads.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
              {uploads.map((f, i) => (
                <span key={i}
                  style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
                  onMouseEnter={(e) => { const x = e.currentTarget.querySelector(".del-x"); if (x) x.style.display = "flex"; }}
                  onMouseLeave={(e) => { const x = e.currentTarget.querySelector(".del-x"); if (x) x.style.display = "none"; }}
                >
                  <span style={{
                    fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: MONO,
                    background: f.content ? "rgba(139,34,82,0.08)" : th.surface,
                    border: `0.5px solid ${f.content ? CRIMSON : th.border}`,
                    color: f.content ? "#d4768a" : th.dim,
                  }}>{f.name}</span>
                  <span className="del-x" onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{
                    display: "none", position: "absolute", right: -6, top: -6,
                    width: 16, height: 16, borderRadius: "50%",
                    background: CRIMSON, color: "white", fontSize: 9,
                    alignItems: "center", justifyContent: "center", cursor: "pointer",
                    fontWeight: 700, lineHeight: 1,
                  }}>✕</span>
                </span>
              ))}
            </div>
          )}
          {/* Row 2: clickable drop hint (centered vertically in remaining space) */}
          <div
            onClick={() => !distilling && fileRef.current?.click()}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: distilling ? "default" : "pointer", gap: 8 }}
          >
            <span style={{ fontSize: 22, color: CRIMSON }}>↑</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: th.mid, fontFamily: SANS }}>{t.dropHint}</span>
            <span style={{ fontSize: 11, color: th.dim, fontFamily: MONO }}>{t.clFormats}</span>
            <span style={{ fontSize: 15, color: th.dim, fontFamily: SANS }}>{t.localHint}</span>
          </div>
        </div>

        {/* ── Distill buttons at the bottom ── */}
        <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
          {["her", "me"].map((target) => (
            <button
              key={target}
              onClick={() => handleDistill(target)}
              disabled={!personName || (!!distilling && distilling !== target)}
              style={{
                flex: 1, padding: "18px 0",
                background: btnBg(target),
                border: "none", borderRadius: 10,
                color: distilling && distilling !== target ? th.dim : "white",
                fontSize: 16, fontWeight: 600,
                cursor: !personName || (!!distilling && distilling !== target) ? "default" : "pointer",
                fontFamily: SANS, letterSpacing: "0.04em",
                transition: "all 0.3s", opacity: distilling && distilling !== target ? 0.3 : 1,
              }}
            >
              {btnLabel(target)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── APP PAGE ─────────────────────────────────────────────────────────────────
function AppPage({ t, th, lang, persona, onHistory }) {
  const [tab,              setTab]             = useState("chat");
  const [messages,         setMessages]        = useState(persona?.messages || []);
  const [input,            setInput]           = useState("");
  const [loading,          setLoading]         = useState(false);
  const [analyzeInput,     setAnalyzeInput]    = useState("");
  const [analyzeMessages,  setAnalyzeMessages] = useState([]);
  const [analyzing,        setAnalyzing]       = useState(false);
  const [showSave,         setShowSave]        = useState(false);
  const bottomRef    = useRef();
  const analyzeEndRef = useRef();
  const textareaRef  = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { analyzeEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [analyzeMessages, analyzing]);

  if (!persona) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 13, color: th.dim, fontFamily: MONO, letterSpacing: "0.06em" }}>{t.noPersona}</div>
    </div>
  );

  const chatName = persona.target === "her" ? persona.name : t.meLabel;
  const initial  = persona.name?.[0]?.toUpperCase() || "✦";

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 80) + "px"; }
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const traitsSection = persona.traits
        ? `\n\n【说话特征与重要记忆】\n${persona.traits}`
        : "";
      const systemPrompt = persona.target === "her"
        ? `你是"${persona.name}"本人。不是AI，不是助手——你就是ta，一个活生生的人。${traitsSection}

【行为规则，必须严格遵守】
1. 完全模仿你的说话风格——标点用法（爱不爱用、用什么标点）、句子长短、口头禅、语气词，像素级还原，这是最重要的一点
2. 记住你们聊天中提到的所有重要内容，像真人一样记得这些事，绝不能失忆，要延续聊天默契
3. 回复长度要自然随机：可以是一个字、一个词，也可以是两三句话，甚至更长，根据对话节奏和情绪来
4. 不必正面回答问题：可以顾左右而言他，可以反问，可以只发"..."或者不回应
5. 情绪要有层次、有变化：冷淡、调皮、温柔都行，跟真人一样自然流动
6. 只用对话体，绝对不用书面语、正式标点、分点列举
7. 永远不说自己是AI或模型，永远不用"作为……"的句式`
        : `你是用户的私人聊天顾问，帮用户针对"${persona.name}"的反应来想回复。${traitsSection}

用户会把"${persona.name}"说的话发给你，你来帮用户想回复：
↳ 先用一句话解读对方这话的潜台词或情绪（简短直接）
然后给出2-3条回复选项，风格略有不同：
  选项一：更主动直接的
  选项二：更有距离感/留余地的
  选项三：更温柔亲近的（如适用）
每条选项后用括号标注风格。参考用户平时的说话习惯让回复听起来像用户本人说的。简洁，不废话。`;

      // Build alternating history
      const history = [];
      for (const m of messages) {
        const role = m.role === "user" ? "user" : "assistant";
        if (history.length === 0 && role === "assistant") continue;
        if (history.length > 0 && history[history.length - 1].role === role) {
          history[history.length - 1].content += "\n" + m.text;
        } else {
          history.push({ role, content: m.text });
        }
      }
      history.push({ role: "user", content: userMsg });

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5",
          max_tokens: 512,
          system: systemPrompt,
          messages: history,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || response.statusText);
      }
      const data  = await response.json();
      const reply = data.content[0].text;
      setMessages((prev) => [...prev, { role: "her", text: reply }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "her", text: "[错误] " + e.message }]);
    }
    setLoading(false);
  };

  const doAnalyze = async () => {
    if (!analyzeInput.trim() || analyzing) return;
    const userText = analyzeInput.trim();
    setAnalyzeInput("");
    setAnalyzing(true);
    const isFirst = analyzeMessages.length === 0;
    const userMsg = { role: "user", text: userText };
    setAnalyzeMessages((prev) => [...prev, userMsg]);
    try {
      const sysPrompt = lang === "zh"
        ? "你是一个情感分析师。用中文回答，简洁直接。"
        : "You are an emotional analyst. Answer concisely and directly.";
      const firstUserContent = isFirst
        ? (lang === "zh"
            ? `请分析以下内容中发言者的情感状态、潜台词和真实意图。简洁直接，150字以内。\n\n${userText}`
            : `Analyze the emotional state, subtext, and true intent of the speaker. Concise, under 150 words.\n\n${userText}`)
        : userText;
      const history = [];
      for (const m of analyzeMessages) {
        history.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
      }
      history.push({ role: "user", content: firstUserContent });
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-haiku-4-5", max_tokens: 512, system: sysPrompt, messages: history }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || response.statusText); }
      const data = await response.json();
      setAnalyzeMessages((prev) => [...prev, { role: "assistant", text: data.content[0].text }]);
    } catch (e) {
      setAnalyzeMessages((prev) => [...prev, { role: "assistant", text: "[错误] " + e.message }]);
    }
    setAnalyzing(false);
  };

  const tabOpts = [{ v: "analyze", l: t.analyze }, { v: "chat", l: t.chat }];

  return (
    <>
      {/* Save conversation modal */}
      <Modal show={showSave} onClose={() => setShowSave(false)} th={th}>
        <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 500, color: th.text, marginBottom: 20 }}>{t.saveQ}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setShowSave(false); onHistory(messages); }} style={{
            flex: 1, padding: "11px", background: CRIMSON, border: "none",
            borderRadius: 6, color: "white", fontSize: 13, cursor: "pointer", fontFamily: SANS, fontWeight: 600,
          }}>{t.saveY}</button>
          <button onClick={() => { setShowSave(false); onHistory(null); }} style={{
            flex: 1, padding: "11px", background: th.card, border: `0.5px solid ${th.border}`,
            borderRadius: 6, color: th.mid, fontSize: 13, cursor: "pointer", fontFamily: SANS,
          }}>{t.saveN}</button>
        </div>
      </Modal>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Profile bar: chat = name centered + history right; analyze = history right only */}
        <div style={{ padding: "12px 24px", borderBottom: `0.5px solid ${th.border}`, display: "flex", alignItems: "center", flexShrink: 0, position: "relative", minHeight: 48 }}>
          {tab === "chat" && (
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontFamily: SANS, fontSize: 17, fontWeight: 600, color: th.text, whiteSpace: "nowrap" }}>{chatName}</div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            {tab === "chat" && messages.length > 0 && (
              <button onClick={() => setMessages([])} style={{
                padding: "7px 16px", background: CRIMSON, border: "none",
                borderRadius: 6, color: "white", fontSize: 15, cursor: "pointer",
                fontFamily: MONO, letterSpacing: "0.04em",
              }}>{t.clearChat}</button>
            )}
            {tab === "analyze" && analyzeMessages.length > 0 && (
              <button onClick={() => setAnalyzeMessages([])} style={{
                padding: "7px 16px", background: CRIMSON, border: "none",
                borderRadius: 6, color: "white", fontSize: 15, cursor: "pointer",
                fontFamily: MONO, letterSpacing: "0.04em",
              }}>{t.clearChat}</button>
            )}
            <button onClick={() => setShowSave(true)} style={{
              padding: "7px 16px", background: CRIMSON, border: "none",
              borderRadius: 6, color: "white", fontSize: 15, cursor: "pointer",
              fontFamily: MONO, letterSpacing: "0.04em",
            }}>{t.redistill}</button>
          </div>
        </div>

        {/* Tab content */}
        {tab === "chat" ? (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 10, alignItems: "flex-end" }}>
                  {msg.role !== "user" && (
                    persona.avatarUrl
                      ? <img src={persona.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `0.5px solid ${th.border}` }} />
                      : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(139,34,82,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 13, color: "#d4768a", flexShrink: 0, border: `0.5px solid rgba(212,118,138,0.15)` }}>{initial}</div>
                  )}
                  <div style={{
                    maxWidth: 480, padding: "10px 14px",
                    background: msg.role === "user" ? CRIMSON : th.msgHer,
                    border: msg.role === "user" ? "none" : `0.5px solid ${th.msgHerBorder}`,
                    borderRadius: msg.role === "user" ? "10px 2px 10px 10px" : "2px 10px 10px 10px",
                    fontSize: 14, lineHeight: 1.7,
                    color: msg.role === "user" ? "white" : th.text,
                    fontFamily: SANS, fontWeight: msg.role !== "user" ? 400 : 400,
                  }}>{msg.text}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  {persona.avatarUrl
                    ? <img src={persona.avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `0.5px solid ${th.border}` }} />
                    : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(139,34,82,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 13, color: "#d4768a", flexShrink: 0 }}>{initial}</div>
                  }
                  <div style={{ padding: "12px 16px", background: th.msgHer, border: `0.5px solid ${th.msgHerBorder}`, borderRadius: "2px 10px 10px 10px", display: "flex", gap: 4, alignItems: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(212,118,138,0.5)", animation: "revPulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "12px 24px 14px", borderTop: `0.5px solid ${th.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: th.input, border: `0.5px solid ${th.border}`, borderRadius: 8, padding: "10px 14px", transition: "border-color 0.2s" }}
                onFocus={(e) => e.currentTarget.style.borderColor = th.borderH}
                onBlur={(e) => e.currentTarget.style.borderColor = th.border}
              >
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); autoResize(); }}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={t.chatPH}
                  rows={1}
                  style={{ flex: 1, background: "none", border: "none", outline: "none", color: th.text, fontFamily: SANS, fontSize: 16, resize: "none", lineHeight: 1.6, maxHeight: 80, scrollbarWidth: "none" }}
                />
                <button onClick={send} disabled={!input.trim() || loading} style={{
                  width: 30, height: 30, borderRadius: 6, background: input.trim() ? CRIMSON : th.card,
                  border: "none", cursor: input.trim() ? "pointer" : "default",
                  color: input.trim() ? "white" : th.dim, fontSize: 14, flexShrink: 0, transition: "all 0.15s",
                }}>→</button>
              </div>
            </div>
          </>
        ) : (
          /* Analyze tab — conversation with memory */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Messages area */}
            {analyzeMessages.length > 0 && (
              <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {analyzeMessages.map((m, i) => (
                  <div key={i} style={{
                    padding: "11px 15px", borderRadius: 8, fontSize: 14, lineHeight: 1.8, fontFamily: SANS,
                    background: m.role === "user" ? "rgba(139,34,82,0.06)" : th.card,
                    border: `0.5px solid ${m.role === "user" ? "rgba(139,34,82,0.15)" : th.border}`,
                    color: th.text,
                  }}>{m.text}</div>
                ))}
                {analyzing && (
                  <div style={{ padding: "11px 15px", background: th.card, border: `0.5px solid ${th.border}`, borderRadius: 8, display: "flex", gap: 4, alignItems: "center" }}>
                    {[0,1,2].map((i) => (
                      <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(212,118,138,0.5)", animation: "revPulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </div>
                )}
                <div ref={analyzeEndRef} />
              </div>
            )}

            {/* Input area */}
            <div style={{ padding: analyzeMessages.length > 0 ? "10px 24px 14px" : "20px 24px", borderTop: analyzeMessages.length > 0 ? `0.5px solid ${th.border}` : "none", flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, flex: analyzeMessages.length === 0 ? 1 : 0 }}>
              <textarea
                value={analyzeInput}
                onChange={(e) => setAnalyzeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); doAnalyze(); } }}
                placeholder={analyzeMessages.length === 0 ? t.pastePH : t.analyzeFollowPH}
                style={{
                  flex: analyzeMessages.length === 0 ? 1 : "none",
                  minHeight: analyzeMessages.length === 0 ? 0 : 56,
                  background: th.input, border: `0.5px solid ${th.border}`,
                  borderRadius: 8, padding: "14px 16px", color: th.text,
                  fontFamily: SANS, fontSize: 16, resize: "none", outline: "none", lineHeight: 1.7,
                }}
              />
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button onClick={doAnalyze} disabled={!analyzeInput.trim() || analyzing} style={{
                  flex: 1, padding: "11px", background: analyzeInput.trim() ? CRIMSON : th.card,
                  border: "none", borderRadius: 7, color: analyzeInput.trim() ? "white" : th.dim,
                  fontSize: 15, cursor: analyzeInput.trim() ? "pointer" : "default",
                  fontFamily: MONO, letterSpacing: "0.04em", transition: "all 0.2s",
                }}>
                  {analyzing ? t.analyzing : t.analyzeBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom tab switcher */}
        <div style={{ padding: "10px 24px 14px", borderTop: `0.5px solid ${th.border}`, display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <Seg opts={tabOpts} val={tab} onChange={setTab} th={th} disabledVals={persona.viewMode ? ["analyze"] : []} />
        </div>
      </div>

      <style>{`@keyframes revPulse{0%,60%,100%{opacity:.3;transform:scale(.9)}30%{opacity:1;transform:scale(1.15)}}`}</style>
    </>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,           setDark]           = useState(true);
  const [lang,           setLang]           = useState("zh");
  const [page,           setPage]           = useState("assess");
  const [persona,        setPersona]        = useState(null);
  const [triggerHistory, setTriggerHistory] = useState(0);
  const [isPaid,         setIsPaid]         = useState(() => {
    try { return !!JSON.parse(localStorage.getItem("revery_user")); } catch { return false; }
  });
  const [showPaywall,  setShowPaywall]  = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const th = mkTh(dark);
  const t  = TX[lang];

  const handleDistilled = (p) => {
    setPersona(p);
    setPage("app");
  };

  const handleAppHistory = (messages) => {
    if (messages !== null) {
      const hist = JSON.parse(localStorage.getItem("revery_history") || "[]");
      if (hist.length > 0) {
        hist[0] = { ...hist[0], messages };
        localStorage.setItem("revery_history", JSON.stringify(hist));
      }
    }
    setPage("distill");
    setTriggerHistory((n) => n + 1);
  };

  const handlePaymentSuccess = () => {
    setIsPaid(true);
    setShowRegister(true);
  };

  const handleRegister = (info) => {
    setShowRegister(false);
    setPage("distill");
  };

  const handleNavChange = (dest) => {
    if (page === "app" && dest !== "app") return;
    if (!isPaid && (dest === "distill" || dest === "app")) return;
    if (dest === "app" && !persona) return;
    setPage(dest);
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: th.bg, color: th.text, fontFamily: SANS, overflow: "hidden" }}>
      <Header
        page={page} onNavChange={handleNavChange}
        dark={dark} setDark={setDark}
        lang={lang} setLang={setLang}
        th={th} t={t}
        isPaid={isPaid} persona={persona}
        onPaywall={() => setShowPaywall(true)}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {page === "assess"  && <AssessPage t={t} th={th} lang={lang} onPaymentSuccess={handlePaymentSuccess} />}
        {page === "distill" && <DistillPage t={t} th={th} onDistilled={handleDistilled} triggerHistory={triggerHistory} />}
        {page === "app"     && <AppPage t={t} th={th} lang={lang} persona={persona} onHistory={handleAppHistory} />}
      </div>

      {/* Paywall modal — triggered when clicking locked nav tabs */}
      <PaywallModal show={showPaywall} onClose={() => setShowPaywall(false)} onPay={() => { setShowPaywall(false); handlePaymentSuccess(); }} th={th} t={t} />

      {/* Registration modal — shown after payment */}
      <RegisterModal show={showRegister} onRegister={handleRegister} th={th} t={t} />
    </div>
  );
}
