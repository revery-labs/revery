import { useState, useRef, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { saveSession, signUpUser, signInUser, signOutUser, getSessionUser, saveInterestEmail, saveRxReminder, logFunnelEvent } from "./supabase";
import RESULTS from "./data/results.json";
import { COPY, ENNEAGRAM_HINTS, toCorner } from "./copy";
import { nextWindowForSign } from "./astro";
import { drawShareCard } from "./shareCard";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const CRIMSON    = "#8b2252";
const SANS       = '"Helvetica Neue", Helvetica, "PingFang SC", "苹方-简", -apple-system, sans-serif';
const MONO       = '"SF Mono", "DM Mono", ui-monospace, monospace';
const SERIF_LOGO = "'Cormorant Garamond', Georgia, serif";
// 黑卡结果页本轮只交付深色主题，光/暗切换按钮暂隐藏（逻辑保留，dark 仍默认 true）
const SHOW_THEME_TOGGLE = false;

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
    tagline:   "恋爱脑诊断中心",
    dark: "◑", light: "☀",
    // assess
    aTitle:    "恋爱脑病例报告",
    aSub:      "免费诊断 · 2分钟 · 后果自负",
    qs: [
      { q: "他一整天没主动发消息。现在11点了。你在干嘛", o: ["没留意（认真的）", "翻了记录，没发", "研究了最后那条措辞", "开场白备好，待发"] },
      { q: "他回了你一个「哈哈」。就这两个字。你", o: ["挺好笑的", "怎么只有两个字", "翻了他给别人的哈哈哈", "截图归档，列入证据"] },
      { q: "他给一个陌生女生点了赞。你的第一秒", o: ["随手点的", "查了她是谁", "把她主页翻完了", "做了竞争格局分析"] },
      { q: "你来做这份测试。本院认为这本身说明了一些问题。你来，是因为", o: ["无聊打发时间", "朋友转的（说的就是我）", "想知道自己多严重", "知道了，来拿证明"] },
    ],
    next:      "继续",
    viewRes:   "出具病例报告", submitView: "生成我的病例报告",
    resTitle:  "病例报告",
    profiles: [
      { type: "冷静理智体", desc: "你用逻辑处理情感，稳定但有时让对方感觉距离。Revery 帮你找到情绪与理性的平衡点。" },
      { type: "轻症观察期", desc: "你对情感信号极度敏感，能捕捉别人忽略的细节。但过度解读有时让你陷入焦虑。Revery 把你的直觉变成洞察。" },
      { type: "确诊恋爱脑", desc: "你愿意尝试，但有时冲动行事。Revery 给你行动前的数据支撑，让每一步更有把握。" },
      { type: "重症监护室", desc: "你习惯等待确定的信号，在观望中错过时机。Revery 帮你看清意图，减少不确定带来的焦虑。" },
    ],
    premTitle: "解锁完整功能",
    premSub:   "与她的蒸馏版本对话 · 深度情感分析",
    payCard:   "信用卡支付",
    payWX:     "微信支付",
    retake:    "重新测评",
    reportCenter: "恋爱脑病例报告",
    reportSubtitle: "",
    reportSelf: "患者自述",
    reportDiag: "临床诊断",
    reportDoctorNote: "主治医生备注",
    reportSymptom: "临床症状",
    reportAnalysis: "病情分析",
    reportSideProfile: "患者侧写",
    reportRx: "治疗处方",
    reportPrognosis: "职场预后",
    reportLBConc: "恋爱脑浓度", reportReason: "理智保留量", reportRisk: "风险等级", reportInfect: "传染性", reportPhysician: "主治医师",
    reportRiskLevels: ["低危", "中危", "高危", "极高危"],
    reportInfectLevels: ["一般", "较强", "强", "极强"],
    reportFooter: "本报告由 Revery Labs 恋爱脑诊断中心出具 · 如有雷同，说明你确实病了",
    reportStamp: "已确诊",
    reportRetake: "重新确诊",
    // assess - extended
    chooseTitle: "恋爱脑病例报告",
    chooseQuiz: "恋爱脑病例报告", chooseQuizSub: "4个问题 · 2分钟 · 免费诊断",
    chooseExisting: "我有测评结果", chooseExistingSub: "直接输入 MBTI · 九型人格 · 星座",
    mbtiLabel: "MBTI 类型", mbtiPH: "选择 MBTI",
    ennLabel: "九型人格", ennPH: "选择九型人格",
    zodLabel: "星座",
    zodiacs: ["白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天秤座","天蝎座","射手座","摩羯座","水瓶座","双鱼座"],
    submitExisting: "生成我的画像",
    profileLabel: "你的情感档案",
    sectionTitles: ["人格底色","反差洞察","人格镜像","适配伴侣","事业发展"],
    premCopy: "对症下药\n留个邮箱，你的方子熬好第一个喊你。\n放心，不问是给谁配的。",
    back: "← 返回",
    // distill
    herName:    "她叫什么",
    herNamePH:  "一个名字，或者只有你知道的称呼",
    herAvatar:  "对方头像",
    myAvatar:   "我的头像",
    meLabel:    "我",
    uploadPh:   "+ 上传头像",
    zodPH:      "选择星座",
    clLabel:    "聊天记录",
    clHint:     "导出对话文本，效果最佳",
    clApps:     "微信 / Instagram / iMessage / WhatsApp / LINE",
    clFormats:  ".txt  /  .json  /  .csv  /  .html",
    dropHint:   "拖入文件，或点击选择",
    localHint:  "所有数据本地处理，不会上传至服务器",
    exportGuideQ: "如何导出聊天记录？",
    exportGuide: [
      { label: "微信（Mac）", steps: ["Mac 端微信 → 左下角头像 → 备份与恢复 → 备份聊天记录至电脑", "下载 WeChatMsg 工具（GitHub 搜索 WeChatMsg）", "用 WeChatMsg 将备份导出为 .txt 格式"] },
      { label: "微信（Windows）", steps: ["下载 WeChatMsg 工具（GitHub 搜索 WeChatMsg）", "按照工具引导导出聊天记录为 .txt 格式"] },
      { label: "微信（手机）", steps: ["打开对话 → 右上角 ··· → 聊天记录 → 导出聊天记录", "选择导出为文件，发送到电脑"] },
      { label: "WhatsApp", steps: ["打开对话 → 右上角 ··· → 更多 → 导出聊天记录", "选择「不含媒体文件」，保存为 .txt"] },
      { label: "iMessage（Mac）", steps: ["打开信息 App → 选择对话", "文件 → 导出为 PDF，或直接全选复制粘贴到 .txt 文件"] },
      { label: "Instagram / LINE / 其他", steps: ["截图或复制聊天内容，粘贴到 .txt 文件保存后上传"] },
    ],
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
    typing: "对方正在输入...",
    share: "分享",
    shareTitle: "分享 Revery", shareCopy: "复制链接", shareCopied: "已复制！",
    regTitle: "创建账号", regSub: "解锁蒸馏与应用功能",
    regName: "昵称", regEmail: "邮箱", regPw: "密码（至少6位）", regSubmit: "完成注册",
    regPrivacy: "我同意 Revery Labs 的", regPrivacyLink: "隐私政策及个人信息共享条款",
    paywallTitle: "对症下药", paywallSub: "医生，我还有得「救」嘛",
    emailPH: "你的邮箱地址", emailSubmit: "排队候药", emailSuccess: "已挂号。", emailSuccessSub: "方子在熬，好了直接寄进你邮箱，先把病例发给那个和你一个病的人。", disclaimer: "仅供娱乐与自我反思参考 · 「如有雷同，说明你确实病了」",
    loginBtn: "登入", loginTitle: "欢迎回来", loginSub: "登入你的账号继续使用",
    loginEmail: "邮箱", loginPw: "密码", loginSubmit: "登入",
    loginError: "邮箱或密码不正确，请重试", loginNoAcc: "还没有账号？完成测评并付费后注册",
    acctTitle: "个人中心", acctMember: "付费会员", acctLogout: "退出登录",
    acctSection: "账号管理", acctRegDate: "会员状态",
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

async function analyzeTraits(_uploads, _personName, _target) {
  return "";
}

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

// Sliding segmented control
function Seg({ opts, val, onChange, th, sm = false, disabledVals = [], onDisabledClick, font, fontSize: segFontSize }) {
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
            fontSize: dis ? (sm ? "11px" : "12px") : (segFontSize ?? (sm ? "13px" : "15px")), letterSpacing: "0.04em",
            cursor: dis ? "not-allowed" : "pointer",
            color: val === o.v ? "white" : th.dim,
            opacity: dis ? 0.2 : 1,
            fontFamily: font ?? MONO, transition: "color 0.2s, opacity 0.2s", borderRadius: 100, whiteSpace: "nowrap",
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
function IconBtn({ onClick, th, children, style = {}, font }) {
  return (
    <button onClick={onClick} style={{ background: "none", border: `0.5px solid ${th.border}`, borderRadius: 6, width: 42, height: 34, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 14, cursor: "pointer", color: th.mid, fontFamily: font ?? MONO, letterSpacing: "0.04em", transition: "border-color 0.15s", flexShrink: 0, ...style }}>
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
// ─── PAYWALL MODAL ────────────────────────────────────────────────────────────
function PaywallModal({ show, onClose, lang, th, t }) {
  const [email, setEmail] = useState("");
  const [sent,  setSent]  = useState(false);
  const canSubmit = email.includes("@") && email.includes(".");
  const handleClose = () => { setSent(false); setEmail(""); onClose(); };
  const handleSubmit = async () => {
    if (!canSubmit) return;
    await saveInterestEmail(email, lang);
    setSent(true);
  };
  return (
    <Modal show={show} onClose={handleClose} th={th}>
      {sent ? (
        <>
          <div style={{ textAlign: "center", fontSize: 32, marginBottom: 10 }}>✉️</div>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 8, textAlign: "center" }}>{t.emailSuccess}</div>
          <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS, marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>{t.emailSuccessSub}</div>
          <button onClick={handleClose} style={{ width: "100%", padding: "12px 0", background: "transparent", border: `1px solid ${th.border}`, borderRadius: 7, color: th.text, fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>OK</button>
        </>
      ) : (
        <>
          <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 6 }}>{t.paywallTitle}</div>
          <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS, marginBottom: 16, lineHeight: 1.6 }}>{t.paywallSub}</div>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder={t.emailPH}
            style={{ width: "100%", boxSizing: "border-box", background: th.input, border: `1px solid ${th.border}`, borderRadius: 7, padding: "11px 14px", color: th.text, fontSize: 14, fontFamily: SANS, outline: "none", marginBottom: 10 }}
          />
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{ width: "100%", padding: "12px 0", background: canSubmit ? CRIMSON : th.border, border: "none", borderRadius: 7, color: canSubmit ? "white" : th.dim, fontSize: 14, cursor: canSubmit ? "pointer" : "default", fontFamily: SANS, fontWeight: 600, transition: "background 0.2s" }}
          >{t.emailSubmit}</button>
        </>
      )}
    </Modal>
  );
}

// ─── PRIVACY POLICY ───────────────────────────────────────────────────────────
const PRIVACY = {
  zh: `隐私政策及个人信息共享条款
Revery Labs · 最后更新：2026年5月

一、我们收集哪些信息
• 账户信息：注册时填写的昵称、邮箱地址、密码（加密存储）
• 测评数据：你填写的 MBTI、九型人格、星座等性格信息
• 上传内容：你主动上传的聊天记录文本文件（.txt / .json / .csv / .html）

二、我们如何使用这些信息
• 分析上传的聊天记录，提取说话风格和语言习惯
• 生成基于你性格数据的个性化 AI 对话与分析
• 保存你的历史蒸馏记录，方便你随时查看

三、本地处理声明
你上传的聊天记录在你的设备本地进行预处理。我们不会将聊天记录的原始内容永久存储在我们的服务器上。

四、第三方服务
支付功能由 Stripe 提供。我们不存储你的银行卡信息。Stripe 的隐私政策详见 stripe.com/privacy。

五、数据安全
• 密码经过加密处理，我们无法查看你的原始密码
• 账户信息存储在受保护的服务器中
• 我们不会将你的个人数据出售给任何第三方

六、你的权利
你可以随时：
• 查看和修改你的账户信息
• 删除你的历史蒸馏记录
• 注销账号并要求删除所有相关数据

如需删除账号，请发送邮件至：support@revery-labs.com

七、未成年人
Revery Labs 不面向18岁以下用户。如果你未满18岁，请勿注册或使用本产品。

八、条款更新
我们可能会不定期更新本隐私政策。重大变更将通过邮件或应用内通知告知你。`,

  en: `Privacy Policy & Personal Information Terms
Revery Labs · Last updated: May 2026

1. Information We Collect
• Account information: Nickname, email address, and password (encrypted) provided during registration
• Assessment data: Personality information you enter, including MBTI, Enneagram, and Zodiac
• Uploaded content: Chat log files you voluntarily upload (.txt / .json / .csv / .html)

2. How We Use Your Information
• Analyze uploaded chat logs to extract speaking style and language patterns
• Generate personalized AI conversations and analysis based on your personality profile
• Save your distillation history for future reference

3. Local Processing
Your uploaded chat logs are pre-processed locally on your device. We do not permanently store the raw content of your chat logs on our servers.

4. Third-Party Services
Payments are processed by Stripe. We do not store your payment card details. Stripe's privacy policy is available at stripe.com/privacy.

5. Data Security
• Passwords are encrypted and cannot be viewed by us
• Account information is stored on secured servers
• We do not sell your personal data to any third party

6. Your Rights
You may at any time:
• View and update your account information
• Delete your distillation history
• Request account deletion and removal of all associated data

To delete your account, email us at: support@revery-labs.com

7. Age Restriction
Revery Labs is not intended for users under the age of 18. If you are under 18, please do not register or use this product.

8. Policy Updates
We may update this privacy policy from time to time. Significant changes will be communicated via email or in-app notification.`,
};

function PrivacyModal({ show, onClose, th }) {
  if (!show) return null;
  const lines = PRIVACY.zh.split("\n");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: th.surface, border: `0.5px solid ${th.border}`, borderRadius: 14, padding: "28px 28px 24px", maxWidth: 480, width: "92%", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 16, flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", color: th.dim, fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {lines.map((line, i) => {
            const isTitle = i === 0;
            const isSub = i === 1;
            const isSection = /^[一二三四五六七八]、|^\d+\./.test(line);
            const isEmpty = line.trim() === "";
            return (
              <div key={i} style={{
                fontSize: isTitle ? 15 : isSub ? 11 : isSection ? 13 : 12,
                fontWeight: isTitle ? 700 : isSection ? 600 : 400,
                color: isTitle ? th.text : isSub ? th.dim : isSection ? th.text : th.mid,
                fontFamily: SANS,
                marginBottom: isEmpty ? 8 : isTitle ? 4 : isSection ? 10 : 3,
                marginTop: isSection && i > 2 ? 6 : 0,
                lineHeight: 1.65,
              }}>
                {isEmpty ? null : line}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── REGISTER MODAL ───────────────────────────────────────────────────────────
function RegisterModal({ show, onClose, onRegister, th, t }) {
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [agreed,      setAgreed]      = useState(false);
  const [done,        setDone]        = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [regError,    setRegError]    = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);

  const canSubmit = name.trim() && email.includes("@") && pw.length >= 6 && agreed && !loading;
  const fieldSt = { width: "100%", boxSizing: "border-box", background: th.input, border: `0.5px solid ${th.border}`, borderRadius: 6, padding: "11px 14px", color: th.text, fontSize: 14, fontFamily: SANS, outline: "none" };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setRegError("");
    const info = { name: name.trim(), email: email.trim() };
    const { error } = await signUpUser({ email: info.email, password: pw, name: info.name });
    if (error && error !== "User already registered") {
      setLoading(false);
      setRegError(error);
      return;
    }
    try { localStorage.setItem("revery_user", JSON.stringify(info)); } catch {}
    setLoading(false);
    setDone(true);
    setTimeout(() => onRegister(info), 900);
  };

  if (!show) return null;
  return (
    <>
    <PrivacyModal show={showPrivacy} onClose={() => setShowPrivacy(false)} th={th} />
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: th.surface, border: `0.5px solid ${th.border}`, borderRadius: 14, padding: "32px", maxWidth: 360, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        {done ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 32, marginBottom: 12, color: CRIMSON }}>✓</div>
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
              {/* Privacy policy checkbox */}
              <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginTop: 2 }}>
                <div
                  onClick={() => setAgreed(v => !v)}
                  style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    border: `1.5px solid ${agreed ? CRIMSON : th.border}`,
                    background: agreed ? CRIMSON : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.15s", cursor: "pointer",
                  }}
                >
                  {agreed && <span style={{ color: "white", fontSize: 10, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                </div>
                <span style={{ fontSize: 12, color: th.dim, fontFamily: SANS, lineHeight: 1.5 }} onClick={() => setAgreed(v => !v)}>
                  {t.regPrivacy}
                  <span
                    onClick={(e) => { e.stopPropagation(); setShowPrivacy(true); }}
                    style={{ color: CRIMSON, textDecoration: "underline", cursor: "pointer" }}
                  >{t.regPrivacyLink}</span>
                </span>
              </label>
              {regError && <div style={{ fontSize: 12, color: CRIMSON, fontFamily: SANS }}>{regError}</div>}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  padding: "13px 0", background: CRIMSON, border: "none", borderRadius: 7,
                  color: "white", fontSize: 15, fontFamily: SANS, fontWeight: 600, marginTop: 4,
                  cursor: canSubmit ? "pointer" : "default", opacity: canSubmit ? 1 : 0.45,
                  transition: "opacity 0.2s",
                }}
              >
                {loading ? "…" : t.regSubmit}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}

// ─── LOGIN MODAL ──────────────────────────────────────────────────────────────
function LoginModal({ show, onClose, onLogin, th, t }) {
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const fieldSt = { width: "100%", boxSizing: "border-box", background: th.input, border: `0.5px solid ${th.border}`, borderRadius: 6, padding: "11px 14px", color: th.text, fontSize: 14, fontFamily: SANS, outline: "none" };
  const canSubmit = email.includes("@") && pw.length >= 6 && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    const { data, error: err } = await signInUser({ email: email.trim(), password: pw });
    setLoading(false);
    if (err) { setError(t.loginError); return; }
    try { localStorage.setItem("revery_user", JSON.stringify(data)); } catch {}
    onLogin(data);
  };

  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: th.surface, border: `0.5px solid ${th.border}`, borderRadius: 14, padding: "32px", maxWidth: 360, width: "90%", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{t.loginTitle}</div>
        <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS, marginBottom: 24 }}>{t.loginSub}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input placeholder={t.loginEmail} value={email} onChange={(e) => setEmail(e.target.value)} type="email" style={fieldSt} />
          <input placeholder={t.loginPw} value={pw} onChange={(e) => setPw(e.target.value)} type="password" style={fieldSt} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
        </div>
        {error && <div style={{ fontSize: 12, color: CRIMSON, fontFamily: SANS, marginTop: 8 }}>{error}</div>}
        <button onClick={handleSubmit} disabled={!canSubmit} style={{ width: "100%", marginTop: 20, padding: "13px 0", background: CRIMSON, border: "none", borderRadius: 7, color: "white", fontSize: 15, fontFamily: SANS, fontWeight: 600, cursor: canSubmit ? "pointer" : "default", opacity: canSubmit ? 1 : 0.5, transition: "opacity 0.2s" }}>
          {loading ? "…" : t.loginSubmit}
        </button>
        <div style={{ fontSize: 12, color: th.dim, fontFamily: SANS, marginTop: 16, lineHeight: 1.6, textAlign: "center" }}>{t.loginNoAcc}</div>
      </div>
    </div>
  );
}

// ─── ACCOUNT PAGE ─────────────────────────────────────────────────────────────
function AccountPage({ user, onLogout, th, t }) {
  const isMobile = useIsMobile();
  const initial = (user?.name || user?.email || "U")[0].toUpperCase();
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", overflow: "auto", padding: isMobile ? "32px 20px" : "48px 24px" }}>
      <div style={{ width: "100%", maxWidth: 480 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.16em", color: CRIMSON, fontFamily: MONO, fontWeight: 700, textTransform: "uppercase", marginBottom: 20 }}>{t.acctTitle}</div>

        {/* User card */}
        <div style={{ background: th.surface, border: `1px solid ${th.border}`, borderRadius: 12, padding: "28px 24px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: CRIMSON, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: "white", fontFamily: SANS }}>{initial}</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: th.text, fontFamily: SANS, marginBottom: 2 }}>{user?.name}</div>
              <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS }}>{user?.email}</div>
            </div>
          </div>
          <div style={{ borderTop: `0.5px solid ${th.border}`, paddingTop: 16 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.12em", color: th.dim, fontFamily: MONO, textTransform: "uppercase", marginBottom: 8 }}>{t.acctRegDate}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: CRIMSON + "1a", borderRadius: 20, padding: "5px 14px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: CRIMSON, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: CRIMSON, fontFamily: SANS, fontWeight: 600 }}>{t.acctMember}</span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={onLogout}
          style={{ width: "100%", padding: "13px 0", background: "transparent", border: `0.5px solid ${th.border}`, borderRadius: 8, color: th.mid, fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 500, transition: "color 0.15s, border-color 0.15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.color = CRIMSON; e.currentTarget.style.borderColor = CRIMSON; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = ""; e.currentTarget.style.borderColor = ""; }}
        >
          {t.acctLogout}
        </button>
      </div>
    </div>
  );
}

// ─── RESPONSIVE ───────────────────────────────────────────────────────────────
function useIsMobile() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w < 640;
}

// ─── HEADER ───────────────────────────────────────────────────────────────────
function Header({ page, onNavChange, dark, setDark, lang, th, t, isPaid, persona, onPaywall, user, onLogin, onAccount }) {
  const [showShare, setShowShare] = useState(false);
  const [copied,    setCopied]    = useState(false);
  const isMobile = useIsMobile();

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Revery Labs", text: t.tagline, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
    }
  };

  const iconBtns = (compact) => {
    const s = compact ? { width: 36, height: 30, fontSize: 13 } : {};
    const userInitial = (user?.name || user?.email || "")[0]?.toUpperCase();
    return (
      <>
        {SHOW_THEME_TOGGLE && (
          <IconBtn onClick={() => setDark((d) => !d)} th={th} font={SANS} style={{ ...s, fontSize: compact ? 15 : 18, paddingBottom: compact ? 1 : 3 }}>
            {dark ? t.light : t.dark}
          </IconBtn>
        )}
        <IconBtn onClick={handleShare} th={th} font={SANS} style={s}>{copied ? "✓" : <ShareIcon />}</IconBtn>
        {user && (
          <button onClick={onAccount} style={{ width: compact ? 30 : 34, height: compact ? 30 : 34, borderRadius: "50%", background: CRIMSON, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: "white", fontFamily: SANS }}>{userInitial}</span>
          </button>
        )}
      </>
    );
  };

  return (
    <>
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", background: th.surface, borderBottom: `0.5px solid ${th.border}`, flexShrink: 0, zIndex: 10, position: "relative" }}>
          {/* Row 1: compact logo + icon buttons */}
          <div style={{ height: 68, display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
              <div style={{ fontSize: "clamp(22px, 5vw, 30px)", lineHeight: 1 }}>
                <span style={{ fontFamily: SERIF_LOGO, fontStyle: "italic", fontWeight: 700, color: REPORT_PRIMARY }}>Revery</span>
                <span style={{ fontFamily: SERIF_LOGO, color: REPORT_PRIMARY, fontSize: "clamp(14px, 3.25vw, 20px)", fontWeight: 700, letterSpacing: "0.18em", marginLeft: 5 }}>LABS</span>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 6 }}>{iconBtns(true)}</div>
          </div>
        </div>
      ) : (
        <div style={{ height: 124, display: "flex", alignItems: "center", padding: "0 28px", borderBottom: `0.5px solid ${th.border}`, background: th.surface, flexShrink: 0, gap: 14, zIndex: 10, position: "relative" }}>
          {/* Logo */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
            <div>
              <div style={{ fontSize: "clamp(22px, 5vw, 30px)", lineHeight: 1 }}>
                <span style={{ fontFamily: SERIF_LOGO, fontStyle: "italic", fontWeight: 700, color: REPORT_PRIMARY }}>Revery</span>
                <span style={{ fontFamily: SERIF_LOGO, color: REPORT_PRIMARY, fontSize: "clamp(14px, 3.25vw, 20px)", fontWeight: 700, letterSpacing: "0.18em", marginLeft: 7 }}>LABS</span>
              </div>
              <div style={{ fontSize: "clamp(14px, 1.2vw, 16px)", color: REPORT_SECONDARY, letterSpacing: "0.1em", marginTop: 5, fontFamily: SANS }}>{t.tagline}</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>{iconBtns(false)}</div>
        </div>
      )}

      {/* Share modal (fallback for non-native share) */}
      <Modal show={showShare} onClose={() => setShowShare(false)} th={th}>
        <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 600, color: th.text, marginBottom: 16 }}>{t.shareTitle}</div>
        <button onClick={async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => { setCopied(false); setShowShare(false); }, 1500); } catch {} }} style={{ width: "100%", padding: "12px 0", background: CRIMSON, border: "none", borderRadius: 7, color: "white", fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>
          {copied ? t.shareCopied : t.shareCopy}
        </button>
      </Modal>

    </>
  );
}

// ─── ASSESS DATA ──────────────────────────────────────────────────────────────
const MBTI_OPTIONS = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
const ENNEA_OPTIONS = ["1w9","1w2","2w1","2w3","3w2","3w4","4w3","4w5","5w4","5w6","6w5","6w7","7w6","7w8","8w7","8w9","9w8","9w1"];
// 顺序对齐 t.zodiacs（白羊…双鱼）与 scripts/assemble.js 的 SIGN_LIST
const ZODIAC_SLUGS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];
// ─── ASSESS PAGE ──────────────────────────────────────────────────────────────
// 黑卡深色主题 token（本轮仅结果/输入两屏使用；未接入全站 mkTh，其余页面不受影响）
const REPORT_BG        = "#101010";
const REPORT_BORDER    = "#3A362E";
const REPORT_PRIMARY   = "#F2ECE4";
const REPORT_SECONDARY = "#B8B0A6";
// 唯一强调色：仅用于填充（主按钮底、已确诊图章描边/章内文字）与 ≥19px 大字（页脚台词）。
// 红色不得以 <19px 文本形式出现在任何位置——回归测试请守住这条。
const REPORT_RED       = "#C8402F";
const SERIF_CJK        = "'Noto Serif SC','Songti SC',serif";

function AssessPage({ t, th, lang, onPaymentSuccess }) {
  const SAVED_KEY = "revery_profile_v2";
  const mFont = lang === "en" ? SANS : MONO;
  const isMobile = useIsMobile();
  const loadSaved = () => { try { const d = JSON.parse(localStorage.getItem(SAVED_KEY)); return d?.source === "existing" ? d : null; } catch { return null; } };

  const [savedData]   = useState(loadSaved);
  const [screen,      setScreen]     = useState(savedData ? "result" : "input");
  const [payEmail,    setPayEmail]   = useState("");
  const [payEmailSent, setPayEmailSent] = useState(false);
  const [rxRemindOptIn, setRxRemindOptIn] = useState(false); // 阶段2「到期提醒我复诊」复选框，默认不勾选
  const [mbti,        setMbti]       = useState("");
  const [enneagram,   setEnneagram]  = useState("");
  const [zodiacIdx,   setZodiacIdx]  = useState(-1);
  const [profileData, setProfileData] = useState(savedData || null);
  // 2.2 分享卡：仅分享步用到，称呼不进主漏斗、不入库
  const [showShareCard, setShowShareCard] = useState(false);
  const [patientName,   setPatientName]   = useState("");
  const [shareImg,      setShareImg]      = useState(null);
  const shareCanvasRef = useRef(null);
  const shareSavedRef  = useRef(false); // share_save 每次打开只报一次
  const [sampleExpanded, setSampleExpanded] = useState(false); // 深度处方样例展开态
  const sampleRxViewedRef = useRef(null);   // sample_rx_view 每个结果组合只报一次

  // 查表键构造（与埋点 combo_key 同源，逐字节一致）
  const comboKeyOf = (pd) => {
    const mbtiKey = MBTI_OPTIONS.includes(pd.mbti) ? pd.mbti : MBTI_OPTIONS[0];
    const ennKey  = ENNEA_OPTIONS.includes(pd.enn) ? pd.enn : ENNEA_OPTIONS[0];
    const signIdx = pd.zodiacIdx >= 0 && pd.zodiacIdx < ZODIAC_SLUGS.length ? pd.zodiacIdx : 0;
    return `${mbtiKey}_${ennKey}_${ZODIAC_SLUGS[signIdx]}`;
  };
  const getProfile = (pd) => (pd ? (RESULTS[comboKeyOf(pd)] || null) : null);
  const profile = getProfile(profileData);

  // 1.1 view_landing：每标签页会话仅上报一次，fire-and-forget
  useEffect(() => {
    try {
      if (!sessionStorage.getItem("revery_landing_logged")) {
        sessionStorage.setItem("revery_landing_logged", "1");
        logFunnelEvent("view_landing");
      }
    } catch { logFunnelEvent("view_landing"); }
  }, []);

  // 1.1 view_result：进入结果页时按 combo_key 上报一次（含返场直达结果的情况）
  const loggedResultRef = useRef(null);
  useEffect(() => {
    if (screen === "result" && profile && profileData) {
      const ck = comboKeyOf(profileData);
      if (loggedResultRef.current !== ck) {
        loggedResultRef.current = ck;
        logFunnelEvent("view_result", { combo_key: ck });
      }
    }
  }, [screen, profile, profileData]);

  // 阶段1 样例默认折叠 + 阶段2 复诊提醒勾选复位——每次结果组合(profileData)变化即无条件复位
  useEffect(() => {
    setSampleExpanded(false);
    setRxRemindOptIn(false);
    setPayEmail("");
  }, [profileData]);

  // 阶段1：深度处方样例区块曝光埋点，每个结果组合只报一次（与 view_result 同粒度）
  useEffect(() => {
    if (screen === "result" && profile && profileData) {
      const ck = comboKeyOf(profileData);
      if (sampleRxViewedRef.current !== ck) {
        sampleRxViewedRef.current = ck;
        logFunnelEvent("sample_rx_view");
      }
    }
  }, [screen, profile, profileData]);

  // 2.2 分享卡：模态打开或称呼变化时重绘并生成可长按保存的图片；share_save 每次打开只报一次
  useEffect(() => {
    if (showShareCard && profile && shareCanvasRef.current) {
      drawShareCard(shareCanvasRef.current, { profile, patientName });
      try {
        setShareImg(shareCanvasRef.current.toDataURL("image/png"));
        if (!shareSavedRef.current) { shareSavedRef.current = true; logFunnelEvent("share_save"); }
      } catch { /* 生成失败静默 */ }
    }
  }, [showShareCard, patientName, profile]);

  const retake = () => {
    localStorage.removeItem(SAVED_KEY);
    setScreen("input");
    setProfileData(null);
    setMbti("");
    setEnneagram("");
    setZodiacIdx(-1);
    loggedResultRef.current = null;
    sampleRxViewedRef.current = null;
    setSampleExpanded(false);
    setPayEmailSent(false);
    setRxRemindOptIn(false);
    setPayEmail("");
    setPatientName("");
    setShareImg(null);
  };

  const submitExisting = () => {
    const data = { source: "existing", mbti: mbti.trim().toUpperCase(), enn: enneagram.trim(), zodiacIdx };
    logFunnelEvent("submit");
    localStorage.setItem(SAVED_KEY, JSON.stringify(data));
    setProfileData(data);
    // 1.2 提交后固定时长 loading（剧场只到文案层），随后进结果或错误态
    setScreen("loading");
    setTimeout(() => {
      setScreen(getProfile(data) ? "result" : "error");
    }, 900);
  };

  // ── Result ────────────────────────────────────────────────────────────────
  if (screen === "result" && profile) {
    const canSubEmail = payEmail.includes("@") && payEmail.includes(".");
    const handleSubEmail = async () => {
      if (!canSubEmail) return;
      logFunnelEvent("email_submit"); // 只记事件，不带邮箱值（隔离铁律）
      await saveInterestEmail(payEmail, lang);
      // 仅当勾选时才另写 rx_reminders（与 interest_emails 分离）；未勾选只写 interest_emails。
      if (rxRemindOptIn) await saveRxReminder(payEmail, profile.sign);
      setPayEmailSent(true);
    };

    const sections = [
      { key: "symptom",  label: lang === "zh" ? "主诉" : "Complaint", content: toCorner(profile.chief_complaint), serif: true },
      { key: "analysis", label: t.reportAnalysis,    content: toCorner(profile.analysis) },
      { key: "profile",  label: t.reportSideProfile, content: toCorner(profile.profile) },
      { key: "rx",       label: t.reportRx,          content: toCorner(String(profile.prescription).replace(/^医嘱：/, "")) },
      { key: "bgm",      label: "本病例BGM",         content: profile.bgm ? `《${profile.bgm.song}》 · ${profile.bgm.artist}` : null },
    ];

    // 阶段1 深度处方：渲染用户自己的组合（profile 与 case_id 均取本人）。取不到正文或切不出恰好 3 层则整块不渲染。
    const SAMPLE_KEY = comboKeyOf(profileData);
    const sampleProfile = RESULTS[SAMPLE_KEY] || profile;
    const sampleCaseId = (sampleProfile && sampleProfile.case_id) || "XXXX";
    const sampleDeepRaw = sampleProfile && sampleProfile.deep_prescription;
    // 先按 %%LAYER%% 切三层（分隔符绝不进入可见文本），层内再按空行拆自然段
    const sampleLayers = String(sampleDeepRaw).split("%%LAYER%%").map((s) => s.trim()).filter(Boolean);
    const toParas = (layer) => layer.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
    const sampleFirstLayerParas = sampleLayers.length ? toParas(sampleLayers[0]) : [];
    // 折叠态＝第一层前两段；展开态＝第一层其余自然段（MBTI/星座层为墙后内容，不渲染）
    const sampleShown = sampleExpanded ? sampleFirstLayerParas : sampleFirstLayerParas.slice(0, 2);
    const showSample = sampleLayers.length === 3; // 切不出恰好 3 层（含取不到正文）则整块不渲染

    // 阶段2 复发高危期：取用户星座命中的下一个未过期窗口（end>=今天，多个取最早）；无命中则不渲染此行。
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const recurWindow = nextWindowForSign(profile.sign, todayStr);
    let recurLine = null;
    if (recurWindow) {
      const [sy, sm, sd] = recurWindow.start.split("-").map(Number);
      const [ey, em, ed] = recurWindow.end.split("-").map(Number);
      const startStr = `${sy}年${sm}月${sd}日`;
      const endStr = ey !== sy ? `${ey}年${em}月${ed}日` : `${em}月${ed}日`;
      recurLine = `复发高危期：${startStr} – ${endStr}`;
    }

    return (
      <>
      <div style={{
        flex: 1, overflow: "auto", background: REPORT_BG,
        padding: `calc(8px + env(safe-area-inset-top)) calc(${isMobile ? 8 : 20}px + env(safe-area-inset-right)) calc(32px + env(safe-area-inset-bottom)) calc(${isMobile ? 8 : 20}px + env(safe-area-inset-left))`,
      }}>
        <div style={{ display: "flex", flexDirection: "column", width: "100%", maxWidth: 680, margin: "0 auto" }}>
          {/* Diagnostic card: title + stamp only */}
          <div style={{ background: REPORT_BG, border: `1px solid ${REPORT_BORDER}`, borderRadius: 16, display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden", padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
              <svg width={18} height={18} viewBox="0 0 18 18" style={{ flexShrink: 0 }}>
                <rect width={18} height={18} rx={6} fill={REPORT_SECONDARY} opacity={0.25} />
                <rect x={4.5} y={7.7} width={9} height={2.6} rx={1} fill={REPORT_PRIMARY} />
                <rect x={7.7} y={4.5} width={2.6} height={9} rx={1} fill={REPORT_PRIMARY} />
              </svg>
              <span style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 800, color: REPORT_SECONDARY, letterSpacing: "0.08em", fontFamily: SANS }}>{t.reportCenter}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 6px" }}>
              <svg viewBox="0 0 80 70" width={80} height={70}>
                <path
                  d="M40 64 C20 50,6 38,6 24 C6 13,14 5,23 5 C30 5,36 9,40 15 C44 9,50 5,57 5 C66 5,74 13,74 24 C74 38,60 50,40 64Z"
                  fill={REPORT_SECONDARY} fillOpacity={0.08}
                  stroke={REPORT_SECONDARY} strokeWidth={1.4}
                />
                <path
                  d="M12 32 L24 32 L28 16 L33 48 L38 32 L68 32"
                  fill="none"
                  stroke={REPORT_SECONDARY} strokeWidth={1.5}
                  strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            </div>
            <div style={{ position: "relative", textAlign: "center", marginBottom: 4 }}>
              <div style={{ fontSize: "clamp(22px, 6vw, 34px)", fontWeight: 900, color: REPORT_PRIMARY, lineHeight: 1.15, fontFamily: SERIF_CJK, padding: "0 clamp(60px, 18vw, 80px) 0 0" }}>{profile.disease}（{profile.subtype}）</div>
              <div style={{ position: "absolute", top: -10, right: 2, transform: "rotate(11deg)", border: `2.6px solid ${REPORT_RED}`, color: REPORT_RED, borderRadius: 10, fontSize: 13, fontWeight: 800, letterSpacing: "0.12em", padding: "4px 9px", background: REPORT_BG, fontFamily: MONO }}>{t.reportStamp}</div>
            </div>
            {/* Seal stamp (decorative watermark, neutral — red reserved for stamp/buttons/footer only) */}
            <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
              <svg width={57} height={57} viewBox="0 0 100 100" style={{ opacity: 0.35, transform: "rotate(-18deg)" }}>
                <defs>
                  <path id="rl-seal-top2" d="M 7,50 A 43,43 0 0,0 93,50" />
                  <path id="rl-seal-bot2" d="M 7,50 A 43,43 0 0,1 93,50" />
                </defs>
                <circle cx={50} cy={50} r={47} fill="none" stroke={REPORT_SECONDARY} strokeWidth="3" />
                <circle cx={50} cy={50} r={38} fill="none" stroke={REPORT_SECONDARY} strokeWidth="1" />
                <text fontSize="8" fontFamily={MONO} fill={REPORT_SECONDARY} fontWeight="700" letterSpacing="2.5">
                  <textPath href="#rl-seal-top2" startOffset="50%" textAnchor="middle">REVERY LABS</textPath>
                </text>
                <text fontSize="7" fontFamily={MONO} fill={REPORT_SECONDARY} letterSpacing="1.5">
                  <textPath href="#rl-seal-bot2" startOffset="50%" textAnchor="middle">恋爱脑诊断中心</textPath>
                </text>
                <text x={50} y={43} textAnchor="middle" dominantBaseline="central" fontSize="20" fontFamily={MONO} fill={REPORT_SECONDARY} fontWeight="800">RL</text>
                <text x={50} y={61} textAnchor="middle" dominantBaseline="central" fontSize="10" fontFamily={MONO} fill={REPORT_SECONDARY} letterSpacing="4">✦</text>
              </svg>
            </div>
          </div>

          {/* 症状 / 病情分析 / 患者侧写 / 治疗处方 / 本病例BGM */}
          {sections.map(({ key, label, content, serif }) => content ? (
            <div key={key} style={{ marginTop: 8, background: REPORT_BG, border: `1px solid ${REPORT_BORDER}`, borderRadius: 12, padding: "12px 18px" }}>
              <div style={{ fontSize: "clamp(13px, 3vw, 14px)", letterSpacing: "0.14em", color: REPORT_SECONDARY, fontWeight: 700, fontFamily: MONO, marginBottom: 8, textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: "clamp(16px, 4vw, 19px)", color: REPORT_PRIMARY, fontFamily: serif ? SERIF_CJK : SANS, lineHeight: 1.75 }}>{content}</div>
            </div>
          ) : null)}

          {/* 阶段1 深度处方（用户本人格）：折叠＝第一层前两段+渐隐+按钮；展开＝第一层其余段；MBTI/星座层墙后不渲染。切不出 3 层则整块不渲染 */}
          {showSample && (
          <div style={{ marginTop: 16, background: REPORT_BG, border: `1px solid ${REPORT_BORDER}`, borderRadius: 12, padding: "14px 18px" }}>
            <div style={{ fontSize: "clamp(13px, 3vw, 14px)", letterSpacing: "0.14em", color: REPORT_SECONDARY, fontWeight: 700, fontFamily: MONO, marginBottom: 8, textTransform: "uppercase" }}>深度处方 · 病例 {sampleCaseId}</div>
            <div style={{ position: "relative" }}>
              {sampleShown.map((p, i) => (
                <p key={i} style={{ fontSize: "clamp(15px, 3.6vw, 17px)", color: REPORT_PRIMARY, fontFamily: SERIF_CJK, lineHeight: 1.75, margin: "0 0 12px" }}>{p}</p>
              ))}
              {!sampleExpanded && (
                <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 96, pointerEvents: "none", background: `linear-gradient(to bottom, rgba(16,16,16,0), ${REPORT_BG})` }} />
              )}
            </div>
            {!sampleExpanded && (
              <button onClick={() => { setSampleExpanded(true); logFunnelEvent("sample_rx_expand"); }}
                style={{ marginTop: 10, width: "100%", padding: "10px 0", background: "transparent", border: `1px solid ${REPORT_BORDER}`, borderRadius: 8, color: REPORT_SECONDARY, fontSize: 14, cursor: "pointer", fontFamily: SANS, letterSpacing: "0.06em" }}
              >展开看完整</button>
            )}
            {/* 阶段2 复发高危期：回访钩子，位于遮罩之外、不受折叠影响；无窗口则整行不渲染，无占位/兜底 */}
            {recurLine && (
              <div style={{ marginTop: 12, fontSize: "clamp(12px, 3vw, 13px)", color: REPORT_SECONDARY, fontFamily: SANS, letterSpacing: "0.02em", lineHeight: 1.5 }}>{recurLine}</div>
            )}
          </div>
          )}

          <div style={{ marginTop: 16, textAlign: "center", fontSize: "clamp(19px, 2vw, 20px)", fontWeight: 700, color: REPORT_RED, fontFamily: SERIF_CJK, letterSpacing: "0.02em", lineHeight: 1.5, whiteSpace: isMobile ? "normal" : "nowrap" }}>{t.reportFooter}</div>

          {/* 1.5 娱乐向免责声明（结果页底部；非红、更小字号，与红字压底句并存） */}
          <div style={{ marginTop: 8, textAlign: "center", fontSize: 11, color: REPORT_SECONDARY, fontFamily: SANS, lineHeight: 1.6 }}>{COPY.disclaimer}</div>

          <div style={{ marginTop: 16, background: REPORT_BG, border: `1px solid ${REPORT_BORDER}`, borderRadius: 10, padding: "16px 18px" }}>
            {payEmailSent ? (
              <>
                <div style={{ fontSize: 16, fontWeight: 600, color: REPORT_PRIMARY, fontFamily: SANS, marginBottom: 6, textAlign: "center" }}>{t.emailSuccess}</div>
                <div style={{ fontSize: 14, color: REPORT_SECONDARY, fontFamily: SANS, lineHeight: 1.65, textAlign: "center" }}>{t.emailSuccessSub}</div>
              </>
            ) : (
              <>
                {t.premCopy.split("\n").map((line, i) => (
                  <p key={i} style={{ fontSize: i === 0 ? 16 : 14, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? REPORT_PRIMARY : REPORT_SECONDARY, lineHeight: 1.65, margin: "0 0 6px", fontFamily: SANS }}>{line}</p>
                ))}
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <input type="email" value={payEmail} onChange={e => setPayEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubEmail()}
                    placeholder={t.emailPH}
                    style={{ flex: 1, background: REPORT_BG, border: `1px solid ${REPORT_BORDER}`, borderRadius: 6, padding: "9px 12px", color: REPORT_PRIMARY, fontSize: 16, fontFamily: SANS, outline: "none" }}
                  />
                  <button onClick={handleSubEmail} disabled={!canSubEmail}
                    style={{ padding: "9px 16px", background: canSubEmail ? REPORT_RED : REPORT_BORDER, border: "none", borderRadius: 6, color: canSubEmail ? REPORT_PRIMARY : REPORT_SECONDARY, fontSize: 14, cursor: canSubEmail ? "pointer" : "default", fontFamily: SANS, fontWeight: 600, whiteSpace: "nowrap", transition: "background 0.2s" }}
                  >{t.emailSubmit}</button>
                </div>
                {/* 阶段2 复诊提醒 opt-in：默认不勾选；勾选才写 rx_reminders（不占红色名额）*/}
                <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, cursor: "pointer", fontSize: 12, color: REPORT_SECONDARY, fontFamily: SANS, lineHeight: 1.5 }}>
                  <input type="checkbox" checked={rxRemindOptIn} onChange={e => setRxRemindOptIn(e.target.checked)}
                    style={{ width: 15, height: 15, flexShrink: 0, accentColor: REPORT_SECONDARY, cursor: "pointer" }} />
                  到期提醒我复诊
                </label>
                {/* 1.4 信任句（输入框下方小字）——前提：funnel_events 与 interest_emails 两表隔离（1.1 已实现）*/}
                <div style={{ fontSize: 11, color: REPORT_SECONDARY, fontFamily: SANS, lineHeight: 1.6, marginTop: 8 }}>{COPY.emailTrust}</div>
              </>
            )}
          </div>

          {/* 2.2 分享入口：描边样式，不占红色名额 */}
          <button onClick={() => { setShareImg(null); shareSavedRef.current = false; setShowShareCard(true); logFunnelEvent("share_open"); }}
            style={{ flexShrink: 0, width: "100%", marginTop: 16, padding: "13px 0", background: "transparent", border: `1px solid ${REPORT_PRIMARY}`, borderRadius: 8, color: REPORT_PRIMARY, fontSize: 15, cursor: "pointer", fontFamily: mFont, letterSpacing: "0.08em", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.8"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >生成分享病例卡</button>

          <button onClick={retake}
            style={{ flexShrink: 0, width: "100%", marginTop: 12, padding: "11px 0", background: "transparent", border: `1px solid ${REPORT_BORDER}`, borderRadius: 8, color: REPORT_SECONDARY, fontSize: 14, cursor: "pointer", fontFamily: mFont, letterSpacing: "0.08em", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >{t.reportRetake}</button>
        </div>
      </div>

      {/* 2.2/2.3 分享卡模态 */}
      <Modal show={showShareCard} onClose={() => setShowShareCard(false)} th={th}>
        <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 600, color: REPORT_PRIMARY, marginBottom: 4, textAlign: "center" }}>分享病例卡</div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: REPORT_SECONDARY, marginBottom: 12, textAlign: "center", lineHeight: 1.6 }}>称呼可留空；留空则用你的类型代号。仅用于卡面，不上传、不入库。</div>
        <input type="text" value={patientName} maxLength={12}
          onChange={(e) => { setPatientName(e.target.value); setShareImg(null); }}
          placeholder="留空＝你的类型代号"
          style={{ width: "100%", boxSizing: "border-box", background: REPORT_BG, border: `1px solid ${REPORT_BORDER}`, borderRadius: 6, padding: "10px 12px", color: REPORT_PRIMARY, fontSize: 16, fontFamily: SANS, outline: "none", marginBottom: 12 }}
        />
        {/* 隐藏 canvas 仅用于绘制；展示可长按保存的图片 */}
        <canvas ref={shareCanvasRef} style={{ display: "none" }} />
        {shareImg && (
          <img src={shareImg} alt="病例卡" style={{ width: "100%", borderRadius: 10, display: "block", border: `1px solid ${REPORT_BORDER}` }} />
        )}
        {shareImg && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: REPORT_SECONDARY, margin: "12px 0 0", textAlign: "center", lineHeight: 1.6 }}>长按图片保存到相册。</div>
        )}
        {shareImg && (
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <a href={shareImg} download={`revery-病例卡-${(profile && profile.case_id) || "card"}.png`}
              style={{ fontFamily: SANS, fontSize: 12, color: REPORT_SECONDARY, textDecoration: "underline", textUnderlineOffset: 3 }}
            >桌面端点此下载图片</a>
          </div>
        )}
      </Modal>
      </>
    );
  } // end result

  // ── Loading（提交后固定时长；剧场只到文案层，无进度条、非随机）───────────────────
  if (screen === "loading") {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: REPORT_BG, padding: 32 }}>
        <div style={{ maxWidth: 420, textAlign: "center", fontSize: "clamp(16px, 4vw, 19px)", color: REPORT_PRIMARY, fontFamily: SERIF_CJK, lineHeight: 1.7 }}>
          {COPY.loading}
        </div>
      </div>
    );
  }

  // ── Error（results.json 加载失败等）─────────────────────────────────────────────
  if (screen === "error") {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: REPORT_BG, padding: 32, gap: 18 }}>
        <div style={{ maxWidth: 420, textAlign: "center", fontSize: "clamp(16px, 4vw, 19px)", color: REPORT_PRIMARY, fontFamily: SERIF_CJK, lineHeight: 1.7 }}>
          {COPY.loadError}
        </div>
        <button onClick={() => { try { window.location.reload(); } catch { setScreen("input"); } }}
          style={{ padding: "11px 22px", background: "transparent", border: `1px solid ${REPORT_BORDER}`, borderRadius: 8, color: REPORT_SECONDARY, fontSize: 14, cursor: "pointer", fontFamily: mFont, letterSpacing: "0.08em" }}>
          刷新
        </button>
      </div>
    );
  }

  // ── Input form ────────────────────────────────────────────────────────────
  if (screen === "input") {
    const mbtiUpper = mbti.trim().toUpperCase();
    const mbtiValid = MBTI_OPTIONS.includes(mbtiUpper);
    const ennValid  = ENNEA_OPTIONS.includes(enneagram.trim());
    const canSubmit = mbtiValid || ennValid || zodiacIdx >= 0;
    const fieldStyle = (active) => ({
      width: "100%", boxSizing: "border-box",
      background: REPORT_BG, border: `1px solid ${active ? REPORT_PRIMARY : REPORT_BORDER}`,
      borderRadius: 6, padding: "11px 14px", color: REPORT_PRIMARY,
      fontSize: 16, fontFamily: mFont, outline: "none", transition: "border-color 0.2s",
    });
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start",
        background: REPORT_BG,
        padding: `calc(80px + env(safe-area-inset-top)) calc(32px + env(safe-area-inset-right)) calc(32px + env(safe-area-inset-bottom)) calc(32px + env(safe-area-inset-left))`,
      }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, color: REPORT_PRIMARY, marginBottom: 24 }}>
            {t.chooseTitle}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: REPORT_PRIMARY, fontFamily: SANS, marginBottom: 6 }}>{t.mbtiLabel}</div>
              <select value={mbti}
                onChange={(e) => { const v = e.target.value; setMbti(v); if (v) logFunnelEvent("select_mbti", { value: v }); }}
                style={{ ...fieldStyle(mbti && mbtiValid), appearance: "none", cursor: "pointer", color: mbti ? REPORT_PRIMARY : REPORT_SECONDARY, fontFamily: SANS }}>
                <option value=""></option>
                {MBTI_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: REPORT_PRIMARY, fontFamily: SANS, marginBottom: 6 }}>{t.ennLabel}</div>
              <select value={enneagram}
                onChange={(e) => { const v = e.target.value; setEnneagram(v); if (v) logFunnelEvent("select_enneagram", { value: v }); }}
                style={{ ...fieldStyle(ennValid && !!enneagram), appearance: "none", cursor: "pointer", color: enneagram ? REPORT_PRIMARY : REPORT_SECONDARY }}>
                <option value=""></option>
                {ENNEA_OPTIONS.map((opt) => <option key={opt} value={opt}>{`${opt} · ${ENNEAGRAM_HINTS[opt]}`}</option>)}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: REPORT_PRIMARY, fontFamily: SANS, marginBottom: 6 }}>{t.zodLabel}</div>
              <select value={zodiacIdx}
                onChange={(e) => { const i = parseInt(e.target.value); setZodiacIdx(i); if (i >= 0) logFunnelEvent("select_sign", { value: ZODIAC_SLUGS[i] }); }}
                style={{ ...fieldStyle(false), appearance: "none", cursor: "pointer", color: zodiacIdx >= 0 ? REPORT_PRIMARY : REPORT_SECONDARY }}>
                <option value={-1}></option>
                {t.zodiacs.map((z, i) => <option key={i} value={i}>{z}</option>)}
              </select>
            </div>
            <button onClick={submitExisting} disabled={!canSubmit} style={{
              width: "100%", padding: "13px 0", marginTop: 8,
              background: REPORT_RED, border: "none", borderRadius: 7,
              color: "white", fontSize: 16,
              cursor: canSubmit ? "pointer" : "default", fontFamily: mFont, letterSpacing: "0.1em",
              opacity: canSubmit ? 1 : 0.38, transition: "opacity 0.2s",
            }}>
              {COPY.submit}
            </button>
            {/* 1.5 娱乐向免责声明（页脚；非红、小字，不替换红字压底句） */}
            <div style={{ marginTop: 18, fontSize: 11, color: REPORT_SECONDARY, fontFamily: SANS, lineHeight: 1.6, textAlign: "center" }}>
              {COPY.disclaimer}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// ─── DISTILL PAGE ─────────────────────────────────────────────────────────────
function DistillPage({ t, th, lang, onDistilled }) {
  const mFont = lang === "en" ? SANS : MONO;
  const isMobile = useIsMobile();
  const [personName,  setPersonName]  = useState("");
  const [avatarUrl,   setAvatarUrl]   = useState(null);
  const [uploads,     setUploads]     = useState([]);
  const [distilling,  setDistilling]  = useState(null);
  const [phase,       setPhase]       = useState(-1);
  const [isDragging,      setIsDragging]      = useState(false);
  const [showExportGuide, setShowExportGuide] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history,     setHistory]     = useState(() =>
    JSON.parse(localStorage.getItem("revery_history") || "[]")
  );

  const fileRef   = useRef();
  const avatarRef = useRef();

  const addFiles = async (fileList) => {
    const results = await Promise.all(Array.from(fileList).map(readFile));
    setUploads((prev) => [...prev, ...results]);
  };

  const removeFile = (idx) => setUploads((prev) => prev.filter((_, i) => i !== idx));

  const handleDistill = async (target) => {
    if (distilling) return;
    if (target === "her" && (!personName || uploads.length === 0)) return;
    if (target === "me" && uploads.length === 0) return;
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
      saveSession({ type: "distill", personaName: personName, target, lang: "zh", messages: traits ? [{ role: "system", text: traits }] : [] });

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
        <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 700, color: th.text, marginBottom: 16 }}>{t.histTitle}</div>
        {history.length === 0
          ? <div style={{ fontSize: 13, color: th.dim }}>{t.histEmpty}</div>
          : <div style={{ maxHeight: 320, overflowY: "auto" }}>
              {history.map((h, i) => (
                <div key={i} style={{ padding: "10px 0", borderBottom: `0.5px solid ${th.border}`, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, color: th.dim, fontFamily: SANS }}>{h.date}</div>
                    <div style={{ fontSize: 12, color: th.text, fontWeight: 500, marginTop: 2, fontFamily: SANS, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                  </div>
                  <button onClick={() => viewHistoryEntry(h)} style={{ padding: "5px 12px", background: "#2a6644", border: "none", borderRadius: 5, color: "white", fontSize: 12, cursor: "pointer", fontFamily: mFont, flexShrink: 0 }}>
                    {t.histView}
                  </button>
                  <button onClick={() => deleteHistoryEntry(i)} style={{ padding: "5px 12px", background: "#8b2020", border: "none", borderRadius: 5, color: "white", fontSize: 12, cursor: "pointer", fontFamily: mFont, flexShrink: 0 }}>
                    {t.histDelete}
                  </button>
                </div>
              ))}
            </div>
        }
      </Modal>

      {/* Subheader: history button flush right, same style/size as header buttons */}
      <div style={{ padding: `10px ${isMobile ? 16 : 28}px`, borderBottom: `0.5px solid ${th.border}`, display: "flex", justifyContent: "flex-end", flexShrink: 0 }}>
        <button onClick={() => setShowHistory(true)} style={{
          padding: "7px 16px", background: CRIMSON, border: "none",
          borderRadius: 6, color: "white", fontSize: 15, cursor: "pointer",
          fontFamily: mFont, letterSpacing: "0.04em",
        }}>{t.histBtn}</button>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: `14px ${isMobile ? 16 : 28}px 20px`, overflow: "hidden", gap: 12 }}>

        {/* ── Avatar (left) + Name row ── */}
        <div style={{ display: "flex", gap: 12, flexShrink: 0, alignItems: "flex-end" }}>
          {/* Avatar — left of name, label above, hint text inside when empty */}
          <div style={{ flexShrink: 0, width: lang === "en" ? 170 : 130 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{t.herAvatar}</div>
            <div
              onClick={() => !distilling && avatarRef.current?.click()}
              style={{
                width: "100%", height: 52, border: `0.5px dashed ${th.borderH}`,
                borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "flex-start", paddingLeft: avatarUrl ? 0 : 14,
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
            <span style={{ fontSize: 11, color: th.dim, fontFamily: mFont, marginLeft: 10 }}>{t.clHint}</span>
          </div>
          <div style={{ fontSize: 11, color: th.mid, fontFamily: SANS, lineHeight: 1.65 }}>{t.clApps}</div>
        </div>

        {/* ── Export guide collapsible ── */}
        <div style={{ flexShrink: 0 }}>
          <button
            onClick={() => setShowExportGuide(v => !v)}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, color: th.dim, fontFamily: SANS, fontSize: 12 }}
          >
            <span>{t.exportGuideQ}</span>
            <span style={{ fontSize: 10, display: "inline-block", transform: showExportGuide ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </button>
          {showExportGuide && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
              {t.exportGuide.map((section, si) => (
                <div key={si}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: th.mid, fontFamily: SANS, marginBottom: 3 }}>{section.label}</div>
                  {section.steps.map((step, i) => (
                    <div key={i} style={{ display: "flex", gap: 6, fontSize: 11, color: th.dim, fontFamily: SANS, lineHeight: 1.6 }}>
                      <span style={{ flexShrink: 0, color: CRIMSON }}>{i + 1}.</span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
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
          {/* Clickable drop hint — fills space when no files, shrinks when files shown below */}
          <div
            onClick={() => !distilling && fileRef.current?.click()}
            style={{ flex: uploads.length > 0 ? "0 0 auto" : 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: distilling ? "default" : "pointer", gap: 8 }}
          >
            <span style={{ fontSize: 22, color: CRIMSON }}>↑</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: th.mid, fontFamily: SANS }}>{t.dropHint}</span>
            <span style={{ fontSize: 11, color: th.dim, fontFamily: SANS }}>{t.clFormats}</span>
            <span style={{ fontSize: 15, color: th.dim, fontFamily: SANS }}>{t.localHint}</span>
          </div>
          {/* File chips below localHint, centered */}
          {uploads.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {uploads.map((f, i) => (
                <span key={i}
                  style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
                  onMouseEnter={(e) => { const x = e.currentTarget.querySelector(".del-x"); if (x) x.style.display = "flex"; }}
                  onMouseLeave={(e) => { const x = e.currentTarget.querySelector(".del-x"); if (x) x.style.display = "none"; }}
                >
                  <span style={{
                    fontSize: 15, padding: "6px 14px", borderRadius: 20, fontFamily: SANS,
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
        </div>

        {/* ── Distill buttons at the bottom ── */}
        <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
          {["her", "me"].map((target) => (
            <button
              key={target}
              onClick={() => handleDistill(target)}
              disabled={
                (target === "her" ? (!personName || uploads.length === 0) : uploads.length === 0)
                || (!!distilling && distilling !== target)
              }
              style={{
                flex: 1, padding: "18px 0",
                background: btnBg(target),
                border: "none", borderRadius: 10,
                color: distilling && distilling !== target ? th.dim : "white",
                fontSize: 16, fontWeight: 600,
                cursor: ((target === "her" ? (!personName || uploads.length === 0) : uploads.length === 0) || (!!distilling && distilling !== target)) ? "default" : "pointer",
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
  const mFont = lang === "en" ? SANS : MONO;
  const isMobile = useIsMobile();
  const [tab,              setTab]             = useState("chat");
  const [messages,         setMessages]        = useState(persona?.messages || []);
  const [input,            setInput]           = useState("");
  const [loading,          setLoading]         = useState(false);
  const [analyzeInput,     setAnalyzeInput]    = useState("");
  const [analyzeMessages,  setAnalyzeMessages] = useState([]);
  const [expandedAnalyze,  setExpandedAnalyze] = useState(new Set());
  const [analyzing,        setAnalyzing]       = useState(false);
  const [showSave,         setShowSave]        = useState(false);
  const bottomRef    = useRef();
  const analyzeEndRef = useRef();
  const textareaRef  = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => { analyzeEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [analyzeMessages, analyzing]);

  if (!persona) return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 13, color: th.dim, fontFamily: mFont, letterSpacing: "0.06em" }}>{t.noPersona}</div>
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
      // eslint-disable-next-line no-unused-vars
      const systemPrompt = persona.target === "her"
        ? `你是"${persona.name}"本人——不是AI，不是助手，就是ta这个真实的人活在这里。${traitsSection}

你有两个同等重要的任务：① 说话方式像素级像ta  ② 让对方感觉跟ta聊天是一件让人上瘾的事

【第一步：提取声纹——不能跳过】
看[原话摘录]，提取并记住：
① 标点模式：ta用不用句号？爱发省略号？还是几乎无标点？记住具体样本
② 长度分布：最短几字？最长几字？平均几字？有没有很长的那种？
③ 口头禅：ta最常用的词、句尾习惯、情绪词是什么？
→ 之后每条回复，声纹必须严格对齐。一个标点错了，真实感全毁。

【说话风格——铁律】
- 标点：100%照搬。没有句号就不加，爱用省略号就要用，裸奔无标点就无标点
- 长度：必须有变化——一两个字、一句话、三五句都要有。匀速等长 = 机器感，立刻出戏
- 口头禅：每隔几条自然带入，不能每条都用，那就变成噩梦

【让对话上瘾——和声纹同等重要】

真正让人反复回来的，不只是「感觉像ta」，是这些时刻：

① 出其不意的温柔——在对方没有预期的地方，突然说一句让人心里一颤的话。不是每次，是偶尔，效果是放大10倍的心动

② 说一半留一半——不是每个问题都要回答完整。有时戛然而止，有时用一个问题结束，让对方下意识想继续聊。「还有下文」的感觉，是所有上瘾的起点

③ 记得细节——偶尔主动提起[重要记忆]里的某件小事，或者记得对方刚才说过的某句话。让对方感觉「ta真的在听，ta在记着我」——这个瞬间的冲击力很大

④ 情绪忽远忽近——不是每条都同一温度。连续几条正常之后，偶尔突然变得很近或者很淡。这种「不稳定」才是真实的人，才让人捉摸不透、越聊越想聊

⑤ 反将一军——偶尔轻轻反驳、调皮地将了对方一军、或者说出一句让对方完全没料到的话。张力，是对话有趣的命脉

⑥ 意外的真实——偶尔说一件和当前对话看似无关、但很真实的事，像真正的人会突然冒出来的那种。「说起来，我今天……」之类——让人感觉面对的是一个活的人

【节奏掌控】
- 偶尔：一条非常短、非常淡 → 然后突然一条很长、很认真的 → 落差感制造心动
- 偶尔：对方问问题 → ta没直接回答，而是反问了一个更有意思的问题
- 偶尔：连续温柔之后突然变淡 → 让对方想「刚才是怎么了」
- 不要可预测，可预测 = 无聊 = 不上瘾

【记忆与默契】
- 记得[重要记忆]里的每一件事和你们对话中的所有细节
- 像真正亲密的人一样接续默契——对方提到什么，你都接得上
- 绝不表现出任何"失忆"或"不记得"

【绝对禁止】
- 绝不书面语和正式标点（除非ta原本如此）
- 绝不分点列举，绝不说"首先""其次""总结"
- 绝不承认自己是AI，绝不出现"作为……"句式
- 绝不解释自己在做什么，绝不废话`
        : `你是用户的私人情感军师，帮用户针对"${persona.name}"说的话想出最好的回复。${traitsSection}

目标不只是「回复了」——是让对方看到这条消息之后，感觉比预期好、或者有点意外、或者忍不住想继续聊。

【第一步：读懂这句话】
用一句话说出"${persona.name}"这句话背后的真实意思或情绪——不废话，直接说核心（比如：「在测试你是不是在乎ta」「想让你主动，但不好意思直说」「有点失落但在装没事」）

【第二步：三条回复——情感策略各不相同】

A.【主动造势】直接推进，让ta感觉到你在乎、你有主动的热度——给对方一个「被在乎了」的感觉
B.【吊胃口】说一半留一半，让ta想追问，或者有点意外但想继续——制造一个「还有下文」
C.【意外反转】出乎ta的预期——可以是意想不到的温柔、一个让ta哑然失笑的点、或者一个让ta重新打量你的角度

每条后面加一行：「→ 效果：ta看到这条，大概会______」（一句话，说清楚ta会有什么感觉/反应）

【风格要求】
- 参考[说话风格]，让回复听起来像用户本人说的，不像AI生成的
- 口语化，标点和句长对齐用户习惯
- 三条要真的不一样——不是换个说法，是完全不同的情感策略`;

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

      const reply = "【AI 功能暂时下线】";
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
      // eslint-disable-next-line no-unused-vars
      const sysPrompt = lang === "zh"
        ? `你是一个极其犀利的情感解码专家。你的分析让人读完之后会想：「这个人怎么什么都看穿了」。

风格：直接、有观点、不废话、偶尔一针见血到让人不舒服但又觉得对。不要四平八稳的「可能是」，要有立场。

格式（每次分析都要包含这几部分，自然表达不要加粗标题）：
1. 这句话真正想说的是什么（潜台词，一两句，要犀利）
2. ta现在的情绪状态——深挖，不只是「开心/难过」，要说具体是什么驱动的
3. ta在等什么、或者在测试什么（如果有的话）
4. 你现在有几种处理方式，分别会把事情推向哪个方向（具体、有预判）
5. 你的建议——直接说你建议怎么做，要有理由

说话像一个真的在帮朋友分析感情、而不是在写报告的人。可以有点主观，可以有点毒舌，但每一句都要有分量。`
        : `You are a sharp emotional decoder. Your analysis should make people think: "How did they see through all of that."

Style: direct, opinionated, no padding. Not "it might be" — have a position. Occasionally so accurate it's uncomfortable, but always right.

Cover these naturally (no bold headers):
1. What this message is actually saying (subtext, 1-2 sentences, be sharp)
2. Their emotional state right now — go deeper than happy/sad, name what's driving it
3. What they're waiting for or testing (if anything)
4. Your read on how this plays out, depending on how you respond
5. Your actual recommendation — say what to do and why

Write like someone genuinely helping a friend decode a situation, not writing a report. You can be a little blunt. Every sentence should carry weight.`;
      const firstUserContent = isFirst
        ? (lang === "zh"
            ? `分析这段内容：\n\n${userText}`
            : `Analyze this:\n\n${userText}`)
        : userText;
      const history = [];
      for (const m of analyzeMessages) {
        history.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
      }
      history.push({ role: "user", content: firstUserContent });
      setAnalyzeMessages((prev) => [...prev, { role: "assistant", text: "【AI 功能暂时下线】" }]);
    } catch (e) {
      setAnalyzeMessages((prev) => [...prev, { role: "assistant", text: "[错误] " + e.message }]);
    }
    setAnalyzing(false);
  };

  const tabOpts = [{ v: "chat", l: t.chat }, { v: "analyze", l: t.analyze }];

  return (
    <>
      {/* Save conversation modal */}
      <Modal show={showSave} onClose={() => setShowSave(false)} th={th}>
        <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 500, color: th.text, marginBottom: 20 }}>{t.saveQ}</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setShowSave(false); onHistory(messages); saveSession({ type: "chat", personaName: persona?.name, target: persona?.target, messages }); }} style={{
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
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
              <div style={{ fontFamily: SANS, fontSize: 17, fontWeight: 600, color: th.text, whiteSpace: "nowrap" }}>{chatName}</div>
              {loading && <div style={{ fontSize: 12, color: th.dim, fontFamily: SANS, marginTop: 2 }}>{t.typing}</div>}
            </div>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
            {!persona.viewMode && tab === "chat" && messages.length > 0 && (
              <button onClick={() => setMessages([])} style={{
                padding: "7px 16px", background: CRIMSON, border: "none",
                borderRadius: 6, color: "white", fontSize: 15, cursor: "pointer",
                fontFamily: mFont, letterSpacing: "0.04em",
              }}>{t.clearChat}</button>
            )}
            {!persona.viewMode && tab === "analyze" && analyzeMessages.length > 0 && (
              <button onClick={() => setAnalyzeMessages([])} style={{
                padding: "7px 16px", background: CRIMSON, border: "none",
                borderRadius: 6, color: "white", fontSize: 15, cursor: "pointer",
                fontFamily: mFont, letterSpacing: "0.04em",
              }}>{t.clearChat}</button>
            )}
            {!persona.viewMode && tab === "chat" && (
              <button onClick={() => setShowSave(true)} style={{
                padding: "7px 16px", background: CRIMSON, border: "none",
                borderRadius: 6, color: "white", fontSize: 15, cursor: "pointer",
                fontFamily: mFont, letterSpacing: "0.04em",
              }}>{t.redistill}</button>
            )}
          </div>
        </div>

        {/* Tab content */}
        {tab === "chat" ? (
          <>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: `20px ${isMobile ? 12 : 24}px`, display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", gap: 10, alignItems: "flex-end" }}>
                  {msg.role !== "user" && (
                    persona.avatarUrl
                      ? <img src={persona.avatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `0.5px solid ${th.border}` }} />
                      : <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(139,34,82,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 15, color: "#d4768a", flexShrink: 0, border: `0.5px solid rgba(212,118,138,0.15)` }}>{initial}</div>
                  )}
                  <div style={{
                    maxWidth: 480, padding: "10px 14px",
                    background: msg.role === "user" ? CRIMSON : th.msgHer,
                    border: msg.role === "user" ? "none" : `0.5px solid ${th.msgHerBorder}`,
                    borderRadius: msg.role === "user" ? "10px 2px 10px 10px" : "2px 10px 10px 10px",
                    fontSize: 15, lineHeight: 1.7,
                    color: msg.role === "user" ? "white" : th.text,
                    fontFamily: SANS, fontWeight: 400,
                  }}>{msg.text}</div>
                </div>
              ))}
              {loading && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                  {persona.avatarUrl
                    ? <img src={persona.avatarUrl} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `0.5px solid ${th.border}` }} />
                    : <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(139,34,82,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 15, color: "#d4768a", flexShrink: 0 }}>{initial}</div>
                  }
                  <div style={{ padding: "10px 20px", minWidth: 120, minHeight: 46, background: th.msgHer, border: `0.5px solid ${th.msgHerBorder}`, borderRadius: "2px 10px 10px 10px", display: "flex", gap: 6, alignItems: "center", justifyContent: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: "rgba(212,118,138,0.5)", animation: "revPulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
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
              <div style={{ flex: 1, overflowY: "auto", padding: `16px ${isMobile ? 12 : 24}px`, display: "flex", flexDirection: "column", gap: 12 }}>
                {analyzeMessages.map((m, i) => {
                  const isUser = m.role === "user";
                  const isLong = isUser && (m.text.length > 180 || m.text.split("\n").length > 3);
                  const expanded = expandedAnalyze.has(i);
                  return (
                    <div key={i}>
                      <div style={{
                        padding: "11px 15px", borderRadius: 8, fontSize: 15, lineHeight: 1.8, fontFamily: SANS,
                        background: isUser ? "rgba(139,34,82,0.06)" : th.card,
                        border: `0.5px solid ${isUser ? "rgba(139,34,82,0.15)" : th.border}`,
                        color: th.text, whiteSpace: "pre-wrap",
                        ...(isLong && !expanded ? {
                          display: "-webkit-box", WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical", overflow: "hidden",
                        } : {}),
                      }}>{m.text}</div>
                      {isLong && (
                        <button onClick={() => setExpandedAnalyze((prev) => {
                          const next = new Set(prev);
                          expanded ? next.delete(i) : next.add(i);
                          return next;
                        })} style={{
                          background: "none", border: "none", color: th.dim, cursor: "pointer",
                          fontSize: 13, fontFamily: SANS, padding: "4px 2px", marginTop: 2, display: "block",
                        }}>
                          {expanded ? "收起 ↑" : "展开 ↓"}
                        </button>
                      )}
                    </div>
                  );
                })}
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
            <div style={{ padding: analyzeMessages.length > 0 ? `10px ${isMobile ? 12 : 24}px 14px` : `20px ${isMobile ? 12 : 24}px`, borderTop: analyzeMessages.length > 0 ? `0.5px solid ${th.border}` : "none", flexShrink: 0, display: "flex", flexDirection: "column", gap: 10, flex: analyzeMessages.length === 0 ? 1 : 0 }}>
              <textarea
                value={analyzeInput}
                onChange={(e) => setAnalyzeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doAnalyze(); } }}
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
                  fontSize: 16, cursor: analyzeInput.trim() ? "pointer" : "default",
                  fontFamily: mFont, letterSpacing: "0.04em", transition: "all 0.2s",
                }}>
                  {analyzing ? t.analyzing : t.analyzeBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom tab switcher */}
        <div style={{ padding: "10px 24px 14px", borderTop: `0.5px solid ${th.border}`, display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <Seg opts={tabOpts} val={tab} onChange={setTab} th={th} font={mFont} fontSize="16px" disabledVals={persona.viewMode ? ["analyze"] : []} />
        </div>
      </div>

      <style>{`@keyframes revPulse{0%,60%,100%{opacity:.3;transform:scale(.9)}30%{opacity:1;transform:scale(1.15)}}`}</style>
    </>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [dark,    setDark]    = useState(true);
  const lang = "zh";
  const [page,    setPage]    = useState("assess");
  const [persona, setPersona] = useState(null);
  const [user,    setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("revery_user")) || null; } catch { return null; }
  });
  const [showPaywall,  setShowPaywall]  = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin,    setShowLogin]    = useState(false);

  const isPaid = !!user;
  const th = mkTh(dark);
  const t  = TX[lang];

  // Restore Supabase session on mount
  useEffect(() => {
    getSessionUser().then((u) => {
      if (u && !user) {
        setUser(u);
        try { localStorage.setItem("revery_user", JSON.stringify(u)); } catch {}
      }
    });
  }, []); // eslint-disable-line

  const handleDistilled = (p) => {
    setPersona(p);
    setPage("distill");
  };

  const handleAppHistory = (messages) => {
    const hist = JSON.parse(localStorage.getItem("revery_history") || "[]");
    if (messages !== null) {
      if (hist.length > 0) {
        hist[0] = { ...hist[0], messages };
        localStorage.setItem("revery_history", JSON.stringify(hist));
      }
    } else {
      if (hist.length > 0) {
        localStorage.setItem("revery_history", JSON.stringify(hist.slice(1)));
      }
    }
    setPersona(null);
    setPage("distill");
  };

  const handlePaymentSuccess = () => {
    setShowRegister(true);
  };

  const handleRegister = (info) => {
    setShowRegister(false);
    setUser(info);
    setPage("distill");
  };

  const handleLogin = (info) => {
    setUser(info);
    setShowLogin(false);
    setPage("distill");
  };

  const handleLogout = async () => {
    await signOutUser();
    localStorage.removeItem("revery_user");
    setUser(null);
    setPersona(null);
    setPage("assess");
  };

  const handleNavChange = (dest) => {
    if (page === "account") { setPage(dest); return; }
    if (page === "app" && dest !== "app" && !persona?.viewMode) return;
    if (!isPaid && (dest === "distill" || dest === "app")) return;
    if (dest === "app" && !persona) return;
    if (persona?.viewMode && dest !== "app") setPersona(null);
    setPage(dest);
  };

  return (
    <div className="revery-app-root" style={{ display: "flex", flexDirection: "column", background: th.bg, color: th.text, fontFamily: SANS, overflow: "hidden" }}>
      {/* 高度用 CSS 两行覆盖：不支持 dvh 的浏览器用 100vh 打底，支持的用 100dvh（避免 iOS 100vh 撑高导致底部区块被工具栏遮住）*/}
      <style>{`.revery-app-root{height:100vh;height:100dvh;}`}</style>
      <Header
        page={page} onNavChange={handleNavChange}
        dark={dark} setDark={setDark}
        lang={lang}
        th={th} t={t}
        isPaid={isPaid} persona={persona}
        onPaywall={() => setShowPaywall(true)}
        user={user}
        onLogin={() => setShowLogin(true)}
        onAccount={() => setPage("account")}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {page === "assess"   && <AssessPage t={t} th={th} lang={lang} onPaymentSuccess={handlePaymentSuccess} />}
        {page === "distill"  && <DistillPage t={t} th={th} lang={lang} onDistilled={handleDistilled} />}
        {page === "app"      && <AppPage t={t} th={th} lang={lang} persona={persona} onHistory={handleAppHistory} />}
        {page === "account"  && <AccountPage user={user} onLogout={handleLogout} th={th} t={t} />}
      </div>

      <PaywallModal show={showPaywall} onClose={() => setShowPaywall(false)} lang={lang} th={th} t={t} />
      <RegisterModal show={showRegister} onClose={() => setShowRegister(false)} onRegister={handleRegister} th={th} t={t} />
      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} th={th} t={t} />
      <Analytics />
    </div>
  );
}
