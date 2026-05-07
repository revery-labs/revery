import { useState, useRef, useEffect } from "react";

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

// ─── SIGNAL ANALYSIS ──────────────────────────────────────────────────────────

function computeSignals(text) {
  if (!text) return null;
  const hasEllipsis = text.includes("...");
  const hasQuestion = /[？?]/.test(text);
  const isShort = text.length < 12;
  const isLong = text.length > 60;
  const charSum = text.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const jitter = (base, range) =>
    Math.min(99, Math.max(1, base + (charSum % range) - Math.floor(range / 2)));

  const avoidance = Math.round(
    hasEllipsis ? jitter(72, 16) : isShort && !hasQuestion ? jitter(62, 14) : jitter(42, 20)
  );
  const interest = Math.round(
    hasQuestion ? jitter(86, 12) : isLong ? jitter(74, 14) : jitter(54, 18)
  );
  const defense = Math.round(
    hasEllipsis ? jitter(65, 14) : isShort && !hasQuestion ? jitter(68, 12) : jitter(40, 20)
  );

  const insights = hasEllipsis
    ? ["沉默往往比语言携带更多的情绪信息", "她在等你先开口", "不要急着填满这段沉默"]
    : hasQuestion
    ? ["主动发问说明她在意这段对话", "她给了你一个入口", "认真回答比回避更有价值"]
    : isShort
    ? ["简短不等于冷淡，她在观察你的反应", "保持话题，不要让对话断掉"]
    : ["长回复意味着她在认真投入", "这是她愿意打开的信号"];

  const suggestion = hasEllipsis
    ? "给她一点空间，不要急着追问"
    : hasQuestion
    ? "认真回答这个问题，这是她打开的窗口"
    : isShort
    ? "保持自然节奏，一句轻松的话就够了"
    : "她说了很多，你只需要真实回应一点";

  return { avoidance, interest, defense, insights, suggestion };
}

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STEP_THRESHOLDS = [15, 38, 60, 80, 100];
const STEP_LABELS = [
  "解析文本结构与频率分布",
  "提取情感标记与习惯用语",
  "建模回应模式与语气节奏",
  "生成人格向量嵌入",
  "蒸馏完成 · 可以对话了",
];

const DATA_TYPES = [
  { icon: "✉", key: "wechat", name: "微信聊天记录", desc: "导出的对话文本，效果最佳" },
  { icon: "◑", key: "social", name: "朋友圈 / 动态", desc: "公开内容，捕捉她的表达风格" },
  { icon: "♪", key: "voice", name: "语音 / 视频", desc: "提取语气节奏和情感模式" },
  { icon: "✦", key: "photo", name: "照片", desc: "用于情境联想，非必须" },
];

const MODES = [
  { key: "simulate", label: "模拟对话" },
  { key: "analyze", label: "分析信息" },
  { key: "self",    label: "蒸馏自己" },
];

const MODE_BADGES   = { simulate: "模拟", analyze: "分析", self: "自我" };
const MODE_DETAILS  = {
  simulate: "模拟对话 · 基于上传的记忆",
  analyze:  "分析模式 · 粘贴她发给你的消息",
  self:     "博弈模式 · 描述你的处境",
};
const MODE_PLACEHOLDERS = {
  simulate: "说点什么，或者粘贴她发给你的消息...",
  analyze:  "粘贴你们的对话，我来分析...",
  self:     "描述你的处境...",
};

// ─── DISTILL PAGE ─────────────────────────────────────────────────────────────

function DistillPage({ onDistillComplete }) {
  const [personName, setPersonName]   = useState("");
  const [uploads, setUploads]         = useState([]);
  const [selected, setSelected]       = useState({ wechat: true, social: true });
  const [distilling, setDistilling]   = useState(false);
  const [done, setDone]               = useState(false);
  const [progress, setProgress]       = useState(0);
  const [isDragging, setIsDragging]   = useState(false);
  const fileRef = useRef();

  const getStepState = (i) => {
    if (progress < STEP_THRESHOLDS[i]) return "";
    if (i === STEP_THRESHOLDS.length - 1) return progress >= 100 ? "done" : "active";
    return progress >= STEP_THRESHOLDS[i + 1] ? "done" : "active";
  };

  const addFiles = async (fileList) => {
    const results = await Promise.all(Array.from(fileList).map(readFile));
    setUploads((prev) => [...prev, ...results]);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    await addFiles(e.dataTransfer.files);
  };

  const handleDistill = async () => {
    if (!personName || distilling) return;
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
      }, 600);
    } catch {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setDistilling(false);
        setDone(true);
        onDistillComplete(personName, "");
      }, 600);
    }
  };

  return (
    <>
      <div className="page-header">
        <div className="page-title">蒸馏她</div>
        <div className="page-subtitle">上传记忆碎片，重建她的语气与模式</div>
      </div>

      <div className="distill-content">
        <div className="section-label">她的名字</div>
        <input
          className="name-input"
          type="text"
          placeholder="她叫..."
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          disabled={distilling || done}
        />

        <div className="divider" />

        <div className="section-label">你有哪些数据</div>
        <div className="data-grid">
          {DATA_TYPES.map((dt) => (
            <div
              key={dt.key}
              className={`data-card${selected[dt.key] ? " selected" : ""}`}
              onClick={() =>
                !distilling &&
                !done &&
                setSelected((s) => ({ ...s, [dt.key]: !s[dt.key] }))
              }
            >
              <div className="data-icon">{dt.icon}</div>
              <div className="data-info">
                <div className="data-name">{dt.name}</div>
                <div className="data-desc">{dt.desc}</div>
              </div>
              <div className="check">
                <div className="check-mark" />
              </div>
            </div>
          ))}
        </div>

        <div className="section-label">上传文件</div>
        <div
          className={`drop-zone${isDragging ? " dragging" : ""}`}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => !distilling && !done && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
          <div className="drop-icon">↑</div>
          <div className="drop-text">
            拖入文件，或<em>点击选择</em>
            <br />
            <span style={{ fontSize: "10px", opacity: 0.6 }}>
              .txt .json 文件将由 AI 分析提取说话特征
            </span>
          </div>
          {uploads.length > 0 && (
            <div className="uploads-list">
              {uploads.map((f, i) => (
                <span
                  key={i}
                  className={`upload-chip${f.content ? " readable" : ""}`}
                >
                  {f.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {(distilling || done) && (
          <div className="progress-wrap">
            <div className="progress-header">
              <div className="progress-label">正在蒸馏</div>
              <div className="progress-pct">{Math.round(progress)}%</div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="progress-steps">
              {STEP_LABELS.map((label, i) => (
                <div key={i} className={`step-row ${getStepState(i)}`}>
                  <div className="step-dot" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          className={`distill-btn${done ? " done" : ""}`}
          onClick={handleDistill}
          disabled={!personName || distilling}
        >
          {distilling
            ? "蒸馏中..."
            : done
            ? "✓  蒸馏完成 · 开始对话"
            : "开始蒸馏"}
        </button>
      </div>
    </>
  );
}

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────

function ChatPage({ personas, activePersonaIdx, setActivePersonaIdx }) {
  const [mode, setMode]         = useState("simulate");
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [signals, setSignals]   = useState(null);
  const bottomRef  = useRef();
  const textareaRef = useRef();

  const persona = personas[activePersonaIdx] ?? null;

  useEffect(() => {
    if (persona) {
      setMessages([{ role: "her", text: "你好久没联系我了。" }]);
      setSignals(null);
    }
  }, [activePersonaIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 80) + "px";
    }
  };

  const send = async () => {
    if (!input.trim() || loading || !persona) return;
    const userMsg = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const traitsClause = persona.traits
        ? `\n\n关于她说话的特点：${persona.traits}`
        : "";

      const systemPrompt =
        mode === "simulate"
          ? `你在扮演一个真实的人，不是AI助手。你就是"${persona.name}"，一个有自己情绪和节奏的普通人。${traitsClause}

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

      // Build alternating user/assistant history
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
      if (mode === "simulate") setSignals(computeSignals(reply));
    } catch (e) {
      console.error(e);
      setMessages((prev) => [...prev, { role: "her", text: "[错误] " + e.message }]);
    }
    setLoading(false);
  };

  if (!persona) {
    return (
      <div className="chat-empty">
        <div className="chat-empty-text">先去蒸馏一个她，然后回来对话</div>
      </div>
    );
  }

  return (
    <div className="chat-layout">
      {/* ── Personas panel ── */}
      <div className="personas-panel">
        <div className="panel-head">已蒸馏</div>
        <div className="personas-list">
          {personas.map((p, i) => (
            <div
              key={i}
              className={`persona-item${i === activePersonaIdx ? " active" : ""}`}
              onClick={() => setActivePersonaIdx(i)}
            >
              <div className="persona-avatar">{p.initial}</div>
              <div className="persona-info">
                <div className="persona-name">{p.name}</div>
                <div className="persona-status">已完成</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mode-tabs">
          {MODES.map((m) => (
            <div
              key={m.key}
              className={`mode-tab${mode === m.key ? " active" : ""}`}
              onClick={() => setMode(m.key)}
            >
              <div className="mode-tab-dot" />
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="chat-area">
        <div className="chat-info-bar">
          <div className="info-avatar">{persona.initial}</div>
          <div>
            <div className="info-name">{persona.name}</div>
            <div className="info-detail">{MODE_DETAILS[mode]}</div>
          </div>
          <div className="info-badge">{MODE_BADGES[mode]}</div>
        </div>

        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-row${msg.role === "user" ? " user" : ""}`}>
              <div className={`msg-avatar${msg.role === "user" ? " user-av" : ""}`}>
                {msg.role === "user" ? "我" : persona.initial}
              </div>
              <div>
                <div className="msg-bubble">{msg.text}</div>
                <div className="msg-time">刚才</div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="msg-row">
              <div className="msg-avatar">{persona.initial}</div>
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-area">
          <div className="input-row">
            <textarea
              ref={textareaRef}
              className="chat-input"
              rows={1}
              placeholder={MODE_PLACEHOLDERS[mode]}
              value={input}
              onChange={(e) => { setInput(e.target.value); autoResize(); }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="send-btn"
              onClick={send}
              disabled={!input.trim() || loading}
            >
              →
            </button>
          </div>
          <div className="input-hints">
            {['她说"随便"是什么意思', "我该怎么回", "她现在是什么状态"].map((hint) => (
              <div
                key={hint}
                className="hint-chip"
                onClick={() => {
                  setInput(hint);
                  textareaRef.current?.focus();
                }}
              >
                {hint}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Analysis panel ── */}
      <div className="analysis-panel">
        <div className="analysis-head">情感信号</div>
        <div className="analysis-body">
          {signals ? (
            <>
              <div className="signal-card">
                <div className="signal-label">情绪强度</div>
                {[
                  { name: "回避", val: signals.avoidance },
                  { name: "在意", val: signals.interest },
                  { name: "防御", val: signals.defense },
                ].map((s) => (
                  <div key={s.name} className="signal-bar-wrap">
                    <div className="signal-name">{s.name}</div>
                    <div className="signal-bar">
                      <div className="signal-fill" style={{ width: `${s.val}%` }} />
                    </div>
                    <div className="signal-val">{s.val}</div>
                  </div>
                ))}
              </div>

              <div className="signal-card">
                <div className="signal-label">AI 洞察</div>
                {signals.insights.map((txt, i) => (
                  <div key={i} className="insight-item">
                    <div className="insight-bullet" />
                    <span>{txt}</span>
                  </div>
                ))}
              </div>

              <div className="signal-card">
                <div className="signal-label">回应建议</div>
                <div style={{
                  fontSize: "12px",
                  color: "var(--rose)",
                  fontFamily: "var(--serif)",
                  fontStyle: "italic",
                  lineHeight: 1.8,
                }}>
                  "{signals.suggestion}"
                </div>
              </div>
            </>
          ) : (
            <div className="signal-placeholder">
              开始对话后<br />这里会显示<br />她的情感信号
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [page, setPage]                     = useState("distill");
  const [personas, setPersonas]             = useState([]);
  const [activePersonaIdx, setActivePersonaIdx] = useState(0);

  const handleDistillComplete = (name, traits) => {
    const newPersona = {
      name,
      traits,
      initial: name[0]?.toUpperCase() || "✦",
    };
    setPersonas((prev) => {
      setActivePersonaIdx(prev.length);
      return [...prev, newPersona];
    });
    setTimeout(() => setPage("chat"), 500);
  };

  return (
    <div className="app">
      <div className="noise" />
      <div className="ambient" />

      {/* ── Sidebar ── */}
      <div className="sidebar">
        <div className="logo">
          <div className="logo-name">Revery</div>
          <div className="logo-sub">Labs · Beta</div>
        </div>

        <div className="nav-section">工作区</div>
        <div
          className={`nav-item${page === "distill" ? " active" : ""}`}
          onClick={() => setPage("distill")}
        >
          <div className="nav-dot" /> 蒸馏
        </div>
        <div
          className={`nav-item${page === "chat" ? " active" : ""}`}
          onClick={() => setPage("chat")}
        >
          <div className="nav-dot" /> 对话
        </div>
        <div className="nav-item" style={{ opacity: 0.4 }}>
          <div className="nav-dot" /> 分析
        </div>

        {personas.length > 0 && (
          <>
            <div className="nav-section">关系</div>
            {personas.map((p, i) => (
              <div
                key={i}
                className={`nav-item${page === "chat" && activePersonaIdx === i ? " active" : ""}`}
                onClick={() => { setActivePersonaIdx(i); setPage("chat"); }}
              >
                <div className="nav-dot" /> 以 {p.name}
              </div>
            ))}
          </>
        )}

        <div className="sidebar-bottom">
          <div className="distilled-count">
            <span>{personas.length}</span>
            已蒸馏的灵魂
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="main">
        <div className="page">
          {page === "distill" ? (
            <DistillPage onDistillComplete={handleDistillComplete} />
          ) : (
            <ChatPage
              personas={personas}
              activePersonaIdx={activePersonaIdx}
              setActivePersonaIdx={setActivePersonaIdx}
            />
          )}
        </div>
      </div>
    </div>
  );
}
