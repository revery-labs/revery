import { useState, useRef, useEffect } from "react";
import { Analytics } from "@vercel/analytics/react";
import { saveWish, saveUser, saveSession, signUpUser, signInUser, signOutUser, getSessionUser } from "./supabase";

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
    aTitle:    "恋爱脑病例报告",
    aSub:      "免费诊断 · 2分钟 · 后果自负",
    qs: [
      { q: "他一整天没主动发消息。现在11点了。你在干嘛", o: ["没留意（认真的）", "翻了记录，没发", "研究了最后那条措辞", "开场白备好，待发"] },
      { q: "他回了你一个「哈哈」。就这两个字。你", o: ["挺好笑的", "怎么只有两个字", "翻了他给别人的哈哈哈", "截图归档，列入证据"] },
      { q: "他给一个陌生女生点了赞。你的第一秒", o: ["随手点的", "查了她是谁", "把她主页翻完了", "做了竞争格局分析"] },
      { q: "你来做这份测试。本院认为这本身说明了一些问题。你来，是因为", o: ["无聊打发时间", "朋友转的（说的就是我）", "想知道自己多严重", "知道了，来拿证明"] },
    ],
    next:      "继续",
    viewRes:   "出具病例报告", submitView: "查看报告",
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
    chooseTitle: "了解你的情感模式",
    chooseQuiz: "恋爱脑病例报告", chooseQuizSub: "4个问题 · 2分钟 · 免费诊断",
    chooseExisting: "我有测评结果", chooseExistingSub: "直接输入 MBTI · 九型人格 · 星座",
    mbtiLabel: "MBTI 类型", mbtiPH: "选择 MBTI",
    ennLabel: "九型人格", ennPH: "选择九型人格",
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
    share: "分享", cs: "许愿池",
    csTitle: "许愿池", csSub: "有什么功能想要？告诉我们，我们都在看。",
    csPH: "我希望 Revery 能……", csSubmit: "许愿", csSuccess: "愿望已收到", csSuccessSub: "我们都在看，谢谢你。", csAgain: "再许一个愿",
    shareTitle: "分享 Revery", shareCopy: "复制链接", shareCopied: "已复制！",
    regTitle: "创建账号", regSub: "解锁蒸馏与应用功能",
    regName: "昵称", regEmail: "邮箱", regPw: "密码（至少6位）", regSubmit: "完成注册",
    regPrivacy: "我同意 Revery Labs 的", regPrivacyLink: "隐私政策及个人信息共享条款",
    paywallTitle: "解锁完整体验", paywallSub: "完成测评后付费，即可使用蒸馏与应用功能",
    wxMaintTitle: "微信支付维护中", wxMaintSub: "微信支付通道正在维护升级，请使用信用卡支付，或稍后再试。", wxMaintBack: "返回",
    loginBtn: "登入", loginTitle: "欢迎回来", loginSub: "登入你的账号继续使用",
    loginEmail: "邮箱", loginPw: "密码", loginSubmit: "登入",
    loginError: "邮箱或密码不正确，请重试", loginNoAcc: "还没有账号？完成测评并付费后注册",
    acctTitle: "个人中心", acctMember: "付费会员", acctLogout: "退出登录",
    acctSection: "账号管理", acctRegDate: "会员状态",
  },
  en: {
    nav:       ["Assess", "Distill", "Apply"],
    tagline:   "Keep her here",
    dark: "◑", light: "☀",
    aTitle:    "Love Brain Diagnostic Report",
    aSub:      "Free diagnosis · 2 min · consequences not included",
    qs: [
      { q: "He hasn't texted first all day. It's 11pm. Current status:", o: ["Didn't notice. (Sure.)", "Checked the chat. Didn't text.", "Studied his last message wording.", "Draft ready. Still unsent."] },
      { q: "He replied 'haha.' Just that. You:", o: ["It was funny.", "Why only two letters.", "Counted his h's to others.", "Screenshot. Annotated. Filed."] },
      { q: "He liked a stranger girl's post. Your first move:", o: ["Probably just scrolling.", "Checked who she is.", "Went through her whole page.", "Ran a full competitive audit."] },
      { q: "You're taking this test. This clinic finds that meaningful. You're here because:", o: ["Killing time. (Sure.)", "A friend sent it. (She meant me.)", "Need to know how bad it is.", "I know. Here for the paperwork."] },
    ],
    next:      "Next",
    viewRes:   "Generate Report", submitView: "View Report",
    resTitle:  "Diagnostic Report",
    profiles: [
      { type: "Emotionally Stable",    desc: "You process emotions logically. Stable, but can feel distant. Revery helps you bridge head and heart." },
      { type: "Mild Case: Observe",    desc: "You pick up signals others miss. But overthinking can turn intuition into anxiety. Revery channels sensitivity into insight." },
      { type: "Diagnosed: Love Brain", desc: "You're willing to try but sometimes act impulsively. Revery gives data-backed clarity before you move." },
      { type: "Critical: ICU",         desc: "You wait for clear signals, missing windows along the way. Revery reads intent so you can act with confidence." },
    ],
    premTitle: "Unlock Full Features",
    premSub:   "Chat with her distilled version · Deep emotional analysis",
    payCard:   "Pay with Card",
    payWX:     "WeChat Pay",
    retake:    "Retake",
    reportCenter: "Love Brain Case Report",
    reportSubtitle: "",
    reportSelf: "Patient Statement",
    reportDiag: "Clinical Diagnosis",
    reportDoctorNote: "Attending Physician's Note",
    reportSymptom: "Clinical Symptoms",
    reportAnalysis: "Clinical Analysis",
    reportSideProfile: "Patient Profile",
    reportRx: "Prescription",
    reportPrognosis: "Career Prognosis",
    reportLBConc: "Love Brain Conc.", reportReason: "Reason Ret.", reportRisk: "Risk Level", reportInfect: "Contagion", reportPhysician: "Physician",
    reportRiskLevels: ["Low", "Moderate", "High", "Critical"],
    reportInfectLevels: ["Low", "Moderate", "High", "Extreme"],
    reportFooter: "Issued by Revery Labs · For entertainment only · If this is accurate, that's on you",
    reportStamp: "CONFIRMED",
    reportRetake: "Re-diagnose",
    // assess - extended
    chooseTitle: "Understand Your Emotional Patterns",
    chooseQuiz: "Love Brain Diagnostic", chooseQuizSub: "4 questions · 2 min · Free diagnosis",
    chooseExisting: "I have results", chooseExistingSub: "Enter MBTI · Enneagram · Zodiac",
    mbtiLabel: "MBTI Type", mbtiPH: "Select MBTI",
    ennLabel: "Enneagram", ennPH: "Select Enneagram",
    zodLabel: "Zodiac",
    zodiacs: ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces"],
    submitExisting: "Build My Profile",
    profileLabel: "Your Emotional Profile",
    sectionTitles: ["Core Nature","Hidden Contrast","Personality Mirror","Ideal Partner","Career Path"],
    premCopy: "Understand yourself first — then truly win in relationships.\nNot a virtual partner. Not personality content. Your AI strategist for real human connections.\nPersonalized relationship decisions based on your personality data.",
    back: "← Back",
    herName:    "Her name",
    herNamePH:  "A name, or a nickname only you know",
    herAvatar:  "Photo",
    myAvatar:   "My photo",
    meLabel:    "Me",
    uploadPh:   "+ Upload Photo",
    zodPH:      "Select Zodiac",
    clLabel:    "Chat logs",
    clHint:     "Exported text works best",
    clApps:     "WeChat / Instagram / iMessage / WhatsApp / LINE",
    clFormats:  ".txt  /  .json  /  .csv  /  .html",
    dropHint:   "Drop files here, or click to select",
    localHint:  "All data processed locally, never uploaded",
    exportGuideQ: "How to export chat logs?",
    exportGuide: [
      { label: "WeChat (Mac)", steps: ["WeChat → bottom-left avatar → Backup & Restore → Backup to Computer", "Download WeChatMsg (search GitHub for WeChatMsg)", "Use WeChatMsg to export the backup as .txt"] },
      { label: "WeChat (Windows)", steps: ["Download WeChatMsg (search GitHub for WeChatMsg)", "Follow the tool's guide to export chat logs as .txt"] },
      { label: "WeChat (Mobile)", steps: ["Open conversation → ··· top-right → Chat History → Export", "Choose export as file, send to your computer"] },
      { label: "WhatsApp", steps: ["Open conversation → ··· top-right → More → Export Chat", "Choose 'Without Media', save as .txt"] },
      { label: "iMessage (Mac)", steps: ["Open Messages app → select conversation", "File → Export as PDF, or select all → copy → paste into a .txt file"] },
      { label: "Instagram / LINE / Other", steps: ["Screenshot or copy chat content, paste into a .txt file and upload"] },
    ],
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
    typing: "Typing...",
    share: "Share", cs: "Wish List",
    csTitle: "Wish List", csSub: "Got a feature idea? Drop it in. We read everything.",
    csPH: "I wish Revery could…", csSubmit: "Wish", csSuccess: "Wish received", csSuccessSub: "We're reading. Thank you.", csAgain: "Make another wish",
    shareTitle: "Share Revery", shareCopy: "Copy Link", shareCopied: "Copied!",
    regTitle: "Create Account", regSub: "Unlock Distill & Apply",
    regName: "Name", regEmail: "Email", regPw: "Password (6+ chars)", regSubmit: "Create Account",
    regPrivacy: "I agree to Revery Labs'", regPrivacyLink: "Privacy Policy and Data Sharing Terms",
    paywallTitle: "Unlock Full Access", paywallSub: "Pay after your assessment to use Distill & Apply",
    wxMaintTitle: "WeChat Pay Under Maintenance", wxMaintSub: "WeChat Pay is currently under maintenance. Please use card payment or try again later.", wxMaintBack: "Go back",
    loginBtn: "Sign in", loginTitle: "Welcome back", loginSub: "Sign in to your account",
    loginEmail: "Email", loginPw: "Password", loginSubmit: "Sign in",
    loginError: "Incorrect email or password", loginNoAcc: "No account? Complete assessment and pay to register",
    acctTitle: "Account", acctMember: "Paid Member", acctLogout: "Sign out",
    acctSection: "Account", acctRegDate: "Membership",
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

  const prompt = `以下是聊天记录。请提取三部分内容：

一、${subjectDesc}的说话风格（8-12条，每条单独一行，要具体不要笼统）：
必须覆盖：标点习惯（几乎不用/偶尔用/爱用什么，具体举例）、句子长短偏好（单字/短句/长句，给出典型例子）、口头禅与语气词（具体词汇如"哈哈""嗯""啊""吧"等）、情绪表达方式（如何撒娇/冷淡/开心/不满）、用词风格（口语vs书面、网络词汇）、最有辨识度的语言特征

二、聊天中的重要信息（8-12条，每条单独一行）：
包括：双方关系和称呼方式、双方日常/工作/生活细节、重要事件和约定、反复出现的话题、共同的梗/暗语/习惯、情感状态和关系进展

三、${subjectDesc}说过的原话摘录（6-10句，每句单独一行，直接引用原文不加引号）：
优先选取最能体现其标点用法、句子长短、语气词、口头禅的原句

格式（保留标题行，不加其他解释）：
[说话风格]
（一条特征）

[重要记忆]
（一条记忆）

[原话摘录]
（一句原话）

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
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) return "";
  const data = await response.json();
  return data.content[0].text;
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
            fontSize: segFontSize ?? (sm ? "13px" : "15px"), letterSpacing: "0.04em",
            cursor: dis ? "not-allowed" : "pointer",
            color: val === o.v ? "white" : th.dim,
            opacity: dis ? 0.35 : 1,
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
const WishIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
    <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
  </svg>
);

// ─── PAYWALL MODAL ────────────────────────────────────────────────────────────
function PaywallModal({ show, onClose, onPay, th, t }) {
  const [wxMaint, setWxMaint] = useState(false);
  const handleClose = () => { setWxMaint(false); onClose(); };
  return (
    <Modal show={show} onClose={handleClose} th={th}>
      {wxMaint ? (
        <>
          <div style={{ textAlign: "center", fontSize: 28, marginBottom: 10 }}>🔧</div>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 8, textAlign: "center" }}>{t.wxMaintTitle}</div>
          <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS, marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>{t.wxMaintSub}</div>
          <button onClick={() => setWxMaint(false)} style={{ width: "100%", padding: "12px 0", background: "transparent", border: `1px solid ${th.border}`, borderRadius: 7, color: th.text, fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>{t.wxMaintBack}</button>
        </>
      ) : (
        <>
          <div style={{ fontFamily: SANS, fontSize: 20, fontWeight: 700, color: th.text, marginBottom: 6 }}>{t.paywallTitle}</div>
          <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS, marginBottom: 24, lineHeight: 1.6 }}>{t.paywallSub}</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => window.open("https://buy.stripe.com/test_7sYeVecaCgpYfIicuwfYY00", "_blank")} style={{ flex: 1, padding: "12px 0", background: "#635BFF", border: "none", borderRadius: 7, color: "white", fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>{t.payCard}</button>
            <button onClick={() => setWxMaint(true)} style={{ flex: 1, padding: "12px 0", background: "#07C160", border: "none", borderRadius: 7, color: "white", fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>{t.payWX}</button>
          </div>
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
Revery Labs 使用 Anthropic API 提供 AI 分析功能。你上传的内容摘要会通过 Anthropic 的服务器进行处理。Anthropic 有其独立的隐私政策，详见 anthropic.com/privacy。

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
Revery Labs uses the Anthropic API to power AI analysis. Summaries of your uploaded content are processed through Anthropic's servers. Anthropic maintains its own privacy policy at anthropic.com/privacy.

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
  const [lang, setLang] = useState("zh");
  if (!show) return null;
  const lines = PRIVACY[lang].split("\n");
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 3000, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: th.surface, border: `0.5px solid ${th.border}`, borderRadius: 14, padding: "28px 28px 24px", maxWidth: 480, width: "92%", maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["zh", "en"].map((l) => (
              <button key={l} onClick={() => setLang(l)} style={{ padding: "4px 12px", border: `0.5px solid ${lang === l ? CRIMSON : th.border}`, borderRadius: 20, background: lang === l ? CRIMSON : "transparent", color: lang === l ? "white" : th.dim, fontSize: 12, fontFamily: SANS, cursor: "pointer" }}>
                {l === "zh" ? "中文" : "EN"}
              </button>
            ))}
          </div>
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
function Header({ page, onNavChange, dark, setDark, lang, setLang, th, t, isPaid, persona, onPaywall, user, onLogin, onAccount }) {
  const [showShare, setShowShare] = useState(false);
  const [showCS,    setShowCS]    = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [wishText,  setWishText]  = useState("");
  const [wishSent,  setWishSent]  = useState(false);
  const isMobile = useIsMobile();

  const navOpts = t.nav.map((l, i) => ({ v: ["assess", "distill", "app"][i], l }));
  const mFont   = lang === "en" ? SANS : MONO;

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

  const iconBtns = (compact) => {
    const s = compact ? { width: 36, height: 30, fontSize: 13 } : {};
    const userInitial = (user?.name || user?.email || "")[0]?.toUpperCase();
    return (
      <>
        <IconBtn onClick={() => setLang((l) => (l === "zh" ? "en" : "zh"))} th={th} font={SANS} style={{ ...s, minWidth: 42 }}>
          {lang === "zh" ? "EN" : "中"}
        </IconBtn>
        <IconBtn onClick={() => setDark((d) => !d)} th={th} font={SANS} style={{ ...s, fontSize: compact ? 15 : 18, paddingBottom: compact ? 1 : 3 }}>
          {dark ? t.light : t.dark}
        </IconBtn>
        <IconBtn onClick={() => setShowCS(true)} th={th} font={SANS} style={s}><WishIcon /></IconBtn>
        <IconBtn onClick={handleShare} th={th} font={SANS} style={s}>{copied ? "✓" : <ShareIcon />}</IconBtn>
        {user ? (
          <button onClick={onAccount} style={{ width: compact ? 30 : 34, height: compact ? 30 : 34, borderRadius: "50%", background: CRIMSON, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: compact ? 12 : 13, fontWeight: 700, color: "white", fontFamily: SANS }}>{userInitial}</span>
          </button>
        ) : (
          <IconBtn onClick={onLogin} th={th} font={SANS} style={{ ...s, minWidth: 42, fontSize: compact ? 11 : 12 }}>
            {t.loginBtn}
          </IconBtn>
        )}
      </>
    );
  };

  return (
    <>
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", background: th.surface, borderBottom: `0.5px solid ${th.border}`, flexShrink: 0, zIndex: 10, position: "relative" }}>
          {/* Row 1: compact logo + icon buttons */}
          <div style={{ height: 52, display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 3 }}>
              <img src="/logo.png" alt="" style={{ height: 48, width: "auto", display: "block" }} />
              <div style={{ fontSize: 20, lineHeight: 1 }}>
                <span style={{ fontFamily: SERIF_LOGO, fontStyle: "italic", fontWeight: 700, color: CRIMSON }}>Revery</span>
                <span style={{ fontFamily: "Arial, 'Helvetica Neue', sans-serif", color: th.mid, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", marginLeft: 6 }}>LABS</span>
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 6 }}>{iconBtns(true)}</div>
          </div>
          {/* Row 2: nav */}
          <div style={{ display: "flex", justifyContent: "center", padding: "6px 14px 10px" }}>
            <Seg opts={navOpts} val={page} onChange={onNavChange} th={th} font={mFont} sm
              disabledVals={disabledVals}
            />
          </div>
        </div>
      ) : (
        <div style={{ height: 72, display: "flex", alignItems: "center", padding: "0 28px", borderBottom: `0.5px solid ${th.border}`, background: th.surface, flexShrink: 0, gap: 14, zIndex: 10, position: "relative" }}>
          {/* Logo */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
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
          <div style={{ flexShrink: 0 }}>
            <Seg opts={navOpts} val={page} onChange={onNavChange} th={th} font={mFont}
              disabledVals={disabledVals}
            />
          </div>
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

      {/* Wish modal */}
      <Modal show={showCS} onClose={() => { setShowCS(false); setTimeout(() => { setWishText(""); setWishSent(false); }, 300); }} th={th}>
        <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 700, color: th.text, marginBottom: 4 }}>{t.csTitle}</div>
        <div style={{ fontSize: 13, color: th.mid, fontFamily: SANS, marginBottom: 18, lineHeight: 1.5 }}>{t.csSub}</div>
        {wishSent ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🪔</div>
            <div style={{ fontFamily: SANS, fontSize: 16, fontWeight: 700, color: th.text, marginBottom: 6 }}>{t.csSuccess}</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: th.mid, marginBottom: 20 }}>{t.csSuccessSub}</div>
            <button onClick={() => { setWishText(""); setWishSent(false); }} style={{ background: "none", border: `1px solid ${th.border}`, borderRadius: 8, padding: "8px 18px", fontFamily: SANS, fontSize: 13, color: th.mid, cursor: "pointer" }}>{t.csAgain}</button>
          </div>
        ) : (
          <>
            <textarea
              value={wishText}
              onChange={e => setWishText(e.target.value.slice(0, 200))}
              placeholder={t.csPH}
              rows={4}
              style={{ width: "100%", boxSizing: "border-box", fontFamily: SANS, fontSize: 14, color: th.text, background: th.card, border: `1px solid ${th.border}`, borderRadius: 10, padding: "12px 14px", resize: "none", outline: "none", lineHeight: 1.6 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
              <span style={{ fontSize: 11, color: th.dim, fontFamily: MONO }}>{wishText.length}/200</span>
              <button
                onClick={() => { if (wishText.trim()) { setWishSent(true); saveWish(wishText.trim(), lang); } }}
                disabled={!wishText.trim()}
                style={{ background: wishText.trim() ? CRIMSON : th.border, color: wishText.trim() ? "white" : th.dim, border: "none", borderRadius: 8, padding: "9px 20px", fontFamily: SANS, fontSize: 14, fontWeight: 600, cursor: wishText.trim() ? "pointer" : "default", transition: "background 0.2s" }}
              >{t.csSubmit}</button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

// ─── ASSESS DATA ──────────────────────────────────────────────────────────────
const SECTION_KEYS = ["core", "contrast", "mirror", "partner", "career"];
const MBTI_OPTIONS = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP","ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];
const ENNEA_OPTIONS = ["1w9","1w2","2w1","2w3","3w2","3w4","4w3","4w5","5w4","5w6","6w5","6w7","7w6","7w8","8w7","8w9","9w8","9w1"];
// ── Quiz modular content (4×4×4×4 = 256 unique profiles) ─────────────────────
const QUIZ_CONTENT = {
  zh: {
    nameAdj:    ["佛系", "克制", "沉浸", "痴迷"],
    namePrefix: ["冷静", "低烧", "确诊", "重症"],
    nameSuffix: ["理智体", "观察期", "恋爱脑", "监护室"],
    taglineA: [
      "感情里保有独立重心的人——本院样本库存量极低，已列为濒危",
      "隐性在意型——外表在线，内心挂机",
      "全面监测型——每一条消息都是情报",
      "战略备战型——随时可以行动，随时在等最佳时机",
    ],
    taglineB: [
      "——濒危物种，本院已申请保护",
      "——轻症，建议定期复查",
      "——本院正式确诊，请签字画押",
      "——已超出本院诊断范围，建议转介",
    ],
    core: [
      "情感独立型。感情在生活中占比正常，未触发紧急响应机制，后台无持续监测进程。本院评估：情感操作系统运行稳定，资源分配合理，未见异常耗能。补充说明：自主来院接受恋爱脑诊断的患者中，真正做到情感独立的比例极低。本院倾向认为这是一个值得记录的数据点，而不是终点。",
      "隐性在意型。外表正常运转，内部已开辟独立线程专门处理此人，耗能中高，前台继续维持正常显示。本院评估：伪装成功率尚可，但后台资源占用量已超出「随便看看」的合理解释范围。性能画像：情感计算密集，内存占用持续升高，散热略显不足。建议定期检查后台进程。",
      "全面监测型。对方动态已进入感知优先队列，大脑后台持续运行分析程序，前台仍维持正常显示。本院诊断：恋爱脑中期，数据采集阶段，信噪比下降明显。系统诊断：前台任务延迟上升，对方相关信号优先级已被自动提升至最高，当前处于高负载运行状态。",
      "战略备战型。焦虑的最高形态：已转化为系统性行动预案，配备多线程情景模拟与实时风险评估模块。外表最从容，内部最精密。本院命名：高功能恋爱脑。病情：严重。执行力：优秀。本院注意到：功能越高的恋爱脑，越难被外部识别——这既是保护机制，也是延误就诊的主要原因。",
    ],
    contrast: [
      "标点免疫型。对方发什么，读的就是字面意思，无自动解读层，无语气推断模块。本院评估：要么是真正的情感自主，要么是标点敏感阶段尚未激活——两种情况本院均已收录，均值得持续观察。运行日志：语义解析引擎负荷极低，信号处理效率高，但可能漏掉部分有效信号。",
      "信号初始化型。情感雷达已上线，正在建立基准参考系，微小的语气变化已进入可感知范围。本院评估：解读系统启动中，校准阶段，尚未形成完整数据库。系统状态：对方信息开始接受自动标注，主观解读权重逐步上升，客观判断权重相应下降。预计进入稳定监测阶段：若干条消息之后。",
      "历史对比型。已建立参考数据库，对当前信号进行横向比对，可识别半个标点的差异。精度极高，副作用：很难真的放松。本院评估：中度确诊，进入数据积累期。系统诊断：历史记录已被主动调取，比对算法持续运行，对方用词变化已纳入情感趋势模型。这不是多心，是有数据支撑的推断。",
      "完整解码型。标点、语速、用词、发送时间均已纳入情感语义系统，并与历史基线持续比对。本院评估：这不是喜欢，这是田野调查——自发的、系统的，且研究对象尚不知情。本院郑重声明：此诊断不含批评，我们只是如实记录。此精度若重新定向，在数据分析领域具有压倒性优势。",
    ],
    mirror: [
      "边界感知独立型。对方的社交行为未触发预警机制，感情重心稳固，未见监测行为。本院保留一项观察：此类表现与「还没到在意程度」在外部特征上高度重叠，难以区分。两种可能性均已录入数据库，处理方式：继续观察，暂不定性。建议患者自行对照，选择更接近真实的那一项。",
      "克制观察型。会注意，但不深入。理性与情感处于动态平衡，偶有信息采集行为，保持在可管理范围内——至少患者本人如此认为。本院注意到：「我只是顺手看了一眼」这一表述在本类型患者中出现频率显著高于对照组。克制是真实的；克制的对象，也是真实的。",
      "深度追踪型。对方社交动态已列为定期监测对象，知情权意识强烈，信息采集频率稳定偏高。本院注意到：信息越多，越依赖信息，已形成正反馈循环。系统诊断：监测深度已超出「好奇」的合理阈值，进入结构性关注阶段。本院建议：将此调研能力迁移至职业场景——目前处于免费输出状态，略显浪费。",
      "情报系统型。调研深度已达专业水准，分析维度覆盖历史动态、关联人员及趋势预判，具备完整情报生产能力。本院评估：此能力迁移至职业领域价值极高——用户研究、竞品分析、信息综合，全部适用。目前全部处于免费输出状态。本院正式建议：找到方向，定价，对外。",
    ],
    partner: [
      "元认知：游走型。自述动机模糊，但读完了全文，未在任何题目处放弃。本院观察：随机进入、却坚持读完的患者，通常是自我认知尚未完成语言化的一类——知道有什么，只是还没找到词。处方：继续观察自己。模糊感本身也是一种数据，不需要急着定义。",
      "元认知：外部触发型。需要外部镜像辅助定位自我状态——这是社会性认知的典型路径，并非弱点。本院评估：能接受外部反馈并进行自我校准，是高级认知能力的表现。处方：那位发给你测评的朋友，比你更早看清了你。这种人值得珍惜——他们是你的外部传感器，请好好维护这段关系。",
      "元认知：数据驱动型。以量化替代模糊感受，以坐标代替漂移状态——这是高功能焦虑者的标准应对策略，本院评价：有效。处方：你现在有了坐标。知道自己在哪里，不等于知道该往哪走，但它消除了「不知道自己在哪里」的耗能。接下来怎么用这份数据，是你的事。",
      "元认知：高度清醒型。本院见过最自知的就诊动机。你知道自己在哪里，你来是因为你需要一份有格式的外部确认。处方：这份确认，现在正式出具。补充说明：高度清醒并不会减轻症状，但它确实让你在同等病情下比其他患者多一份主动权。这已经很重要了。",
    ],
    career: [
      "情绪管理能力极强，职场谈判中属于「看不出来在想什么」型——这是稀缺的结构性优势。不泄露、不急迫、让对方先开牌——这一套在感情里你用得很无奈，在职场里是降维打击。本院正式建议：把它用在应该用的地方，回报率截然不同。",
      "「撑得住但心里有数」——职场叫战略克制，是比「知道什么时候该动」更难得的能力：知道什么时候该等。你已经掌握了这一套，比大多数同龄人早学会十年。本院建议：不要在错误的人身上消耗这种克制，它在职场里的回报率高得多。",
      "研究一个人的那股劲——系统性的、持续的、注重细节——放在用户洞察、竞品分析和市场研究上，是公司花钱招不来的。你的问题从来不是能力，是方向。本院正式建议：把这套方法论对准一个能给你付钱的方向，回报率会让你惊讶。",
      "万事准备好再行动，职场叫「不打无准备之仗」——看起来慢，落点准，失误率极低。你草拟了所有预案，模拟了所有场景——在需要精准判断的职业场景里，这是压倒性优势。建议：把这个习惯对准更值得它的目标。长期主义者的轨迹，市场最终都会认可。",
    ],
    doctorNote: [
      "患者呈现出本院罕见的情感独立状态，各项指标未见异常激活。本院记录：自主来院接受恋爱脑诊断的患者中，真正不在意的极少——多数属于「不在意」与「还不到在意程度」之间的过渡态，外部特征高度相似。建议患者自行对照，择一信之。本院不做强制定性。",
      "患者情感系统进入隐性待机模式：表面正常运转，内部运算持续进行，资源占用量高于基线。本院将此定义为「表演性放松」，是恋爱脑早中期的标准呈现形式。评估结论：伪装成功率尚可，但后台进程已可被本院检测仪器识别。病程预估：持续至当前关系明朗化为止，或直至患者主动重启系统。",
      "患者信号接收系统处于高度活跃状态，存在显著的解读偏向性——倾向于将中性信号赋予超出统计均值的情感含义。本院诊断：恋爱脑中期，感知精度过剩，校准需求迫切。系统日志显示：信号处理优先级已自动上调，理性审查层权重下降，确认偏差模块活跃。建议定期重新校准感知基线。",
      "患者应对机制已从被动等待切换至主动预案模式，具备完整的场景模拟与风险评估功能。高功能恋爱脑特征：焦虑程度与执行力正相关，外表平静与内部精密同步提升。本院最终评估：这是本院接诊过的最复杂的「看起来没事」。执行档案评级：A+。治疗难点：患者可能比医生更早预判到任何干预措施。",
    ],
  },
  en: {
    nameAdj:    ["Dormant", "Guarded", "Submerged", "Fixated"],
    namePrefix: ["Stable", "Low-Grade", "Diagnosed", "Critical"],
    nameSuffix: ["Rational", "Watch", "Love Brain", "ICU"],
    taglineA: [
      "Didn't notice. (This clinic has thoughts about that.)",
      "Checked the chat. Didn't text.",
      "Pulled up his last message. Studied the wording.",
      "An opener drafted. Still unsent. Optimal timing: pending.",
    ],
    taglineB: [
      " — endangered specimen, under clinical observation",
      " — mild case, follow-up recommended",
      " — officially confirmed, please sign and date",
      " — beyond clinic scope, referral issued",
    ],
    core: [
      "Emotional independence type. Love registers at normal system weight — no emergency protocols engaged, no persistent monitoring threads active. Clinic assessment: emotional operating system stable, resource allocation normal, no anomalous energy draw detected. Supplemental note: among patients who self-present for a Love Brain Diagnostic, the proportion who are genuinely emotionally independent is statistically very low. This clinic treats the appearance here as a data point, not a conclusion.",
      "Covert attachment type. External display: normal. Internal threads dedicated to this individual: active, running at medium-high load, while the surface continues presenting normally. Clinic assessment: disguise success rate adequate; however, background resource consumption already exceeds what 'not that interested' can plausibly explain. Performance profile: emotionally compute-intensive, memory allocation rising, heat dissipation insufficient. Recommend monitoring background processes.",
      "Full-monitoring type. Subject has entered active awareness priority queue. Background analysis program: continuously running. Signal-to-noise ratio: declining. Clinical diagnosis: mid-stage love brain, data accumulation phase. System report: foreground task latency increasing; subject-related signals have been automatically elevated to highest system priority. Current status: operating under high load.",
      "Strategic contingency type. Anxiety converted into systematic action planning — equipped with multi-thread scenario simulation and real-time risk assessment modules. Externally: most composed. Internally: most precise. Clinical designation: high-functioning love brain. Severity: significant. Execution: excellent. Pattern noted: the more high-functioning the love brain, the harder it is to detect externally — which is both a protective mechanism and the primary reason for delayed presentation.",
    ],
    contrast: [
      "Signal-agnostic type. Receives communications at face value — no auto-complete interpretation layer, no tone inference module active. Clinic assessment: either genuine emotional self-sufficiency, or the signal-sensitivity phase has simply not yet activated. Both possibilities are recorded. Processing log: semantic parsing engine running at minimal load, high efficiency. Possible side effect: some valid signals may be missed.",
      "Baseline-calibrating type. Emotional radar is online. Establishing reference parameters; minor tonal variations are entering detectable range. Clinic assessment: interpretation system initiating, calibration phase, full database not yet established. System status: incoming messages have begun receiving automatic annotation; subjective weighting is rising as objective review weighting proportionally declines. Estimated time to stable monitoring phase: a number of messages from now.",
      "Historical-comparative type. Reference database established. Current signals undergoing cross-analysis with prior data. Precision: high — capable of detecting sub-punctuation variations. Side effect: genuine relaxation is difficult. Clinic assessment: mid-stage, confirmed. System diagnosis: historical records are being actively retrieved, comparison algorithm running continuously, subject's word choice changes integrated into the emotional trend model. This is not overthinking. This is inference with supporting data.",
      "Full-decoding type. Punctuation, response speed, word choice, send timing — all integrated into the emotional semantic framework, continuously compared against historical baseline. Clinic assessment: this is not affection anymore. This is fieldwork — voluntary, systematic, and the subject of the research is unaware a study is occurring. This clinic formally notes: the diagnostic does not contain criticism. We are only accurately recording. Patients who achieve this precision have overwhelming advantages in data analysis if redirected.",
    ],
    mirror: [
      "Perimeter-independent type. Subject's external social behavior has not triggered alert protocols. Emotional center: stable. No monitoring behavior detected. Clinic note: this presentation is externally indistinguishable from 'not yet invested enough to notice' — the two share virtually identical external features. Both possibilities are recorded. Protocol: continued observation, no definitive classification at this time. Patient is invited to select the more accurate description.",
      "Restrained-observer type. Will notice; will not investigate deeply. Rational-emotional balance: dynamic equilibrium, currently maintained. Information-gathering behavior: occasional, within manageable range — at least, that is the patient's current self-assessment. Clinic note: the phrase 'I just happened to look' appears in this patient type at a frequency significantly above the control group average. The restraint is real. So is the thing being restrained.",
      "Deep-tracking type. Subject's social activity is now classified as a recurring monitoring target. Information-gathering frequency: stable, elevated. Observed pattern: more data increases reliance on data — positive feedback loop confirmed. System diagnosis: monitoring depth has exceeded the plausible threshold for casual curiosity; structural investment phase is active. Clinic recommendation: this research capacity, redirected professionally, would be commercially valuable. Currently operating as free output.",
      "Intelligence-system type. Research depth has reached professional grade. Analysis covers historical activity, associated individuals, and trend projection — full intelligence production capability confirmed. Clinic assessment: this capability, redirected to user research, competitive intelligence, or data synthesis, commands significant professional value. Current allocation: entirely free output. Formal clinic recommendation: identify a direction, set a price, and deploy.",
    ],
    partner: [
      "Metacognition: wandering. Stated motivation unclear; completed full assessment regardless, without abandoning at any question. Clinic observation: patients who report random entry but remain through all four questions are a recognizable subtype — they sense something is present but haven't found language for it yet. Prescription: continue observing yourself. The vague feeling is itself data. No urgency to define it.",
      "Metacognition: externally triggered. Required external input to locate internal state — a standard social cognition pathway, not a weakness. Clinic assessment: the ability to receive external feedback and self-calibrate is a sign of advanced cognitive function. Prescription: the friend who sent you this test understood you before you did. That person is worth protecting — they function as an external sensor for you. Maintain the relationship.",
      "Metacognition: data-driven. Seeks quantification over vague discomfort — the standard coping strategy of high-functioning anxious people, and an effective one. Prescription: you now have coordinates. Knowing where you are doesn't automatically tell you where to go — but it eliminates the energy cost of not knowing where you are. What you do with the data from here is yours. This clinic's obligation ends here.",
      "Metacognition: fully conscious. The most self-aware presenting complaint this clinic has received. You knew where you were before you arrived. You came because you needed a formatted external confirmation. Prescription: the confirmation is formally issued. Supplemental note: full awareness does not reduce severity of symptoms, but it gives you one degree of agency that other patients at the same stage do not have. That matters.",
    ],
    career: [
      "Emotional self-regulation under pressure is called high-stakes composure in professional contexts, and it is structurally rare. The hardest person to read at the negotiating table is the one who never looks affected — you hold the informational advantage. This skill: not leaking, not rushing, letting the other side move first — in relationships you deploy it to painful effect; in professional settings it is a decisive edge. Recommendation: redirect it.",
      "'Appearing unbothered while tracking everything' is called strategic restraint at work — and knowing when to wait is rarer and more valuable than knowing when to move. You have already learned this. Most people don't learn it for another decade. Recommendation: stop spending this resource on the wrong targets. The return on investment in professional contexts is substantially higher.",
      "The same intensity applied to analyzing a person — systematic, sustained, detail-oriented — is exactly what companies recruit for in user research, competitive intelligence, and market analysis, and rarely find to this degree. The problem has never been capability. It's direction. Formal recommendation: point this methodology at something that pays. The ROI will surprise you.",
      "Preparing completely before acting is called 'no such thing as an unprepared meeting' in professional terms. Looks slow. Lands accurately. Failure rate: minimal. You drafted all the contingency plans, simulated all the scenarios — in the right professional context, this is an overwhelming competitive advantage. Recommendation: deploy this habit against targets that deserve it. The long-game winner's profile is recognized by the market, eventually.",
    ],
    doctorNote: [
      "Patient reports emotional non-engagement; all monitored indicators within normal range. Clinic records: among patients who self-select a Love Brain Diagnostic, the proportion who are genuinely unaffected is statistically very low — most occupy a transitional state between 'not interested' and 'not yet invested enough to register,' which are externally identical. This clinic does not force a classification. Patient is invited to select the more accurate description.",
      "Patient's emotional system has entered covert standby mode: surface presentation normal, internal processing continuous, resource consumption above baseline. Clinic classification: performed relaxation — the standard presentation of early-to-mid stage love brain. Assessment: disguise success rate adequate, but background processes are detectable by this clinic's instruments. Projected course: continues until the current relational ambiguity resolves, or until the patient initiates a system restart.",
      "Patient's signal reception system is operating at significantly elevated sensitivity, with observable attribution bias — tendency to assign above-average emotional significance to neutral inputs. Diagnosis: mid-stage love brain, excess perceptual precision, recalibration urgently recommended. System log: signal processing priority has been automatically elevated, rational review layer weighting has declined, confirmation bias module is active. Recommend re-establishing perceptual baseline.",
      "Patient has transitioned from passive waiting to active contingency mode, with full scenario simulation and risk assessment capability, displaying characteristic high-functioning love brain presentation: anxiety and execution capacity positively correlated, external calm and internal precision rising in tandem. Final clinic assessment: this is the most complex 'looks fine' this clinic has encountered. Executive function rating: A+. Treatment note: patient will likely have anticipated any possible intervention before it is proposed.",
    ],
  },
};

// ── MBTI content (16 types) ───────────────────────────────────────────────────
const MBTI_CONTENT = {
  zh: {
    INTJ: { nameTag:"战略构建者", nameRoot:"战略", tagline:"你比别人早几步看到终局", core:"你的大脑是一台永远在跑的战略机器——你比别人早几步看到终局，但你很少解释你的想法，因为过程太长了，你更想直接给答案。这不是傲慢，是效率。", contrast:"你对情感信号的解读往往比你说出来的要精准得多——你已经看到了，只是还在等确认。这种内敛的洞察力，让你在感情上比任何人都更能做出精准的判断。", mirror:"你在关系里的独立感，不是冷漠，是一种很高的自我认知——你知道你需要什么，也知道什么是不可妥协的。这份清醒，是一种稀缺的情感智慧。", partner:"你需要一个能在智识上让你持续尊重的人——不是让你感觉「好吧差不多」，而是越了解越觉得值得深入。", career:"给你一个复杂的问题、足够的时间和自主权，你能拿出别人想都没想到的解法。任何需要远见和独立判断的领域，都是你的主场。" },
    INTP: { nameTag:"系统拆解者", nameRoot:"系统", tagline:"你在别人觉得够了的地方，发现了真正重要的问题", core:"你对世界的理解方式是拆开来看——原理是什么、逻辑在哪里、哪个假设是错的。你在大多数人觉得「差不多就行了」的地方，发现了真正重要的问题。", contrast:"你在感情里的思维深度往往让对方感觉到被认真对待——你不是随便走流程的人，你真的在想这段关系是什么。这种认真，比很多表面的热情更有重量。", mirror:"你对关系里的逻辑和一致性很敏感——你不喜欢矛盾和说不通的地方。这不是挑剔，是你对真实的高标准，它会保护你不陷入错误的关系。", partner:"你需要一个禁得住和你深聊的人——不会在你深入问问题的时候感到被审问，而是真的有东西可以探讨、有来有往。", career:"分析、研究、系统设计——任何需要从头想清楚的问题都是你的主场。你的核心优势是：你不会被表面答案满足，而这在关键问题上是决定性的。" },
    ENTJ: { nameTag:"目标驱动者", nameRoot:"目标", tagline:"你不等资源，你创造资源", core:"你天生知道怎么带着一群人朝着一个目标走——不是因为你喜欢发号施令，是因为你能清楚地看到怎么做是对的，然后让所有人也看到。", contrast:"你在感情里的主动和决断，往往让对方感觉到被引领——你不会在模糊里耗很久，你会把话说清楚，把方向定下来。这种清晰，在感情里是稀缺品。", mirror:"你在关系里是那个更容易先说出「我在乎这段关系」的人——不是软弱，是你有足够的自信让自己先开口，因为你不需要靠「谁先表态」来确认自己的价值。", partner:"你需要一个有自己方向的人——不会在你强大的气场下消失，有自己的想法，有时候还能推着你走。", career:"领导力、战略、创业——你在任何需要「把事情做成」的赛道里都有天然优势。你不是等资源的人，你是创造资源的人。" },
    ENTP: { nameTag:"思维颠覆者", nameRoot:"思维", tagline:"你提出的问题，比大多数人的答案更有价值", core:"你有一种天然的反叛精神——不是为了反对而反对，是因为你真的能看到既有答案的漏洞，然后找到更有趣的解法。你让所有对话都变得更刺激了。", contrast:"你在感情里最有魅力的时刻，往往是你说出了别人想都没想到的角度。这种新鲜感和惊喜，让和你在一起的人感觉每次聊天都是值得期待的体验。", mirror:"你在关系里需要一定的自由度——不是逃避承诺，是你的思维需要空间。给你足够空间的人，会得到你全部的回应和忠诚。", partner:"你需要一个能接住你跳跃式思维的人——不会在你突然转换话题的时候感到困惑，而是能跟得上、甚至推着你往更有趣的方向走。", career:"创业、咨询、产品、创意策略——任何需要颠覆性思维的赛道都需要像你这样的人。你的价值在于你永远能提出别人没问过的问题。" },
    INFJ: { nameTag:"深度共鸣者", nameRoot:"共鸣", tagline:"你对人的理解，往往深于你的表达", core:"你对人的理解往往深于你的表达——你在一个人身上看到的层次，比他们自己意识到的更多。这让你成为一个极少数的、真正能理解别人的那种人。", contrast:"你在感情里给出的，往往比你展示出来的更多——你的爱是沉默的、持续的。你以为是普通，其实是珍稀，能感知到的人才值得你给。", mirror:"你的共情力有时候会让你比对方更早感受到关系的变化——你看到了，但你不一定说出口。学会开口，是你在感情里最重要的一步。", partner:"你需要一个愿意慢慢走进你的人——不期待一夜之间就「懂你」，但真的有兴趣，真的在靠近，而且接住你给出的那份深度。", career:"咨询、心理、写作、教育——任何需要深度理解人的工作都在召唤你。你的洞察力，是这些领域里最核心的稀缺资源。" },
    INFP: { nameTag:"理想守护者", nameRoot:"理想", tagline:"当别人在顺从世界的形状时，你在保持自己的", core:"你有一套非常清晰的内心价值观——不是抽象的原则，是真实影响你每个决定的东西。当别人在顺从世界的时候，你在悄悄保持你自己的形状。", contrast:"你在感情里最大的礼物，是你的真实——你不表演、不迎合、不假装。对的人会感觉到这份真实是罕见的，然后珍视它。", mirror:"你对意义的追求延伸到关系里——你不只是想在一起，你想要这段关系是有意义的。这种深度，让你成为一个极难得的伴侣候选人。", partner:"你需要一个不会因为你「想太多」就皱眉的人——反而觉得这就是你最好的部分，然后愿意跟你一起进入那个深度。", career:"创作、设计、教育、心理——任何需要用真实的自我去影响别人的赛道，都是你最有战斗力的地方。你的真实，是最强的竞争壁垒。" },
    ENFJ: { nameTag:"影响力燃点", nameRoot:"引领", tagline:"你让别人感觉到被看见——这比你以为的更稀缺", core:"你有一种天然的能力，能让周围的人感觉被看见、被激励——不是因为你在表演热情，是因为你真的在乎，而且知道怎么把这份在乎传递出去。", contrast:"你在感情里的给予往往多于你表达出来的——你总是先考虑对方的感受。学会把自己的需求也说出来，是你在关系里最值得做的事。", mirror:"你在关系里是那个把对方照顾得很好的人——但别忘了，好的关系应该是两个人互相照顾的。你值得被同等对待。", partner:"你需要一个真的看见你付出的人——不是理所当然地接受，而是感知到你在做什么，然后用同等的真实来回应你。", career:"领导力、教育、公关、品牌——任何需要调动人心的赛道，你都是天然的主角。你的感召力，在需要凝聚力的时刻是决定性的。" },
    ENFP: { nameTag:"可能性追寻者", nameRoot:"追寻", tagline:"你的热情是真实的，不是表演", core:"你活在可能性里——你总是能看到「如果这样会怎样」，然后真的去试。这让你的生命里充满了大多数人没有的惊喜，也充满了只有你才能带给别人的启发。", contrast:"你在感情里的热情和创造力，是让关系保持活力的秘密武器。你让对方感觉到，在这段关系里永远还有什么值得期待——这比稳定更难得。", mirror:"你对人天然感兴趣——你对每个人都有真实的好奇心。这让你成为一个让对方感觉被特别对待的伴侣，因为你的关注是真诚的，不是礼貌的。", partner:"你需要一个跟得上你的人——不觉得你「太多了」，反而觉得和你在一起每次都有点不一样，而且这个「不一样」是他喜欢的。", career:"创业、创意、品牌、社群——你在需要活力和想象力的赛道里没有对手。你的核心资产是你对世界的真实热情，这是无法复制的。" },
    ISTJ: { nameTag:"稳定基石者", nameRoot:"基石", tagline:"你说到的，你会做到——这比你以为的稀缺得多", core:"你是那种大家知道可以依靠的人——不是因为你没有自己的想法，而是因为你对承诺的理解比大多数人都要认真。你说到的，你会做到。", contrast:"你在感情里的稳定和可靠，是很多人在关系里最缺少的东西。你不会热三天冷四天，你给出的是真实的、持续的在场——这是一种极稀缺的品质。", mirror:"你在关系里表达爱的方式，更多是通过行动而不是言语——你做的事情说明了一切。对的人会看见这些，并且比任何表白都更珍视它。", partner:"你需要一个懂得看行动不只看言语的人——能读懂你默默做的那些事，然后把它理解成爱，而不是理所当然。", career:"运营、财务、法律、管理——任何需要精准和可靠性的赛道，你都有不可替代的位置。你的执行力是许多人最缺乏的能力。" },
    ISFJ: { nameTag:"温暖守护者", nameRoot:"守护", tagline:"你记得别人忘记的细节，因为你真的在乎", core:"你记得别人忘记的细节，你在别人不注意的地方用心——不是因为你想被夸，是因为你就是这样对待在乎的人。这种细腻，在粗糙的世界里非常珍稀。", contrast:"你在感情里的体贴和周到，往往让对方感觉到被照顾得很好。但别忘了偶尔让自己被照顾一下——你也值得被惦记、被呵护。", mirror:"你在关系里的存在感，是那种「有他在就踏实了」的感觉。这种踏实是要付出真实的心力才能给出的，不是随便谁都能做到的。", partner:"你需要一个能看到你默默付出的人——不是因为你需要被夸，而是因为你需要知道你做的这一切被看见了、被珍视了。", career:"医疗、教育、人力、服务——任何需要真实关怀的赛道，都需要你这样的人。你的专注和耐心，是这些领域里最难被复制的核心。" },
    ESTJ: { nameTag:"秩序建构者", nameRoot:"秩序", tagline:"你让混乱的事情变得有序，这是真正的领导力", core:"你对「应该怎么做」有非常清晰的判断，而且你有把这个判断落实成结果的执行力。你让混乱的事情变得有序，让模糊的责任变得清晰——这是领导力的底层能力。", contrast:"你在感情里的直接和清晰，往往让对方感觉到你是认真的——你不拐弯抹角，你把话说清楚。在一些人眼里这太强势，但对的人会感激这份清晰。", mirror:"你在关系里是那个把事情推进的人——你不会让重要的事情就这样悬着，你会主动解决。这种行动力，在感情里是一种罕见的安全感来源。", partner:"你需要一个欣赏你直接、不觉得你强势的人——真正配得上你的人，会把你的坚定看成优点，而不是需要被驯服的东西。", career:"管理、法律、行政、运营——你在任何需要把复杂系统理顺的赛道里都能站稳。你的执行力和对规则的掌握，是很多组织里最稀缺的能力。" },
    ESFJ: { nameTag:"关系编织者", nameRoot:"联结", tagline:"你让一群人感觉像是一个整体——这是极少数人拥有的天赋", core:"你天生知道怎么让一群人感觉像是一个整体——你记得所有人的名字、所有人的状态，你让没人注意到的裂缝在悄悄扩大之前被修好。", contrast:"你在感情里的周到，往往让对方感觉到被很好地照顾——你会记得他们说过的事，会在他们需要之前就准备好。这种细心，是一种极罕见的爱的能力。", mirror:"你在关系里总是先考虑对方的感受——这让你成为一个极好的伴侣，但偶尔也要让自己先被考虑一下。好的关系应该是双向的。", partner:"你需要一个懂得主动照顾你的人——不需要你提示，不需要你暗示，就知道在什么时候来靠近你、关心你。", career:"公关、人力、教育、市场——任何需要让人与人之间的关系产生价值的赛道，你都有先天优势。你的社交智商，是一种极难培训的核心资产。" },
    ISTP: { nameTag:"实战问题者", nameRoot:"实战", tagline:"你的行动比你的分析更有说服力", core:"你在理论结束的地方才开始发力——你不需要反复讨论，你需要动手。你对实际运作的理解往往比任何人都更深，因为你真的去做了，不只是分析。", contrast:"你在感情里的方式往往是通过行动表达——你不擅长说，但你会做。对的人会读懂你的行动语言，并且比言语更信任它。", mirror:"你在关系里需要足够的空间来保持自己——不是距离感，是自主性。给你这个空间的人，会得到你最真实的在场和投入。", partner:"你需要一个不依赖言语表达的人——能和你并肩做事、在共同的经历里建立连接，而不只是靠聊天建立关系。", career:"工程、设计、运营、技术——任何需要直接面对真实问题的赛道，你都有优势。你的动手能力和问题解决本能，是很多「策略」永远追不上的。" },
    ISFP: { nameTag:"感官艺术者", nameRoot:"感知", tagline:"你把美带进日常，这是一种大多数人不自知的天赋", core:"你对美的感知是天然的，而且它影响你生活里所有的选择——你穿什么、待在哪里、和谁在一起。你把美带进日常，而大多数人活在一片灰色里。", contrast:"你在感情里的真实和不将就，是你最稀缺的特质——你不会因为凑合就进入一段关系，你要的是真实的感觉，这种自尊心最终会引领你到对的地方。", mirror:"你在关系里的存在是温柔的、真实的——你不强迫，不表演，你就是你。这种不加修饰的本真，是让对方越来越在乎你的根本原因。", partner:"你需要一个让你感觉「做自己是安全的」的人——在他面前，你不需要调整自己的样子，你本来的样子就已经足够好了。", career:"设计、艺术、创作、用户体验——你在任何需要感知力和审美判断的赛道里都有无法被复制的优势。你的品味，是很多组织缺乏的核心能力。" },
    ESTP: { nameTag:"即时行动者", nameRoot:"行动", tagline:"别人还在分析的时候，你已经在调整策略了", core:"你在当下是最好的——你反应快、判断准、执行力强，你不需要等到一切都想清楚才开始。在别人还在分析的时候，你已经在调整策略了。", contrast:"你在感情里的直接和行动力，往往让对方感觉到你是真的在场的——你不会让事情悬着，你会直接表达、直接行动。这种确定感，是很多人在关系里最渴望的。", mirror:"你在关系里追求的是真实的、当下的连接——不是计划，不是将来，是现在这一刻两个人的状态。这种活在当下的能力，是很多人一辈子都学不会的。", partner:"你需要一个跟得上你节奏的人——不会在你做决定的时候拖后腿，而是能和你一起快速响应、灵活调整。", career:"销售、创业、谈判、运营——任何需要在实时变化里快速决策的赛道，你都有天然的竞争力。你的机动性是一种在慢热环境里很稀缺的东西。" },
    ESFP: { nameTag:"能量场域者", nameRoot:"能量", tagline:"你走进一个空间，气氛就不一样了", core:"你走进一个空间，气氛就变了——不是因为你刻意表演，是因为你天生就能和当下建立连接，而这种连接会传染给周围的人。你让别人感觉到活在当下是什么感觉。", contrast:"你在感情里带来的那股能量和热情，是让关系保持活力的天然燃料。你不会让关系变得沉闷，你让对方感觉和你在一起总是有点意思的。", mirror:"你在关系里的真实和热情，让对方感觉被完全接纳——你不评判，你不保留，你全力以赴地在场。这种全心的投入，是极难遇到的品质。", partner:"你需要一个能接住你能量的人——不觉得你太闹、太多，反而觉得你的活力是让他们生活更好的东西，然后真心欢迎这一切。", career:"娱乐、品牌、销售、教育——任何需要用能量和热情感染他人的赛道，你都是天然的领军人物。你的存在感，是一种训练出来没法复制的东西。" },
  },
  en: {
    INTJ: { nameTag:"Strategic Architect", nameRoot:"Strategic", tagline:"You see the endgame before others have read the setup", core:"Your brain runs a perpetual long-term simulation. You see the endgame before others have read the setup — and you rarely explain your reasoning because the explanation would take longer than just being right. That's not arrogance. That's efficiency.", contrast:"Your read on emotional signals is usually more precise than what you let on — you've already figured it out, you're just waiting for confirmation. That quiet perceptiveness is what makes you accurate in ways others aren't.", mirror:"Your independence in relationships isn't coldness — it's a form of high self-knowledge. You know what you need and what isn't negotiable. That clarity is a rare kind of emotional intelligence.", partner:"You need someone you can keep respecting — not someone you feel vaguely tolerant of, but someone who gets more worth knowing the more you know them.", career:"Give you a hard problem, enough autonomy, and time — and you'll produce solutions people didn't think were possible. Any field rewarding independent strategic judgment is your territory." },
    INTP: { nameTag:"System Dismantler", nameRoot:"Systemic", tagline:"You find the real problem where everyone else settled for good enough", core:"You understand the world by taking it apart — finding the principle, identifying the flawed premise, questioning the assumption everyone accepted. You find the real problem in places where most people settle for good enough.", contrast:"The depth you bring to thinking about a relationship makes the other person feel genuinely considered — you're not going through the motions. That seriousness carries more weight than most surface-level enthusiasm.", mirror:"You're sensitive to contradictions and inconsistencies in a relationship — not out of pickiness, but because your standard for what's real is high. That standard protects you from ending up in the wrong place.", partner:"You need someone who can handle depth — who doesn't feel interrogated when you ask real questions, but engaged. Someone with enough inside them that the conversation stays interesting.", career:"Analysis, research, systems design — anything requiring rigorous first-principles thinking is your home ground. Your edge: you are never satisfied with the surface answer, and that's exactly the layer that matters." },
    ENTJ: { nameTag:"Goal Commander", nameRoot:"Commanding", tagline:"You don't wait for resources — you create them", core:"You know instinctively how to mobilize people toward an objective — not because you enjoy issuing orders, but because you can see what the right move is and make everyone else see it too.", contrast:"Your directness in relationships lets the other person know exactly where they stand — you don't let things fester in ambiguity. For the right person, that clarity is incredibly reassuring.", mirror:"You're usually the one who says 'I care about this' first — not out of vulnerability, but out of confidence. You don't need 'who blinks first' dynamics to feel secure in your own value.", partner:"You need someone with their own direction — who doesn't disappear under your energy, has their own ideas, and occasionally challenges you forward.", career:"Leadership, strategy, entrepreneurship — you have a native advantage in any field that rewards getting things done at scale. You don't wait for resources; you create them." },
    ENTP: { nameTag:"Idea Disruptor", nameRoot:"Disruptive", tagline:"The questions you ask are more valuable than most people's answers", core:"You have a natural instinct to push back — not for its own sake, but because you genuinely see the holes in the accepted answer and want to find a better one. You make every room more interesting.", contrast:"The moments you're most compelling in relationships are when you offer a perspective no one expected. That freshness keeps the other person feeling like conversations with you are always worth having.", mirror:"You need some degree of freedom in a relationship — not to avoid commitment, but because your thinking needs room to breathe. Give someone the space to respect that, and they'll have your full loyalty.", partner:"You need someone who can follow the leaps — who doesn't get lost when you change direction, and can push the conversation to even more interesting places.", career:"Startups, consulting, product, creative strategy — any field rewarding unconventional thinking needs people like you. Your value is the question no one else thought to ask." },
    INFJ: { nameTag:"Deep Empath", nameRoot:"Empathic", tagline:"You understand people at a level they haven't understood themselves", core:"Your understanding of people usually runs deeper than your ability to articulate it — you see layers in someone that they haven't consciously identified in themselves. That makes you one of the rare few who actually understands others.", contrast:"What you give in a relationship usually exceeds what you show — your love is quiet, sustained, continuous. You think of it as ordinary; the right person will recognize it as exceptional.", mirror:"Your empathy sometimes means you feel the relationship shifting before the other person does. You see it — you don't always say it. Learning to speak is the most important thing you can do in love.", partner:"You need someone who comes toward you slowly and genuinely — who doesn't expect to understand you overnight but is actually interested, actually approaching, and can receive the depth you offer.", career:"Counseling, psychology, writing, education — any work requiring genuine depth of human understanding is calling for you. Your insight is the scarcest resource in those fields." },
    INFP: { nameTag:"Ideal Keeper", nameRoot:"Idealistic", tagline:"While others adapt to the world's shape, you quietly maintain your own", core:"You carry a set of internal values that are crystal clear — not abstract principles but actual forces shaping every decision you make. While others adapt to the world's shape, you quietly maintain your own.", contrast:"What you bring to a relationship is authenticity — you don't perform, don't adapt, don't pretend. The right person will recognize this as rare and will treasure it more than any rehearsed version of you.", mirror:"You bring a search for meaning into relationships — you don't just want to be together, you want this connection to actually matter. That depth makes you an extraordinarily rare candidate for a lasting partnership.", partner:"You need someone who doesn't roll their eyes when you go deep — who actually thinks that's the best part of you, and is willing to go there with you.", career:"Writing, design, education, counseling — any field where bringing your authentic self is what makes the work land. Your honesty is a competitive moat most people can't cross." },
    ENFJ: { nameTag:"Ignition Point", nameRoot:"Catalytic", tagline:"You make people feel seen — which is rarer than you think", core:"You have a natural gift for making people feel seen and inspired — not because you're performing warmth, but because you genuinely care and know how to transmit that care in ways people can receive it.", contrast:"You tend to give more in relationships than you show — you're always attending to the other person's feelings first. Saying what you need out loud is the most valuable thing you can practice in love.", mirror:"You're usually the caretaker in relationships — but a good relationship should be mutual caretaking. You deserve the same quality of attention you give.", partner:"You need someone who actually sees what you do — not takes it for granted, but feels it, and responds with the same quality of genuine investment.", career:"Leadership, education, PR, brand — any field that needs to move people emotionally has a place for you at the front. Your ability to galvanize is decisive in moments requiring alignment." },
    ENFP: { nameTag:"Possibility Hunter", nameRoot:"Expansive", tagline:"Your enthusiasm is real — and that's the rarest version of it", core:"You live in possibility — you can always see what could happen if things went this way or that, and then you actually go try it. Your life has surprises in it that most people never get, and you bring that energy to everyone around you.", contrast:"Your warmth and creative energy in a relationship is what keeps it from going stale. You make the other person feel like there's always something to look forward to — which is rarer and more valuable than stability.", mirror:"Your genuine curiosity about people makes whoever you're with feel specially attended to — because your interest is real, not polite. That's a form of love most people have never received.", partner:"You need someone who can keep up — who doesn't find you 'too much' but actually loves that every time is a little different, and finds that difference something to look forward to.", career:"Entrepreneurship, creative work, brand building, community — you have no real competition in fields requiring genuine enthusiasm and imagination. That aliveness can't be hired." },
    ISTJ: { nameTag:"Reliable Foundation", nameRoot:"Reliable", tagline:"You mean what you say — and that's rarer than anyone admits", core:"You're the person everyone knows they can count on — not because you have no opinions of your own, but because your relationship with commitment is more serious than most people's. You mean what you say.", contrast:"Your steadiness in a relationship is what many people spend years searching for and never find. You don't run hot and cold — you give the real, continuous, unbroken presence that is actually the hardest thing to sustain.", mirror:"You express love more through action than words — what you do says everything. The right person will see those actions and understand them as love, not take them for granted.", partner:"You need someone who reads actions rather than waiting for declarations — who sees what you quietly do and understands exactly what it means.", career:"Operations, finance, law, management — any field requiring precision and dependability has a place that only someone like you can fill. Your execution is the skill most people are missing." },
    ISFJ: { nameTag:"Warm Anchor", nameRoot:"Nurturing", tagline:"You remember what others forget — because you actually care", core:"You remember the details others forget, and you put effort in where others don't notice — not for praise, but because that's simply how you treat people who matter to you. That level of care is rare in a world that moves fast.", contrast:"The way you take care of people in a relationship is noticed more than you realize. But don't forget to let yourself be taken care of sometimes — you deserve to be thought of and looked after too.", mirror:"Your presence in a relationship is the kind that makes someone feel handled, settled, secure. That feeling doesn't come easy — it requires real investment of self, and not just anyone can provide it.", partner:"You need someone who sees what you quietly do — not because you need praise, but because you need to know it's been seen and valued.", career:"Healthcare, education, HR, services — any field requiring genuine human care needs you. Your focus and patience are the hardest things to replicate in those roles." },
    ESTJ: { nameTag:"Order Builder", nameRoot:"Structured", tagline:"You turn chaos into structure — that's foundational leadership", core:"You have clear, confident judgment about how things should work — and then you have the follow-through to make it happen. You turn chaos into structure and vague responsibility into clear accountability. That's a foundational leadership capacity.", contrast:"Your directness in relationships means the other person always knows where they stand — you don't let things linger in ambiguity. For the right person, that clarity is a relief, not a pressure.", mirror:"You're the one who moves things forward in a relationship — you don't let important things just hang there unaddressed, you deal with them. That initiative is a rare source of security.", partner:"You need someone who appreciates your directness and doesn't mistake it for being controlling — who sees your clarity as an asset, not something to be managed.", career:"Management, law, administration, operations — you stabilize complex systems. Your execution and command of process are among the scarcest competencies in organizations." },
    ESFJ: { nameTag:"Connection Weaver", nameRoot:"Connective", tagline:"You make groups feel whole — a gift almost no one else has", core:"You naturally know how to make a group of people feel like a whole — you remember everyone's names, everyone's state, and you notice and repair small fractures before they become real problems.", contrast:"The attentiveness you bring to a relationship — remembering what they said, preparing for what they'll need — is a form of love that most people have never received and might not even know how to name.", mirror:"You tend to put the other person's feelings first — which makes you a remarkable partner. But a good relationship is a mutual one. Let yourself be considered first sometimes.", partner:"You need someone who actively takes care of you in return — who doesn't need prompting or hinting, but just naturally notices and comes toward you.", career:"PR, HR, education, marketing — any field where human relationships create value puts you at a native advantage. Your social intelligence is a core asset that can't be trained." },
    ISTP: { nameTag:"Practical Solver", nameRoot:"Tactical", tagline:"Your actions are more convincing than your analysis", core:"You get going where theory stops — you don't need another meeting, you need to get your hands on it. Your understanding of how things actually work runs deeper than most, because you actually did the thing instead of just analyzing it.", contrast:"You tend to express care through action in a relationship — you don't always say it, but you do it. The right person will read your action language and trust it more than words.", mirror:"You need enough space to stay yourself in a relationship — not distance, but autonomy. Give someone the understanding to respect that, and they'll have your most genuine presence.", partner:"You need someone who doesn't rely only on words — who can build connection through shared experience and actual doing, not just talking.", career:"Engineering, design, operations, technical fields — anything requiring direct engagement with real problems is where you outperform. Your instinct for action under pressure is what strategies can't replicate." },
    ISFP: { nameTag:"Sensory Artist", nameRoot:"Aesthetic", tagline:"You bring beauty into the everyday — and most people don't even notice what they've been missing", core:"Your sense of beauty is instinctive and it shapes every choice — what you wear, where you are, who you're with. You bring aesthetic into the everyday in ways most people don't even notice they're missing.", contrast:"Your refusal to settle in relationships is one of your rarest qualities — you won't enter something unless it actually feels right. That self-respect will eventually take you exactly where you need to be.", mirror:"Your presence in a relationship is gentle and real — no forcing, no performing, just you. That unpolished authenticity is what makes people want to keep coming back.", partner:"You need someone in whose presence being yourself feels safe — where no adjustment is required, and the version of you that shows up without trying is already enough.", career:"Design, art, creative direction, UX — any field requiring perceptual judgment and taste puts you in an uncrossable advantage. Your eye is a core competency many organizations lack entirely." },
    ESTP: { nameTag:"Instant Executor", nameRoot:"Dynamic", tagline:"While others are still analyzing, you're already adjusting", core:"You're best right now — fast reactions, accurate instincts, strong follow-through. You don't need everything figured out to start moving. While others are still analyzing, you're already adjusting to what actually happened.", contrast:"Your directness and action in relationships means the other person always knows you're actually there — you don't let things hang. For the right person, that certainty is exactly what they've been wanting.", mirror:"What you want in a relationship is real, in-the-moment connection — not plans, not the future, just the actual state of two people right now. That presence is something most people never manage to achieve.", partner:"You need someone who can match your pace — who won't slow you down when decisions need to be made, and can move and adapt alongside you.", career:"Sales, entrepreneurship, negotiation, operations — any field requiring real-time decisions in a shifting environment gives you a native edge. Your agility is rare in slow-moving contexts." },
    ESFP: { nameTag:"Energy Field", nameRoot:"Energetic", tagline:"When you walk in, the room actually changes", core:"When you walk into a space, the atmosphere changes — not because you're performing, but because you genuinely connect with the present moment, and that connects to everyone around you. You show people what it feels like to actually be alive right now.", contrast:"The energy and warmth you bring to a relationship is the natural fuel that keeps it alive. You don't let things go dull — with you, the other person always feels like there's something in this.", mirror:"Your realness and enthusiasm in relationships make the other person feel completely accepted — no judgment, no holding back, full presence. That kind of all-in investment is extraordinarily rare.", partner:"You need someone who receives your energy — who doesn't find you too much, but sees your aliveness as something that makes their life better, and genuinely welcomes all of it.", career:"Entertainment, brand, sales, education — any field requiring contagious enthusiasm puts you in a category by yourself. Your presence is not something that can be replicated through effort." },
  },
};

// ── Enneagram wing content (18 wings) ─────────────────────────────────────────
const ENN_CONTENT = {
  zh: {
    "1w9": { nameTag:"理想克制者", nameSuffix:"克制者", tagline:"你对自己最严格，但对别人比你表现出来的更宽容", contrast:"你对自己要求最高，但对别人往往比你表现出来的更宽容——你的内心标准是用来要求自己的，不是用来评判别人的。这让你比大多数完美主义者都更容易相处。", partner:"你需要一个让你感觉「放松也可以」的人——在他面前，做回普通的自己，不需要时刻保持最好状态，就已经足够了。", core:"你有一套在内心运行的精密标准系统，用来要求自己比任何人都严格，但你从不轻易把这把尺对准别人。这种内外有别的克制，是你的稀缺性所在。", mirror:"在别人眼里，你是有原则的那个，可以信赖的那个。你自己清楚，那条线是你给自己画的——而你从未真正到达，也因此从未停止前进。", career:"法律、教育、品质管理——任何需要高标准和长期坚守的赛道都是你的主场。你的自律不只是个人风格，是组织里真正稀缺的能力。" },
    "1w2": { nameTag:"责任付出者", nameSuffix:"付出者", tagline:"你不只有原则，你用实际行动证明原则", contrast:"你对「正确」有很清晰的判断，而且你愿意为它付出真实的行动——不只是有原则，你是那种用行动证明原则的人，这让你在别人眼里有一种可靠的重量感。", partner:"你需要一个欣赏你付出的人——不是理所当然地接受，而是真的看到你在做什么，然后说谢谢。", core:"你对「正确」的追求不只停留在脑子里，你会用实际行动证明它。你是那种说到做到的人——不是因为必须，是因为你没办法接受言行不一。", mirror:"别人眼里你是可靠的那个，总是能信任的那个。你自己知道，这份可靠是有成本的——但你愿意付，因为你在乎这件事本身。", career:"教育、医疗、公共服务、任何有使命感的赛道——你在这里找到的不只是职业，是价值的出口。你的行动力，是稀缺的执行资产。" },
    "2w1": { nameTag:"温暖建设者", nameSuffix:"建设者", tagline:"你的付出是具体的、主动的——这是极少数人能给出的", contrast:"你给予的方式是具体的、主动的——不只是情绪上的支持，你会真的去做点什么。这让你成为别人生命里那种「有他在就踏实了」的存在，这种位置不是每个人都能占的。", partner:"你需要一个真的接住你付出的人——不只是享受，是感知到你的用心，然后把同等的真实回馈给你。", core:"你的给予方式是具体的、主动的——你不只在情绪上支持别人，你会真的去做点什么。这让你在任何群体里都是那个让人感觉踏实的存在。", mirror:"在别人眼里，你是那个「有他在就放心了」的人。你自己知道，你的付出是有选择的——你给的是真心，不是义务，这让你的付出更有重量。", career:"人力资源、社会工作、医疗、咨询——你在任何需要真实关怀的赛道里都有天然优势。你的温度，是很多岗位最难培训出来的核心能力。" },
    "2w3": { nameTag:"魅力连接者", nameSuffix:"连接者", tagline:"你让人感觉被看见——而且是真实的，不是礼貌的", contrast:"你在人际关系里有一种天然的魔力——你能让别人感觉被看见、被重视，而且是真实的，不是社交礼仪。你让很多人生命里的某段时间，变得更有光了。", partner:"你需要一个不需要你「表演付出」的人——在他面前，你不需要特别努力就能感觉到被需要、被珍视，这才是对你真正好的关系。", core:"你有一种让人感觉被看见的天赋——不是社交礼仪，是真实的关注。你让很多人在人生某个阶段感受到了「被理解」是什么感觉，这不是每个人都能给的。", mirror:"别人看你，看到的是那个出现在正确时机、说出正确话的人。你自己知道，这份精准来自于你真的在观察、真的在乎，不是本能，是修炼。", career:"公关、市场、品牌、社群运营——任何需要让人与人之间产生真实连接的赛道，你都是天然候选人。你的社交智商是最难被AI替代的。" },
    "3w2": { nameTag:"成就赋能者", nameSuffix:"赋能者", tagline:"你的野心是被真实的在乎驱动的，不是冷的", contrast:"你的成就欲背后，是一个真的想让自己和身边的人过得更好的愿望。你的野心不是冷的，它是被真实的在乎驱动的——这让你的成功比单纯的功利主义更有温度。", partner:"你需要一个既欣赏你的成就、又不把你等于你的成就的人——爱你这个人，不只是爱你带来的结果。", core:"你有强烈的成就欲，但你的野心不是冷的——背后是真实的在乎和想让周围的人也变好的愿望。这让你的成功比纯粹的功利主义更有温度和可持续性。", mirror:"别人看你，看到的是那个推进事情、让团队往前走的人。你自己知道，你最在意的其实不只是结果，是那个过程里大家有没有真的变好。", career:"管理、创业、品牌——你在需要既有远见又有执行力的赛道里有压倒性优势。你的成就欲加上对人的真实在乎，是领导力的稀有组合。" },
    "3w4": { nameTag:"深度成就者", nameSuffix:"实现者", tagline:"你对成功有自己的定义——外部认可不是全部", contrast:"你追求成功，但你对「什么是真正的成功」有自己的定义——不只是外部认可，你需要内心觉得这件事有意义。这让你比很多人更难满足，但也更难被表面的成功糊弄。", partner:"你需要一个能看到你内心世界的人——不只是为你的成就鼓掌，而是真的对你内部在想什么、在乎什么感兴趣。", core:"你追求成功，但你有自己的定义——外部认可不是终点，内心觉得有意义才是。这让你比很多高成就者更难满足，但也更难被表面的成功糊弄。", mirror:"别人看到的是你的成就和光环。你自己清楚，你更在意的是那个做这件事的自己——有没有在成长，有没有在靠近那个你真正想成为的人。", career:"创意产业、品牌战略、艺术与商业的交叉地带——你在需要兼顾深度和影响力的赛道里才能完全释放自己。你不只是做到了，你还想做出意义。" },
    "4w3": { nameTag:"独特存在者", nameSuffix:"共鸣者", tagline:"你在别人满足于「差不多」的地方，还在追求更真实的状态", contrast:"你有一种拒绝平庸的本能——你需要你的存在是有意义的、是独特的、是真实的。在大多数人满足于「差不多」的地方，你一直在追求一种更真实的状态。", partner:"你需要一个能接住你深度的人——不觉得你「想太多」，反而觉得这就是你最好的部分，然后愿意跟你一起进入那个深度。", core:"你有一种对平庸的本能抗拒——你需要你的存在是有意义的、是独特的、是不能被替代的。这不是自大，是一种很深层的对真实的追求。", mirror:"别人看你，看到的是那个「有点不一样」的人，气质上的出挑。你自己知道，这份不同不是刻意经营的，是你没办法假装成别人的结果。", career:"创作、设计、品牌叙事、文化产业——你在任何允许个性发挥的赛道里都会留下印记。你最大的职业资产，是你独一无二的感知视角。" },
    "4w5": { nameTag:"内省创造者", nameSuffix:"探索者", tagline:"你的深度是给真正愿意理解你的人的", contrast:"你的内心世界极其丰富，但你不是随便就能进入的——你的深度是给真正愿意理解你的人的。这种选择性，不是冷漠，是你对真实连接的高标准。", partner:"你需要一个愿意慢慢走进你的人——不期待一夜之间就「懂你」，但是真的有兴趣、真的在靠近、真的被你的内心世界所吸引。", core:"你的内心世界极其丰富，而且你有把它转化成创造物的能力。你不只是感受得深，你还能在深处找到形式——这是一种极少数人拥有的完整天赋。", mirror:"别人看你，往往看到了一个安静、深沉、有点难以捉摸的人。你自己知道，你只是对真实的质量有高标准——能进入你内心世界的人，会发现那里比外面丰富得多。", career:"写作、艺术、研究、深度内容创作——你在任何允许深度独处和创造的赛道里都能爆发出惊人的输出。你的内省力，是市场上真正稀缺的原创资产。" },
    "5w4": { nameTag:"深思探索者", nameSuffix:"思索者", tagline:"你的理解同时有深度和温度，这是很罕见的组合", contrast:"你在思考上有极深的渗透力，但你的思考不只是理性的——有一种情感和美学的维度在里面。你对世界的理解，同时有深度和温度，这是很罕见的组合。", partner:"你需要一个不打扰你独处的人——知道你需要空间，也知道在正确的时候出现，而且在出现的时候是真实的。", core:"你对世界的理解是从内部建立的——你需要自己想清楚，才会相信。这让你的认知体系极其稳固，也让你在别人还在跟风的时候，已经有了自己的答案。", mirror:"别人看你，看到的是那个安静、博学、很难被一句话打动的人。你自己知道，你不是冷——你只是把深度留给真正值得的人和事，这是一种很高的标准。", career:"研究、哲学、写作、系统设计——你在任何需要深度独立思考的赛道里都有不可替代的位置。你的知识体系，是时间和专注力构建的护城河。" },
    "5w6": { nameTag:"系统洞察者", nameSuffix:"洞察者", tagline:"你做出的决策，往往比那些冲动行事的人稳得多", contrast:"你对安全感的追求让你会在行动前把每一个变量都想得非常透彻——这不是过度焦虑，是一种极有价值的风险意识。你做出的决策，往往比那些冲动行事的人稳得多。", partner:"你需要一个让你感觉「在他这里是安全的」的人——不需要你时刻保持警惕，在他面前你可以放下那些对未知的防御。", core:"你对世界的理解建立在可靠的信息和缜密的逻辑上——你不轻易相信，但一旦判断了，就非常稳。这种稳健的认知方式，在需要理性决策的时候是压倒性的优势。", mirror:"别人看你，看到的是那个冷静、可靠、遇事不慌的人。你自己知道，这份冷静背后是你提前把每一个变量都想过了——你的从容是准备出来的，不是天生的。", career:"分析、研究、风险管理、技术——任何需要系统思维和可靠判断的赛道都是你的主场。你的决策质量，在长线上会碾压所有靠直觉行事的人。" },
    "6w5": { nameTag:"忠诚守卫者", nameSuffix:"守卫者", tagline:"你在别人只看到机会的地方，同时看到了风险——这让你不可或缺", contrast:"你对风险的感知力极强，但这不是悲观，是一种现实主义的智慧。你会在别人只看到机会的地方，同时看到风险——这让你在团队里成为不可缺少的保障。", partner:"你需要一个稳定的人——不是无聊的那种稳定，而是你知道他不会突然消失、不会无缘无故变化，在你需要他的时候他在那里。", core:"你有极强的风险感知能力，而且你愿意在别人还在乐观的时候，说出那个没人愿意说的问题。这不是悲观，是一种对真实负责的勇气。", mirror:"别人看你，看到的是那个靠谱、不离不弃的人。你自己知道，你的忠诚不是因为没有选择，是因为你真的相信这件事、这段关系值得被坚守。", career:"安全、法务、项目管理、组织运营——你在任何需要预见风险和守住底线的赛道里都是不可或缺的存在。你的谨慎，是很多团队最缺少的那一块。" },
    "6w7": { nameTag:"活力忠诚者", nameSuffix:"信念者", tagline:"「带着焦虑也要往前走」比假装不怕要勇敢得多", contrast:"你对不确定的事情有一种独特的应对方式——你既担心，又仍然愿意去尝试。这种「带着焦虑也要往前走」的姿态，比假装不怕要勇敢得多。", partner:"你需要一个能和你一起面对不确定性的人——不是让你别担心（这没用），而是陪你一起分析、一起接受，然后一起决定怎么办。", core:"你有焦虑，但你不被焦虑打倒——你带着不确定感继续往前走，这需要的勇气比假装不怕要多得多。这种在矛盾中前进的能力，是你最独特的特质。", mirror:"别人看你，看到的是那个热情、合群、总是在场的人。你自己知道，你的热情背后有时候是一种「不要停下来，不然会想太多」的驱动——而你已经学会了把这变成动力。", career:"营销、教育、社群、创业——你在需要热情和系统性思考同时存在的赛道里有天然优势。你的活力是可持续的，因为它背后是真实的投入，不是表演。" },
    "7w6": { nameTag:"冒险探索者", nameSuffix:"寻梦者", tagline:"你的乐观不是假的，是建立在真实体验上的认知", contrast:"你对生活的热情和对新体验的渴望，是你最大的礼物之一——你让身边的人感觉世界比他们以为的更有趣。你的乐观不是假的，是建立在真实体验上的认知。", partner:"你需要一个跟得上你的人——不觉得你「太多了」，反而觉得和你在一起每次都有点不一样，而且这个「不一样」是他喜欢的。", core:"你活在可能性里——你总是能看到下一个值得期待的事情，然后真的去做。你让周围的人觉得世界比他们以为的更有趣，这是一种真实的礼物。", mirror:"别人看你，看到的是那个永远充满能量、带来惊喜的人。你自己知道，你的乐观不是无脑的——你只是选择把注意力放在可能性上，因为你有足够的经历告诉你这值得。", career:"旅游、媒体、创意产业、教育——你在任何需要热情和多元视角的赛道里都能大放异彩。你的生命力，是品牌和组织最想拥有却最难培养的东西。" },
    "7w8": { nameTag:"力量享乐者", nameSuffix:"冒险者", tagline:"你不只是想要更多，你有能力去拿到更多", contrast:"你的能量和魄力在同龄人里是少见的——你不只是想要更多，你有能力去追求更多，然后真的拿到。这种「说了就做」的劲头，是很多人欠缺的执行力。", partner:"你需要一个有自己世界的人——不是那种会被你的能量压倒、然后默默跟着走的人，而是能跟你站在同一高度、有时候还能推着你走的人。", core:"你不只是想要更多，你真的去拿了——而且通常拿到了。这种「说做就做」的执行力加上对享受的真实渴望，让你在很多人还在观望的时候，已经在体验了。", mirror:"别人看你，看到的是那个气场强、说到做到、不废话的人。你自己知道，你的强势背后是一种对生命不想浪费的本能——每一刻都要活得足够真实。", career:"创业、投资、销售、娱乐——你在任何需要魄力和行动力的赛道里都有天然竞争力。你最大的资产是你敢于行动、然后真的能把事情做成的组合。" },
    "8w7": { nameTag:"力量开拓者", nameSuffix:"破局者", tagline:"你的力量来自一种「我不会让坏事在我这里发生」的深层责任心", contrast:"你有一种保护本能——你不只保护自己，你会保护你在乎的人。这种力量感不是攻击性的，是来自一种「我不会让坏事在我这里发生」的深层责任心。", partner:"你需要一个不被你的力量吓到的人——能正视你的强大，同时不觉得有必要去挑战它，能让你感觉「在他面前我不需要一直保持战斗姿态」。", core:"你有一种保护本能，不只保护自己，也保护你在乎的人和你相信的事。这份力量不是攻击性的，是一种「我不会让坏事发生在我这里」的深层责任感。", mirror:"别人看你，看到的是那个强大、有话直说、不怕对抗的人。你自己知道，你的强大不是盔甲——是因为你真的相信你在保护的东西值得你这么做。", career:"创业、政治、法律、高风险决策——你在任何需要勇气和执行力的赛道里都有无可替代的位置。你的战斗力，在危机时刻是决定性的资产。" },
    "8w9": { nameTag:"稳健守护者", nameSuffix:"持重者", tagline:"你的力量是沉稳的——不需要展示，就已经在", contrast:"你有力量，但你的力量是沉稳的、有分寸的——你不需要靠展示力量来证明你的存在。这让你在需要的时候爆发力惊人，在不需要的时候安静得像个普通人。", partner:"你需要一个尊重你边界的人——知道你的强大，但不把它当成工具使用，真正把你当成一个完整的人来对待。", core:"你有力量，但你的力量是沉稳的、有分寸的。你不需要靠证明自己来存在——你只是在，然后事情就稳了。这种不需要展示的强大，是很罕见的品质。", mirror:"别人看你，看到的是那个沉稳、可靠、不会轻易被动摇的人。你自己知道，这份稳定是有成本的——你承载了很多，但你选择了承载，因为你知道自己能。", career:"管理、运营、危机处理——你在任何需要稳定军心和长期主义的赛道里都有不可替代的价值。你的定力，是很多组织在压力时刻最渴望的东西。" },
    "9w8": { nameTag:"平和开拓者", nameSuffix:"调和者", tagline:"当你真正在乎某件事的时候，你展现出的坚定会让所有人惊讶", contrast:"你有一种天然的调和能力——你能让对立的力量找到共存的方式。但你自己也有力量，而且当你真正在乎某件事的时候，你展现出来的坚定会让所有人都惊讶。", partner:"你需要一个让你不需要「维持和平」的关系——在那里，你不是调和者，你是被接受的存在，不需要时刻照顾别人的感受才能保住自己的位置。", core:"你有一种天然的调和能力——你能让对立的力量找到共存的方式，不是妥协，是真正的理解。这让你在任何群体里都是那个让人感觉可以喘口气的存在。", mirror:"别人看你，看到的是那个温和、好相处、不会给人压力的人。你自己知道，你是有立场的——只是你的立场不需要通过对抗来表达，这让你比很多强硬的人更有实质影响力。", career:"外交、咨询、人力资源、文化创意——你在任何需要协调和理解不同视角的赛道里都有天然优势。你的调和力，是冲突频繁的时代里最值钱的能力。" },
    "9w1": { nameTag:"理想平和者", nameSuffix:"平和者", tagline:"你的存在，往往比你说的话更有力量", contrast:"你对世界有一套温和但清晰的期待——你不是没有原则，只是你表达原则的方式是用行动而不是声音。你的存在，往往比你说的话更有力量。", partner:"你需要一个不需要你不断调整自己去适应的人——跟他在一起，你不需要努力，你只需要做自己，然后发现做自己就已经够了。", core:"你有清晰的价值观，但你表达它的方式是用存在本身，而不是声音。你的原则是活出来的，不是说出来的——而这往往比言语更有说服力和持久力。", mirror:"别人看你，看到的是那个安静但有力量的人，那个「他在，就觉得没问题」的存在。你自己知道，你只是选择用行动而不是言语——因为你相信做比说更有重量。", career:"教育、写作、艺术、社会工作——你在任何需要用真实的存在去影响别人的赛道里都能留下印记。你的平和不是平庸，是一种深层的力量。" },
  },
  en: {
    "1w9": { nameTag:"Restrained Idealist", nameSuffix:"Idealist", tagline:"You hold yourself to the highest standard — and you're softer on others than you let on", contrast:"You hold yourself to the highest standard, but you're usually more tolerant of others than you let on — your internal bar is for yourself, not a measuring stick for everyone else. That makes you much easier to be around than most perfectionists.", partner:"You need someone who makes it feel okay to relax — where being imperfect doesn't require explanation, and being yourself without trying to be your best self is already enough.", core:"You run a precise internal standard system — holding yourself to expectations that are stricter than anyone around you, while rarely turning that bar on others. This internal/external distinction is what makes you rare among perfectionists.", mirror:"To others, you're the principled one, the reliable one. You know that line is one you drew for yourself — and that you've never quite reached it, which is exactly why you haven't stopped moving.", career:"Law, education, quality management — any field that demands high standards and long-term commitment is your domain. Your self-discipline isn't just a personality trait; it's a genuinely scarce organizational asset." },
    "1w2": { nameTag:"Principled Giver", nameSuffix:"Giver", tagline:"You don't just have principles — you prove them through what you do", contrast:"You have a clear sense of what's right, and you're willing to act on it — not just hold it as a belief. You're the rare kind of person who actually proves their principles through behavior, and that gives you a quiet, trustworthy weight.", partner:"You need someone who sees what you do and actually acknowledges it — not takes it for granted, but recognizes the effort and says so.", core:"Your pursuit of what's right doesn't stop at belief — you act on it. You're the kind of person who follows through, not because you have to, but because you can't tolerate the gap between word and action.", mirror:"Others see you as the reliable one, the one who can always be counted on. You know that reliability has a cost — and you pay it, because the thing itself matters to you.", career:"Education, healthcare, public service, any mission-driven field — here you find not just a career but an outlet for what you value. Your ability to act on principle is a rare execution asset." },
    "2w1": { nameTag:"Warm Builder", nameSuffix:"Builder", tagline:"Your giving is concrete and proactive — almost no one can do this", contrast:"The way you give is concrete and proactive — you don't just offer emotional support, you actually do something. That makes you the person whose presence makes others feel like things are handled. Not everyone can hold that position.", partner:"You need someone who actually receives what you give — not just accepts it, but feels it, and reciprocates with the same kind of real investment.", core:"Your generosity is concrete and proactive — you don't just support people emotionally, you do something. That makes you the person in any group whose presence creates a feeling of steadiness and safety.", mirror:"Others see you as the one whose presence makes everything feel more manageable. You know your giving is a choice — you offer it from genuine care, not obligation, and that's what gives it weight.", career:"HR, social work, healthcare, counseling — any field requiring real human warmth gives you a natural advantage. The capacity for care you bring is one of the hardest things to train." },
    "2w3": { nameTag:"Charismatic Connector", nameSuffix:"Connector", tagline:"You make people feel seen — and it's real, not politeness", contrast:"You have a natural ability to make people feel seen and valued — and it's real, not social performance. You genuinely make stretches of people's lives feel warmer and more lit up.", partner:"You need someone in whose presence you don't have to 'perform caring' — where being needed and valued feels natural, not something you have to orchestrate.", core:"You have a gift for making people feel genuinely seen — not as a social technique, but as real attention. You've given many people the experience of feeling truly understood, and that's not something everyone can offer.", mirror:"Others see you as the one who shows up at the right moment with the right words. You know that precision comes from actually watching, actually caring — it's not instinct, it's practice.", career:"PR, marketing, brand, community — any field where human connection needs to feel real is your natural territory. Your social intelligence is among the hardest things for automation to replace." },
    "3w2": { nameTag:"Achievement Enabler", nameSuffix:"Enabler", tagline:"Your ambition is driven by real care — it's not cold", contrast:"Your drive is backed by a genuine desire to make things better — for yourself and the people around you. Your ambition isn't cold; it's driven by real investment. That gives your success more warmth than pure achievement-seeking.", partner:"You need someone who admires what you've accomplished without reducing you to it — who loves the person doing the achieving, not just the outcomes.", core:"You're ambitious, but your drive isn't cold — underneath it is a genuine desire to make things better for yourself and the people around you. That combination of ambition and real care is what makes your success more sustainable than pure achievement-chasing.", mirror:"Others see you as the person who moves things forward, who makes teams progress. You know what you actually care about most isn't just results — it's whether people genuinely got better in the process.", career:"Management, entrepreneurship, brand building — you have a decisive advantage in any role that needs both vision and execution. Your ambition combined with real investment in people is a rare leadership combination." },
    "3w4": { nameTag:"Depth Achiever", nameSuffix:"Achiever", tagline:"Your definition of success is your own — external recognition alone doesn't satisfy you", contrast:"You chase success, but you have your own definition of what actually counts — external recognition alone doesn't satisfy you if the thing itself doesn't mean something. That makes you harder to please than most, and much harder to fool.", partner:"You need someone who is genuinely curious about your inner world — not just applauding the surface performance, but interested in what you're actually thinking and what actually matters to you.", core:"You pursue success, but you have your own definition of it — external recognition is not the endpoint; internal meaning is. That makes you harder to satisfy than most high achievers, and much harder to deceive with surface wins.", mirror:"Others see the achievement and the aura. You know what you actually care about is whether the person doing the work is growing — whether you're getting closer to who you actually want to become.", career:"Creative industries, brand strategy, the intersection of art and commerce — you're fully released only in roles that demand both depth and impact. You don't just want to succeed; you want to mean something." },
    "4w3": { nameTag:"Singular Presence", nameSuffix:"Resonator", tagline:"In the places where most people settle for 'fine,' you're still reaching", contrast:"You have a refusal to be ordinary — you need your existence to mean something, to be distinct, to be honest. In the places where most people settle for 'fine,' you're still reaching for something more real.", partner:"You need someone who can hold your depth — who doesn't find you 'too much,' but sees that depth as your best quality and is willing to go there with you.", core:"You have a deep instinct against ordinariness — you need your existence to be meaningful, distinct, irreplaceable. This isn't arrogance; it's a very deep pursuit of what's real.", mirror:"Others see you as the one who stands out — a certain quality that's hard to name. You know this distinctiveness wasn't cultivated; it's just what happens when you can't pretend to be anyone else.", career:"Creation, design, brand narrative, cultural industries — in any space that allows individuality to show, you leave a mark. Your greatest professional asset is a perspective that cannot be replicated." },
    "4w5": { nameTag:"Introspective Creator", nameSuffix:"Explorer", tagline:"Your depth is for people who are willing to actually understand you", contrast:"Your inner world is extraordinarily rich, and access to it isn't offered casually — your depth is for people who are actually willing to understand you. That selectivity isn't coldness; it's a high standard for real connection.", partner:"You need someone who approaches you slowly and genuinely — who doesn't expect to understand everything quickly but is actually interested, actually approaching, actually drawn by what they're finding.", core:"Your inner world is extraordinarily rich, and you have the capacity to turn it into something — not just to feel deeply, but to find form within that depth. That complete combination of sensitivity and creative ability is possessed by very few.", mirror:"Others often see someone quiet, deep, a little hard to read. You know you simply have high standards for authenticity — those who enter your inner world find it far richer than the outside suggested.", career:"Writing, art, research, deep content creation — you're capable of remarkable output in any field that allows deep solitude and creative work. Your introspective capacity is a genuinely scarce original asset." },
    "5w4": { nameTag:"Thoughtful Explorer", nameSuffix:"Seeker", tagline:"Your understanding of the world has both depth and warmth — a rare combination", contrast:"Your analytical depth has an emotional and aesthetic dimension in it too — your understanding of the world isn't purely rational, it has texture and feeling. That combination of depth and warmth is genuinely rare.", partner:"You need someone who doesn't disturb your solitude — who knows you need space and knows when to appear, and when they appear, is actually present.", core:"Your understanding of the world is built from the inside out — you need to think it through yourself before you'll believe it. That makes your knowledge system extraordinarily solid, and means that when others are still following trends, you already have your own answer.", mirror:"Others see someone quiet, well-read, hard to move with a single argument. You know you're not cold — you simply reserve your depth for people and things that genuinely deserve it. That's a very high standard.", career:"Research, philosophy, writing, systems design — you have an irreplaceable position in any field requiring deep independent thought. Your knowledge system is a moat built from time and sustained attention." },
    "5w6": { nameTag:"Systems Analyst", nameSuffix:"Analyst", tagline:"The decisions you make tend to be more stable than those made by people who act first", contrast:"The way you think through risk comes from real self-awareness, not excessive anxiety — you make sure you've accounted for the variables before you move. The decisions you make are typically more stable than those made by people who act first and think later.", partner:"You need someone who makes you feel genuinely safe — where you don't have to maintain vigilance, where you can drop the guard against the unknown.", core:"Your understanding of the world is built on reliable information and careful logic — you don't trust easily, but once you've made a judgment, it's very stable. That careful cognitive approach is an overwhelming advantage when rational decisions are needed.", mirror:"Others see someone calm, dependable, unflappable under pressure. You know that composure comes from having worked through every variable in advance — your ease is prepared, not innate.", career:"Analysis, research, risk management, technology — any field requiring systems thinking and reliable judgment is your territory. Your decision quality will outperform everyone who operates on instinct over the long run." },
    "6w5": { nameTag:"Loyal Sentinel", nameSuffix:"Sentinel", tagline:"You see what most people miss when they're only looking at the upside", contrast:"Your ability to sense risk doesn't make you pessimistic — it makes you a realist. You see what most people miss when they're only looking at the upside. That makes you indispensable on any team that actually wants to succeed.", partner:"You need someone stable — not boring-stable, but the kind where you know they won't disappear, won't randomly shift on you, and will be there when it matters.", core:"You have an acute ability to sense risk, and you're willing to name the problem no one else wants to say when others are still optimistic. That's not pessimism — it's a courageous accountability to what's actually real.", mirror:"Others see you as the reliable one, the one who stays. You know your loyalty isn't from lack of options — it's because you genuinely believe in this thing, this relationship, and you think some things are worth holding.", career:"Security, legal, project management, organizational operations — you're indispensable in any role that requires anticipating risk and holding the line. Your caution is exactly what many teams are missing." },
    "6w7": { nameTag:"Vital Loyalist", nameSuffix:"Loyalist", tagline:"Moving forward while anxious is actually more courageous than pretending not to be afraid", contrast:"You have a unique way of dealing with uncertainty — you're worried, and you go anyway. That approach of moving forward while anxious is actually more courageous than pretending not to be afraid.", partner:"You need someone who can face uncertainty alongside you — not telling you not to worry (useless), but thinking through it with you, accepting it with you, and deciding what to do together.", core:"You have anxiety, but you don't let it stop you — you carry uncertainty and keep moving. That takes more courage than pretending not to be afraid. The ability to advance through contradiction is your most distinctive quality.", mirror:"Others see someone warm, engaged, always present. You know your energy is sometimes driven by 'don't stop or you'll overthink it' — and you've learned to turn that into momentum.", career:"Marketing, education, community, entrepreneurship — you have a natural advantage in roles that need both enthusiasm and systematic thinking. Your energy is sustainable because it comes from genuine investment, not performance." },
    "7w6": { nameTag:"Adventure Seeker", nameSuffix:"Adventurer", tagline:"Your optimism is real — it's built on actual experience", contrast:"Your enthusiasm and appetite for new experience is one of your greatest gifts — you make the world feel more interesting to the people around you. Your optimism isn't performance; it's built on actual experience.", partner:"You need someone who can keep up — who doesn't find you 'too much' but actually loves that every time is a little different, and finds that difference something to look forward to.", core:"You live inside possibility — you can always see the next thing worth looking forward to, and then you actually go do it. You make the people around you feel the world is more interesting than they thought. That's a real gift.", mirror:"Others see someone always full of energy, always bringing surprises. You know your optimism isn't thoughtless — you just choose to put your attention on what's possible, because you have enough experience to know it's worth it.", career:"Travel, media, creative industries, education — you can thrive in any field that needs passion and a range of perspectives. The life force you bring is what brands and organizations most want and least know how to cultivate." },
    "7w8": { nameTag:"Power Enjoyer", nameSuffix:"Pioneer", tagline:"You don't just want more — you have the capacity to actually get it", contrast:"Your energy and boldness are unusual for your generation — you don't just want more, you have the capacity to go get it and then actually get it. That drive from saying to doing is an execution quality many people simply don't have.", partner:"You need someone with their own world — not the kind who gets swept along by your energy and follows quietly, but someone who can stand at the same level and occasionally push you forward.", core:"You don't just want more — you actually go get it, and usually succeed. That combination of genuine appetite for experience and real execution ability puts you in action while others are still deciding whether to try.", mirror:"Others see someone strong, direct, no wasted words. You know your intensity comes from a deep instinct not to waste life — every moment needs to be real enough.", career:"Entrepreneurship, investment, sales, entertainment — you have a natural competitive advantage in any field requiring boldness and execution. Your greatest asset is the combination of willingness to act and ability to make things happen." },
    "8w7": { nameTag:"Force Opener", nameSuffix:"Disruptor", tagline:"Your power comes from a deep sense of responsibility — not aggression", contrast:"You have a protective instinct that extends beyond yourself — you guard the people you care about. That power isn't aggression; it comes from a deep sense of responsibility, a feeling that bad things shouldn't happen on your watch.", partner:"You need someone who isn't intimidated by your strength — who sees it clearly, doesn't feel the need to challenge it, and lets you stop being in combat stance without it being a vulnerability.", core:"You have a protective instinct — not just for yourself, but for the people you care about and the things you believe in. That power isn't aggression; it's a deep sense of responsibility, a feeling that you won't let bad things happen on your watch.", mirror:"Others see someone strong, direct, unafraid of conflict. You know your strength isn't armor — it's because you genuinely believe what you're protecting is worth it.", career:"Entrepreneurship, politics, law, high-stakes decisions — you have an irreplaceable position in any field requiring courage and execution. Your fighting capacity is a decisive asset in moments of crisis." },
    "8w9": { nameTag:"Grounded Guardian", nameSuffix:"Guardian", tagline:"Your power is steady — you don't need to demonstrate it to know it's there", contrast:"You have power, but it's steady — you don't need to demonstrate it to know it's there. That restraint makes you capable of stunning force when it's actually needed, and unremarkable presence when it's not.", partner:"You need someone who respects your boundaries — who understands your strength but doesn't treat it as a resource to use, and engages with you as a whole person.", core:"You have power, but it's measured and proportionate. You don't need to prove yourself to exist — you simply are, and things stabilize. That kind of strength that doesn't need display is an exceptionally rare quality.", mirror:"Others see someone steady, reliable, difficult to move. You know that stability has a cost — you carry a lot, and you've chosen to carry it, because you know you can.", career:"Management, operations, crisis response — you have irreplaceable value in any role requiring sustained morale and long-term thinking. Your composure is what organizations desperately want when pressure hits." },
    "9w8": { nameTag:"Peaceful Force", nameSuffix:"Harmonizer", tagline:"When you actually care about something, the determination you show surprises everyone", contrast:"You have a natural gift for reconciling opposing forces. But you have your own force too, and when you genuinely care about something, the determination you show surprises everyone who thought you were just the peacemaker.", partner:"You need a relationship where you don't have to be the mediator — where you're not someone who exists to smooth things over, but someone who is accepted and doesn't have to manage the room to stay welcome.", core:"You have a natural capacity for reconciliation — you can help opposing forces coexist, not through compromise, but through genuine understanding. This makes you the person in any group who allows others to breathe.", mirror:"Others see someone mild, easy to be around, never pressuring. You know you have a position — you just don't need conflict to express it. That lets you carry more real influence than many who are louder.", career:"Diplomacy, consulting, HR, cultural and creative work — you have a natural advantage in any field requiring coordination across different perspectives. Your reconciling ability is among the most valuable capacities in an era of constant friction." },
    "9w1": { nameTag:"Serene Idealist", nameSuffix:"Peacemaker", tagline:"What you actually do tends to carry more weight than anything you say", contrast:"You have a gentle but clear view of how things should be — your principles aren't absent, you just express them through behavior instead of declaration. What you actually do tends to carry more weight than anything you say.", partner:"You need someone with whom you don't have to constantly adjust to fit — where being yourself, without effort, is already enough.", core:"You have clear values, but you express them through existence itself rather than through voice. Your principles are lived, not declared — and that tends to be more persuasive and more lasting than words.", mirror:"Others see someone quiet but powerful, a presence that makes people feel things are going to be okay. You know you simply choose action over speech — because you believe doing carries more weight.", career:"Education, writing, art, social work — in any field that asks you to influence others through genuine presence, you leave a mark. Your peace isn't complacency; it's a deep form of strength." },
  },
};

// ── Zodiac content (12 entries indexed 0-11, matching TX.zh/en zodiacs arrays) ─
const ZOD_CONTENT = {
  zh: [
    { nameAdj:"热烈", tagline:"你比任何人都更愿意第一个跳进去", core:"你有一种对新开始的本能渴望——你愿意第一个跳进去，愿意先开口，愿意在别人还在观望的时候已经在行动了。这不是冲动，是你对真实的一种本能性追求。", contrast:"你给感情带来的热烈，有时候比对方准备好接住的多。这不是问题，是你的生命力太真实了——真正的伴侣会学着跟上你，而不是让你压缩自己。", mirror:"你的能量是感染性的，你走进一个空间，温度就不一样了。你给感情带来的那股「现在就要」，不是冲动——是对真实的一种本能性追求。", partner:"你需要一个能跟上你节奏的人——不觉得你「太多了」，反而被你的热情点燃，然后一起往前冲。", career:"销售、创业、活动策划、任何需要激励别人往前走的赛道——你天生适合做那个率先点燃房间的人。你的行动力，是组织里最稀缺的启动资产。" },
    { nameAdj:"笃定", tagline:"你的慢，是有重量的选择", core:"你对感情的进入是缓慢的、审慎的，但一旦你决定了，那份稳定是极少数人能给出的。你的慢不是犹豫——是你知道你在选择什么。", contrast:"你在感情里不轻易表态，但你给出的那份确定感，是很多人一生都找不到的。你的存在本身，就是一种承诺。", mirror:"你在感情里的耐心和稳定，是极少数人能给出的礼物。你不会轻易开始，但一旦开始，你是那种让对方感觉「这是真的」的存在。", partner:"你需要一个愿意等你慢慢走近的人——不催你、不给你压力，但是真的在那里等，然后在你到达的时候，他也到了。", career:"金融、建筑、长线投资、任何需要耐心积累的赛道——你的稳健是时间里最有价值的资产。你不做最快的那个，但你常常是最后留下来的那个。" },
    { nameAdj:"灵动", tagline:"你的大脑和你的心一样快", core:"你在感情里的好奇心和变化感，是一种生命力——你让关系不会停在舒适区里变得平淡。你对新角度的渴望，是让你和关系都保持活力的秘密。", contrast:"你的多面性有时候让别人觉得难以捕捉——但真正理解你的人会知道，你的变化不是不稳定，是你总是在成长，在找到更真实的自己。", mirror:"你在感情里的好奇心和变化感，是一种生命力——你让关系不会停滞在舒适区里变得平淡。你是那种让人永远有点想靠近的人。", partner:"你需要一个有自己思想世界的人——跟你在一起，话永远聊不完，角度永远不重复，然后在这种流动里，两个人变得更加彼此了解。", career:"媒体、写作、咨询、跨界创意——你在需要多元视角和快速切换的赛道里有天然优势。你的思维灵活性，是很多固守一个领域的人最难拥有的。" },
    { nameAdj:"细腻", tagline:"你给出的安全感，是真实的", core:"你在感情里有一种深度的保护本能——你会主动感知对方的状态，在他们还没开口之前就知道他们需要什么。这种细腻，是很多人一生都得不到的礼物。", contrast:"你的保护本能有时候会让你比对方更早感知到问题——但这不是过度敏感，是你在乎的程度的体现。你感知到的，往往是真实的。", mirror:"你在感情里的保护本能不是控制欲，是一种深度的在乎——你让身边的人感觉到有人在。这种存在感，是很多关系里最缺少的东西。", partner:"你需要一个能接住你保护的人——真的感受到你的在乎，然后也愿意让你在某些时候靠近他们，而不是总是一个人扛着所有。", career:"心理咨询、儿童教育、用户体验、社会工作——你在任何需要真实感知他人状态的赛道里都有不可替代的洞察力。你的细腻，是最难被培训出来的核心能力。" },
    { nameAdj:"耀眼", tagline:"你值得被看见，这不是自大", core:"你有一种自然的存在感——你走进一个房间，人们会注意到。你在感情里的大方和热情，不是表演，是你本来的样子，你让对方感觉到被重视和被珍视。", contrast:"你对被看见有真实的渴望——这不是虚荣，是你知道你有东西值得被认可。但你也知道，真正的伴侣看到的不只是你的光芒，是光芒背后的那个人。", mirror:"你在感情里的大方和热情，不是表演，是你本来的样子。你让对方感觉到被重视、被珍视，而这种感觉，是你自然散发出来的。", partner:"你需要一个欣赏你、但不会被你的光芒淹没的人——有自己的世界，有自己的力量，然后在你们相遇的地方，是两道光在互相照亮。", career:"表演、品牌、领导力、公众演讲——你在任何需要存在感和感召力的赛道里都有天然优势。你的光芒是可以成为组织里最强大的动能的。" },
    { nameAdj:"精准", tagline:"你的细致，是一种深层的在乎", core:"你有一种对细节的本能敏感——你会注意到别人完全错过的东西，然后把这些细节转化成对关系的理解。你给出的，是一种精准的、有深度的关注，这是极少数人能做到的。", contrast:"你的高标准有时候会让你比别人更早看到问题——但这不是挑剔，是你对关系质量真实的在乎。你的眼光，是关系里最真实的温度计。", mirror:"你在感情里注意到的那些细节，是别人完全没捕捉到的——你记得的那些小事，是关系里最真实的温度计。你给出的，是一种精准的、有深度的关注。", partner:"你需要一个真的被你看见、然后珍视这份被看见的人——不觉得你在「挑剔」，而是感谢你注意到了那些他自己都以为不重要的小事。", career:"数据分析、品质管理、编辑、研究——任何需要精密眼光和高标准执行的赛道都是你的主场。你的细致，是很多粗放型工作者终其一生都达不到的专业深度。" },
    { nameAdj:"和美", tagline:"你对关系的平衡感，是一种天赋", core:"你有一种对公平和和谐的本能追求——你在感情里自然地为两个人的感受找到一个都能接受的位置。这不是计算，是你真的在乎双方都能在关系里感觉舒服。", contrast:"你的调和能力有时候会让你压抑了自己的需求——但你知道，真正的平衡是包括你自己的。你也值得在关系里占有一个位置。", mirror:"你在感情里自然地追求公平和美感——你不是在计算，你是在为两个人的感受找到一个都能接受的地方。这种调和能力，是关系里非常稀缺的天赋。", partner:"你需要一个知道在关系里「给」的人——不需要你一直去平衡，而是对方也在主动考虑你的感受，然后你们自然达到一种真实的平衡。", career:"外交、法律、人力资源、品牌咨询——你在任何需要协调不同利益和感受的赛道里都有天然优势。你的平衡感，是冲突解决中最稀缺的能力。" },
    { nameAdj:"深邃", tagline:"你的深度，是大多数人不敢去的地方", core:"你在感情里有一种极罕见的专注力——一旦你投入，你是真的在那里，不是一半心思在别处。你给出的是一种全然的存在感，而这对的人会感觉到，然后不再想要别的。", contrast:"你的强度有时候会让对方感觉到压力——但这不是你的问题，是他们还没有准备好接住真实的深度。真正的伴侣不会被你的专注淹没，他们会因此感到安全。", mirror:"你在感情里的专注和强度，是一种极罕见的礼物——一旦你投入，你是那种真的在那里的人。对的人会感觉到这份全然的存在，然后不想再要别的了。", partner:"你需要一个不怕你深度的人——不但不怕，还觉得只有在这个深度里，他才感觉到了真实的连接。然后你们一起往下走。", career:"心理学、研究、深度写作、战略咨询——你在任何需要真正潜入问题内部的赛道里都能做到别人做不到的事。你的深度，是知识密集型行业里最真实的竞争力。" },
    { nameAdj:"自由", tagline:"你的自由不是逃避，是真实的样子", core:"你有一种对开放和可能性的本能渴望——你在感情里不是不想投入，是你需要那个投入是自由选择的，不是被锁进去的。你让对方感觉到关系里还有很多值得探索的空间。", contrast:"你的独立性有时候会让别人觉得你不够在乎——但你知道，你的自由是你爱得最真实的方式。真正理解你的人会感受到，你选择留下来，比什么承诺都有力量。", mirror:"你在感情里的开放和探索欲，是一种生命力。你让对方感觉到「在这段关系里还有很多可能」——这比稳定更罕见，也更难得。", partner:"你需要一个有自己世界的人——不需要你时刻在场来证明你在乎，也不会因为你需要空间就感到不安，然后在你回来的时候，真的高兴你回来了。", career:"创业、旅行、自由职业、创意产业——你在给你空间和自主权的赛道里才能完全释放自己。你的探索欲，是很多固定框架里的人永远找不到的创新动力。" },
    { nameAdj:"坚韧", tagline:"你的认真，本身就是最好的承诺", core:"你在感情里的稳定和负责任，是一种无声的承诺——你不说太多，但你做的每一件事都在传递同一个信号：你是真的在。这种存在本身，就是最可靠的安全感。", contrast:"你的稳健有时候会被误读为冷淡——但你知道，你的在乎从来不少，只是你选择用行动而不是言语来表达。真正懂你的人，会感受到那些行动背后的重量。", mirror:"你在感情里的负责任和踏实，是对的人会感觉到的——你不说太多，但你做的每件事都在传递一个信号：你是真的在。", partner:"你需要一个能感知到你行动语言的人——不需要你把每一分在乎都说出口，他自己就能感受到，然后用同样真实的方式回应你。", career:"建筑、工程、长期项目管理、制造——你在任何需要长线坚持和高可靠性的赛道里都有稀缺价值。你的执行稳定性，是很多团队在关键时刻最需要的那一块。" },
    { nameAdj:"前卫", tagline:"你对感情的理解，超出了大多数人的框架", core:"你对感情有自己的理解方式——你不按大多数人的框架去定义关系，而是探索它可以是什么样的。这种前卫不是标新立异，是你对真实的高标准驱动你去找到更好的答案。", contrast:"你的独特视角有时候让别人感到不知如何回应——但这不是你的问题，是他们还没见过关系可以这样存在。真正的伴侣不会被你吓到，他们会被你的视角打开。", mirror:"你在关系里带来的新鲜视角，是让人突然意识到感情还能这样存在的那种。你的独特，是一种真正的礼物——不是所有人都能接住，但接住的人会终身感激。", partner:"你需要一个能跟上你思考方式的人——不觉得你「太复杂」，反而被你的视角所吸引，然后愿意和你一起探索感情可以是什么样的。", career:"科技、艺术、社会创新、跨学科研究——你在任何允许打破框架的赛道里都能做到别人想不到的事。你的前瞻性，是很多守旧行业最缺少的创新动力。" },
    { nameAdj:"感性", tagline:"你感受到的，比你能说出来的多太多了", core:"你有一种极强的情感感知力——你能感受到对方还没说出口的东西，能在关系里捕捉到那些无法用语言描述的微妙变化。这种感受力，是极少数人拥有的完整天赋。", contrast:"你的感受力有时候让你承载了太多——别人的情绪、关系的张力、那些没说出口的话，都会落在你身上。但你也知道，这份感受力是你最深的礼物，不是你的负担。", mirror:"你在感情里的共情力和感受力，是一种极罕见的天赋。你让对方感觉到被完全理解——不只是言语层面，是那种「有个人真的懂我」的感觉。", partner:"你需要一个也能感受到你的人——不只是听你说了什么，而是感受到你没说出来的那些，然后让你在关系里感觉到：终于有个人真的懂我了。", career:"艺术、心理学、写作、音乐——你在任何允许把感受转化成形式的赛道里都能创造出真正打动人的东西。你的感受力，是AI最难复制的人类核心竞争力。" },
  ],
  en: [
    { nameAdj:"Ardent", tagline:"You're always the first one in the door", core:"You have an instinctive hunger for new beginnings — you're willing to be first, to speak first, to move when others are still watching. This isn't impulsiveness; it's an instinctive pursuit of what's real.", contrast:"The heat you bring to love sometimes exceeds what others are ready to receive. That's not a flaw — your vitality is just too genuine. The right partner learns to keep up, not asks you to compress yourself.", mirror:"Your energy is contagious — when you're present, the temperature actually shifts. The impulse you bring to love isn't recklessness. It's an instinctive pursuit of what's real.", partner:"You need someone who can match your pace — who doesn't find you 'too much' but is actually ignited by your energy, and then moves forward alongside you.", career:"Sales, entrepreneurship, event production, any field that needs someone to fire the room up — you're naturally the person who starts things. Your initiative is the rarest startup asset in any organization." },
    { nameAdj:"Grounded", tagline:"Your slowness is a deliberate choice with weight", core:"Your entry into relationships is slow and considered, but once you've decided, the stability you offer is something very few people can match. Your slowness isn't hesitation — it's knowing exactly what you're choosing.", contrast:"You don't announce your feelings easily, but the certainty you eventually give is what many people search for their entire lives. Your presence is a form of promise.", mirror:"The steadiness you offer in a relationship is a gift very few people can give. You don't start easily, but once you do, you're the kind of presence that makes someone feel this is for real.", partner:"You need someone willing to wait for you to approach — no pressure, no rushing, but genuinely there. And when you arrive, they've arrived too.", career:"Finance, architecture, long-term investing, any field that rewards patience — your steadiness is an asset that compounds with time. You're not the fastest, but you're often the last one standing." },
    { nameAdj:"Fluid", tagline:"Your mind moves as fast as your heart", core:"The curiosity and aliveness you bring to relationships is a form of vitality — you keep things from settling into comfortable stagnation. Your appetite for new angles is the secret to both your growth and the relationship's.", contrast:"Your multidimensionality can make you seem hard to pin down. But those who actually understand you know your changefulness isn't instability — it's constant growth, a continuous search for a more authentic self.", mirror:"Your curiosity and changefulness in relationships are a form of vitality — you keep things from settling into comfortable stagnation. You're the kind of person people always feel a slight pull toward.", partner:"You need someone with a world of their own — where conversations never run out, perspectives never repeat, and through that flow, two people keep discovering each other more deeply.", career:"Media, writing, consulting, cross-disciplinary creativity — you have a natural advantage in any field requiring multiple perspectives and rapid switching. Your cognitive flexibility is what specialists who've stayed in one lane can rarely acquire." },
    { nameAdj:"Tender", tagline:"The safety you offer is genuine", core:"You have a deep protective instinct in relationships — you actively sense the other person's state, knowing what they need before they say it. That tenderness is a gift very few people ever receive.", contrast:"Your protective instinct sometimes means you sense problems before the other person does — but that's not over-sensitivity, it's a reflection of how much you care. What you pick up on is usually real.", mirror:"Your protective instinct in relationships isn't control — it's deep care made tangible. You make people feel that someone is actually there. That kind of presence is what most relationships are missing.", partner:"You need someone who can receive your protection — who genuinely feels your care and is also willing to let you in sometimes, rather than always carrying everything alone.", career:"Counseling, early childhood education, user experience, social work — you have irreplaceable insight in any field that requires genuinely sensing others' states. Your tenderness is the hardest thing to train." },
    { nameAdj:"Radiant", tagline:"You deserve to be seen — that's not ego", core:"You have a natural presence — when you enter a space, people notice. The warmth and generosity you bring to relationships isn't performance, it's just who you are. You make others feel noticed and valued in a way that radiates from you naturally.", contrast:"Your desire to be seen is real — and that's not vanity, it's knowing that you have something worth recognizing. But you also know that the right partner sees not just your light, but the person behind it.", mirror:"The generosity and warmth you bring to relationships isn't performance — it's just who you are. You make people feel noticed and valued in a way that naturally comes from you, not something you have to work at.", partner:"You need someone who appreciates you without being eclipsed by you — someone with their own world and their own strength, so that when you meet, two lights are illuminating each other.", career:"Performance, brand, leadership, public speaking — you have a natural advantage in any field requiring presence and magnetism. Your radiance can become the most powerful engine in an organization." },
    { nameAdj:"Precise", tagline:"Your attention to detail is care in a different language", core:"You have an instinctive sensitivity to detail — you notice what others entirely miss, then translate those details into understanding about the relationship. What you give is a precise, deep form of attention that very few people are capable of.", contrast:"Your high standards sometimes let you see problems earlier than others — but that's not pickiness, it's genuine investment in the quality of connection. Your eye is the most accurate thermometer in the room.", mirror:"What you notice in a relationship that others miss entirely — those small things you remember — are the most accurate thermometers of connection. What you give is a precise, deep form of attention.", partner:"You need someone who feels seen by you and actually treasures that feeling — who doesn't experience your attention as scrutiny, but as gratitude that you noticed the things even they thought didn't matter.", career:"Data analysis, quality management, editing, research — any field requiring a precise eye and high-standard execution is your domain. Your care for detail is the professional depth that most generalist workers never reach." },
    { nameAdj:"Balanced", tagline:"Your sense of balance in relationships is a rare gift", core:"You have an instinctive drive toward fairness and harmony — in relationships you naturally find a position where both people can feel okay. This isn't calculation; it's genuine care that both of you feel comfortable in the relationship.", contrast:"Your reconciling ability can sometimes lead you to suppress your own needs — but you know that real balance includes you. You deserve to occupy space in the relationship too.", mirror:"You naturally pursue fairness and harmony — you're not calculating, you're finding a place where two people can both be okay. That mediating capacity is genuinely scarce in relationships.", partner:"You need someone who knows how to give in a relationship — not someone who needs you to always be the one balancing, but someone actively considering your feelings too, so balance arrives naturally.", career:"Diplomacy, law, HR, brand consulting — you have a natural advantage in any field requiring coordination across different interests and feelings. Your sense of balance is among the most scarce capacities in conflict resolution." },
    { nameAdj:"Intense", tagline:"Your depth is a place most people don't have the nerve to go", core:"You have a rare capacity for focus in relationships — once you're in, you're actually there, not half-somewhere else. You offer a quality of total presence that the right person will feel and never want to give up.", contrast:"Your intensity can sometimes feel like pressure — but that's not your problem, it's that others aren't ready to hold real depth. The right partner won't be overwhelmed by your focus; they'll feel safe in it.", mirror:"The focus and intensity you bring to relationships is an extraordinarily rare gift — once you're in, you're actually there. The right person will feel that total presence and not want anything less from then on.", partner:"You need someone who isn't afraid of your depth — who doesn't just tolerate it, but feels that only at this depth can real connection happen. Then you go deeper together.", career:"Psychology, research, deep writing, strategic consulting — you can do what others can't in any field requiring genuine immersion. Your depth is a genuine competitive advantage in knowledge-intensive work." },
    { nameAdj:"Free", tagline:"Your freedom isn't avoidance — it's just who you are", core:"You have an instinctive hunger for openness and possibility — in relationships, you don't want to avoid commitment, you need that commitment to be freely chosen rather than locked in. You make the other person feel there's still space to explore within the relationship.", contrast:"Your independence is sometimes read as not caring enough — but you know your freedom is how you love most authentically. Those who truly understand you sense that your choosing to stay carries more weight than any promise.", mirror:"The openness and curiosity you bring to relationships is a form of aliveness. You make the other person feel that within this relationship, there are still possibilities to discover — rarer and more valuable than stability.", partner:"You need someone with their own world — who doesn't need you present every moment to know you care, and who isn't unsettled by your need for space. And when you return, they're genuinely glad you're back.", career:"Entrepreneurship, travel, freelancing, creative industries — you fully release yourself only in fields that give you space and autonomy. Your exploratory drive is the innovation impulse that people locked in fixed frameworks will never find." },
    { nameAdj:"Steadfast", tagline:"Your seriousness is itself the best kind of commitment", core:"Your steadiness in relationships is a silent promise — you don't say much, but everything you do transmits the same signal: you're actually here. That presence itself is the most reliable safety.", contrast:"Your reliability is sometimes misread as detachment — but you know your care has never been less, just expressed through action rather than declaration. Those who truly know you feel the weight of those actions.", mirror:"The accountability and steadiness you bring to relationships communicate in a quiet but unmistakable language — not many declarations, but everything you do says: I'm actually here.", partner:"You need someone who can read your action language — who doesn't need every bit of care spoken aloud, but can feel it themselves and responds in an equally real way.", career:"Architecture, engineering, long-term project management, manufacturing — you have rare value in any field requiring sustained commitment and high reliability. Your execution consistency is what teams most need when it matters." },
    { nameAdj:"Electric", tagline:"You understand love in a way most people haven't considered", core:"You have your own way of understanding connection — you don't define relationships by conventional frameworks, but explore what they could be. This isn't contrarianism; it's that your high standard for authenticity drives you to find better answers.", contrast:"Your unique perspective sometimes leaves others unsure how to respond — but that's not your problem, it's that they haven't seen how connection can exist this way. The right partner won't be startled; they'll be opened.", mirror:"The fresh perspectives you bring into relationships are the kind that make someone realize connection can exist in forms they never imagined. Your distinctiveness is a genuine gift — those who can receive it are changed.", partner:"You need someone who can follow your way of thinking — who doesn't find you 'too complicated' but is drawn in by your perspective, and wants to explore with you what love can actually be.", career:"Technology, art, social innovation, interdisciplinary research — in any field that allows framework-breaking, you can do what others haven't thought of. Your foresight is the innovation impulse most traditional industries are missing." },
    { nameAdj:"Resonant", tagline:"What you feel is so much more than what you can say", core:"You have an exceptionally strong capacity for emotional perception — you can sense what the other person hasn't said yet, catching the subtle shifts in a relationship that can't be put into words. That sensitivity is a complete gift possessed by very few.", contrast:"Your sensitivity sometimes means you absorb too much — others' emotions, relationship tensions, the things left unspoken all land on you. But you also know this sensitivity is your deepest gift, not your burden.", mirror:"Your empathy and sensitivity in relationships is a rare gift. You make people feel completely understood — not just at the level of what they said, but the kind of understanding where someone finally feels: this person actually gets me.", partner:"You need someone who can feel you back — not just hear what you say, but sense what you haven't said, and let you feel in the relationship: finally, someone actually understands me.", career:"Art, psychology, writing, music — in any field that allows turning feeling into form, you create things that genuinely move people. Your sensitivity is the human core competency that AI is furthest from replicating." },
  ],
};

function buildQuizProfile(picks, lang) {
  const QC = QUIZ_CONTENT[lang] ?? QUIZ_CONTENT.zh;
  const [p0, p1, p2, p3] = picks;
  const sep = lang === "zh" ? "" : " ";
  return {
    name:     [QC.nameAdj[p2], QC.namePrefix[p0], QC.nameSuffix[p1]].join(sep),
    tagline:  QC.taglineA[p0] + QC.taglineB[p3],
    core:     QC.core[p0],
    contrast: QC.contrast[p1],
    mirror:   QC.mirror[p2],
    partner:  QC.partner[p3],
    career:   QC.career[(p0 + p2) % 4],
  };
}

function buildExistingProfile(mbti, enn, zodiacIdx, lang) {
  const MC = MBTI_CONTENT[lang] ?? MBTI_CONTENT.zh;
  const EC = ENN_CONTENT[lang]  ?? ENN_CONTENT.zh;
  const ZC = ZOD_CONTENT[lang]  ?? ZOD_CONTENT.zh;
  const m  = MC[mbti] ?? null;
  const e  = enn ? (EC[enn] ?? null) : null;
  const z  = (zodiacIdx >= 0 && zodiacIdx < ZC.length) ? ZC[zodiacIdx] : null;
  const sep = lang === "zh" ? "" : " ";
  let nameParts;
  if (m && e && z)     nameParts = [z.nameAdj, m.nameRoot, e.nameSuffix];
  else if (m && e)     nameParts = [m.nameRoot, e.nameSuffix];
  else if (m && z)     nameParts = [z.nameAdj, m.nameTag];
  else if (e && z)     nameParts = [z.nameAdj, e.nameTag];
  else if (m)          nameParts = [m.nameTag];
  else if (e)          nameParts = [e.nameTag];
  else if (z)          nameParts = [z.nameAdj, lang === "zh" ? "感知者" : "Perceiver"];
  else                 nameParts = [lang === "zh" ? "感知者" : "Perceiver"];
  return {
    name: nameParts.join(sep),
    tagline:  z?.tagline ?? e?.tagline ?? m?.tagline ?? "",
    core:     m?.core     ?? e?.core     ?? z?.core     ?? "",
    contrast: e?.contrast ?? m?.contrast ?? z?.contrast ?? "",
    mirror:   z?.mirror   ?? m?.mirror   ?? e?.mirror   ?? "",
    partner:  e?.partner  ?? m?.partner  ?? z?.partner  ?? "",
    career:   m?.career   ?? e?.career   ?? z?.career   ?? "",
  };
}

// eslint-disable-next-line no-unused-vars
const PROFILES_UNUSED = { zh: [
    // pid = picks[0]*4 + picks[1]  (Q1: 情感状态 × Q2: 最大困扰)
    // 0: 喜欢一个人 × 不知对方感受
    { name:"隐形磁力者", tagline:"你的吸引力，连你自己都还没意识到",
      core:    "你正在暗中牵挂一个人，却还在等一个确定的信号才愿意靠近。这不是犹豫，是你对真实感情的珍重——你不愿意在不确定的土地上押注全部的自己。",
      contrast:"你外表淡定，内心在高频运转。别人看到的是你的从容，你自己感受到的是那一点放不下的拉扯——两者同时存在，这叫有深度。",
      mirror:  "你对信号的敏感，往往让你比对方更早看到关系的走向。这是天赋，也是你需要学会接受模糊的地方——有些事情，是在靠近的过程里才能看清的。",
      partner: "你需要一个愿意先跨出一步的人——不是因为你不敢，而是因为你值得被主动选择。",
      career:  "你的敏锐和克制，是任何需要判断力的岗位的核心竞争力。信任你对人的直觉，它很少骗你。" },
    // 1: 喜欢一个人 × 感情越来越淡
    { name:"温柔坚守者", tagline:"你爱的方式，比结果更能定义你",
      core:    "你喜欢一个人，但感受到温度在下降。这种感知力是你最珍贵的特质——大多数人要到关系终结才意识到，你在它发生时就已经在思考了。",
      contrast:"你很少把不安说出口。不是因为你不在乎，是因为你不想用情绪给对方压力——这份体贴，很多人一生都遇不到。",
      mirror:  "你比任何人都更懂得在关系里保留空间。这让你成为极好的伴侣，但也让你有时候独自承担了太多——你可以开口的。",
      partner: "你需要一个能主动感知你状态的人，不需要你说出来，就知道来靠近你。",
      career:  "你的耐心和坚持是长线赛道的核心资产。任何需要积累信任的领域，都是你的主场。" },
    // 2: 喜欢一个人 × 分手想挽回
    { name:"深情复盘者", tagline:"你敢认真爱过，就敢再认真一次",
      core:    "你喜欢一个人，但你们之间也许有过一段还未理清的故事。你没有假装一切都清零，而是选择诚实地面对自己还在意——这需要很大的勇气。",
      contrast:"你表面上可以过得好好的，但对某个人的想念会在不设防的瞬间冒出来。这不是软弱，是你感情深度的证明。",
      mirror:  "你愿意承认自己还在乎，大多数人会躲进「其实无所谓了」的故事里，你没有。这份诚实，是你最稀缺的特质。",
      partner: "你需要一个能接住你这份认真的人——不觉得你沉重，反而觉得你珍贵。",
      career:  "你的复盘能力和不轻易放弃，在职场里会转化成别人没有的韧劲。失败不会打倒你，只会让你更准。" },
    // 3: 喜欢一个人 × 想更了解对方
    { name:"精准探索者", tagline:"你不是慢热，你是在确认值不值得",
      core:    "你喜欢一个人，但你需要先真正了解他们，才愿意全情投入。这是智慧，不是保守——你只是不想把心给错了地方。",
      contrast:"你研究一个人的方式，比对方意识到的要深很多。你已经看到了很多层，只是选择慢慢揭开——这份从容，是稀缺的成熟。",
      mirror:  "了解背后是你对关系质量的高标准。你宁愿等，也不愿意将就——这种自尊，最终会引导你去到真正值得的地方。",
      partner: "你需要一个禁得住被你了解的人——有深度、有内容、不怕你问问题。",
      career:  "研究型思维是你在任何领域的核武器。你永远比别人多准备一层，这在关键时刻是决定性的优势。" },
    // 4: 恋爱中 × 不知对方感受
    { name:"感知共鸣者", tagline:"你带着全部的自己进入每一段关系",
      core:    "你在恋爱中，但你比任何人都更认真地想知道对方内心真正的感受。这不是不安全感，是你对感情深度的追求——你想要的是真实的连接，不是表演。",
      contrast:"你爱得认真，有时候会在对方还没想清楚的问题上，已经想了很多遍了。这种深情，不是每个人都消受得起，能接住你的才是真的值得。",
      mirror:  "你在关系里给予的，往往多于你表现出来的。你的爱是沉默的、持续的——你以为普通，其实珍稀。",
      partner: "你需要一个愿意开口告诉你他在想什么的人。你值得真实的互动，而不是猜谜。",
      career:  "你对人的敏感是不可复制的资产——用户洞察、品牌策略、咨询、教育，你的情商是最大的护城河。" },
    // 5: 恋爱中 × 感情越来越淡
    { name:"清醒守护者", tagline:"你看得到别人视而不见的细节",
      core:    "你在恋爱中，却感受到了那种微妙的温度变化。这种觉察力是稀缺天赋——大多数人选择麻木，你选择面对。这份清醒，本身就是一种爱。",
      contrast:"你不是没有安全感，你是太清醒了。你知道关系是活的，需要维护——而这份认知本身，已经领先了大多数人。",
      mirror:  "你能感知到感情变淡这件事，说明你对这段关系的质量有真实的期待。期待本身，是你付出过的证明。",
      partner: "你需要一个把关系当成需要用心经营的东西的人——不是觉得「在一起了就OK了」。",
      career:  "品质感知、体验设计、关系运营——任何需要持续优化的赛道，都需要像你这样能感知细节变化的人。" },
    // 6: 恋爱中 × 分手想挽回（关系出现裂缝想修复）
    { name:"关系修复者", tagline:"你知道值得修的东西，就应该去修",
      core:    "你在一段关系中，但感觉到它需要你的主动介入。你没有逃避，而是选择面对——这种勇气比大多数人想象的稀有得多。",
      contrast:"你愿意为一段关系付出努力，哪怕不确定结果。这不是执念，是你对「真的在乎」的定义。你不把感情当消耗品。",
      mirror:  "你在关系里往往是那个先放下自尊先开口的人。不是因为你软弱，是因为你更在乎关系本身，而不是输赢——这是情感成熟度的表现。",
      partner: "你需要一个愿意和你一起修复、而不是等着你一个人撑的人。真正的关系是两个人都在为它负责。",
      career:  "谈判、调解、项目管理、客户关系——你天生知道怎么把破裂的东西修好，这是职场里的顶级技能。" },
    // 7: 恋爱中 × 想更了解对方
    { name:"深度连接者", tagline:"你的爱是一场持续深入的探索",
      core:    "你在恋爱中，但你还在继续了解对方——因为你知道，一个人的深度是探索不完的。这种好奇心，是让关系保持活力的秘密武器。",
      contrast:"你不满足于表面的相处，你想知道对方是什么、为什么、怎么想的。这让你成为一个极度用心的伴侣——这种人，很难遇到第二个。",
      mirror:  "你的好奇心保护了关系不被熟悉感淡化。你让对方在你面前永远有被重新发现的感觉——这是一种顶级的爱的能力。",
      partner: "你需要一个有层次的人——拆开一层还有一层，让你永远有东西可以探索。",
      career:  "研究、策略、深度写作——你最适合那些越深挖越有收获的工作。你的竞争力在于你总是比别人多想一步。" },
    // 8: 分手后 × 不知对方感受
    { name:"坦然重建者", tagline:"你的伤口里藏着你最深的力量",
      core:    "你走过了一段关系，但还不确定对方现在的感受。这种不确定，是你内心仍然关心这个人的证明——你是个有情有义的人，这本身就值得被珍视。",
      contrast:"你表面上能平静谈及这段经历，但内心仍然在梳理某些问题。这种细腻，让你比同龄人更懂得什么是真实的感情。",
      mirror:  "你没有选择切断和漠视，你选择了理解和梳理。这需要很高的情感成熟度——也是你比大多数人更适合深度关系的原因。",
      partner: "你需要一个愿意给你时间、不催你「快点好起来」的人。你的节奏是对的，不需要为任何人加速。",
      career:  "心理洞察、创作、咨询——你走过的弯路，是你日后帮助别人最宝贵的素材。经历，从来不是浪费。" },
    // 9: 分手后 × 感情越来越淡
    { name:"清醒离场者", tagline:"你没有崩溃，这本身就是实力",
      core:    "你经历了一段关系的降温，最终走到了结束。你对这个过程的清醒感知，说明你不是一个会欺骗自己的人——这是很高的自我诚实。",
      contrast:"你处理离别的方式比大多数人优雅。不是因为你不在乎，是因为你知道勉强没有意义——这种判断力，弥足珍贵。",
      mirror:  "你在感情里能感知到温度变化，是因为你对关系的质量有真实的标准。正是这种标准，保护了你不将就。",
      partner: "你需要一个从一开始就「对了」的人——不需要你去适应，不需要你磨合出一个凑合的版本。",
      career:  "你的清醒和自律，在职场里是稀缺品。能做到「放弃止损再出发」的人，是天然的领导者。" },
    // 10: 分手后 × 分手想挽回
    { name:"勇敢回望者", tagline:"想清楚再放手，比什么都值",
      core:    "你分手了，但你还没完全放下——因为你想弄清楚，这段关系是真的结束了，还是值得再试一次。这种认真，不是执念，是你对真实感情的负责。",
      contrast:"你没有假装自己不在乎，也没有因为「应该向前看」就强迫自己。你在自己的节奏里做决定——这需要很大的自我尊重。",
      mirror:  "你愿意承认自己想挽回，是需要很大勇气的。大多数人会躲进「其实也无所谓」里，你没有——这份诚实，是你最珍贵的部分。",
      partner: "你需要一个配得上你这份认真的人。如果对方配得上，你的勇气是开始；如果配不上，你同样有勇气放手。",
      career:  "复盘能力和不轻易放弃，会在职业里变成难以撼动的韧性。你不会在困难面前第一个离开。" },
    // 11: 分手后 × 想更了解对方
    { name:"深度疗愈者", tagline:"你用理解代替了怨恨",
      core:    "你在关系结束后，选择了去理解而不是去评判。这是一种情感成熟度——大多数人要花很多年才能明白你现在就在做的事。",
      contrast:"你在失去一段关系的时候，并没有失去对人的好奇心和善意。这说明你内心的宽广，超过了这段经历带来的伤。",
      mirror:  "你想了解对方，其实也是在了解自己。这种自我探索，是你未来建立更健康关系的基础——你走的每一步都算数。",
      partner: "你需要一个愿意被你了解、也愿意真正了解你的人。不是带着面具相处，而是两个真实的人真实地在一起。",
      career:  "心理学、教育、内容创作、用户研究——你对人性的好奇和理解，是这些领域里最难被替代的竞争力。" },
    // 12: 想找到对的人 × 不知对方感受
    { name:"直觉寻路者", tagline:"你对对的人，有自己的判断标准",
      core:    "你还在寻找那个对的人，同时面对感情信号的不确定。这种状态需要很大的耐心——而你愿意在不确定中等待，说明你知道自己要什么。",
      contrast:"你不是不想开始，你是不想开始一段错的。这种分辨力，保护了你不会把时间浪费在凑合的关系上——这是自尊。",
      mirror:  "你对自己的标准很清楚，哪怕有时候说不出来。你的直觉在帮你把关——信它，它在保护你。",
      partner: "你需要一个让你的直觉放松而不是警觉的人。对的人不会让你时刻猜测，而是让你感到理所当然的安心。",
      career:  "你在新环境里能快速判断谁值得信任、谁有真本事。这种人事判断力，在管理和创业领域是黄金技能。" },
    // 13: 想找到对的人 × 感情越来越淡
    { name:"真实追求者", tagline:"你知道自己要的是真的，不是勉强的",
      core:    "你在寻找那个对的人，但经历过感情降温的失落。这不是你的问题，是你的标准在帮你筛选——只有真正匹配的关系，才能保持温度。",
      contrast:"你从降温的经历里学到的，比很多人从顺利的关系里学到的更多。你知道什么是值得维持的温度，因为你见过什么不是。",
      mirror:  "你没有因为遇到过失落就降低标准。这说明你对真实连接的渴望是真的——你配得上那种值得坚持的温度。",
      partner: "你需要一个不需要你刻意维持热情的人——那种化学反应，要么天然就在，要么强求也没用。",
      career:  "你在工作里同样不将就。这会让你有时候换得比别人频繁，但每一次都更接近你真正想做的事。" },
    // 14: 想找到对的人 × 分手想挽回
    { name:"诚实面对者", tagline:"你从不对自己说谎，这才是真正的勇气",
      core:    "你还在寻找对的人，但内心对某段过去的感情还有牵挂。你没有假装这个不存在——这种诚实，是你做自己最珍贵的地方。",
      contrast:"你面对感情的方式是正视，不是回避。哪怕那意味着要承认自己还没走出来，你也不会装作已经过去了——这需要很大的自我尊重。",
      mirror:  "你对自己的感受很诚实，这让你在关系里也会是一个真实的伴侣。你不会假装，不会演戏——这太稀缺了。",
      partner: "你需要一个能接住你的真实的人——不因为你有过去就质疑你，而是因为你的诚实更加珍惜你。",
      career:  "你的诚实和不将就，会让你成为那种人们真正信任的人。信任，是一切职场资本的底层。" },
    // 15: 想找到对的人 × 想更了解对方
    { name:"从容选择者", tagline:"你把了解当成进入一段关系的前提",
      core:    "你想找到对的人，而且你愿意花时间真正了解对方再决定。这是最聪明的感情方式——感情的质量，取决于你选择的质量。",
      contrast:"你不是慢热，你是高效。你在了解一个人的过程里，就已经在做大多数人在关系开始后才做的事情了。",
      mirror:  "你的克制里藏着一种深深的自尊：你知道自己值得被认真对待，所以你也认真对待选择本身——这种人，是关系里最可靠的存在。",
      partner: "你需要一个耐得住你这份「了解」过程的人——越看越喜欢、而不是越看越怀疑的人。",
      career:  "战略规划、产品、投资——任何需要在行动前做深度判断的赛道，都是你的主场。你的耐心是最大的竞争优势。" },
  ],
  en: [
    // 0: Crushing × Don't know how they feel
    { name:"Invisible Magnet", tagline:"Your pull is stronger than you've let yourself believe",
      core:    "You're drawn to someone, but you're waiting for a clear signal before you move. That's not hesitation — that's respect for what real connection actually requires.",
      contrast:"Outwardly composed, internally running a hundred quiet calculations. What reads as mystery to others is just what caring looks like on you.",
      mirror:  "Your sensitivity to signals often means you see where things are heading before the other person does. That's a gift — and a reminder that some things only become clear in motion.",
      partner: "You need someone who chooses you first. Not because you can't initiate, but because you deserve to be pursued.",
      career:  "Precision, pattern-recognition, emotional intelligence — rare and valuable in any field. Your read on people is almost never wrong. Trust it." },
    // 1: Crushing × Fading
    { name:"Tender Guardian", tagline:"How you love defines you more than the outcome",
      core:    "You like someone, but the temperature feels like it's shifting. The fact that you notice — while most people numb out — is a form of emotional intelligence that takes others years to develop.",
      contrast:"You rarely voice the unease. Not because you don't feel it, but because you'd rather protect the space than fill it with pressure. That kind of care is rarer than you think.",
      mirror:  "You hold space for others in relationships. This makes you a remarkable partner — and sometimes means you carry more than your share. You're allowed to speak.",
      partner: "You need someone who checks in without being asked. Who notices when you've gone quiet and comes to find you.",
      career:  "Patience and consistency are your career superpower. Long games, trust-based relationships, compounding returns — that's your native terrain." },
    // 2: Crushing × Want to reconcile
    { name:"Honest Romantic", tagline:"You loved for real. You'll love that way again.",
      core:    "Someone you like may have been part of an unresolved chapter. You haven't pretended otherwise — and that honesty about what still matters is one of your rarest qualities.",
      contrast:"You can function fine. But certain moments still catch you. That's not fragility. That's the proof that you gave something real.",
      mirror:  "Admitting you still care takes courage most people don't have. Most retreat into 'I'm fine with it.' You didn't — and that honesty is your most valuable trait.",
      partner: "You need someone who doesn't find your depth heavy — who thinks it's the whole point of you.",
      career:  "Your ability to go back, re-examine, and try again will make you someone who doesn't quit when things get hard. That's irreplaceable." },
    // 3: Crushing × Want to understand them
    { name:"Precise Explorer", tagline:"You're not slow — you're making sure it's worth it",
      core:    "You like someone, but you need to actually know them before you go all in. That's not caution — that's wisdom. You just won't waste your whole heart on the wrong fit.",
      contrast:"You've already seen more layers than they realize. You're choosing when to reveal that you've been paying close attention — and that restraint is its own kind of confidence.",
      mirror:  "Your need to understand before you commit comes from high standards — for yourself and for what you build together. Those standards will protect you.",
      partner: "You need someone who holds up under examination. Layered, substantive, unafraid of your questions.",
      career:  "Research-mode thinking is your edge in any domain. You always come with one more layer of preparation than everyone else — and that's the layer that matters." },
    // 4: In a relationship × Don't know how they feel
    { name:"Resonance Seeker", tagline:"You bring all of yourself to every connection",
      core:    "You're in a relationship and you're still asking the deep questions about what the other person really feels. That's not insecurity — that's a commitment to real intimacy, not performed closeness.",
      contrast:"You love with real weight. Sometimes you've thought through something ten times before they've considered it once. That intensity is rare — and worth being received by the right person.",
      mirror:  "What you give in a relationship usually exceeds what you show. Your love is quiet and continuous — ordinary to you, extraordinary to whoever really receives it.",
      partner: "You need someone who opens up. Real reciprocity is what you're built for — not a one-sided connection.",
      career:  "Emotional intelligence, user insight, teaching, strategy — your ability to read people is a moat most competitors can't cross." },
    // 5: In a relationship × Fading
    { name:"Lucid Witness", tagline:"You see what others choose not to look at",
      core:    "You're in a relationship and you're feeling the temperature shift. That awareness — while most people numb it — is a form of integrity. You won't lie to yourself about what's happening.",
      contrast:"You're not anxious, you're awake. You know relationships need tending. That clarity is itself a form of love — and a thing most people only develop after much more loss.",
      mirror:  "Noticing the fade means you had real expectations about the quality of this connection. Those expectations aren't the problem — they're the measure of how much you've invested.",
      partner: "You need someone who treats the relationship like something worth actively building — not something that runs itself.",
      career:  "Quality perception, experience design, anything requiring sustained attention to what's actually happening — your perceptiveness is a professional advantage." },
    // 6: In a relationship × Want to reconcile
    { name:"Relationship Builder", tagline:"You know what's worth fixing — and you actually fix it",
      core:    "You're in a relationship and you're choosing to show up for it, even when it's hard. That decision — to stay and work — is one of the rarest things in modern relationships.",
      contrast:"You're willing to try even without guaranteed results. That's not sunk-cost thinking — that's what love actually looks like in practice, not just in theory.",
      mirror:  "You're usually the one who reaches out first, who makes peace first. Not because you lost — because you care more about the relationship than about being right.",
      partner: "You need someone who shows up to maintain things alongside you. Not someone you have to drag to the table alone.",
      career:  "Negotiation, repair, client relationships, management — you have an instinct for what makes things work again. That skill is worth a lot." },
    // 7: In a relationship × Want to understand them
    { name:"Deep Connector", tagline:"Your love is a sustained and willing investigation",
      core:    "You're in a relationship and still discovering the person you're with — because you know people have more depth than most relationships bother to reach. That curiosity is what makes relationships last.",
      contrast:"You don't settle for surface-level understanding. You want the why behind the what. That makes you an extraordinarily attentive partner — the kind people realize they've been waiting for.",
      mirror:  "Your curiosity protects relationships from going stale. You make the people you're with feel continually seen — and that's not a small thing at all.",
      partner: "You need someone with layers. Who keeps surprising you. Who is interesting enough that you never quite finish figuring them out.",
      career:  "Research, strategy, deep writing — you thrive in work that rewards digging. The more complex the problem, the more advantage you have over everyone else." },
    // 8: After breakup × Don't know how they feel
    { name:"Grounded Rebuilder", tagline:"Your wound holds your deepest strength",
      core:    "You've moved through a relationship and you're still thinking about what the other person feels. Caring about that answer shows integrity — you're not someone who disappears from things that mattered.",
      contrast:"You can talk about it calmly now, but there are still things you're working through quietly. That depth of processing is exactly what makes you someone who actually learns from experience.",
      mirror:  "You chose understanding over numbness. That takes emotional maturity most people only reach after much more pain — and it's what makes you someone worth being close to.",
      partner: "You need someone who gives you time. Who doesn't rush your processing or hand you a timeline for being fine.",
      career:  "Insight, writing, coaching, research — what you've lived through is exactly what makes your understanding of others irreplaceable." },
    // 9: After breakup × Fading
    { name:"Clear-Eyed Leaver", tagline:"Not falling apart was the whole point",
      core:    "You felt the relationship cooling and stayed honest with yourself about it — eventually making peace with the ending. That self-honesty is a rare and quietly powerful form of self-respect.",
      contrast:"You handle endings with more grace than most people manage. Not because you care less, but because you know that forcing something past its time honors no one.",
      mirror:  "Feeling the fade and responding to it honestly means you have real standards for connection — and real respect for your own time and heart.",
      partner: "You need someone who feels right from the beginning. Not someone you have to talk yourself into, or reshape into what you need.",
      career:  "The ability to cut losses and redirect is one of the most valuable leadership skills there is. You have it naturally — and that's not common." },
    // 10: After breakup × Want to reconcile
    { name:"Courageous Returner", tagline:"You think it through before you let go",
      core:    "You've gone through a breakup, but you're not sure it's truly over — because you want to be certain before you close the door. That deliberateness is integrity, not stubbornness.",
      contrast:"You didn't retreat into 'I don't care anymore.' That would have been easier. Instead you're being honest about what you feel — which takes more courage than most people give themselves.",
      mirror:  "Admitting you want to try again requires real vulnerability. Most people protect themselves by pretending they're already fine. You're not pretending — and that honesty is your best asset.",
      partner: "You need someone who deserves this level of seriousness. If they do — your courage is the start of something real. If they don't — you'll know how to walk away with the same strength.",
      career:  "Resilience and the ability to revisit and recalibrate turn into a professional durability that outlasts people who only know how to move forward." },
    // 11: After breakup × Want to understand them
    { name:"Meaning-Maker", tagline:"You chose understanding over resentment",
      core:    "After this relationship ended, you chose to understand rather than blame. That's a form of emotional maturity that takes most people years — sometimes decades — to reach.",
      contrast:"You didn't lose your curiosity about people even after being hurt. Your openness survived the experience. That's a form of emotional strength that rarely gets the credit it deserves.",
      mirror:  "Understanding them is also a way of understanding yourself. This kind of reflection is the foundation of every future relationship you'll build with more wisdom and less armor.",
      partner: "You need someone who can be fully known — and who wants to fully know you. No performance, no managed image. Two real people.",
      career:  "Psychology, education, content, research — your deep understanding of human behavior is the hardest thing to hire for and the most valuable thing to have." },
    // 12: Looking × Don't know how they feel
    { name:"Intuitive Pathfinder", tagline:"You're not lost — you know exactly what you're looking for",
      core:    "You're looking for the right person, navigating uncertainty about someone's feelings right now. Your patience in this ambiguity isn't weakness — it's evidence that you know what you're worth waiting for.",
      contrast:"You're not avoiding commitment. You're avoiding the wrong commitment. That distinction is what separates people who end up in the right place from people who just end up anywhere.",
      mirror:  "Your standards are clear even when they're unspoken. Your gut is doing quality control — and it's been right before. Trust it.",
      partner: "You need someone whose presence relaxes you rather than puts you on alert. The right person won't require this much scrutiny — they'll just feel different.",
      career:  "Reading people, environments, and opportunities quickly is your native skill. In leadership and entrepreneurship, that judgment separates the exceptional from everyone else." },
    // 13: Looking × Fading
    { name:"Authentic Pursuer", tagline:"You know the difference between real and settling",
      core:    "You're looking for the right person, and you've experienced connection cooling before. That's not a pattern of failure — it's your instincts doing their job, filtering out the wrong fits.",
      contrast:"You've learned more from the connections that faded than many people learn from the ones that lasted. You know now exactly what the absence of real fit feels like — and you won't accept it again.",
      mirror:  "You haven't lowered your standards to avoid the uncertainty. That's self-respect in action. You know what real feels like, and you're not going to fake it.",
      partner: "You need someone whose presence naturally sustains warmth — not because you're managing it, but because the chemistry is actually there from the start.",
      career:  "You apply this same standard to your work — moving when something isn't right, staying when it is. Each move takes you closer to where your work actually means something." },
    // 14: Looking × Want to reconcile
    { name:"Honest Seeker", tagline:"You don't lie to yourself — and that's real power",
      core:    "You're still looking for the right person, and there's something from a past connection you haven't fully set down yet. You're not pretending otherwise — and that honesty about your inner state is genuinely rare.",
      contrast:"You face your feelings rather than outrun them. Even when that means admitting you're not completely over something, you'd rather be true than performatively fine.",
      mirror:  "Your emotional honesty means you'll show up as a real person in your next relationship — not a managed version of yourself. That's the basis for something actually lasting.",
      partner: "You need someone who receives your honesty as a gift, not a complication. Someone who trusts you more because you tell the truth about yourself.",
      career:  "Your integrity and refusal to fake it will build you a reputation as someone genuinely trustworthy — which is the most durable career asset there is." },
    // 15: Looking × Want to understand them
    { name:"Deliberate Chooser", tagline:"You treat understanding as a prerequisite, not a phase",
      core:    "You want to find the right person, and you take your time getting to know someone before deciding. That's not hesitation — that's the most efficient approach to love there is.",
      contrast:"You're not slow. You're doing the work upfront that most people avoid — and ending up in clearer, more honest connections as a result.",
      mirror:  "The restraint behind your approach comes from deep self-respect: you know you deserve to be chosen carefully, so you choose carefully too. That's the kind of person relationships are built on.",
      partner: "You need someone who gets more interesting the more you know them. Who rewards your patience with depth — not someone whose appeal fades under closer examination.",
      career:  "Strategy, investing, product development, long-arc planning — fields that require patience and judgment before action are your native habitat. Your competitive advantage is that you actually think first." },
  ],
};

// ─── ASSESS PAGE ──────────────────────────────────────────────────────────────
// NOTE: PROFILES_UNUSED above is a legacy stub — buildQuizProfile/buildExistingProfile replace it
function AssessPage({ t, th, lang, onPaymentSuccess }) {
  const SAVED_KEY = "revery_profile_v2";
  const mFont = lang === "en" ? SANS : MONO;
  const isMobile = useIsMobile();
  const loadSaved = () => { try { return JSON.parse(localStorage.getItem(SAVED_KEY)); } catch { return null; } };

  const [savedData]   = useState(loadSaved);
  const [screen,      setScreen]     = useState(savedData?.source ? "result" : "choose");
  const [wxMaint,     setWxMaint]    = useState(false);
  const [picks,       setPicks]      = useState(Array(4).fill(null));
  const [mbti,        setMbti]       = useState("");
  const [enneagram,   setEnneagram]  = useState("");
  const [zodiacIdx,   setZodiacIdx]  = useState(-1);
  const [profileData, setProfileData] = useState(savedData?.source ? savedData : null);

  const getProfile = (pd, lg) => {
    if (!pd) return null;
    if (pd.source === "quiz" && pd.picks) return buildQuizProfile(pd.picks, lg);
    if (pd.source === "existing") return buildExistingProfile(pd.mbti || "", pd.enn || "", pd.zodiacIdx ?? -1, lg);
    return null;
  };
  const profile = getProfile(profileData, lang);

  const saveAndShow = (data) => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(data));
    setProfileData(data);
    setScreen("result");
  };

  const retake = () => {
    localStorage.removeItem(SAVED_KEY);
    setScreen("choose");
    setProfileData(null);
    setPicks(Array(4).fill(null));
    setMbti("");
    setEnneagram("");
    setZodiacIdx(-1);
  };

  const finishQuiz = (finalPicks) =>
    saveAndShow({ source: "quiz", picks: finalPicks });

  const submitExisting = () =>
    saveAndShow({ source: "existing", mbti: mbti.trim().toUpperCase(), enn: enneagram.trim(), zodiacIdx });

  // ── Result ────────────────────────────────────────────────────────────────
  if (screen === "result" && profile) {
    const PaymentBlock = () => (
      <div style={{ marginTop: 16, background: th.card, border: `0.5px solid ${th.border}`, borderRadius: 10, padding: "16px 18px" }}>
        {t.premCopy.split("\n").map((line, i) => (
          <p key={i} style={{ fontSize: i === 0 ? 14 : 12, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? th.text : th.mid, lineHeight: 1.65, margin: "0 0 6px", fontFamily: SANS }}>{line}</p>
        ))}
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button onClick={() => window.open("https://buy.stripe.com/test_7sYeVecaCgpYfIicuwfYY00", "_blank")} style={{ flex: 1, padding: "10px 0", background: "#635BFF", border: "none", borderRadius: 7, color: "white", fontSize: 13, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>{t.payCard}</button>
          <button onClick={() => setWxMaint(true)} style={{ flex: 1, padding: "10px 0", background: "#07C160", border: "none", borderRadius: 7, color: "white", fontSize: 13, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>{t.payWX}</button>
        </div>
      </div>
    );

    // ── Quiz source: medical report format ──────────────────────────────────
    if (profileData?.source === "quiz" && profileData.picks) {
      const picks = profileData.picks;
      const QC = (lang === "en" ? QUIZ_CONTENT.en : QUIZ_CONTENT.zh);
      const caseNo = `LBDC-${new Date().getFullYear()}-${String(picks[0]*64+picks[1]*16+picks[2]*4+picks[3]).padStart(3,"0")}`;
      const today = new Date().toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", { year:"numeric", month:"long", day:"numeric" });
      const doctorNote = QC.doctorNote[picks[0]];
      const totalScore = picks[0]*3 + picks[1]*2 + picks[2]*2 + picks[3];
      const lbPct = 28 + Math.round((totalScore / 24) * 62);
      const reasonPct = 100 - lbPct;
      const riskIdx = Math.min(3, Math.floor((picks[0] + picks[2]) / 2));
      const infectIdx = picks[3];
      // radar chart
      const radarCx = 60, radarCy = 65, radarR = 50, radarN = 5;
      const radarVals = [
        Math.max(0.12, picks[0] / 3),
        Math.max(0.12, picks[1] / 3),
        Math.max(0.12, picks[2] / 3),
        Math.max(0.12, picks[3] / 3),
        Math.max(0.12, lbPct / 90),
      ];
      const radarLabels = lang === "zh"
        ? ["执着", "解读", "监测", "动机", "风险"]
        : ["Attach", "Decode", "Track", "Motive", "Risk"];
      const radarPt = (i, scale) => {
        const a = -Math.PI / 2 + i * (2 * Math.PI / radarN);
        return [radarCx + radarR * scale * Math.cos(a), radarCy + radarR * scale * Math.sin(a)];
      };
      const radarGrid = (scale) => Array.from({ length: radarN }, (_, i) => radarPt(i, scale).join(",")).join(" ");
      const radarData = radarVals.map((v, i) => radarPt(i, v).join(",")).join(" ");
      const Row = ({ label, children, accent, grow = 1 }) => (
        <div style={{ borderTop: `0.5px solid ${th.border}`, padding: isMobile ? "8px 12px" : "8px 16px", flex: isMobile ? "none" : grow, display: "flex", flexDirection: "column", overflow: "visible" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", color: CRIMSON, fontWeight: 700, fontFamily: MONO, marginBottom: 4, textTransform: "uppercase", flexShrink: 0 }}>{label}</div>
          {children}
        </div>
      );
      return (
        <>
        <Modal show={wxMaint} onClose={() => setWxMaint(false)} th={th}>
          <div style={{ textAlign: "center", fontSize: 28, marginBottom: 10 }}>🔧</div>
          <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 8, textAlign: "center" }}>{t.wxMaintTitle}</div>
          <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS, marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>{t.wxMaintSub}</div>
          <button onClick={() => setWxMaint(false)} style={{ width: "100%", padding: "12px 0", background: "transparent", border: `1px solid ${th.border}`, borderRadius: 7, color: th.text, fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>{t.wxMaintBack}</button>
        </Modal>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", padding: `8px ${isMobile ? 8 : 20}px 8px` }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "auto", width: "100%", maxWidth: isMobile ? undefined : 1200, margin: isMobile ? undefined : "0 auto" }}>
            {/* Report card */}
            <div style={{ flex: isMobile ? "none" : 1, border: `1px solid ${th.border}`, borderRadius: 10, overflow: "visible", background: th.surface, display: "flex", flexDirection: "column" }}>
              {/* Header */}
              <div style={{ background: CRIMSON, padding: "9px 18px", textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: "white", fontFamily: SANS, letterSpacing: "0.04em" }}>{t.reportCenter}</div>
              </div>
              {/* Case info */}
              <div style={{ padding: "4px 18px", background: th.card, display: "flex", justifyContent: "space-between", flexShrink: 0, borderBottom: `0.5px solid ${th.border}` }}>
                <div style={{ fontSize: 9, color: th.dim, fontFamily: MONO }}>{caseNo}</div>
                <div style={{ fontSize: 9, color: th.dim, fontFamily: MONO }}>{today}</div>
              </div>
              {/* Vital stats */}
              <div style={{ padding: "5px 18px", background: th.card, borderBottom: `0.5px solid ${th.border}`, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: 7.5, color: th.dim, fontFamily: MONO, letterSpacing: "0.10em", whiteSpace: "nowrap" }}>{t.reportLBConc}</div>
                  <div style={{ flex: 1, height: 4, background: th.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${lbPct}%`, height: "100%", background: CRIMSON }} />
                  </div>
                  <div style={{ fontSize: 12, fontFamily: MONO, color: CRIMSON, fontWeight: 700 }}>{lbPct}%</div>
                </div>
                <div style={{ display: "flex", flexWrap: isMobile ? "wrap" : "nowrap" }}>
                  {[
                    { label: t.reportReason, val: `${reasonPct}%`, color: th.text },
                    { label: t.reportRisk, val: t.reportRiskLevels[riskIdx], color: CRIMSON },
                    { label: t.reportInfect, val: t.reportInfectLevels[infectIdx], color: th.text },
                    { label: t.reportPhysician, val: "Dr. R. Labs", color: th.mid },
                  ].map(({ label, val, color }, i) => (
                    <div key={i} style={{ flex: isMobile ? "0 0 50%" : 1, borderLeft: (!isMobile && i > 0) ? `0.5px solid ${th.border}` : "none", paddingLeft: (!isMobile && i > 0) ? 10 : 0, marginTop: isMobile && i >= 2 ? 4 : 0 }}>
                      <div style={{ fontSize: 7, color: th.dim, fontFamily: MONO, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 1 }}>{label}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: MONO }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Body: two-column on desktop, single-column on mobile */}
              <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: isMobile ? "column" : "row", overflow: "visible" }}>
                {/* Left column */}
                <div style={{ flex: isMobile ? "none" : "0 0 38%", display: "flex", flexDirection: "column", borderRight: isMobile ? "none" : `0.5px solid ${th.border}`, borderBottom: isMobile ? `0.5px solid ${th.border}` : "none" }}>
                  <Row label={t.reportDiag} accent grow={0.65}>
                    <div style={{ position: "relative" }}>
                      <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: CRIMSON, fontFamily: SANS, lineHeight: 1.1, marginBottom: 4, paddingRight: 44 }}>{profile.name}</div>
                      <div style={{ position: "absolute", top: 0, right: 0, border: `2px solid ${CRIMSON}`, borderRadius: 4, padding: "5px 10px", transform: "rotate(12deg)", opacity: 0.6 }}>
                        <span style={{ fontSize: 13, fontFamily: MONO, color: CRIMSON, fontWeight: 700, letterSpacing: "0.14em" }}>{t.reportStamp}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: th.mid, fontFamily: SANS, lineHeight: 1.4 }}>{profile.tagline}</div>
                  </Row>
                  <Row label={lang === "zh" ? "情绪雷达" : "Psych Radar"} grow={1.8}>
                    {(() => {
                      const levelZh = [["稳定","波动","显著","极端"],["正常","轻度","中度","重度"],["未见","偶发","持续","全面"],["自发","外诱","主动","确认"]];
                      const levelEn = [["Stable","Mild","Notable","Extreme"],["Normal","Slight","Moderate","Severe"],["None","Sporadic","Ongoing","Total"],["Casual","Prompted","Aware","Certain"]];
                      return (
                        <div style={{ flex: isMobile ? "none" : 1, height: isMobile ? 180 : 220, display: "flex", gap: 10, alignItems: "stretch", paddingTop: 4 }}>
                          {/* SVG — fixed 48% of row width */}
                          <div style={{ flex: "0 0 48%", minWidth: 0, minHeight: 0 }}>
                            <svg viewBox="-10 -8 140 145" width="100%" height="100%" style={{ display: "block" }} preserveAspectRatio="xMidYMid meet">
                              {[0.33, 0.66, 1].map(s => (
                                <polygon key={s} points={radarGrid(s)} fill="none" stroke={th.border} strokeWidth={0.9} />
                              ))}
                              {Array.from({ length: radarN }, (_, i) => {
                                const [x, y] = radarPt(i, 1);
                                return <line key={i} x1={radarCx} y1={radarCy} x2={x} y2={y} stroke={th.border} strokeWidth={0.9} />;
                              })}
                              <polygon points={radarData} fill={CRIMSON} fillOpacity={0.18} stroke={CRIMSON} strokeWidth={1.8} strokeLinejoin="round" />
                              {radarVals.map((v, i) => {
                                const [x, y] = radarPt(i, v);
                                return <circle key={i} cx={x} cy={y} r={2.5} fill={CRIMSON} />;
                              })}
                              {radarLabels.map((label, i) => {
                                const [x, y] = radarPt(i, 1.3);
                                return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={7} fontFamily={MONO} fill={th.text}>{label}</text>;
                              })}
                            </svg>
                          </div>
                          {/* Metrics — flex 1, fills remaining space */}
                          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-around" }}>
                            {radarLabels.map((label, i) => {
                              const pct = Math.round(radarVals[i] * 100);
                              const isRisk = i === 4;
                              const lvl = i < 4
                                ? (lang === "zh" ? levelZh[i] : levelEn[i])[picks[i]]
                                : (lang === "zh" ? t.reportRiskLevels : ["Low","Mid","High","Critical"])[riskIdx];
                              return (
                                <div key={i}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                    <span style={{ fontSize: 11, fontFamily: MONO, color: th.text, letterSpacing: "0.06em" }}>{label}</span>
                                    <span style={{ fontSize: 11, fontFamily: MONO, color: isRisk ? CRIMSON : th.text }}>{lvl}</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                    <div style={{ flex: 1, height: 6, background: th.border, borderRadius: 3, overflow: "hidden" }}>
                                      <div style={{ width: `${pct}%`, height: "100%", background: isRisk ? CRIMSON : th.mid }} />
                                    </div>
                                    <span style={{ fontSize: 12, fontFamily: MONO, fontWeight: 700, color: isRisk ? CRIMSON : th.text, flexShrink: 0 }}>{pct}%</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </Row>
                </div>
                {/* Right column */}
                <div style={{ flex: isMobile ? "none" : 1, display: "flex", flexDirection: "column" }}>
                  <Row label={t.reportDoctorNote} grow={1.6}>
                    <div style={{ fontSize: 11, color: th.text, fontFamily: SANS, lineHeight: 1.65, fontStyle: "italic" }}>{doctorNote}</div>
                  </Row>
                  <Row label={t.reportSymptom} grow={1.5}>
                    <div style={{ fontSize: 11, color: th.text, fontFamily: SANS, lineHeight: 1.65 }}>{profile.core}</div>
                  </Row>
                  <Row label={t.reportAnalysis} grow={1.5}>
                    <div style={{ fontSize: 11, color: th.text, fontFamily: SANS, lineHeight: 1.65 }}>{profile.contrast}</div>
                  </Row>
                  <Row label={t.reportSideProfile} grow={1.3}>
                    <div style={{ fontSize: 11, color: th.text, fontFamily: SANS, lineHeight: 1.65 }}>{profile.mirror}</div>
                  </Row>
                  <Row label={t.reportRx} grow={1.3}>
                    <div style={{ fontSize: 11, color: th.text, fontFamily: SANS, lineHeight: 1.65 }}>{profile.partner}</div>
                  </Row>
                  <Row label={t.reportPrognosis} grow={1}>
                    <div style={{ fontSize: 11, color: th.text, fontFamily: SANS, lineHeight: 1.65 }}>{profile.career}</div>
                  </Row>
                </div>
              </div>
              {/* Footer */}
              <div style={{ borderTop: `0.5px solid ${th.border}`, padding: "8px 18px", display: "flex", alignItems: "center", flexShrink: 0 }}>
                <div style={{ flex: 1, fontSize: 11, color: th.dim, fontFamily: SANS, letterSpacing: "0.02em", textAlign: "center" }}>{t.reportFooter}</div>
                {/* Revery Labs circular seal */}
                <svg width={68} height={68} viewBox="0 0 100 100" style={{ flexShrink: 0, opacity: 0.5, transform: "rotate(-18deg)", marginRight: -6 }}>
                  <defs>
                    <path id="rl-seal-top" d="M 7,50 A 43,43 0 0,0 93,50" />
                    <path id="rl-seal-bot" d="M 7,50 A 43,43 0 0,1 93,50" />
                  </defs>
                  <circle cx={50} cy={50} r={47} fill="none" stroke={CRIMSON} strokeWidth="3" />
                  <circle cx={50} cy={50} r={38} fill="none" stroke={CRIMSON} strokeWidth="1" />
                  <text fontSize="8" fontFamily={MONO} fill={CRIMSON} fontWeight="700" letterSpacing="2.5">
                    <textPath href="#rl-seal-top" startOffset="50%" textAnchor="middle">REVERY LABS</textPath>
                  </text>
                  <text fontSize="7" fontFamily={MONO} fill={CRIMSON} letterSpacing="1.5">
                    <textPath href="#rl-seal-bot" startOffset="50%" textAnchor="middle">恋爱脑诊断中心</textPath>
                  </text>
                  <text x={50} y={43} textAnchor="middle" dominantBaseline="central" fontSize="20" fontFamily={MONO} fill={CRIMSON} fontWeight="800">RL</text>
                  <text x={50} y={61} textAnchor="middle" dominantBaseline="central" fontSize="10" fontFamily={MONO} fill={CRIMSON} letterSpacing="4">✦</text>
                </svg>
              </div>
            </div>
            {/* Retake */}
            <button onClick={retake}
              style={{ flexShrink: 0, width: "100%", marginTop: 8, padding: "14px 0", background: CRIMSON, border: "none", borderRadius: 8, color: "white", fontSize: 15, cursor: "pointer", fontFamily: mFont, letterSpacing: "0.08em", transition: "opacity 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
            >{t.reportRetake}</button>
            <PaymentBlock />
          </div>
        </div>
        </>
      );
    }

    // ── Existing profile: standard card format ───────────────────────────────
    const extraTag = [profileData?.mbti, profileData?.enn, profileData?.zodiacIdx >= 0 ? t.zodiacs[profileData.zodiacIdx] : ""].filter(Boolean).join(" · ");
    return (
      <>
      <Modal show={wxMaint} onClose={() => setWxMaint(false)} th={th}>
        <div style={{ textAlign: "center", fontSize: 28, marginBottom: 10 }}>🔧</div>
        <div style={{ fontFamily: SANS, fontSize: 18, fontWeight: 700, color: th.text, marginBottom: 8, textAlign: "center" }}>{t.wxMaintTitle}</div>
        <div style={{ fontSize: 13, color: th.dim, fontFamily: SANS, marginBottom: 24, lineHeight: 1.6, textAlign: "center" }}>{t.wxMaintSub}</div>
        <button onClick={() => setWxMaint(false)} style={{ width: "100%", padding: "12px 0", background: "transparent", border: `1px solid ${th.border}`, borderRadius: 7, color: th.text, fontSize: 14, cursor: "pointer", fontFamily: SANS, fontWeight: 600 }}>{t.wxMaintBack}</button>
      </Modal>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Fixed top: profile header only */}
        <div style={{ padding: "20px 24px 16px", flexShrink: 0, background: th.bg, borderBottom: `0.5px solid ${th.border}` }}>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.2em", color: th.dim, fontFamily: SANS }}>{t.profileLabel.toUpperCase()}</div>
              {extraTag && <div style={{ fontSize: 10, color: th.dim, fontFamily: SANS }}>{extraTag}</div>}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 32, fontWeight: 700, color: CRIMSON, lineHeight: 1.1, marginBottom: 4 }}>{profile.name}</div>
            <div style={{ fontSize: 14, color: th.mid, fontFamily: SANS }}>{profile.tagline}</div>
          </div>
        </div>

        {/* Scrollable: sections → retake → payment */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 28px" }}>
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            {t.sectionTitles.map((title, i) => {
              const content = profile[SECTION_KEYS[i]];
              if (!content) return null;
              return (
                <div key={i} style={{ padding: "16px 0", borderTop: `0.5px solid ${th.border}` }}>
                  <div style={{ fontSize: 10, letterSpacing: "0.18em", color: CRIMSON, fontFamily: mFont, marginBottom: 8, textTransform: "uppercase", opacity: 0.75 }}>{title}</div>
                  <div style={{ fontSize: 14, color: th.text, lineHeight: 1.9, fontFamily: SANS }}>{content}</div>
                </div>
              );
            })}

            {/* Retake */}
            <div style={{ paddingTop: 20, borderTop: `0.5px solid ${th.border}` }}>
              <button onClick={retake} style={{ width: "100%", padding: "14px 0", background: CRIMSON, border: "none", borderRadius: 8, color: "white", fontSize: 15, cursor: "pointer", fontFamily: mFont, letterSpacing: "0.08em", transition: "opacity 0.15s" }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >{t.retake}</button>
            </div>

            {/* Payment CTA */}
            <PaymentBlock />
          </div>
        </div>
      </div>
      </>
    );
  } // end result

  // ── Choose mode ───────────────────────────────────────────────────────────
  if (screen === "choose") return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, gap: 28 }}>
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
    const mbtiValid = MBTI_OPTIONS.includes(mbtiUpper);
    const ennValid  = ENNEA_OPTIONS.includes(enneagram.trim());
    const canSubmit = mbtiValid || ennValid || zodiacIdx >= 0;
    const fieldStyle = (active) => ({
      width: "100%", boxSizing: "border-box",
      background: th.input, border: `0.5px solid ${active ? CRIMSON : th.border}`,
      borderRadius: 6, padding: "11px 14px", color: th.text,
      fontSize: 14, fontFamily: mFont, outline: "none", transition: "border-color 0.2s",
    });
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <button onClick={() => setScreen("choose")} style={{ background: "none", border: "none", color: th.dim, cursor: "pointer", fontSize: 15, fontFamily: mFont, marginBottom: 24, padding: 0 }}>
            {t.back}
          </button>
          <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, color: th.text, marginBottom: 24 }}>
            {t.chooseExisting}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: th.text, fontFamily: SANS, marginBottom: 6 }}>{t.mbtiLabel}</div>
              <select value={mbti} onChange={(e) => setMbti(e.target.value)}
                style={{ ...fieldStyle(mbti && mbtiValid), appearance: "none", cursor: "pointer", color: mbti ? th.text : th.dim, fontFamily: SANS }}>
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
              <select value={zodiacIdx} onChange={(e) => setZodiacIdx(parseInt(e.target.value))}
                style={{ ...fieldStyle(false), appearance: "none", cursor: "pointer", color: zodiacIdx >= 0 ? th.text : th.dim }}>
                <option value={-1}>{t.zodPH}</option>
                {t.zodiacs.map((z, i) => <option key={i} value={i}>{z}</option>)}
              </select>
            </div>
            <button onClick={submitExisting} disabled={!canSubmit} style={{
              width: "100%", padding: "13px 0", marginTop: 8,
              background: CRIMSON, border: "none", borderRadius: 7,
              color: "white", fontSize: 15,
              cursor: canSubmit ? "pointer" : "default", fontFamily: mFont, letterSpacing: "0.1em",
              opacity: canSubmit ? 1 : 0.38, transition: "opacity 0.2s",
            }}>
              {t.submitView}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz — 2×2 quadrant layout ────────────────────────────────────────────
  const canSubmit = picks.every((p) => p !== null);
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: isMobile ? 16 : 32, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 560 }}>
        <button onClick={() => setScreen("choose")} style={{
          background: "none", border: "none", color: th.dim, cursor: "pointer",
          fontSize: 15, fontFamily: mFont, marginBottom: 24, padding: 0,
        }}>{t.back}</button>

        <div style={{ fontFamily: SANS, fontSize: 22, fontWeight: 600, color: th.text, marginBottom: 24 }}>
          {t.chooseQuiz}
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gridTemplateRows: "auto",
          gridAutoFlow: "row",
          gap: 14,
          marginBottom: 16,
        }}>
          {t.qs.map((q, qi) => (
              <div key={qi} style={{
                display: "flex", flexDirection: "column", padding: "12px 16px",
                border: `0.5px solid ${th.border}`, borderRadius: 10,
              }}>
                <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: th.text, marginBottom: 8, lineHeight: 1.3 }}>
                  <span style={{ color: CRIMSON, fontFamily: mFont, fontSize: 15, marginRight: 6, opacity: 0.7 }}>{qi + 1}</span>
                  {q.q}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                  {q.o.map((opt, oi) => {
                    const sel = picks[qi] === oi;
                    return (
                      <div key={oi} onClick={() => setPicks((prev) => { const n = [...prev]; n[qi] = oi; return n; })} style={{
                        height: 34, width: isMobile ? "100%" : undefined, maxWidth: isMobile ? "none" : 280, padding: "0 10px",
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

        <button onClick={() => canSubmit && finishQuiz(picks)} disabled={!canSubmit} style={{
          width: "100%", padding: "13px 0",
          background: CRIMSON, border: "none", borderRadius: 7,
          color: "white", fontSize: 15,
          cursor: canSubmit ? "pointer" : "default", fontFamily: mFont, letterSpacing: "0.1em",
          opacity: canSubmit ? 1 : 0.38, transition: "opacity 0.2s",
        }}>
          {t.viewRes}
        </button>
      </div>
    </div>
  );
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
          max_tokens: 1024,
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
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-haiku-4-5", max_tokens: 2048, system: sysPrompt, messages: history }),
      });
      if (!response.ok) { const err = await response.json(); throw new Error(err.error?.message || response.statusText); }
      const data = await response.json();
      setAnalyzeMessages((prev) => [...prev, { role: "assistant", text: data.content[0].text }]);
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
  const [dark,    setDark]    = useState(false);
  const [lang,    setLang]    = useState("zh");
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
    setPage("app");
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
    <div style={{ height: "100dvh", minHeight: "100vh", display: "flex", flexDirection: "column", background: th.bg, color: th.text, fontFamily: SANS, overflow: "hidden" }}>
      <Header
        page={page} onNavChange={handleNavChange}
        dark={dark} setDark={setDark}
        lang={lang} setLang={setLang}
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

      <PaywallModal show={showPaywall} onClose={() => setShowPaywall(false)} onPay={() => { setShowPaywall(false); handlePaymentSuccess(); }} th={th} t={t} />
      <RegisterModal show={showRegister} onClose={() => setShowRegister(false)} onRegister={handleRegister} th={th} t={t} />
      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} onLogin={handleLogin} th={th} t={t} />
      <Analytics />
    </div>
  );
}
