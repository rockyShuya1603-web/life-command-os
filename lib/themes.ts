export type ThemeKey =
  | "mirai"
  | "hanabi"
  | "natsumatsuri"
  | "umi"
  | "sakura"
  | "yukata"
  | "ichimatsu"
  | "asanoha"
  | "hoshizora"
  | "aurora"
  | "sunset"
  | "forest"
  | "cyber"
  | "morning"
  | "deepfocus"
  | "paper";

export const themes = {
  mirai: {
    name: "未来",
    emoji: "🌐",
    bg: "from-[#020617] via-[#082f72] to-[#020617]",
    card: "bg-sky-950/35 border-sky-200/25 shadow-sky-400/10",
    accent: "from-sky-200 via-blue-300 to-indigo-300",
    image: "/future-bg.png?v=20260521-future-v14",
    pattern: "radial-gradient(circle at 50% 0%, rgba(125,211,252,.24), transparent 40%), radial-gradient(circle at 80% 20%, rgba(129,140,248,.18), transparent 36%)",
  },
  hanabi: {
    name: "花火",
    emoji: "🎆",
    bg: "from-[#020617] via-[#1e1b4b] to-black",
    card: "bg-black/45 border-cyan-300/20 shadow-cyan-500/10",
    accent: "from-cyan-300 to-fuchsia-300",
    pattern: "radial-gradient(circle at 20% 20%, rgba(103,232,249,.20) 0 2px, transparent 3px), radial-gradient(circle at 80% 30%, rgba(240,171,252,.16) 0 2px, transparent 3px)",
  },
  natsumatsuri: {
    name: "夏祭り",
    emoji: "🏮",
    bg: "from-[#1c0903] via-[#4a1a0a] to-black",
    card: "bg-black/45 border-orange-300/20 shadow-orange-500/10",
    accent: "from-orange-300 to-red-300",
    pattern: "linear-gradient(90deg, rgba(251,146,60,.10) 1px, transparent 1px), linear-gradient(rgba(251,146,60,.08) 1px, transparent 1px)",
  },
  umi: {
    name: "海",
    emoji: "🌊",
    bg: "from-[#031525] via-[#0c4a6e] to-black",
    card: "bg-black/45 border-sky-300/20 shadow-sky-500/10",
    accent: "from-sky-300 to-cyan-300",
    pattern: "radial-gradient(ellipse at 50% 0%, rgba(125,211,252,.20), transparent 45%), repeating-linear-gradient(135deg, rgba(34,211,238,.08) 0 8px, transparent 8px 18px)",
  },
  sakura: {
    name: "桜",
    emoji: "🌸",
    bg: "from-[#220811] via-[#4a1630] to-black",
    card: "bg-black/45 border-pink-300/20 shadow-pink-500/10",
    accent: "from-pink-300 to-rose-300",
    pattern: "radial-gradient(circle at 15% 25%, rgba(251,207,232,.18) 0 5px, transparent 6px), radial-gradient(circle at 75% 45%, rgba(244,114,182,.14) 0 4px, transparent 5px)",
  },
  yukata: {
    name: "浴衣",
    emoji: "👘",
    bg: "from-[#140824] via-[#312e81] to-black",
    card: "bg-black/45 border-violet-300/20 shadow-violet-500/10",
    accent: "from-violet-300 to-indigo-300",
    pattern: "repeating-linear-gradient(45deg, rgba(167,139,250,.10) 0 2px, transparent 2px 18px), repeating-linear-gradient(-45deg, rgba(129,140,248,.08) 0 2px, transparent 2px 18px)",
  },
  ichimatsu: {
    name: "市松",
    emoji: "◼️",
    bg: "from-[#07130f] via-[#064e3b] to-black",
    card: "bg-black/50 border-emerald-300/20 shadow-emerald-500/10",
    accent: "from-emerald-300 to-lime-300",
    pattern: "linear-gradient(45deg, rgba(110,231,183,.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(110,231,183,.12) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(110,231,183,.12) 75%), linear-gradient(-45deg, transparent 75%, rgba(110,231,183,.12) 75%)",
  },
  asanoha: {
    name: "麻の葉",
    emoji: "✳️",
    bg: "from-[#0f1020] via-[#4c1d95] to-black",
    card: "bg-black/50 border-purple-300/20 shadow-purple-500/10",
    accent: "from-purple-300 to-pink-300",
    pattern: "repeating-conic-gradient(from 30deg, rgba(216,180,254,.10) 0deg 10deg, transparent 10deg 60deg)",
  },
  hoshizora: {
    name: "星空",
    emoji: "🌌",
    bg: "from-[#020617] via-[#111827] to-black",
    card: "bg-black/50 border-blue-300/20 shadow-blue-500/10",
    accent: "from-blue-300 to-cyan-200",
    pattern: "radial-gradient(circle at 10% 20%, rgba(255,255,255,.35) 0 1px, transparent 2px), radial-gradient(circle at 70% 30%, rgba(255,255,255,.25) 0 1px, transparent 2px), radial-gradient(circle at 40% 80%, rgba(125,211,252,.25) 0 1px, transparent 2px)",
  },
  aurora: {
    name: "オーロラ",
    emoji: "🟢",
    bg: "from-[#04111f] via-[#064e3b] to-[#020617]",
    card: "bg-black/45 border-emerald-200/20 shadow-emerald-500/10",
    accent: "from-emerald-200 to-sky-300",
    pattern: "radial-gradient(ellipse at 25% 15%, rgba(110,231,183,.22), transparent 38%), radial-gradient(ellipse at 80% 30%, rgba(125,211,252,.18), transparent 42%)",
  },
  sunset: {
    name: "夕焼け",
    emoji: "🌇",
    bg: "from-[#20030a] via-[#7c2d12] to-[#111827]",
    card: "bg-black/45 border-amber-200/20 shadow-orange-500/10",
    accent: "from-amber-200 to-rose-300",
    pattern: "radial-gradient(circle at 50% 0%, rgba(251,191,36,.20), transparent 35%), repeating-linear-gradient(0deg, rgba(251,113,133,.08) 0 2px, transparent 2px 18px)",
  },
  forest: {
    name: "森林",
    emoji: "🌲",
    bg: "from-[#03130d] via-[#14532d] to-black",
    card: "bg-black/45 border-lime-200/20 shadow-lime-500/10",
    accent: "from-lime-200 to-emerald-300",
    pattern: "radial-gradient(circle at 20% 20%, rgba(190,242,100,.16), transparent 25%), repeating-linear-gradient(120deg, rgba(74,222,128,.08) 0 3px, transparent 3px 20px)",
  },
  cyber: {
    name: "サイバー",
    emoji: "🧬",
    bg: "from-[#05020a] via-[#312e81] to-black",
    card: "bg-black/50 border-fuchsia-300/20 shadow-fuchsia-500/10",
    accent: "from-fuchsia-300 to-cyan-300",
    pattern: "linear-gradient(90deg, rgba(217,70,239,.10) 1px, transparent 1px), linear-gradient(rgba(34,211,238,.08) 1px, transparent 1px)",
  },
  morning: {
    name: "朝光",
    emoji: "🌤️",
    bg: "from-[#082f49] via-[#0369a1] to-[#0f172a]",
    card: "bg-black/40 border-sky-100/20 shadow-sky-500/10",
    accent: "from-yellow-200 to-sky-200",
    pattern: "radial-gradient(circle at 20% 0%, rgba(254,240,138,.22), transparent 28%), radial-gradient(circle at 80% 20%, rgba(186,230,253,.18), transparent 34%)",
  },
  deepfocus: {
    name: "深集中",
    emoji: "🧘",
    bg: "from-[#020617] via-[#0f172a] to-[#111827]",
    card: "bg-black/55 border-slate-200/15 shadow-slate-500/10",
    accent: "from-slate-200 to-cyan-200",
    pattern: "linear-gradient(135deg, rgba(148,163,184,.08) 1px, transparent 1px)",
  },
  paper: {
    name: "手帳",
    emoji: "📔",
    bg: "from-[#1c1917] via-[#3f2f22] to-[#0c0a09]",
    card: "bg-black/42 border-amber-100/20 shadow-amber-500/10",
    accent: "from-amber-100 to-orange-200",
    pattern: "repeating-linear-gradient(0deg, rgba(253,230,138,.08) 0 1px, transparent 1px 24px)",
  },
} as const;

export function getStoredTheme(): ThemeKey {
  if (typeof window === "undefined") return "mirai";
  const stored = localStorage.getItem("theme") as ThemeKey | null;
  return stored && stored in themes ? stored : "mirai";
}

export function saveTheme(theme: ThemeKey) {
  if (typeof window !== "undefined") {
    localStorage.setItem("theme", theme);
  }
}
