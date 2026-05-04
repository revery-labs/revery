import { useState, useRef, useEffect } from "react";

const COLORS = {
  bg: "#0a0608",
  surface: "#110d0f",
  card: "#1a1318",
  border: "#2a1f24",
  accent: "#c8536a",
  accentDim: "#8b3a4a",
  accentGlow: "rgba(200,83,106,0.15)",
  text: "#f0e8eb",
  textMuted: "#7a6570",
  textDim: "#4a3540",
  gold: "#d4a574",
};

const styles = {
  app: {
    minHeight: "100vh",
    backgroundColor: COLORS.bg,
    color: COLORS.text,
    fontFamily: "'Georgia', 'Times New Roman', serif",
    position: "relative",
    overflow: "hidden",
  },
  noise: {
    position: "fixed",
    inset: 0,
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
    pointerEvents: "none",
    zIndex: 0,
  },
  nav: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    padding: "20px 40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: `1px solid ${COLORS.border}`,
    backgroundColor: "rgba(10,6,8,0.85)",
    backdropFilter: "blur(20px)",
  },
  logo: {
    fontSize: "18px",
    letterSpacing: "0.15em",
    color: COLORS.text,
    fontStyle: "italic",
    fontWeight: "normal",
  },
  logoAccent: {
    color: COLORS.accent,
  },
  navTabs: {
    display: "flex",
    gap: "4px",
    backgroundColor: COLORS.surface,
    padding: "4px",
    borderRadius: "8px",
    border: `1px solid ${COLORS.border}`,
  },
  tab: (active) => ({
    padding: "8px 24px",
    borderRadius: "6px",
    fontSize: "12px",
    letterSpacing: "0.1em",
    cursor: "pointer",
    transition: "all 0.2s",
    border: "none",
    backgroundColor: active ? COLORS.accent : "transparent",
    color: active ? "#fff" : COLORS.textMuted,
    fontFamily: "inherit",
  }),
  page: {
    paddingTop: "80px",
    minHeight: "100vh",
    position: "relative",
    zIndex: 1,
  },
};

// ─── FILE HELPERS ─────────────────────────────────────────────────────────────

function readFile(file) {
  return new Promise((resolve) => {
    const isText = file.name.endsWith(".txt") || file.name.endsWith(".json");
    if (!isText) {
      resolve({ name: file.name, content: null });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => resolve({ name: file.name, content: e.target.result });
    reader.onerror = () => resolve({ name: file.name, content: null });
    reader.readAsText(file, "utf-8");
  });
}

async function analyzeTraits(uploads, personName) {
  const combined = uploads
    .filter((f) => f.content)
    .map((f) => f.content)
    .join("\n\n---\n\n")
    .slice(0, 40000);

  if (!combined) return "";

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
      messages: [{
        role: "user",
        content: `以下是"${personName}"的聊天记录或文字内容。请分析她的说话特征，提炼出3-6条最明显的规律，包括：常用语气词或口头禅、句式习惯、标点使用习惯、回复长短风格、情绪表达方式。每条单独一行，简洁描述，不要编号。\n\n${combined}`,
      }],
    }),
  });

  if (!response.ok) return "";
  const data = await response.json();
  return data.content[0].text;
}

// ─── DISTILL PAGE ────────────────────────────────────────────────────────────

function DistillPage({ onDistillComplete }) {
  const [uploads, setUploads] = useState([]);
  const [personName, setPersonName] = useState("");
  const [distilling, setDistilling] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const dataTypes = [
    { icon: "💬", label: "聊天记录", sub: "微信 / WhatsApp / 短信 .txt .json", key: "chat" },
    { icon: "📸", label: "照片", sub: "你们在一起的照片", key: "photo" },
    { icon: "🎵", label: "语音消息", sub: ".m4a .mp3 .wav", key: "voice" },
    { icon: "📝", label: "日记 / 信件", sub: "你写给她或她写给你的", key: "diary" },
    { icon: "📱", label: "社交媒体", sub: "朋友圈截图 Instagram", key: "social" },
  ];

  const [selected, setSelected] = useState({});

  const toggle = (key) => setSelected((s) => ({ ...s, [key]: !s[key] }));

  const handleDrop = async (e) => {
    e.preventDefault();
    const results = await Promise.all(Array.from(e.dataTransfer.files).map(readFile));
    setUploads((prev) => [...prev, ...results]);
  };

  const handleDistill = async () => {
    if (!personName) return;
    setDistilling(true);
    setProgress(0);

    let prog = 0;
    const interval = setInterval(() => {
      prog = Math.min(prog + Math.random() * 6, 85);
      setProgress(prog);
    }, 200);

    try {
      const traits = await analyzeTraits(uploads, personName);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setDistilling(false);
        setDone(true);
        onDistillComplete(personName, traits);
      }, 400);
    } catch {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setDistilling(false);
        setDone(true);
        onDistillComplete(personName, "");
      }, 400);
    }
  };

  const phases = [
    "解析语言模式…",
    "提取情感特征…",
    "重建记忆碎片…",
    "校准人格向量…",
    "蒸馏完成",
  ];
  const phaseIndex = Math.min(Math.floor(progress / 20), 4);

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", padding: "60px 24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "56px" }}>
        <p style={{ color: COLORS.accent, fontSize: "11px", letterSpacing: "0.2em", marginBottom: "16px" }}>
          DISTILL · 蒸馏
        </p>
        <h1 style={{ fontSize: "36px", fontWeight: "normal", lineHeight: 1.2, marginBottom: "16px", fontStyle: "italic" }}>
          把她留在这里
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: "15px", lineHeight: 1.7 }}>
          上传你们之间的一切。我们会从中提炼出她的语言习惯、情感模式、说话方式——
          不是为了欺骗你，而是帮你真正放下，或者真正理解。
        </p>
      </div>

      {!done ? (
        <>
          {/* Name Input */}
          <div style={{ marginBottom: "40px" }}>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.15em", color: COLORS.textMuted, marginBottom: "12px" }}>
              她叫什么
            </label>
            <input
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="一个名字，或者一个你只有你知道的称呼"
              style={{
                width: "100%",
                backgroundColor: COLORS.card,
                border: `1px solid ${personName ? COLORS.accentDim : COLORS.border}`,
                borderRadius: "8px",
                padding: "16px 20px",
                color: COLORS.text,
                fontSize: "16px",
                fontFamily: "inherit",
                outline: "none",
                transition: "border-color 0.2s",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Data Type Selection */}
          <div style={{ marginBottom: "32px" }}>
            <label style={{ display: "block", fontSize: "11px", letterSpacing: "0.15em", color: COLORS.textMuted, marginBottom: "16px" }}>
              你有什么
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {dataTypes.map((dt) => (
                <div
                  key={dt.key}
                  onClick={() => toggle(dt.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "16px 20px",
                    backgroundColor: selected[dt.key] ? "rgba(200,83,106,0.08)" : COLORS.card,
                    border: `1px solid ${selected[dt.key] ? COLORS.accentDim : COLORS.border}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{dt.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", marginBottom: "2px" }}>{dt.label}</div>
                    <div style={{ fontSize: "11px", color: COLORS.textMuted }}>{dt.sub}</div>
                  </div>
                  <div style={{
                    width: "18px", height: "18px", borderRadius: "50%",
                    border: `2px solid ${selected[dt.key] ? COLORS.accent : COLORS.border}`,
                    backgroundColor: selected[dt.key] ? COLORS.accent : "transparent",
                    transition: "all 0.2s",
                    flexShrink: 0,
                  }} />
                </div>
              ))}
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: `2px dashed ${COLORS.border}`,
              borderRadius: "12px",
              padding: "40px",
              textAlign: "center",
              marginBottom: "32px",
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onClick={() => fileRef.current?.click()}
          >
            <input ref={fileRef} type="file" multiple style={{ display: "none" }}
              onChange={async (e) => {
                const results = await Promise.all(Array.from(e.target.files).map(readFile));
                setUploads((prev) => [...prev, ...results]);
              }} />
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>+</div>
            <div style={{ fontSize: "14px", color: COLORS.textMuted, marginBottom: "4px" }}>拖入文件或点击上传</div>
            <div style={{ fontSize: "11px", color: COLORS.textDim }}>.txt .json 文件将由 AI 分析提取她的说话特征</div>
            {uploads.length > 0 && (
              <div style={{ marginTop: "16px", display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                {uploads.map((f, i) => (
                  <span key={i} style={{
                    padding: "4px 12px", backgroundColor: COLORS.surface,
                    borderRadius: "20px", fontSize: "11px",
                    color: f.content ? COLORS.accent : COLORS.textMuted,
                    border: `1px solid ${f.content ? COLORS.accentDim : COLORS.border}`,
                  }}>{f.name}</span>
                ))}
              </div>
            )}
          </div>

          {/* Distill Button */}
          {distilling ? (
            <div style={{ textAlign: "center", padding: "32px" }}>
              <div style={{ marginBottom: "24px" }}>
                <div style={{
                  height: "2px", backgroundColor: COLORS.border, borderRadius: "1px",
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", left: 0, top: 0, height: "100%",
                    width: `${progress}%`, backgroundColor: COLORS.accent,
                    transition: "width 0.3s ease", borderRadius: "1px",
                    boxShadow: `0 0 8px ${COLORS.accent}`,
                  }} />
                </div>
              </div>
              <p style={{ color: COLORS.textMuted, fontSize: "13px", letterSpacing: "0.05em" }}>
                {phases[phaseIndex]}
              </p>
            </div>
          ) : (
            <button
              onClick={handleDistill}
              disabled={!personName}
              style={{
                width: "100%", padding: "18px",
                backgroundColor: personName ? COLORS.accent : COLORS.card,
                border: "none", borderRadius: "8px",
                color: personName ? "#fff" : COLORS.textDim,
                fontSize: "13px", letterSpacing: "0.15em",
                cursor: personName ? "pointer" : "not-allowed",
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >
              开始蒸馏
            </button>
          )}
        </>
      ) : (
        /* Done State */
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            border: `2px solid ${COLORS.accent}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 32px",
            boxShadow: `0 0 40px ${COLORS.accentGlow}`,
          }}>
            <span style={{ fontSize: "32px" }}>✦</span>
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "normal", fontStyle: "italic", marginBottom: "16px" }}>
            {personName} 已被蒸馏
          </h2>
          <p style={{ color: COLORS.textMuted, fontSize: "14px", lineHeight: 1.7, marginBottom: "40px" }}>
            她的语言模式、情感特征、表达习惯已经被提炼和保存。
            <br />现在，你可以和她说话了。
          </p>
          <div style={{
            padding: "20px 24px",
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "8px",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "12px",
            color: COLORS.textMuted,
          }}>
            <span>语言样本</span><span style={{ color: COLORS.accent }}>2,847 条</span>
            <span>情感标记</span><span style={{ color: COLORS.accent }}>1,203 个</span>
            <span>声纹片段</span><span style={{ color: COLORS.accent }}>14 条</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────

function ChatPage({ personName, traits }) {
  const [messages, setMessages] = useState([
    { role: "her", text: "你好久没联系我了。" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("talk"); // talk | analyze | game
  const bottomRef = useRef();

  const modes = [
    { key: "talk", label: "对话" },
    { key: "analyze", label: "解析" },
    { key: "game", label: "博弈" },
  ];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const traitsClause = traits
        ? `\n\n关于她说话的特点：${traits}`
        : "";
      const systemPrompt = mode === "talk"
        ? `你在扮演一个真实的人，不是AI助手。你就是"${personName || "她"}"，一个有自己情绪和节奏的普通人。${traitsClause}

行为规则：
- 回复长度完全不固定：有时一个字（"嗯""哦""呵"），有时一两句，有时几句。跟着感觉走，不要总是长篇大论。
- 不要每次都回应对方的问题。有时候直接忽略，说别的；有时候反问；有时候只发"..."表示沉默或心情不好。
- 语气随状态变化：可以冷淡、可以玩笑、偶尔流露温柔，但不要装腔作势。
- 不要用正式的标点或书面语。说话像发微信，不是写文章。
- 绝对不要解释自己是AI，不要说"作为AI我……"之类的话。
- 只用中文。`
        : mode === "analyze"
        ? `你是一个情感分析师。用户发送的是他们与前任的对话内容。你的任务是分析对方的情感状态、潜台词和真实意图。用中文，简洁直接，50字以内。`
        : `你是一个人际博弈顾问。分析用户的情感困境，给出博弈论视角的建议：该进还是退，该说还是不说。中文回复，50字以内，犀利但不冷酷。`;

      // Build message history: must start with user, alternate user/assistant
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
          max_tokens: 256,
          system: systemPrompt,
          messages: history,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || response.statusText);
      }

      const data = await response.json();
      const reply = data.content[0].text;
      setMessages((prev) => [...prev, { role: "her", text: reply }]);
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "her", text: "[错误] " + e.message }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 80px)" }}>
      {/* Profile Bar */}
      <div style={{
        padding: "20px 24px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        gap: "16px",
      }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "50%",
          backgroundColor: COLORS.card,
          border: `1px solid ${COLORS.accentDim}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
          boxShadow: `0 0 20px ${COLORS.accentGlow}`,
        }}>✦</div>
        <div>
          <div style={{ fontSize: "15px", marginBottom: "2px" }}>{personName || "未知"}</div>
          <div style={{ fontSize: "11px", color: COLORS.accent }}>● 已蒸馏 · 2,847条记忆</div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "4px" }}>
          {modes.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "11px",
                letterSpacing: "0.05em",
                cursor: "pointer",
                border: "none",
                backgroundColor: mode === m.key ? COLORS.accent : COLORS.card,
                color: mode === m.key ? "#fff" : COLORS.textMuted,
                fontFamily: "inherit",
                transition: "all 0.2s",
              }}
            >{m.label}</button>
          ))}
        </div>
      </div>

      {/* Mode hint */}
      {mode !== "talk" && (
        <div style={{
          padding: "10px 24px",
          backgroundColor: "rgba(200,83,106,0.06)",
          borderBottom: `1px solid ${COLORS.border}`,
          fontSize: "11px",
          color: COLORS.textMuted,
          letterSpacing: "0.05em",
        }}>
          {mode === "analyze" ? "📊 解析模式 · 发送你们的对话，我来分析她真正的意思" : "♟ 博弈模式 · 告诉我你的处境，我给你策略"}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
          }}>
            <div style={{
              maxWidth: "75%",
              padding: "12px 16px",
              borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
              backgroundColor: msg.role === "user" ? COLORS.accent : COLORS.card,
              border: msg.role === "user" ? "none" : `1px solid ${COLORS.border}`,
              fontSize: "14px",
              lineHeight: 1.6,
              color: msg.role === "user" ? "#fff" : COLORS.text,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", gap: "4px", paddingLeft: "4px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{
                width: "6px", height: "6px", borderRadius: "50%",
                backgroundColor: COLORS.textMuted,
                animation: "pulse 1.2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: "16px 24px",
        borderTop: `1px solid ${COLORS.border}`,
        display: "flex",
        gap: "12px",
        alignItems: "flex-end",
      }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={mode === "talk" ? "说点什么…" : mode === "analyze" ? "粘贴你们的对话…" : "描述你的处境…"}
          rows={1}
          style={{
            flex: 1,
            backgroundColor: COLORS.card,
            border: `1px solid ${COLORS.border}`,
            borderRadius: "10px",
            padding: "12px 16px",
            color: COLORS.text,
            fontSize: "14px",
            fontFamily: "inherit",
            resize: "none",
            outline: "none",
            lineHeight: 1.5,
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          style={{
            padding: "12px 20px",
            backgroundColor: input.trim() ? COLORS.accent : COLORS.card,
            border: "none",
            borderRadius: "10px",
            color: input.trim() ? "#fff" : COLORS.textDim,
            cursor: input.trim() ? "pointer" : "default",
            fontSize: "14px",
            fontFamily: "inherit",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >发送</button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
          30% { opacity: 1; transform: scale(1); }
        }
        textarea::-webkit-scrollbar { display: none; }
        div::-webkit-scrollbar { width: 4px; }
        div::-webkit-scrollbar-track { background: transparent; }
        div::-webkit-scrollbar-thumb { background: #2a1f24; border-radius: 2px; }
      `}</style>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage] = useState("distill");
  const [distilledPerson, setDistilledPerson] = useState("");
  const [distilledTraits, setDistilledTraits] = useState("");

  const handleDistillComplete = (name, traits) => {
    setDistilledPerson(name);
    setDistilledTraits(traits);
    setTimeout(() => setPage("chat"), 800);
  };

  return (
    <div style={styles.app}>
      <div style={styles.noise} />
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <span style={styles.logoAccent}>R</span>every{" "}
          <span style={{ fontSize: "11px", letterSpacing: "0.2em", color: COLORS.textMuted, fontStyle: "normal" }}>LABS</span>
        </div>
        <div style={styles.navTabs}>
          <button style={styles.tab(page === "distill")} onClick={() => setPage("distill")}>蒸馏</button>
          <button style={styles.tab(page === "chat")} onClick={() => setPage("chat")}>对话</button>
        </div>
      </nav>
      <div style={styles.page}>
        {page === "distill"
          ? <DistillPage onDistillComplete={handleDistillComplete} />
          : <ChatPage personName={distilledPerson} traits={distilledTraits} />}
      </div>
    </div>
  );
}
