"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ThemeKey, themes, getStoredTheme, saveTheme } from "@/lib/themes";

type PageKey =
  | "home"
  | "memos"
  | "tweets"
  | "todos"
  | "calendar"
  | "diary"
  | "coffee"
  | "budget"
  | "shopping"
  | "belongings"
  | "routines"
  | "trash"
  | "map"
  | "heatmap"
  | "lifehub"
  | "braindump"
  | "focus"
  | "search"
  | "tags"
  | "chronology"
  | "anniversary"
  | "condition"
  | "cafe"
  | "goals"
  | "ideals"
  | "users"
  | "train"
  | "exp"
  | "night"
  | "ainews"
  | "timeline"

  | "todaycommand"
  | "lowenergy"
  | "outing"
  | "shoppingmission"
  | "paymentcalendar"
  | "subscriptions"
  | "decisionlog"
  | "projectlab"
  | "promptvault"
  | "bugcenter"
  | "recovery"
  | "reset"
  | "weeklyreview"
  | "monthlyreview"
  | "lifescore"
  | "skilltree"
  | "archive"
  | "futureletter"
  | "emergencynote"
  | "placelog"
  | "sleepprep"
  | "mail"
  | "settings";

type Memo = {
  id: string;
  content: string;
  image_url?: string | null;
  created_at: string;
};
type Tweet = {
  id: string;
  tweet_date: string;
  content: string;
  mood: string | null;
  image_url?: string | null;
  created_at: string;
};
type Todo = {
  id: string;
  title: string;
  done: boolean;
  priority: string;
  due_date: string | null;
  due_time?: string | null;
  location_name?: string | null;
  location_url?: string | null;
  notify_enabled?: boolean | null;
  image_url?: string | null;
  created_at: string;
};
type EventItem = {
  id: string;
  title: string;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  note: string | null;
  created_at: string;
};
type Diary = {
  id: string;
  entry_date: string;
  mood: string;
  title?: string | null;
  content: string;
  image_url?: string | null;
  created_at: string;
};
type CoffeeLog = {
  id: string;
  drink_date: string;
  coffee_name: string;
  cups: number;
  caffeine_mg: number;
  note: string | null;
  created_at: string;
};
type BudgetLog = {
  id: string;
  spend_date: string;
  type: "income" | "expense" | "charge";
  category: string;
  amount: number;
  memo: string | null;
  source?: string | null;
  wallet?: string | null;
  payment_method?: string | null;
  image_url?: string | null;
  created_at: string;
};
type BudgetFixedTemplate = {
  id: string;
  title: string;
  category: string;
  amount: number;
  wallet: string | null;
  due_day: number | null;
  active: boolean;
  memo: string | null;
  created_at: string;
};
type Routine = {
  id: string;
  title: string;
  routine_time: string | null;
  note: string | null;
  active: boolean;
  created_at: string;
};
type RoutineCheck = {
  id: string;
  routine_id: string;
  check_date: string;
  created_at: string;
};
type TrashRule = {
  id: string;
  trash_type: string;
  weekday: number;
  notify_time: string | null;
  note: string | null;
  active: boolean;
  created_at: string;
};
type PlaceLog = {
  id: string;
  place_date: string;
  title: string;
  category: string;
  address: string | null;
  map_url: string | null;
  note: string | null;
  created_at: string;
};
type SleepLog = {
  id: string;
  sleep_date: string;
  bedtime: string | null;
  wake_time: string | null;
  quality: string | null;
  note: string | null;
  created_at: string;
};
type BudgetAccount = {
  id: string;
  name: string;
  kind: string;
  balance: number;
  note: string | null;
  created_at: string;
};

type MoneyBudgetSetting = {
  id: string;
  category: string;
  limit: number;
  created_at: string;
};

type MoneySubscription = {
  id: string;
  name: string;
  amount: number;
  wallet: string;
  nextDate: string;
  frequency: "monthly" | "yearly";
  usage: string;
  memo: string;
  created_at: string;
};
type IdealItem = {
  id: string;
  title: string;
  image_url: string | null;
  description: string | null;
  created_at: string;
};
type BelongingCard = {
  id: string;
  title: string;
  note: string | null;
  created_at: string;
};
type BelongingItem = {
  id: string;
  card_id: string;
  name: string;
  checked: boolean;
  image_url?: string | null;
  created_at: string;
};
type UserProfile = {
  name?: string;
  nickname?: string;
  birthday?: string;
  birthplace?: string;
  bloodType?: string;
  schoolStartYear?: string;
  elementaryStartYear?: string;
  juniorHighStartYear?: string;
  highSchoolStartYear?: string;
  universityStartYear?: string;
  jobStartYear?: string;
  memo?: string;
};

type Snapshot = {
  memos: Memo[];
  tweets: Tweet[];
  todos: Todo[];
  events: EventItem[];
  diaries: Diary[];
  coffee: CoffeeLog[];
  budget: BudgetLog[];
  budgetAccounts: BudgetAccount[];
  budgetFixedTemplates: BudgetFixedTemplate[];
  ideals: IdealItem[];
  belongingCards: BelongingCard[];
  belongingItems: BelongingItem[];
  routines: Routine[];
  trash: TrashRule[];
  places: PlaceLog[];
  sleep: SleepLog[];
  routineChecks: RoutineCheck[];
  userProfile: UserProfile | null;
};

const navItems: { key: PageKey; label: string; icon: string }[] = [
  { key: "home", label: "ホーム", icon: "🏠" },
  { key: "memos", label: "メモ", icon: "📝" },
  { key: "tweets", label: "つぶやき", icon: "💬" },
  { key: "todos", label: "TODO", icon: "✅" },
  { key: "calendar", label: "カレンダー", icon: "📅" },
  { key: "diary", label: "Diary", icon: "📖" },
  { key: "coffee", label: "コーヒー", icon: "☕" },
  { key: "budget", label: "家計簿", icon: "👛" },
  { key: "shopping", label: "買い物", icon: "🛒" },
  { key: "belongings", label: "持ち物", icon: "🎒" },
  { key: "routines", label: "ルーティン", icon: "🌅" },
  { key: "trash", label: "ゴミ", icon: "🗑️" },
  { key: "map", label: "地図", icon: "🗺️" },
  { key: "heatmap", label: "ヒートマップ", icon: "🔥" },
  { key: "lifehub", label: "生活OS", icon: "🧬" },
  { key: "todaycommand", label: "今日", icon: "🧭" },
  { key: "lowenergy", label: "低エネ", icon: "🫧" },
  { key: "outing", label: "外出", icon: "🎒" },
  { key: "shoppingmission", label: "買物任務", icon: "🛒" },
  { key: "paymentcalendar", label: "支払いカレンダー", icon: "💳" },
  { key: "subscriptions", label: "サブスク", icon: "🔁" },
  { key: "decisionlog", label: "決断", icon: "🧩" },
  { key: "projectlab", label: "開発", icon: "🧪" },
  { key: "promptvault", label: "依頼文", icon: "📦" },
  { key: "bugcenter", label: "バグ", icon: "🐞" },
  { key: "recovery", label: "回復", icon: "🛟" },
  { key: "reset", label: "リセット", icon: "🔄" },
  { key: "weeklyreview", label: "週次", icon: "📆" },
  { key: "monthlyreview", label: "月次", icon: "🗓️" },
  { key: "lifescore", label: "生活点", icon: "🎮" },
  { key: "skilltree", label: "スキル", icon: "🌳" },
  { key: "archive", label: "保管庫", icon: "🏛️" },
  { key: "futureletter", label: "未来手紙", icon: "✉️" },
  { key: "emergencynote", label: "緊急", icon: "🛡️" },
  { key: "placelog", label: "場所ログ", icon: "📍" },
  { key: "sleepprep", label: "睡眠準備", icon: "🌙" },
  { key: "timeline", label: "時系列", icon: "🕰️" },
  { key: "braindump", label: "思考整理", icon: "🧠" },
  { key: "focus", label: "集中タイマー", icon: "⏱️" },
  { key: "search", label: "検索", icon: "🧠" },
  { key: "tags", label: "タグ", icon: "🏷️" },
  { key: "chronology", label: "自分年表", icon: "📜" },
  { key: "anniversary", label: "過去の今日", icon: "⏳" },
  { key: "condition", label: "予測", icon: "🔮" },
  { key: "cafe", label: "カフェ図鑑", icon: "☕" },
  { key: "goals", label: "目標", icon: "🌌" },
  { key: "ideals", label: "理想", icon: "🖼️" },
  { key: "users", label: "ユーザー", icon: "👤" },
  { key: "train", label: "電車", icon: "🚆" },
  { key: "exp", label: "経験値", icon: "🎮" },
  { key: "night", label: "夜モード", icon: "🌙" },
  { key: "ainews", label: "AIニュース", icon: "📰" },
  { key: "mail", label: "メール", icon: "✉️" },
  { key: "settings", label: "設定", icon: "🎨" },
];

const todayKey = () => toDateKey(new Date());
function toDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function getCreatedDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}
function yen(value: number) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "JPY",
    maximumFractionDigits: 0,
  }).format(value || 0);
}
function weekdayLabel(day: number) {
  return ["日", "月", "火", "水", "木", "金", "土"][day] || "?";
}
function dateMinus(dateKey: string, days: number) {
  const d = new Date(dateKey + "T00:00:00");
  d.setDate(d.getDate() - days);
  return toDateKey(d);
}
function monthKey(dateKey = todayKey()) {
  return String(dateKey || todayKey()).slice(0, 7);
}
function isSameMonth(dateKey: string | null | undefined, target = todayKey()) {
  return String(dateKey || "").slice(0, 7) === monthKey(target);
}
function daysLeftInMonth(dateKey = todayKey()) {
  const d = new Date(dateKey + "T00:00:00");
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return Math.max(1, end.getDate() - d.getDate() + 1);
}
type NotifySettings = { enabled: boolean; sound: boolean; vibrate: boolean };
function getNotifySettings(): NotifySettings {
  if (typeof window === "undefined")
    return { enabled: true, sound: true, vibrate: true };
  try {
    const raw = localStorage.getItem("lifeNotifySettings");
    return raw
      ? { enabled: true, sound: true, vibrate: true, ...JSON.parse(raw) }
      : { enabled: true, sound: true, vibrate: true };
  } catch {
    return { enabled: true, sound: true, vibrate: true };
  }
}
function saveNotifySettings(settings: NotifySettings) {
  if (typeof window !== "undefined")
    localStorage.setItem("lifeNotifySettings", JSON.stringify(settings));
}
function playSoftNotice() {
  const settings = getNotifySettings();
  if (!settings.enabled) return;
  if (settings.vibrate && "vibrate" in navigator) navigator.vibrate?.([80]);
  if (settings.sound) {
    const audio = new Audio("/notify-soft.mp3");
    audio.volume = 0.16;
    audio.play().catch(() => {});
  }
}
type AppNotice = { key: string; title: string; body: string };
function getDismissedNoticeKeys() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    return new Set(
      JSON.parse(
        localStorage.getItem("lifeDismissedNotices") || "[]",
      ) as string[],
    );
  } catch {
    return new Set<string>();
  }
}
function dismissNoticeKey(key: string) {
  if (typeof window === "undefined") return;
  const set = getDismissedNoticeKeys();
  set.add(key);
  localStorage.setItem(
    "lifeDismissedNotices",
    JSON.stringify(Array.from(set).slice(-500)),
  );
}
function requestLocalNotification(
  title: string,
  body: string,
  noticeKey: string,
  onAppNotice?: (notice: AppNotice) => void,
) {
  const settings = getNotifySettings();
  if (!settings.enabled || getDismissedNoticeKeys().has(noticeKey)) return;
  playSoftNotice();
  onAppNotice?.({ key: noticeKey, title, body });
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, silent: true });
  }
}
function isDueNow(
  dateKey: string | null | undefined,
  timeValue: string | null | undefined,
) {
  if (!dateKey || !timeValue) return false;
  const now = new Date();
  return (
    dateKey === toDateKey(now) &&
    timeValue.slice(0, 5) ===
      `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
  );
}
function setGuideDraft(message: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lifeGuideMessage", message);
  window.dispatchEvent(
    new CustomEvent("life-guide-message", { detail: message }),
  );
}
function stripHtml(value: string) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const FOCUS_TIMER_STORAGE_KEY = "lifeFocusTimerState";

type FocusTimerState = {
  mode: "stopwatch" | "countdown";
  running: boolean;
  seconds: number;
  preset: number;
  updatedAt: number;
  startedAt: number | null;
};

function readFocusTimerState(): FocusTimerState {
  const fallback: FocusTimerState = {
    mode: "countdown",
    running: false,
    seconds: 25 * 60,
    preset: 25,
    updatedAt: Date.now(),
    startedAt: null,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(FOCUS_TIMER_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<FocusTimerState>;
    const mode =
      parsed.mode === "stopwatch" || parsed.mode === "countdown"
        ? parsed.mode
        : "countdown";
    const preset = Number.isFinite(Number(parsed.preset))
      ? Math.max(1, Number(parsed.preset))
      : 25;
    const savedSeconds = Number.isFinite(Number(parsed.seconds))
      ? Math.max(0, Math.floor(Number(parsed.seconds)))
      : preset * 60;
    const updatedAt = Number.isFinite(Number(parsed.updatedAt))
      ? Number(parsed.updatedAt)
      : Date.now();
    const running = Boolean(parsed.running);
    const elapsed = running
      ? Math.max(0, Math.floor((Date.now() - updatedAt) / 1000))
      : 0;
    return {
      mode,
      preset,
      running,
      seconds:
        mode === "countdown"
          ? Math.max(0, savedSeconds - elapsed)
          : savedSeconds + elapsed,
      updatedAt: Date.now(),
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
    };
  } catch {
    return fallback;
  }
}

function saveFocusTimerState(state: Omit<FocusTimerState, "updatedAt">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    FOCUS_TIMER_STORAGE_KEY,
    JSON.stringify({ ...state, updatedAt: Date.now() }),
  );
}

function restoreScrollIfUnexpectedlyRaised(scrollY: number) {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    const active = document.activeElement as HTMLElement | null;
    const tag = active?.tagName?.toLowerCase();
    const isEditing =
      tag === "input" ||
      tag === "textarea" ||
      tag === "select" ||
      active?.isContentEditable;
    if (!isEditing && scrollY > 80 && window.scrollY + 80 < scrollY) {
      window.scrollTo({ top: scrollY, behavior: "auto" });
    }
  });
}

async function imageFileToDataUrl(file: File | null): Promise<string | null> {
  if (!file) return null;
  if (!file.type.startsWith("image/")) {
    alert("画像ファイルを選んでね。");
    return null;
  }

  // iPhone/Macの写真はそのままだとVercelのAPI上限に当たりやすいので、AI送信用に自動圧縮する。
  if (typeof window === "undefined" || typeof document === "undefined")
    return fileToDataUrl(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.onload = () => {
        const maxSide = 1280;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("画像の圧縮に失敗しました"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}
function hasImageColumnError(error: { message?: string } | null | undefined) {
  const message = String(error?.message || "");
  return (
    message.includes("image_url") ||
    message.includes("column") ||
    message.includes("schema cache")
  );
}

type TodoInsertCandidate = {
  title?: unknown;
  priority?: unknown;
  due_date?: unknown;
};
function localTodoCandidatesFromText(text: string): TodoInsertCandidate[] {
  const raw = String(text || "").trim();
  if (!raw) return [];
  const lines = raw
    .split(/\r?\n|[。！？!?]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const keywords =
    /(する|やる|買う|行く|行か|予約|確認|連絡|提出|支払|払う|送る|作る|準備|持って|持参|更新|修正|掃除|洗濯|申請|登録|電話|メール|返す|見る|調べる|受け取る|持つ|必要|忘れ)/;
  const picked = lines
    .filter((line) => keywords.test(line) || /^[-・*□☐]/.test(line))
    .map((line) => ({
      title: line.replace(/^[-・*□☐\s]+/, "").slice(0, 120),
      priority: /急ぎ|至急|今日|締切|重要|必ず/.test(line) ? "high" : "normal",
      due_date: null,
    }))
    .filter((task) => task.title.length > 0)
    .slice(0, 10);
  if (picked.length) return picked;
  return [
    {
      title: raw.split(/\r?\n|[。！？!?]+/)[0].slice(0, 120),
      priority: "normal",
      due_date: null,
    },
  ];
}
function normalizeTodoPriority(value: unknown) {
  const priority = String(value || "normal");
  return priority === "low" || priority === "normal" || priority === "high"
    ? priority
    : "normal";
}
async function insertTodoCandidates(
  tasks: TodoInsertCandidate[],
  fallbackDate = todayKey(),
) {
  let inserted = 0;
  let lastError = "";
  const savedTodos: Todo[] = [];
  for (const task of tasks.slice(0, 10)) {
    const title = String(task?.title || "")
      .trim()
      .slice(0, 120);
    if (!title) continue;
    const dueDate =
      typeof task.due_date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(task.due_date)
        ? task.due_date
        : fallbackDate;
    const payload = {
      title,
      priority: normalizeTodoPriority(task.priority),
      due_date: dueDate,
      done: false,
    };
    const result = await supabase
      .from("todos")
      .insert(payload)
      .select("*")
      .single();
    if (result.error) {
      lastError = result.error.message;
      continue;
    }
    if (result.data) savedTodos.push(result.data as Todo);
    inserted += 1;
  }
  return { inserted, lastError, savedTodos };
}

function NavIcon({
  icon,
  label,
  className = "h-7 w-7",
}: {
  icon: string;
  label: string;
  className?: string;
}) {
  const isImage = icon.startsWith("/") || icon.startsWith("http");
  if (isImage) {
    return (
      <img
        src={icon}
        alt={label}
        className={`${className} shrink-0 rounded-xl object-cover shadow-[0_0_14px_rgba(255,184,80,.55)]`}
      />
    );
  }
  return <span className="shrink-0 text-lg">{icon}</span>;
}

function ImagePreview({
  src,
  alt = "添付画像",
}: {
  src?: string | null;
  alt?: string;
}) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className="mt-3 max-h-72 w-full rounded-3xl border border-white/10 object-cover"
    />
  );
}

function openMap(text: string) {
  const q = encodeURIComponent(text.trim());
  if (!q) return;
  window.location.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
}
function openAppleMap(text: string) {
  const q = encodeURIComponent(text.trim());
  if (!q) return;
  window.location.href = `http://maps.apple.com/?q=${q}`;
}
function openGoogleMap(text: string) {
  const q = encodeURIComponent(text.trim());
  if (!q) return;
  window.location.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
}
function userMilestones(profile?: UserProfile | null) {
  const rows: { date: string; label: string }[] = [];
  const add = (year: string | undefined, label: string, suffix = "-04-01") => {
    if (year && /^\d{4}$/.test(year))
      rows.push({ date: `${year}${suffix}`, label });
  };
  if (profile?.birthday && /^\d{4}-\d{2}-\d{2}$/.test(profile.birthday))
    rows.push({
      date: profile.birthday,
      label: `${profile.name || profile.nickname || "ユーザー"} 誕生`,
    });
  add(profile?.elementaryStartYear || profile?.schoolStartYear, "小学校入学");
  add(profile?.juniorHighStartYear, "中学校入学");
  add(profile?.highSchoolStartYear, "高校入学");
  add(profile?.universityStartYear, "大学・専門学校など入学");
  add(profile?.jobStartYear, "仕事・社会生活の節目");
  return rows;
}
function tagWords(text: string) {
  const src = text.toLowerCase();
  const tags: string[] = [];
  if (/疲|しんど|眠|だる/.test(src)) tags.push("#回復");
  if (/嬉|楽|最高|できた|成功/.test(src)) tags.push("#達成");
  if (/走|ラン|ジム|筋トレ|bike|バイク/.test(src)) tags.push("#運動");
  if (/カフェ|coffee|コーヒー/.test(src)) tags.push("#カフェ");
  if (/不安|怖|緊張|焦/.test(src)) tags.push("#不安");
  if (/冒険|地図|散歩|江ノ島|旅行/.test(src)) tags.push("#冒険");
  return tags.length ? tags : ["#生活ログ"];
}
function calcRoutineStats(routineId: string, checks: RoutineCheck[]) {
  const dates = Array.from(
    new Set(
      checks
        .filter(
          (c) =>
            c.routine_id === routineId &&
            /^\d{4}-\d{2}-\d{2}$/.test(c.check_date),
        )
        .map((c) => c.check_date),
    ),
  ).sort((a, b) => b.localeCompare(a));
  const set = new Set(dates);
  const today = todayKey();
  const yesterday = dateMinus(today, 1);
  const doneToday = set.has(today);
  const doneYesterday = set.has(yesterday);

  // 今日まだ押していなくても、昨日まで続いていた習慣を0日に落とさない。
  // 朝にアプリを開いた時点では「継続中・今日未達」として見せる。
  const streakStart = doneToday ? today : doneYesterday ? yesterday : today;
  let currentStreak = 0;
  let cursor = streakStart;
  while (set.has(cursor)) {
    currentStreak += 1;
    cursor = dateMinus(cursor, 1);
  }

  const recent7 = Array.from({ length: 7 }, (_, index) => {
    const date = dateMinus(today, index);
    return { date, done: set.has(date) };
  }).reverse();

  return {
    currentStreak,
    totalDays: dates.length,
    doneToday,
    doneYesterday,
    lastDoneDate: dates[0] || null,
    recent7,
  };
}

function shortDateLabel(dateKey: string | null) {
  if (!dateKey) return "なし";
  const [, month, day] = dateKey.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

async function loadSnapshot(): Promise<Snapshot> {
  const [
    memos,
    tweets,
    todos,
    events,
    diaries,
    coffee,
    budget,
    budgetAccounts,
    budgetFixedTemplates,
    ideals,
    belongingCards,
    belongingItems,
    routines,
    trash,
    places,
    sleep,
    routineChecks,
    userProfileSetting,
  ] = await Promise.all([
    supabase
      .from("memos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("tweets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("calendar_events")
      .select("*")
      .order("event_date", { ascending: false })
      .limit(80),
    supabase
      .from("diary_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("coffee_logs")
      .select("*")
      .order("drink_date", { ascending: false })
      .limit(80),
    supabase
      .from("budget_logs")
      .select("*")
      .order("spend_date", { ascending: false })
      .limit(80),
    supabase
      .from("budget_accounts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("budget_fixed_templates")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("ideal_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("belonging_cards")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("belonging_items")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(500),
    supabase
      .from("routines")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("trash_rules")
      .select("*")
      .order("weekday", { ascending: true })
      .limit(80),
    supabase
      .from("place_logs")
      .select("*")
      .order("place_date", { ascending: false })
      .limit(80),
    supabase
      .from("sleep_logs")
      .select("*")
      .order("sleep_date", { ascending: false })
      .limit(80),
    supabase
      .from("routine_checks")
      .select("*")
      .order("check_date", { ascending: false })
      .limit(300),
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "user_profile")
      .maybeSingle(),
  ]);
  return {
    memos: memos.data || [],
    tweets: tweets.data || [],
    todos: todos.data || [],
    events: events.data || [],
    diaries: diaries.data || [],
    coffee: coffee.data || [],
    budget: budget.data || [],
    budgetAccounts: budgetAccounts.data || [],
    budgetFixedTemplates: budgetFixedTemplates.data || [],
    ideals: ideals.data || [],
    belongingCards: belongingCards.data || [],
    belongingItems: belongingItems.data || [],
    routines: routines.data || [],
    trash: trash.data || [],
    places: places.data || [],
    sleep: sleep.data || [],
    routineChecks: routineChecks.data || [],
    userProfile: (userProfileSetting.data?.value || null) as UserProfile | null,
  };
}

type VisualMode = "current" | "stained" | "cyber" | "funny" | "liquid";

const visualModes: Record<
  VisualMode,
  {
    name: string;
    emoji: string;
    description: string;
    shell: string;
    cardHint: string;
  }
> = {
  current: {
    name: "Current",
    emoji: "🌙",
    description: "今のLife Command OSの見た目",
    shell: "visual-current",
    cardHint: "いつもの安定デザイン",
  },
  stained: {
    name: "Stained Glass",
    emoji: "✨",
    description: "ステンドグラスのような彩色ガラスUI",
    shell: "visual-stained",
    cardHint: "光を通す色ガラス",
  },
  cyber: {
    name: "Cyber HUD",
    emoji: "🌃",
    description: "ネオンとHUDラインの近未来UI",
    shell: "visual-cyber",
    cardHint: "司令室っぽい発光",
  },
  funny: {
    name: "Funny",
    emoji: "🎪",
    description: "少しポップで遊び心のあるUI",
    shell: "visual-funny",
    cardHint: "気分転換モード",
  },
  liquid: {
    name: "Liquid Glass",
    emoji: "🍎",
    description: "Apple風の薄いガラスUI",
    shell: "visual-liquid",
    cardHint: "透明感と高級感",
  },
};

function readVisualMode(): VisualMode {
  if (typeof window === "undefined") return "current";
  const raw = localStorage.getItem("lifeVisualMode") as VisualMode | null;
  return raw && raw in visualModes ? raw : "current";
}

function saveVisualMode(mode: VisualMode) {
  if (typeof window !== "undefined")
    localStorage.setItem("lifeVisualMode", mode);
}

export default function Home() {
  const [page, setPage] = useState<PageKey>("home");
  const [themeKey, setThemeKey] = useState<ThemeKey>("mirai");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [syncStatus, setSyncStatus] = useState("同期準備中");
  const [appNotice, setAppNotice] = useState<AppNotice | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [visualMode, setVisualMode] = useState<VisualMode>("liquid");
  const syncingRef = useRef(false);
  const realtimeRefreshTimerRef = useRef<number | null>(null);
  const firedNoticeRef = useRef<Set<string>>(new Set());
  const theme = themes[themeKey];
  const visual = visualModes[visualMode];
  const themeImage = "image" in theme ? theme.image : "";
  const title = navItems.find((item) => item.key === page)?.label || "ホーム";
  const refreshSnapshot = useCallback(async (reason = "同期中...") => {
    if (syncingRef.current && !reason.startsWith("手動")) return;
    syncingRef.current = true;
    const beforeScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    try {
      setSyncStatus(reason);
      const next = await loadSnapshot();
      setSnapshot(next);
      restoreScrollIfUnexpectedlyRaised(beforeScrollY);
      const time = new Date().toLocaleTimeString("ja-JP", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setSyncStatus(
        reason.startsWith("手動")
          ? `手動同期完了 ${time}`
          : `常時同期ON ${time}`,
      );
    } catch (error) {
      console.error(error);
      setSyncStatus("同期失敗");
    } finally {
      syncingRef.current = false;
    }
  }, []);
  useEffect(() => {
    let alive = true;
    const forceFutureKey = "lifeFutureThemeAppliedV1";
    const shouldForceFuture = typeof window !== "undefined" && localStorage.getItem(forceFutureKey) !== "20260521";
    const localTheme = shouldForceFuture ? "mirai" : getStoredTheme();
    setThemeKey(localTheme as ThemeKey);
    if (shouldForceFuture) {
      saveTheme("mirai");
      localStorage.setItem(forceFutureKey, "20260521");
    }
    const forceLiquidKey = "lifeFutureLiquidAppliedV15";
    const shouldForceLiquid = typeof window !== "undefined" && localStorage.getItem(forceLiquidKey) !== "20260523-v15";
    const nextVisualMode = shouldForceLiquid ? "liquid" : readVisualMode();
    setVisualMode(nextVisualMode);
    if (shouldForceLiquid) {
      saveVisualMode("liquid");
      localStorage.setItem(forceLiquidKey, "20260523-v15");
    }
    (async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "theme")
          .maybeSingle();
        const cloudTheme = data?.value?.theme as ThemeKey | undefined;
        if (alive && !shouldForceFuture && cloudTheme && cloudTheme in themes) {
          setThemeKey(cloudTheme);
          saveTheme(cloudTheme);
        }
      } catch {
        // テーマ同期に失敗してもアプリ本体は止めない
      }
    })();
    refreshSnapshot("初回同期中...");
    return () => {
      alive = false;
    };
  }, [refreshSnapshot]);
  useEffect(() => {
    let alive = true;
    const syncTables = [
      "memos",
      "tweets",
      "todos",
      "calendar_events",
      "diary_entries",
      "coffee_logs",
      "budget_logs",
      "budget_accounts",
      "budget_fixed_templates",
      "ideal_items",
      "belonging_cards",
      "belonging_items",
      "app_settings",
      "routines",
      "trash_rules",
      "place_logs",
      "sleep_logs",
      "routine_checks",
    ];
    const channel = syncTables.reduce(
      (current, table) => {
        return current.on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          () => {
            if (!alive) return;
            setSyncStatus("常時同期中...");
            if (realtimeRefreshTimerRef.current)
              window.clearTimeout(realtimeRefreshTimerRef.current);
            realtimeRefreshTimerRef.current = window.setTimeout(() => {
              realtimeRefreshTimerRef.current = null;
              refreshSnapshot("常時同期中...");
            }, 450);
          },
        );
      },
      supabase.channel(`life-command-os-realtime-sync-${Date.now()}`),
    );

    channel.subscribe((status) => {
      if (!alive) return;
      if (status === "SUBSCRIBED") setSyncStatus("常時同期ON");
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT")
        setSyncStatus("同期エラー");
      if (status === "CLOSED") setSyncStatus("同期停止");
    });

    return () => {
      alive = false;
      if (realtimeRefreshTimerRef.current) {
        window.clearTimeout(realtimeRefreshTimerRef.current);
        realtimeRefreshTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [refreshSnapshot]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      refreshSnapshot("常時同期確認中...");
    }, 30000);
    const onFocus = () => refreshSnapshot("画面復帰同期中...");
    const onVisibility = () => {
      if (!document.hidden) refreshSnapshot("画面復帰同期中...");
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refreshSnapshot]);
  useEffect(() => {
    const tick = () => {
      if (!getNotifySettings().enabled) return;
      const now = new Date();
      (snapshot?.todos || []).forEach((t) => {
        const key = `todo-${t.id}-${t.due_date || ""}-${t.due_time || ""}`;
        if (
          !t.done &&
          t.notify_enabled &&
          isDueNow(t.due_date, t.due_time) &&
          !firedNoticeRef.current.has(key) &&
          !getDismissedNoticeKeys().has(key)
        ) {
          firedNoticeRef.current.add(key);
          requestLocalNotification("TODOの時間", t.title, key, setAppNotice);
        }
      });
      (snapshot?.routines || []).forEach((r) => {
        const key = `routine-${r.id}-${toDateKey(now)}-${r.routine_time || ""}`;
        if (
          r.active &&
          isDueNow(toDateKey(now), r.routine_time) &&
          !firedNoticeRef.current.has(key) &&
          !getDismissedNoticeKeys().has(key)
        ) {
          firedNoticeRef.current.add(key);
          requestLocalNotification("習慣の時間", r.title, key, setAppNotice);
        }
      });
      (snapshot?.trash || []).forEach((r) => {
        const key = `trash-${r.id}-${toDateKey(now)}-${r.notify_time || ""}`;
        if (
          r.active &&
          r.weekday === now.getDay() &&
          isDueNow(toDateKey(now), r.notify_time) &&
          !firedNoticeRef.current.has(key) &&
          !getDismissedNoticeKeys().has(key)
        ) {
          firedNoticeRef.current.add(key);
          requestLocalNotification(
            "ゴミの日",
            `${r.trash_type}の日だよ`,
            key,
            setAppNotice,
          );
        }
      });
    };
    tick();
    const timer = window.setInterval(tick, 30000);
    return () => window.clearInterval(timer);
  }, [snapshot]);
  function changeTheme(next: ThemeKey) {
    setThemeKey(next);
    saveTheme(next);
    void (async () => {
      try {
        await supabase
          .from("app_settings")
          .upsert({
            key: "theme",
            value: { theme: next },
            updated_at: new Date().toISOString(),
          });
        setGuideDraft(
          `テーマを「${themes[next].name}」に同期したよ。PCとスマホでも同じ色に近づくはず。`,
        );
      } catch {
        setGuideDraft(
          `テーマはこの端末に保存したよ。クラウド同期だけ少し失敗したみたい。`,
        );
      }
    })();
  }
  function changeVisualMode(next: VisualMode) {
    setVisualMode(next);
    saveVisualMode(next);
    setGuideDraft(
      `UIモードを「${visualModes[next].name}」に切り替えたよ。全ページの雰囲気だけ変えて、記録データは触らない設計だよ。`,
    );
  }
  const panelProps = { snapshot, refreshSnapshot, setPage };
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
        event.preventDefault();
        setQuickAddOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${theme.bg} ${visual.shell} ${(themeKey === "mirai" ? "future-os" : (themeKey === "hanabi" || themeKey === "natsumatsuri") ? "matsuri-os" : "")} text-white`}
    >
      {appNotice && (
        <div className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-md rounded-3xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-black text-white">{appNotice.title}</p>
          <p className="mt-1 text-sm leading-6 text-white/75">
            {appNotice.body}
          </p>
          <button
            type="button"
            onClick={() => {
              dismissNoticeKey(appNotice.key);
              firedNoticeRef.current.add(appNotice.key);
              setAppNotice(null);
            }}
            className="mt-3 w-full rounded-2xl bg-white px-4 py-2 text-sm font-black text-black"
          >
            閉じる
          </button>
        </div>
      )}
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 ${(themeKey === "mirai" ? "future-bg-layer opacity-100" : (themeKey === "hanabi" || themeKey === "natsumatsuri") ? "matsuri-bg-layer opacity-100" : "opacity-70")}`}
        style={{
          backgroundImage: themeImage ? `url(${themeImage})` : theme.pattern,
          backgroundSize: themeImage
            ? "cover"
            : "34px 34px, 34px 34px, 34px 34px, 34px 34px",
          backgroundPosition: themeImage ? "center center" : undefined,
          backgroundRepeat: themeImage ? "no-repeat" : undefined,
        }}
      />
      <div
        className={`pointer-events-none fixed inset-0 z-0 ${(themeKey === "mirai" ? "future-vignette" : (themeKey === "hanabi" || themeKey === "natsumatsuri") ? "matsuri-night-vignette" : "bg-black/20")}`}
        aria-hidden="true"
      />
      <div className="relative z-10 mx-auto flex max-w-[1540px] gap-4 px-3 pb-32 pt-4 sm:px-4 sm:pt-6 lg:pb-8">
        <aside className="matsuri-sidebar sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-3 shadow-2xl backdrop-blur-xl lg:block">
          <div className="mb-3 rounded-3xl bg-white/10 p-4">
            <p className="text-xs font-black text-white/50">Life Command OS</p>
            <p className="mt-1 text-lg font-black">ページ一覧</p>
          </div>
          <div className="h-[calc(100%-5.5rem)] space-y-1 overflow-y-auto pr-1 nav-scroll">
            {navItems.map((item) => {
              const active = page === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setPage(item.key)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition ${
                    active
                      ? `bg-gradient-to-r ${theme.accent} font-black text-black shadow-lg`
                      : "text-white/72 hover:bg-white/10"
                  }`}
                >
                  <NavIcon icon={item.icon} label={item.label} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          {themeKey === "mirai" ? (
            <FutureTopHud
              title={title}
              syncStatus={syncStatus}
              themeKey={themeKey}
              visualMode={visualMode}
              onSearch={() => setGlobalSearchOpen(true)}
              onManualSync={() => refreshSnapshot("手動同期中...")}
              onChangeTheme={changeTheme}
              onChangeVisualMode={changeVisualMode}
            />
          ) : (
          <header
            className={`matsuri-topbar rounded-[1.75rem] border ${theme.card} p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-5`}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold text-white/65 sm:text-sm">
                  {theme.emoji} Life Command OS
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                  {title}
                </h1>
                <p className="mt-2 text-xs leading-6 text-white/55 sm:text-sm">
                  生活ログ・思い出・習慣・お金・カフェ・未来目標をまとめる人生OS
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />
                    {syncStatus}
                  </div>
                  <button
                    type="button"
                    onClick={() => refreshSnapshot("手動同期中...")}
                    className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white/85 transition hover:bg-white/15 active:scale-95"
                  >
                    手動同期
                  </button>
                </div>
              </div>
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setGlobalSearchOpen(true)}
                  className="fixed right-3 top-3 z-[70] rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-black text-black shadow-xl transition active:scale-95 sm:static sm:py-2"
                >
                  🔎 検索
                </button>
                <select
                  value={themeKey}
                  onChange={(e) => changeTheme(e.target.value as ThemeKey)}
                  className="w-full rounded-2xl border border-white/20 bg-slate-950/90 px-3 py-3 text-sm text-white outline-none [color-scheme:dark] sm:w-auto sm:py-2"
                >
                  {Object.entries(themes).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.emoji} {value.name}
                    </option>
                  ))}
                </select>
                <select
                  value={visualMode}
                  onChange={(e) =>
                    changeVisualMode(e.target.value as VisualMode)
                  }
                  className="w-full rounded-2xl border border-white/20 bg-slate-950/90 px-3 py-3 text-sm text-white outline-none [color-scheme:dark] sm:w-auto sm:py-2"
                >
                  {Object.entries(visualModes).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value.emoji} {value.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </header>
          )}
          <section
            className={`matsuri-stage ${themeKey === "mirai" ? "future-main-stage mt-3 rounded-[2rem] border-transparent bg-transparent p-0 shadow-none sm:mt-4 sm:p-0" : `mt-4 rounded-[1.75rem] border ${theme.card} p-3 shadow-2xl backdrop-blur-xl sm:mt-5 sm:rounded-[2rem] sm:p-6`}`}
          >
            {page === "home" && (
              <HomePanel themeKey={themeKey} {...panelProps} />
            )}
            {page === "memos" && <MemosPanel {...panelProps} />}
            {page === "tweets" && <TweetsPanel {...panelProps} />}
            {page === "todos" && <TodosPanel {...panelProps} />}
            {page === "calendar" && <CalendarPanel snapshot={snapshot} refreshSnapshot={refreshSnapshot} />}
            {page === "diary" && <DiaryPanel {...panelProps} />}
            {page === "coffee" && <CoffeePanel {...panelProps} />}
            {page === "budget" && (
              <BudgetPanel themeKey={themeKey} {...panelProps} />
            )}
            {page === "shopping" && <ShoppingPanel />}
            {page === "belongings" && <BelongingsPanel {...panelProps} />}
            {page === "routines" && <RoutinesPanel {...panelProps} />}
            {page === "trash" && <TrashPanel {...panelProps} />}
            {page === "map" && <MapPanel {...panelProps} />}
            {page === "heatmap" && <HeatmapPanel snapshot={snapshot} />}
            {page === "lifehub" && (
              <LifeHubPanel snapshot={snapshot} setPage={setPage} />
            )}
            {page === "braindump" && (
              <BrainDumpPanel
                refreshSnapshot={refreshSnapshot}
                setPage={setPage}
              />
            )}
            {page === "focus" && (
              <FocusTimerPanel snapshot={snapshot} setPage={setPage} />
            )}
            {page === "todaycommand" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.todaycommand} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "lowenergy" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.lowenergy} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "outing" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.outing} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "shoppingmission" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.shoppingmission} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "paymentcalendar" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.paymentcalendar} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "subscriptions" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.subscriptions} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "decisionlog" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.decisionlog} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "projectlab" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.projectlab} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "promptvault" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.promptvault} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "bugcenter" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.bugcenter} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "recovery" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.recovery} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "reset" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.reset} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "weeklyreview" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.weeklyreview} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "monthlyreview" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.monthlyreview} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "lifescore" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.lifescore} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "skilltree" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.skilltree} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "archive" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.archive} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "futureletter" && (
              <FutureLetterPanel snapshot={snapshot} setPage={setPage} />
            )}
            {page === "emergencynote" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.emergencynote} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "placelog" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.placelog} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "sleepprep" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.sleepprep} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "timeline" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.timeline} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}
            {page === "search" && (
              <SecondBrainSearch snapshot={snapshot} setPage={setPage} />
            )}
            {page === "tags" && <AutoTagsPanel snapshot={snapshot} />}
            {page === "chronology" && <ChronologyPanel snapshot={snapshot} />}
            {page === "anniversary" && <AnniversaryPanel snapshot={snapshot} />}
            {page === "condition" && <ConditionPanel snapshot={snapshot} />}
            {page === "cafe" && (
              <CafeAtlasPanel snapshot={snapshot} setPage={setPage} />
            )}
            {page === "goals" && <GoalsPanel snapshot={snapshot} />}
            {page === "ideals" && (
              <IdealsPanel
                snapshot={snapshot}
                refreshSnapshot={refreshSnapshot}
              />
            )}
            {page === "users" && (
              <UserPanel
                snapshot={snapshot}
                refreshSnapshot={refreshSnapshot}
                setPage={setPage}
              />
            )}
            {page === "train" && (
              <TrainPanel snapshot={snapshot} setPage={setPage} />
            )}
            {page === "exp" && (
              <ExpPanel snapshot={snapshot} setPage={setPage} />
            )}
            {page === "night" && <NightModePanel setPage={setPage} />}
            {page === "ainews" && <AiNewsPanel />}
            {page === "mail" && <MailPanel {...panelProps} />}
            {page === "settings" && (
              <SettingsPanel
                themeKey={themeKey}
                onChangeTheme={changeTheme}
                visualMode={visualMode}
                onChangeVisualMode={changeVisualMode}
              />
            )}
          </section>
        </div>
      </div>
      <QuickAddFab
        open={quickAddOpen}
        onOpen={() => setQuickAddOpen(true)}
        onClose={() => setQuickAddOpen(false)}
        setPage={setPage}
        refreshSnapshot={refreshSnapshot}
      />
      {commandOpen && (
        <CommandPaletteModal
          snapshot={snapshot}
          setPage={setPage}
          onClose={() => setCommandOpen(false)}
          openSearch={() => setGlobalSearchOpen(true)}
          openQuickAdd={() => setQuickAddOpen(true)}
        />
      )}
      {globalSearchOpen && (
        <GlobalSearchModal
          snapshot={snapshot}
          setPage={setPage}
          onClose={() => setGlobalSearchOpen(false)}
        />
      )}
      <style jsx global>{`
        input[type="time"],
        input[type="date"],
        input[type="datetime-local"],
        select {
          color-scheme: dark;
          color: #f8fafc;
          background-color: rgba(2, 6, 23, 0.92);
          border-color: rgba(255, 255, 255, 0.22);
        }
        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
          opacity: 0.95;
        }
        .diary-content h1 {
          font-size: 2.25rem;
          line-height: 1.1;
          font-weight: 900;
          margin: 0.7rem 0;
        }
        .diary-content h2 {
          font-size: 1.75rem;
          line-height: 1.2;
          font-weight: 900;
          margin: 0.6rem 0;
        }
        .diary-content h3 {
          font-size: 1.35rem;
          line-height: 1.25;
          font-weight: 900;
          margin: 0.5rem 0;
        }
        .diary-content img {
          max-width: 100%;
          border-radius: 24px;
          margin: 14px 0;
        }
        .diary-content blockquote {
          margin: 0.8rem 0;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          padding: 0.75rem 1rem;
        }

        .visual-current {
          --lc-panel-alpha: 0.075;
          --lc-glow: rgba(125, 211, 252, 0.12);
          --lc-radius: 1.6rem;
        }
        .visual-stained {
          --lc-panel-alpha: 0.13;
          --lc-glow: rgba(244, 114, 182, 0.22);
        }
        .visual-stained section,
        .visual-stained aside,
        .visual-stained header,
        .visual-stained .rounded-\[1\.6rem\] {
          box-shadow:
            0 24px 80px rgba(244, 114, 182, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.18);
        }
        .visual-stained::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.23;
          background-image:
            linear-gradient(135deg, rgba(244, 114, 182, 0.22), transparent 24%),
            linear-gradient(
              45deg,
              transparent 40%,
              rgba(125, 211, 252, 0.18) 40% 44%,
              transparent 44%
            ),
            repeating-conic-gradient(
              from 45deg,
              rgba(255, 255, 255, 0.08) 0 12deg,
              transparent 12deg 48deg
            );
        }
        .visual-cyber {
          --lc-panel-alpha: 0.1;
          --lc-glow: rgba(34, 211, 238, 0.26);
        }
        .visual-cyber section,
        .visual-cyber aside,
        .visual-cyber header {
          box-shadow:
            0 0 0 1px rgba(34, 211, 238, 0.16),
            0 0 42px rgba(34, 211, 238, 0.1);
        }
        .visual-cyber::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          opacity: 0.25;
          background-image:
            linear-gradient(rgba(34, 211, 238, 0.08) 1px, transparent 1px),
            linear-gradient(
              90deg,
              rgba(34, 211, 238, 0.08) 1px,
              transparent 1px
            );
          background-size: 42px 42px;
        }
        .visual-funny {
          --lc-panel-alpha: 0.11;
          --lc-glow: rgba(250, 204, 21, 0.22);
        }
        .visual-funny button {
          transform-origin: center;
        }
        .visual-funny button:hover {
          transform: rotate(-0.6deg) scale(1.01);
        }
        .visual-liquid {
          --lc-panel-alpha: 0.08;
          --lc-glow: rgba(255, 255, 255, 0.2);
        }
        .visual-liquid section,
        .visual-liquid aside,
        .visual-liquid header {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.28),
            0 24px 70px rgba(0, 0, 0, 0.25);
          backdrop-filter: blur(28px) saturate(1.35);
        }
        .nav-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .nav-scroll::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
        }
        .nav-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/85 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.filter((item) => ["home", "memos", "todos", "routines", "budget"].includes(item.key)).map((item) => {
            const active = page === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setPage(item.key)}
                className={`min-w-[76px] snap-start rounded-2xl px-2 py-2 text-center text-[11px] transition sm:min-w-0 sm:flex-1 ${active ? `bg-gradient-to-r ${theme.accent} font-black text-black` : "bg-white/[0.04] text-white/65 hover:bg-white/10"}`}
              >
                <div className="flex justify-center">
                  <NavIcon icon={item.icon} label={item.label} className="h-8 w-8" />
                </div>
                <div>{item.label}</div>
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`matsuri-card rounded-[1.6rem] border border-white/10 bg-white/[0.075] p-4 shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}
function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black transition active:scale-[0.99] disabled:opacity-50"
    >
      {children}
    </button>
  );
}
function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-inner outline-none placeholder:text-white/40 [color-scheme:dark] focus:border-white/45 ${props.className || ""}`}
    />
  );
}
function TimeField(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label = "時刻選択", className, ...rest } = props;
  return (
    <label
      className={`block rounded-2xl border border-white/25 bg-slate-950/95 px-4 py-2 text-left shadow-inner ${className || ""}`}
    >
      <span className="mb-1 block text-[11px] font-black tracking-wide text-cyan-100/80">
        {label}
      </span>
      <input
        {...rest}
        type="time"
        className="w-full bg-transparent py-1 text-base font-black text-white outline-none [color-scheme:dark]"
      />
    </label>
  );
}
function DateField(
  props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string },
) {
  const { label = "日付選択", className, ...rest } = props;
  return (
    <label
      className={`block rounded-2xl border border-white/25 bg-slate-950/95 px-4 py-2 text-left shadow-inner ${className || ""}`}
    >
      <span className="mb-1 block text-[11px] font-black tracking-wide text-cyan-100/80">
        {label}
      </span>
      <input
        {...rest}
        type="date"
        className="w-full bg-transparent py-1 text-base font-black text-white outline-none [color-scheme:dark]"
      />
    </label>
  );
}
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-inner outline-none placeholder:text-white/40 [color-scheme:dark] focus:border-white/45 ${props.className || ""}`}
    />
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-6 text-center text-sm text-white/50">
      {text}
    </div>
  );
}

type PanelProps = {
  snapshot: Snapshot | null;
  refreshSnapshot: (reason?: string) => Promise<void>;
  setPage: (p: PageKey) => void;
};

type WeatherState = {
  status: "idle" | "loading" | "ready" | "denied" | "error";
  temperature?: number;
  apparent?: number;
  wind?: number;
  code?: number;
  place?: string;
  updatedAt?: number;
  message?: string;
};

function weatherLabel(code?: number) {
  if (code === undefined) return "天気";
  if (code === 0) return "快晴";
  if ([1, 2].includes(code)) return "晴れ時々くもり";
  if (code === 3) return "くもり";
  if ([45, 48].includes(code)) return "霧";
  if ([51, 53, 55, 56, 57].includes(code)) return "霧雨";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "雨";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "雪";
  if ([95, 96, 99].includes(code)) return "雷雨";
  return "天気";
}

function WeatherCard() {
  const [weather, setWeather] = useState<WeatherState>(() => {
    if (typeof window === "undefined") return { status: "idle" };
    try {
      const raw = localStorage.getItem("lifeHomeWeatherCache");
      if (!raw) return { status: "idle" };
      const parsed = JSON.parse(raw) as WeatherState;
      if (parsed.updatedAt && Date.now() - parsed.updatedAt < 30 * 60 * 1000)
        return parsed;
    } catch {}
    return { status: "idle" };
  });

  const loadWeather = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!("geolocation" in navigator)) {
      setWeather({
        status: "error",
        message: "位置情報が使えない環境みたい。",
      });
      return;
    }
    setWeather((prev) => ({ ...prev, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("weather fetch failed");
          const json = await res.json();
          const next: WeatherState = {
            status: "ready",
            temperature:
              Math.round(Number(json.current?.temperature_2m ?? 0) * 10) / 10,
            apparent:
              Math.round(Number(json.current?.apparent_temperature ?? 0) * 10) /
              10,
            wind:
              Math.round(Number(json.current?.wind_speed_10m ?? 0) * 10) / 10,
            code: Number(json.current?.weather_code ?? 0),
            place: "現在地",
            updatedAt: Date.now(),
          };
          localStorage.setItem("lifeHomeWeatherCache", JSON.stringify(next));
          setWeather(next);
        } catch {
          setWeather({
            status: "error",
            message: "天気の取得に失敗したみたい。時間を置くと戻るかも。",
          });
        }
      },
      () =>
        setWeather({
          status: "denied",
          message: "位置情報を許可すると、ここに現在地の天気を出せるよ。",
        }),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    if (weather.status === "idle") loadWeather();
  }, [weather.status, loadWeather]);

  const label = weatherLabel(weather.code);
  return (
    <GlassCard className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-sky-100/70">現在地の天気</p>
          <h2 className="mt-1 text-2xl font-black">
            {weather.status === "ready"
              ? label
              : weather.status === "loading"
                ? "取得中..."
                : "天気カード"}
          </h2>
        </div>
        <button
          type="button"
          onClick={loadWeather}
          className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-black"
        >
          更新
        </button>
      </div>
      {weather.status === "ready" ? (
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-black/25 p-3">
            <p className="text-xs text-white/45">気温</p>
            <p className="mt-1 text-2xl font-black">{weather.temperature}℃</p>
          </div>
          <div className="rounded-2xl bg-black/25 p-3">
            <p className="text-xs text-white/45">体感</p>
            <p className="mt-1 text-2xl font-black">{weather.apparent}℃</p>
          </div>
          <div className="rounded-2xl bg-black/25 p-3">
            <p className="text-xs text-white/45">風</p>
            <p className="mt-1 text-2xl font-black">{weather.wind}</p>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm leading-7 text-white/65">
          {weather.message ||
            "ホーム表示を重くしないように、現在地の天気だけ軽く取得するよ。"}
        </p>
      )}
      <p className="mt-3 text-xs text-white/40">
        30分キャッシュで反応速度を保つ設定。
      </p>
    </GlassCard>
  );
}

function FutureTopHud({
  title,
  syncStatus,
  themeKey,
  visualMode,
  onSearch,
  onManualSync,
  onChangeTheme,
  onChangeVisualMode,
}: {
  title: string;
  syncStatus: string;
  themeKey: ThemeKey;
  visualMode: VisualMode;
  onSearch: () => void;
  onManualSync: () => void;
  onChangeTheme: (theme: ThemeKey) => void;
  onChangeVisualMode: (mode: VisualMode) => void;
}) {
  const [clock, setClock] = useState(() => new Date());
  const [hudWeather, setHudWeather] = useState<WeatherState>(() => {
    if (typeof window === "undefined") return { status: "idle" };
    try {
      const raw = localStorage.getItem("lifeHomeWeatherCache");
      if (!raw) return { status: "idle" };
      const cached = JSON.parse(raw) as WeatherState;
      if (cached.updatedAt && Date.now() - cached.updatedAt < 30 * 60 * 1000)
        return cached;
    } catch {}
    return { status: "idle" };
  });

  const loadHudWeather = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setHudWeather({ status: "denied", message: "位置情報待ち" });
      return;
    }
    setHudWeather((prev) => ({ ...prev, status: "loading" }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("weather fetch failed");
          const json = await res.json();
          const next: WeatherState = {
            status: "ready",
            temperature: Math.round(Number(json.current?.temperature_2m ?? 0)),
            apparent: Math.round(Number(json.current?.apparent_temperature ?? 0)),
            wind: Math.round(Number(json.current?.wind_speed_10m ?? 0)),
            code: Number(json.current?.weather_code ?? 0),
            updatedAt: Date.now(),
          };
          localStorage.setItem("lifeHomeWeatherCache", JSON.stringify(next));
          setHudWeather(next);
        } catch {
          setHudWeather({ status: "error", message: "天気取得エラー" });
        }
      },
      () => setHudWeather({ status: "denied", message: "位置情報待ち" }),
      { enableHighAccuracy: false, timeout: 9000, maximumAge: 30 * 60 * 1000 },
    );
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setClock(new Date()), 30000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    if (hudWeather.status === "idle") loadHudWeather();
  }, [hudWeather.status, loadHudWeather]);

  const timeLabel = clock.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateLabel = clock.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const weatherText =
    hudWeather.status === "ready"
      ? `${weatherLabel(hudWeather.code)} ${hudWeather.temperature}℃`
      : hudWeather.status === "loading"
        ? "天気取得中"
        : "天気待ち";

  return (
    <header className="future-top-hud">
      <div className="future-brand-lockup">
        <p className="text-2xl font-black leading-none text-white drop-shadow">Life Command OS</p>
        <p className="mt-2 text-sm font-bold text-sky-100/70">思い出・習慣・目標をまとめる人生OS</p>
      </div>

      <button type="button" onClick={onSearch} className="future-search-pill" aria-label="検索を開く">
        <span className="text-3xl leading-none">⌕</span>
        <span className="text-sm font-bold text-white/58">検索</span>
      </button>

      <div className="future-hud-widgets">
        <button type="button" onClick={loadHudWeather} className="future-hud-card future-weather-chip">
          <span className="text-2xl">☀️</span>
          <span>
            <b>{weatherText}</b>
            <small>気分: Good 😊</small>
          </span>
        </button>
        <div className="future-hud-card future-clock-chip">
          <b>{timeLabel}</b>
          <small>{dateLabel}</small>
        </div>
        <button type="button" onClick={onManualSync} className="future-icon-button" aria-label="同期">
          🔔
        </button>
        <div className="future-avatar" aria-label="プロフィール">
          秀
        </div>
      </div>

      <div className="future-mode-row">
        <span className="future-system-dot" />
        <span>{syncStatus}</span>
        <select value={themeKey} onChange={(e) => onChangeTheme(e.target.value as ThemeKey)}>
          {Object.entries(themes).map(([key, value]) => (
            <option key={key} value={key}>{value.emoji} {value.name}</option>
          ))}
        </select>
        <select value={visualMode} onChange={(e) => onChangeVisualMode(e.target.value as VisualMode)}>
          {Object.entries(visualModes).map(([key, value]) => (
            <option key={key} value={key}>{value.emoji} {value.name}</option>
          ))}
        </select>
      </div>
    </header>
  );
}

function HomePanel({
  themeKey,
  snapshot,
  refreshSnapshot,
  setPage,
}: PanelProps & { themeKey: ThemeKey }) {
  const [guideMessage, setGuideMessage] = useState(
    "おはよう、しゅうやさん。未来港の朝みたいに、今日も小さく前へ進もう。",
  );
  const [loading, setLoading] = useState(false);
  const [quickMemo, setQuickMemo] = useState("");
  const [savingQuickMemo, setSavingQuickMemo] = useState(false);

  async function refreshGuide() {
    setLoading(true);
    try {
      const data = await loadSnapshot();
      await refreshSnapshot();
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "guideAI", data }),
      });
      const json = await res.json();
      const msg = json.result || localGuide(data);
      setGuideMessage(msg);
      setGuideDraft(msg);
    } catch {
      const msg = localGuide(snapshot);
      setGuideMessage(msg);
      setGuideDraft(msg);
    } finally {
      setLoading(false);
    }
  }

  async function saveQuickMemo() {
    const content = quickMemo.trim();
    if (!content || savingQuickMemo) return;
    setSavingQuickMemo(true);
    try {
      const result = await supabase.from("memos").insert({ content });
      if (result.error) throw result.error;
      setQuickMemo("");
      setGuideDraft("クイックメモを保存したよ。小さな記録が未来の材料になるね。");
      await refreshSnapshot("クイックメモ保存中...");
    } catch (error) {
      console.error(error);
      setGuideDraft("メモ保存が少し詰まったみたい。通信状態かSupabaseの設定を確認してみてね。");
    } finally {
      setSavingQuickMemo(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("lifeGuideMessage");
    if (saved) setGuideMessage(saved);
    const handler = (e: Event) =>
      setGuideMessage((e as CustomEvent<string>).detail || "記録を受け取ったよ。");
    window.addEventListener("life-guide-message", handler as EventListener);
    return () => window.removeEventListener("life-guide-message", handler as EventListener);
  }, []);

  const now = new Date();
  const today = todayKey();
  const dateLabel = now.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
  const timeLabel = now.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const todayTodos = (snapshot?.todos || []).filter(
    (t) => !t.done && (t.due_date || getCreatedDateKey(t.created_at)) === today,
  );
  const undoneTodos = (snapshot?.todos || []).filter((t) => !t.done);
  const doneTodos = (snapshot?.todos || []).filter((t) => t.done).length;
  const allTodos = snapshot?.todos?.length || 0;
  const monthLogs = (snapshot?.budget || []).filter((b) => isSameMonth(b.spend_date));
  const income = monthLogs
    .filter((b) => b.type === "income")
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const expense = monthLogs
    .filter((b) => b.type === "expense")
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const balance = income - expense;
  const todayExpense = monthLogs
    .filter((b) => b.type === "expense" && b.spend_date === today)
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const fixedMonthlyForHome = (snapshot?.budgetFixedTemplates || [])
    .filter((t) => t.active !== false)
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const remainingForHome = Math.max(0, income - expense - fixedMonthlyForHome);
  const dailyBudgetForHome = Math.floor(remainingForHome / daysLeftInMonth());
  const mindInboxCount = readMindInboxItems().length;
  const morningRoutinesForHome = (snapshot?.routines || []).filter((r) => r.active && classifyRoutineSlot(r) === "morning");
  const morningDoneForHome = morningRoutinesForHome.filter((r) =>
    (snapshot?.routineChecks || []).some((c) => c.routine_id === r.id && c.check_date === today),
  ).length;
  const morningRateForHome = morningRoutinesForHome.length
    ? Math.round((morningDoneForHome / morningRoutinesForHome.length) * 100)
    : 0;
  const topTodoForHome = todayTodos[0]?.title || undoneTodos[0]?.title || "Mind Captureで今日の最重要を決める";
  const todayEvents = (snapshot?.events || []).filter((e) => e.event_date === today).slice(0, 6);
  const todayMemos = (snapshot?.memos || [])
    .filter((m) => getCreatedDateKey(m.created_at) === today)
    .slice(0, 4);
  const latestMemos = (todayMemos.length ? todayMemos : (snapshot?.memos || []).slice(0, 4));
  const routines = (snapshot?.routines || []).filter((r) => r.active).slice(0, 6);
  const completion = allTodos ? Math.round((doneTodos / allTodos) * 100) : 60;
  const sleep = snapshot?.sleep?.[0];
  const coffee = snapshot?.coffee?.find((c) => c.drink_date === today);

  const fallbackSchedule = [
    "07:00　ジム・筋トレ",
    "09:30　仕事・集中タイム",
    "12:30　昼食・リフレッシュ",
    "16:00　プロジェクト作業",
    "19:00　読書時間",
  ];
  const fallbackMemos = [
    "急に画面がガタンと動くバグを治す",
    "デザインの微調整をする",
    "サイトの表示速度を上げる方法を調べる",
    "明日の準備をして早めに寝る",
  ];
  const progressTodos = (todayTodos.length ? todayTodos : undoneTodos).slice(0, 4);

  return (
    <div className={`matsuri-dashboard ${themeKey === "mirai" ? "future-dashboard future-home-v14 future-home-v16" : ""} space-y-4`}>
      <div className="future-hero-grid">
        <GlassCard className="future-welcome-card matsuri-welcome relative min-h-[292px] overflow-hidden p-6 sm:p-8">
          <div className="relative z-10 max-w-3xl">
            <p className="future-kicker">LIFE COMMAND OS</p>
            <h2 className="mt-5 text-4xl font-black leading-tight text-white drop-shadow sm:text-5xl">
              おはよう、しゅうやさん
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-sky-50/78">
              最高の一日を、今日も始めよう。記録・予定・習慣をひとつの未来港に集めて、背景だけじゃなくカード、枠線、アイコン、ボタンまで青いLiquid Glassで統一したホームだよ。
            </p>
            <div className="mt-6 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                { label: "エネルギー", value: "78%", icon: "⚡" },
                { label: "集中力", value: "82", icon: "◎" },
                { label: "気分", value: "Good", icon: "☻" },
                { label: "時刻", value: timeLabel, icon: "◷" },
                { label: "日付", value: dateLabel.replace(/年|月/g, "/").replace("日", ""), icon: "▣" },
              ].map((item) => (
                <div key={item.label} className="matsuri-mini future-stat-tile rounded-2xl border border-sky-200/20 bg-black/25 p-3 text-center">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-sky-100/30 bg-sky-300/12 text-lg shadow-[0_0_24px_rgba(125,211,252,.35)]">
                    {item.icon}
                  </div>
                  <p className="mt-2 text-[10px] font-black text-sky-100/55">{item.label}</p>
                  <p className="mt-1 text-sm font-black text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard className="future-progress-card matsuri-quest p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black text-sky-100/62">今日の進行</p>
              <h3 className="mt-1 text-3xl font-black">今日の進行</h3>
            </div>
            <span className="rounded-full border border-sky-200/25 bg-sky-300/10 px-3 py-1 text-xs font-black text-sky-100">
              進捗 {completion}%
            </span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/30">
            <div className="h-full rounded-full bg-gradient-to-r from-sky-300 via-indigo-300 to-blue-500" style={{ width: `${Math.max(8, completion)}%` }} />
          </div>
          <div className="mt-5 space-y-3">
            {(progressTodos.length
              ? progressTodos
              : ([
                  { id: "fallback-1", title: "Mind Captureをホームのページに表示させる", done: false, priority: "normal", due_date: today, created_at: new Date().toISOString() },
                  { id: "fallback-2", title: "電車の乗り換えや時刻情報を教えてくれる機能", done: false, priority: "normal", due_date: today, created_at: new Date().toISOString() },
                  { id: "fallback-3", title: "未来テーマのUIを微調整する", done: false, priority: "normal", due_date: today, created_at: new Date().toISOString() },
                ] as Todo[])
            ).map((todo) => (
              <button key={todo.id} onClick={() => setPage("todos")} className="future-progress-row group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-left transition hover:bg-white/10">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-sky-200/50 bg-sky-300/14 text-xs shadow-[0_0_18px_rgba(125,211,252,.22)]">✓</span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-white/88">{todo.title}</span>
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-2 py-1 text-[10px] font-black text-amber-100">進行中</span>
              </button>
            ))}
          </div>
          <button onClick={() => setPage("todos")} className="mt-5 w-full rounded-2xl border border-sky-200/18 bg-sky-300/10 px-4 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-300/15">
            すべてのタスクを見る　→
          </button>
        </GlassCard>
      </div>

      <HomeMindCaptureCard refreshSnapshot={refreshSnapshot} setPage={setPage} />

      <GlassCard className="future-launch-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.28em] text-sky-100/58">TODAY BOOT CARD</p>
            <h3 className="mt-2 text-2xl font-black">今日の起動</h3>
            <p className="mt-2 text-sm leading-6 text-white/62">
              朝ルーティン、予定、お金、未整理メモをまとめて見るカードだよ。
            </p>
          </div>
          <button onClick={() => setPage("braindump")} className="rounded-2xl border border-sky-200/18 bg-sky-300/12 px-4 py-3 text-sm font-black text-sky-50">
            Mind Captureを開く
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ["朝ルーティン", `${morningRateForHome}%`],
            ["今日の予定", `${todayEvents.length}件`],
            ["未整理メモ", `${mindInboxCount}件`],
            ["今日使える目安", yen(Math.max(0, dailyBudgetForHome - todayExpense))],
            ["今日の支出", yen(todayExpense)],
            ["最重要タスク", topTodoForHome],
          ].map(([label, value]) => (
            <button
              key={label}
              onClick={() =>
                label === "朝ルーティン" ? setPage("routines") :
                label === "今日の予定" ? setPage("calendar") :
                label === "未整理メモ" ? setPage("braindump") :
                label === "今日使える目安" || label === "今日の支出" ? setPage("budget") :
                setPage("todos")
              }
              className="rounded-2xl border border-sky-200/12 bg-black/24 p-3 text-left"
            >
              <p className="text-[11px] font-black text-sky-100/48">{label}</p>
              <p className="mt-1 truncate text-lg font-black text-white">{value}</p>
            </button>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-sky-300/10 px-4 py-3 text-sm leading-6 text-sky-50/78">
          {todayEvents.length >= 4
            ? "今日は予定が多めだよ。朝ルーティンは短縮版でも、流れを作れれば十分そう。"
            : todayExpense > dailyBudgetForHome
              ? "今日の支出は少し進んでるよ。次の支出だけ軽めにできると月末予測が安定しそう。"
              : "今日はまだ余白があるよ。Mind Captureで頭の中を一度外に出すと、動き出しが楽になりそう。"}
        </p>
      </GlassCard>

      <div className="future-middle-grid">
        <GlassCard className="future-panel-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black">今日の予定</h3>
            <button onClick={() => setPage("calendar")} className="text-xs font-black text-sky-200">カレンダーへ →</button>
          </div>
          <div className="mt-4 space-y-3">
            {todayEvents.length
              ? todayEvents.map((event) => (
                  <button key={event.id} onClick={() => setPage("calendar")} className="matsuri-row future-list-row w-full text-left">
                    <span>•</span><span className="truncate">{event.title}</span>
                  </button>
                ))
              : fallbackSchedule.map((item) => (
                  <div key={item} className="matsuri-row future-list-row"><span>•</span><span>{item}</span></div>
                ))}
          </div>
        </GlassCard>

        <GlassCard className="future-panel-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black">今日のメモ</h3>
            <button onClick={() => setPage("memos")} className="text-xs font-black text-sky-200">すべて見る →</button>
          </div>
          <div className="mt-4 space-y-3">
            {(latestMemos.length ? latestMemos.map((memo) => memo.content) : fallbackMemos).slice(0, 4).map((memo, index) => (
              <button key={`${memo}-${index}`} onClick={() => setPage("memos")} className="matsuri-row future-list-row w-full text-left">
                <span>✎</span><span className="truncate">{memo}</span>
              </button>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="future-panel-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-black">クイックメモ</h3>
            <button onClick={() => setQuickMemo((v) => v || "新しいアイデア：")} className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200/25 bg-sky-300/10 text-xl font-black text-sky-100">＋</button>
          </div>
          <textarea
            value={quickMemo}
            onChange={(e) => setQuickMemo(e.target.value)}
            placeholder="未来のUIにホログラムの演出を追加する、など"
            className="mt-4 min-h-28 w-full resize-none rounded-3xl border border-sky-200/16 bg-black/24 p-4 text-sm leading-7 text-white outline-none placeholder:text-white/35 focus:border-sky-200/45"
          />
          <button
            type="button"
            onClick={saveQuickMemo}
            disabled={!quickMemo.trim() || savingQuickMemo}
            className="mt-3 w-full rounded-2xl border border-sky-200/25 bg-sky-400/15 px-4 py-3 text-sm font-black text-sky-50 transition active:scale-95 disabled:opacity-45"
          >
            {savingQuickMemo ? "保存中..." : "メモを保存"}
          </button>
        </GlassCard>
      </div>

      <div className="future-bottom-grid">
        <GlassCard className="future-panel-card p-5">
          <h3 className="text-xl font-black">習慣トラッカー</h3>
          <p className="mt-1 text-xs font-bold text-sky-100/55">今週の達成度</p>
          <div className="mt-5 flex items-end gap-3">
            {[34, 52, 46, 65, 78, 91, 96].map((height, index) => (
              <div key={index} className="flex flex-1 flex-col items-center gap-2">
                <div className="w-full rounded-full bg-sky-300/18 p-1">
                  <div className="mx-auto w-full rounded-full bg-gradient-to-t from-blue-500 via-sky-300 to-white shadow-[0_0_18px_rgba(96,165,250,.45)]" style={{ height }} />
                </div>
                <span className="text-[10px] font-black text-white/50">{["月", "火", "水", "木", "金", "土", "日"][index]}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-2">
            {routines.length ? routines.slice(0, 3).map((routine) => {
              const stats = calcRoutineStats(routine.id, snapshot?.routineChecks || []);
              return (
                <button key={routine.id} onClick={() => setPage("routines")} className="matsuri-row future-list-row w-full text-left">
                  <span>✅</span><span className="truncate">{routine.title}</span><b className="ml-auto">{stats.currentStreak}日</b>
                </button>
              );
            }) : <div className="matsuri-row future-list-row"><span>✅</span><span>ルーティン</span><b className="ml-auto">{routines.length}件</b></div>}
          </div>
        </GlassCard>

        <GlassCard className="future-panel-card future-motivation-card p-5">
          <h3 className="text-xl font-black">モチベーション</h3>
          <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
            <p className="text-lg font-black leading-8 text-white">未来を信じて、<br />今日を全力で生きる。</p>
            <p className="mt-4 text-right text-xs font-bold text-sky-100/55">- 自分を信じて -</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-black text-sky-100/70">
            <div className="rounded-2xl bg-black/20 p-3">睡眠<br /><span className="text-white">{sleep?.quality || "記録待ち"}</span></div>
            <div className="rounded-2xl bg-black/20 p-3">カフェイン<br /><span className="text-white">{coffee?.caffeine_mg || 0}mg</span></div>
            <div className="rounded-2xl bg-black/20 p-3">収支<br /><span className="text-white">{yen(balance)}</span></div>
          </div>
        </GlassCard>

        <WeatherCard />
      </div>

      <div className="future-footer-strip">
        <span>小さな積み重ねが、未来をつくる。</span>
        <span className="hidden sm:inline">● システム正常</span>
        <span className="hidden sm:inline">バックアップ：最新</span>
        <span>Ver. 2.0.0</span>
      </div>
    </div>
  );
}

function makeFiveMinuteTodo(title: string) {
  const clean = String(title || "").trim() || "作業";
  if (/掃除|片付|整理/.test(clean))
    return `${clean}のうち、机の上か床の一角だけを5分触る`;
  if (/買|スーパー|支払|予約|連絡/.test(clean))
    return `${clean}に必要な画面/メモを開くだけやる`;
  if (/書|作|開発|コード|資料/.test(clean))
    return `${clean}の最初の1行だけ作る`;
  return `${clean}を5分だけ始める。終わらせなくて大丈夫`;
}

function LifeAssistPanel({
  snapshot,
  setPage,
}: {
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
}) {
  const today = todayKey();
  const todos = (snapshot?.todos || []).filter((t) => !t.done);
  const todayTodos = todos.filter(
    (t) => (t.due_date || getCreatedDateKey(t.created_at)) === today,
  );
  const now3 = (todayTodos.length ? todayTodos : todos).slice(0, 3);
  const laterItems = [...(snapshot?.memos || []), ...(snapshot?.tweets || [])]
    .filter((m: any) =>
      /あとで|後で|読む|調べ|買いたい|行きたい/.test(String(m.content || "")),
    )
    .slice(0, 4);
  const monthLogs = (snapshot?.budget || []).filter((b) =>
    isSameMonth(b.spend_date),
  );
  const income = monthLogs
    .filter((b) => b.type === "income")
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const expense = monthLogs
    .filter((b) => b.type === "expense")
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const fixed = (snapshot?.budgetFixedTemplates || [])
    .filter((f) => f.active)
    .reduce((s, f) => s + Number(f.amount || 0), 0);
  const todayUsable = Math.floor(
    Math.max(0, income - expense - fixed) / daysLeftInMonth(),
  );
  const caffeine = (snapshot?.coffee || [])
    .filter((c) => c.drink_date === today)
    .reduce((s, c) => s + Number(c.caffeine_mg || 0), 0);
  const fatigueScore =
    todos.length +
    (caffeine > 300 ? 2 : 0) +
    ((snapshot?.sleep?.[0]?.quality || "").includes("悪") ? 3 : 0);
  const recentWords = [
    ...(snapshot?.diaries || []),
    ...(snapshot?.memos || []),
    ...(snapshot?.tweets || []),
  ]
    .map((x: any) => `${x.title || ""} ${x.content || ""}`)
    .join(" ");
  const memoryTags = [
    "サウナ",
    "青春ラン",
    "Wind Hunt",
    "江ノ島",
    "カフェ",
    "ストグリ",
    "ジム",
  ].filter((w) => recentWords.includes(w));
  const doneToday =
    (snapshot?.todos || []).filter(
      (t) => t.done && getCreatedDateKey(t.created_at) === today,
    ).length +
    (snapshot?.routineChecks || []).filter((r) => r.check_date === today)
      .length;
  const happySpend = monthLogs
    .filter((b) =>
      /サウナ|カフェ|ラン|ジム|音楽|本|学習/.test(
        `${b.category} ${b.memo || ""}`,
      ),
    )
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  return (
    <div className="grid gap-3 xl:grid-cols-3">
      <GlassCard className="xl:col-span-3">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <p className="text-xs font-black text-cyan-100/70">
              朝ブリーフィング
            </p>
            <p className="mt-1 text-sm text-white/70">
              今日のTODO {todayTodos.length}件 / カフェイン {caffeine}mg
            </p>
          </div>
          <div>
            <p className="text-xs font-black text-emerald-100/70">やった感</p>
            <p className="mt-1 text-sm text-white/70">
              今日の達成 {doneToday}個
            </p>
          </div>
          <div>
            <p className="text-xs font-black text-amber-100/70">
              幸福コスパ候補
            </p>
            <p className="mt-1 text-sm text-white/70">今月 {yen(happySpend)}</p>
          </div>
          <div>
            <p className="text-xs font-black text-fuchsia-100/70">次の導線</p>
            <button
              onClick={() => setPage(todos.length ? "todos" : "braindump")}
              className="mt-1 rounded-2xl bg-white px-3 py-2 text-xs font-black text-black"
            >
              {todos.length ? "TODOへ" : "Mind Captureへ"}
            </button>
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black text-cyan-100/70">
              ワーキングメモリ軽量化
            </p>
            <h2 className="mt-1 text-2xl font-black">今やる3つ</h2>
          </div>
          <button
            onClick={() => setPage("todos")}
            className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-black"
          >
            TODOへ
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {now3.length ? (
            now3.map((t) => (
              <div
                key={t.id}
                className="rounded-2xl bg-black/25 p-3 text-sm font-bold"
              >
                {t.title}
                <p className="mt-1 text-xs text-white/45">
                  5分版: {makeFiveMinuteTodo(t.title)}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/55">
              今すぐ扱うTODOは少なめ。いい感じに余白があるよ。
            </p>
          )}
        </div>
      </GlassCard>
      <GlassCard>
        <p className="text-xs font-black text-emerald-100/70">QOLガード</p>
        <h2 className="mt-1 text-2xl font-black">今日あと使える額</h2>
        <p className="mt-3 text-4xl font-black">{yen(todayUsable)}</p>
        <p className="mt-2 text-sm text-white/55">
          収入・今月支出・固定費テンプレから日割りで計算。
        </p>
        <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm">
          {fatigueScore >= 6
            ? "脳疲労が強めの日。TODO表示を3つに絞るのが相性よさそう。"
            : "今日はまだ処理余力が残りやすい状態に見えるよ。"}
        </p>
      </GlassCard>
      <GlassCard>
        <p className="text-xs font-black text-amber-100/70">ADHDサポート</p>
        <h2 className="mt-1 text-2xl font-black">
          外出前・衝動買い・カフェイン
        </h2>
        <div className="mt-3 space-y-2 text-sm text-white/75">
          <p>🎒 外出前: 財布・鍵・イヤホン・充電を確認しやすくする入口。</p>
          <p>
            🛒 衝動買い:{" "}
            {fatigueScore >= 6
              ? "今日は警戒寄り。買う前に後でBOXへ逃がすと安全。"
              : "今日は通常モード。"}
          </p>
          <p>
            ☕ カフェイン: 約{caffeine}mg /{" "}
            {caffeine >= 300
              ? "夜の覚醒に残りやすいかも"
              : "まだ強すぎない範囲"}
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => setPage("belongings")}
            className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold"
          >
            持ち物へ
          </button>
          <button
            onClick={() => setPage("coffee")}
            className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold"
          >
            コーヒーへ
          </button>
        </div>
      </GlassCard>
      <GlassCard className="xl:col-span-2">
        <p className="text-xs font-black text-fuchsia-100/70">
          後で読むBOX / 途中だったもの
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {laterItems.length ? (
            laterItems.map((item: any) => (
              <div
                key={item.id}
                className="rounded-2xl bg-black/25 p-3 text-sm text-white/75"
              >
                {String(item.content || "").slice(0, 90)}
              </div>
            ))
          ) : (
            <p className="text-sm text-white/55">
              「あとで」「調べる」「買いたい」と書いたメモやつぶやきがここに集まるよ。
            </p>
          )}
          <div className="rounded-2xl bg-black/25 p-3 text-sm text-white/75">
            前回途中候補:{" "}
            {todos[0]?.title ||
              snapshot?.memos?.[0]?.content?.slice(0, 40) ||
              "まだ候補なし"}
          </div>
        </div>
      </GlassCard>
      <GlassCard>
        <p className="text-xs font-black text-sky-100/70">ライフログ自動記憶</p>
        <h2 className="mt-1 text-xl font-black">最近の軸</h2>
        <p className="mt-3 text-sm text-white/65">
          {memoryTags.length
            ? memoryTags.join(" / ")
            : "よく出る言葉が増えると、ここに自動で並ぶよ。"}
        </p>
      </GlassCard>
    </div>
  );
}

function localGuide(data: Snapshot | null) {
  const today = todayKey();
  const todos =
    data?.todos.filter((t) => t.due_date === today && !t.done).length || 0;
  const caffeine =
    data?.coffee
      .filter((c) => c.drink_date === today)
      .reduce((s, c) => s + Number(c.caffeine_mg || 0), 0) || 0;
  const routines =
    data?.routineChecks.filter((c) => c.check_date === today).length || 0;
  return `しゅうやくん、今日のログを見たよ。未完了TODOは${todos}件、カフェインは約${caffeine}mg、習慣チェックは${routines}件。全部を完璧にしなくても、今日の流れはちゃんと残ってるよ。まずは一番軽いページから触れたら大丈夫。`;
}
function GuideAiCard({
  themeKey,
  message,
  onRefresh,
  loading,
}: {
  themeKey: ThemeKey;
  message: string;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  const theme = themes[themeKey];
  return (
    <section className="future-ai-navigator overflow-hidden rounded-[1.75rem] border border-sky-200/16 bg-slate-950/32 shadow-2xl backdrop-blur-2xl">
      <div className="relative grid gap-0 lg:grid-cols-[minmax(0,.92fr)_minmax(0,1.08fr)]">
        <div className="future-ai-portrait relative min-h-[260px] overflow-hidden bg-black/30 lg:min-h-[360px]">
          <img
            src="/life-ai-guide.png"
            alt="案内係AI"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <p className={`inline-flex rounded-full bg-gradient-to-r ${theme.accent} px-3 py-1 text-xs font-black text-black`}>
              Life Command AI
            </p>
            <h3 className="mt-3 text-2xl font-black">現在のAI</h3>
            <p className="mt-1 text-sm text-white/62">記録・予定・お金・習慣を横断して、次に見る場所を整理するよ。</p>
          </div>
        </div>
        <div className="future-ai-console p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["今日", "横断分析"],
              ["お金", "支出確認"],
              ["予定", "行動整理"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-sky-200/12 bg-white/[0.055] p-3">
                <p className="text-[11px] font-black text-sky-100/50">{label}</p>
                <p className="mt-1 text-sm font-black text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="relative mt-4 rounded-[1.4rem] border border-sky-200/14 bg-black/28 p-4">
            <div className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-sky-200/14 bg-[#06142c]" />
            <p className="whitespace-pre-wrap text-sm leading-7 text-white/82">
              {message}
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="mt-4 w-full rounded-2xl border border-sky-200/18 bg-sky-300/12 px-4 py-3 text-sm font-black text-sky-50 shadow-[0_0_30px_rgba(96,165,250,.12)] transition hover:bg-sky-300/18 disabled:opacity-50"
            >
              {loading ? "分析中..." : "現在の記録からAIに整理してもらう"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function MemosPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [edit, setEdit] = useState<Memo | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Memo | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [residentAiOn, setResidentAiOn] = useState(true);
  const [memoAiMode, setMemoAiMode] = useState<
    "annotate" | "classify" | "support"
  >("annotate");
  const [voiceListening, setVoiceListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const memos = snapshot?.memos || [];

  async function add() {
    if (!content.trim()) return;
    const imageUrl = await imageFileToDataUrl(imageFile);
    const payload = { content, image_url: imageUrl };
    const result = await supabase.from("memos").insert(payload);
    if (result.error) {
      if (hasImageColumnError(result.error)) {
        const fallback = await supabase.from("memos").insert({ content });
        if (fallback.error) return alert(fallback.error.message);
      } else {
        return alert(result.error.message);
      }
    }
    setContent("");
    setImageFile(null);
    setGuideDraft("メモを受け取ったよ。画像も一緒に残せる形にしたよ。");
    await refreshSnapshot();
  }
  async function save() {
    if (!edit) return;
    const { error } = await supabase
      .from("memos")
      .update({ content: editContent })
      .eq("id", edit.id);
    if (error) return alert(error.message);
    setEdit(null);
    await refreshSnapshot();
  }
  async function del() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("memos")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) return alert(error.message);
    setDeleteTarget(null);
    setGuideDraft("メモを削除したよ。必要な整理ができたね。");
    await refreshSnapshot();
  }
  async function memoAi() {
    const text =
      content.trim() ||
      memos
        .slice(0, 5)
        .map((m) => m.content)
        .join("\n---\n");
    if (!text) return setAiText("AIに渡せるメモがまだないよ。");
    setAiLoading(true);
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "memoSmartAI", text }),
      });
      const json = await res.json();
      setAiText(json.result || "整理できなかったみたい。");
    } catch {
      setAiText("AI整理に失敗したよ。APIキーや通信状態を確認してね。");
    } finally {
      setAiLoading(false);
    }
  }

  async function residentMemoAi(target?: Memo) {
    const base =
      target?.content ||
      content.trim() ||
      memos
        .slice(0, 8)
        .map((m) => m.content)
        .join("\n---\n");
    if (!base.trim()) return setAiText("常駐AIが見るメモがまだないよ。");
    setAiLoading(true);
    try {
      const prompt =
        memoAiMode === "annotate"
          ? `次のメモに、短い注釈・補足・抜けていそうな観点を付けて。\n${base}`
          : memoAiMode === "classify"
            ? `次のメモをカテゴリ分けして、タグ候補と保存先の候補を出して。\n${base}`
            : `次のメモをもとに、次に取りやすい小さな行動と注意点を出して。\n${base}`;
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "memoSmartAI", text: prompt }),
      });
      const json = await res.json();
      setAiText(json.result || "常駐AIの補助を作れなかったみたい。");
    } catch {
      setAiText("常駐AIに失敗したよ。APIキーや通信状態を確認してね。");
    } finally {
      setAiLoading(false);
    }
  }

  async function memoToTodos() {
    const text =
      content.trim() ||
      memos
        .slice(0, 5)
        .map((m) => m.content)
        .join("\n---\n");
    if (!text) return setAiText("TODO化できるメモがまだないよ。");
    setAiLoading(true);
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "memoToTodosAI", text }),
      });
      const json = await res.json().catch(() => ({}));
      const tasks = Array.isArray(json.todos) ? json.todos : [];
      if (!res.ok && !tasks.length) {
        setAiText(
          json.error ||
            "TODO化APIが失敗したよ。VercelのOPENAI_API_KEYを確認してね。",
        );
        return;
      }
      if (!tasks.length) {
        setAiText(json.result || "TODO候補は見つからなかったよ。");
        return;
      }
      const { inserted, lastError } = await insertTodoCandidates(tasks);
      if (!inserted) {
        setAiText(
          `TODO候補は見つかったけど保存に失敗したよ。${lastError || "todosテーブルを確認してね。"}`,
        );
        return;
      }
      setAiText(`${inserted}件のTODO候補を追加したよ。`);
      setGuideDraft(
        "メモからTODOを抜き出して追加したよ。頭の中の材料が行動リストになったね。",
      );
      await refreshSnapshot();
    } catch (error) {
      console.error(error);
      setAiText(
        "TODO化に失敗したよ。/api の応答かVercelの環境変数を確認してね。",
      );
    } finally {
      setAiLoading(false);
    }
  }

  function startVoiceInput() {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "このブラウザは音声入力に未対応みたい。ChromeかSafariの音声入力を試してね。",
      );
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;
    let finalText = "";
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = String(event.results[i][0]?.transcript || "");
        if (event.results[i].isFinal) finalText += transcript;
        else interim += transcript;
      }
      setContent((current) => {
        const base = current.replace(/\n?（音声入力中：[\s\S]*?）$/, "");
        return `${base}${finalText ? (base ? "\n" : "") + finalText : ""}${interim ? `\n（音声入力中：${interim}）` : ""}`;
      });
    };
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => setVoiceListening(false);
    setVoiceListening(true);
    recognition.start();
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop?.();
    recognitionRef.current = null;
    setVoiceListening(false);
    setContent((current) =>
      current.replace(/\n?（音声入力中：[\s\S]*?）$/, ""),
    );
  }
  return (
    <div className="budget-command-page space-y-4">
      <MemoUpgradePanel memos={memos} refreshSnapshot={refreshSnapshot} onDraft={setContent} />
      <GlassCard className="bg-gradient-to-br from-cyan-400/10 to-fuchsia-400/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">メモ常駐AI</h2>
            <p className="mt-1 text-sm text-white/60">
              注釈・付け足し・分類・補助を、メモページ内でいつでも呼び出せるようにしたよ。
            </p>
          </div>
          <button
            onClick={() => setResidentAiOn(!residentAiOn)}
            className={`rounded-2xl px-4 py-3 font-black ${residentAiOn ? "bg-emerald-300 text-black" : "bg-white/10"}`}
          >
            {residentAiOn ? "AI ON" : "AI OFF"}
          </button>
        </div>
        {residentAiOn && (
          <div className="mt-4 grid gap-2 sm:grid-cols-[180px_1fr]">
            <select
              value={memoAiMode}
              onChange={(e) => setMemoAiMode(e.target.value as any)}
              className="rounded-2xl border border-white/20 bg-slate-950/90 p-3 text-white"
            >
              <option value="annotate">注釈</option>
              <option value="classify">分類</option>
              <option value="support">補助</option>
            </select>
            <button
              onClick={() => residentMemoAi()}
              disabled={aiLoading}
              className="rounded-2xl bg-white px-4 py-3 font-black text-black disabled:opacity-50"
            >
              今のメモをAI補助
            </button>
          </div>
        )}
      </GlassCard>
      <TextArea
        className="h-32"
        placeholder="メモを書く... 画像も添付できるよ"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
        className="w-full rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white/70"
      />
      <div className="grid gap-2 sm:grid-cols-4">
        <PrimaryButton onClick={add}>メモを保存</PrimaryButton>
        <button
          onClick={voiceListening ? stopVoiceInput : startVoiceInput}
          className={`rounded-2xl px-4 py-3 font-black ${voiceListening ? "bg-red-400 text-white" : "bg-white/10"}`}
        >
          {voiceListening ? "音声停止" : "音声入力"}
        </button>
        <button
          onClick={memoAi}
          disabled={aiLoading}
          className="rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50"
        >
          AIで整理
        </button>
        <button
          onClick={memoToTodos}
          disabled={aiLoading}
          className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-black disabled:opacity-50"
        >
          メモからTODO作成
        </button>
      </div>
      {aiText && (
        <GlassCard>
          <p className="whitespace-pre-wrap text-sm leading-7 text-white/78">
            {aiText}
          </p>
        </GlassCard>
      )}
      {!memos.length && (
        <Empty text="まだメモがないよ。追加するとここにカード表示されるよ。" />
      )}
      <div className="grid gap-3">
        {memos.map((m) => (
          <div id={`memo-${m.id}`} data-search-id={`memo-${m.id}`} key={m.id}>
            <GlassCard>
              <p className="whitespace-pre-wrap text-sm leading-7">
                {m.content}
              </p>
              <ImagePreview src={m.image_url} />
              <p className="mt-2 text-xs text-white/40">
                {new Date(m.created_at).toLocaleString("ja-JP")}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => residentMemoAi(m)}
                  className="rounded-2xl bg-cyan-300 px-3 py-2 text-sm font-black text-black"
                >
                  AI注釈
                </button>
                <button
                  onClick={() => {
                    setEdit(m);
                    setEditContent(m.content);
                  }}
                  className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold"
                >
                  編集
                </button>
                <button
                  onClick={() => setDeleteTarget(m)}
                  className="rounded-2xl bg-red-500 px-3 py-2 text-sm font-bold"
                >
                  削除
                </button>
              </div>
            </GlassCard>
          </div>
        ))}
      </div>
      {edit && (
        <Modal title="メモ編集" onClose={() => setEdit(null)}>
          <TextArea
            className="h-48"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <button
            onClick={save}
            className="mt-3 w-full rounded-2xl bg-white px-4 py-3 font-black text-black"
          >
            保存
          </button>
        </Modal>
      )}
      {deleteTarget && (
        <Modal title="本当に削除する？" onClose={() => setDeleteTarget(null)}>
          <div className="sticky top-0 z-10 -mx-1 rounded-3xl border border-red-300/30 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-black text-red-100/80">
              このメモを削除する操作だよ
            </p>
            <button
              onClick={del}
              className="mt-2 w-full rounded-2xl bg-red-500 px-4 py-3 font-black text-white"
            >
              完全に削除する
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 font-bold"
            >
              キャンセル
            </button>
          </div>
          <p className="mt-4 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-black/25 p-3 text-sm leading-7 text-white/65">
            {deleteTarget.content}
          </p>
        </Modal>
      )}
    </div>
  );
}

function TweetsPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("普通");
  const [deleteTarget, setDeleteTarget] = useState<Tweet | null>(null);
  const tweets = snapshot?.tweets || [];
  async function add() {
    if (!content.trim()) return;
    const { error } = await supabase
      .from("tweets")
      .insert({ tweet_date: todayKey(), content, mood });
    if (error) return alert(error.message);
    setContent("");
    setGuideDraft(
      "つぶやきを受け取ったよ。軽く外に出せただけでも、心の圧は少し下がりやすいよ。",
    );
    await refreshSnapshot();
  }
  async function del() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("tweets")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) return alert("つぶやき削除失敗: " + error.message);
    setDeleteTarget(null);
    setGuideDraft("つぶやきを削除したよ。不要なログを整理できたね。");
    await refreshSnapshot();
  }
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <TextArea
          placeholder="軽い愚痴・一言メモ..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <select
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
        >
          <option>最高</option>
          <option>良い</option>
          <option>普通</option>
          <option>疲れた</option>
          <option>しんどい</option>
        </select>
      </div>
      <PrimaryButton onClick={add}>つぶやく</PrimaryButton>
      <div className="space-y-3">
        {tweets.map((t) => (
          <div id={`tweet-${t.id}`} data-search-id={`tweet-${t.id}`} key={t.id}>
            <GlassCard>
              <p className="text-xs text-white/45">
                {t.tweet_date} / {t.mood}
              </p>
              <p className="mt-2 whitespace-pre-wrap">{t.content}</p>
              <ImagePreview src={t.image_url} />
              <button
                onClick={() => setDeleteTarget(t)}
                className="mt-3 w-full rounded-2xl bg-red-500 px-3 py-2 text-sm font-bold"
              >
                削除
              </button>
            </GlassCard>
          </div>
        ))}
      </div>
      {deleteTarget && (
        <Modal
          title="つぶやきを削除する？"
          onClose={() => setDeleteTarget(null)}
        >
          <p className="whitespace-pre-wrap text-sm text-white/65">
            {deleteTarget.content}
          </p>
          <button
            onClick={del}
            className="mt-4 w-full rounded-2xl bg-red-500 px-4 py-3 font-black text-white"
          >
            完全に削除する
          </button>
          <button
            onClick={() => setDeleteTarget(null)}
            className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 font-bold"
          >
            キャンセル
          </button>
        </Modal>
      )}
    </div>
  );
}

function TodosPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState(todayKey());
  const [dueTime, setDueTime] = useState("");
  const [priority, setPriority] = useState("normal");
  const [location, setLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [edit, setEdit] = useState<Todo | null>(null);
  const [localDone, setLocalDone] = useState<Record<string, boolean>>({});
  const [localTodos, setLocalTodos] = useState<Todo[]>([]);
  const [saving, setSaving] = useState(false);
  const [todoMessage, setTodoMessage] = useState("");
  const [todoImageFile, setTodoImageFile] = useState<File | null>(null);
  const [todoAiText, setTodoAiText] = useState("");
  const [todoAiLoading, setTodoAiLoading] = useState(false);

  useEffect(() => {
    setLocalDone({});
    if (!snapshot?.todos?.length) return;
    setLocalTodos((current) =>
      current.filter(
        (local) => !snapshot.todos.some((todo) => todo.id === local.id),
      ),
    );
  }, [snapshot?.todos]);

  const todos = useMemo(() => {
    const merged = [...localTodos, ...(snapshot?.todos || [])];
    const seen = new Set<string>();
    return merged
      .filter((todo) => {
        if (seen.has(todo.id)) return false;
        seen.add(todo.id);
        return true;
      })
      .map((todo) => ({ ...todo, done: localDone[todo.id] ?? todo.done }));
  }, [snapshot?.todos, localTodos, localDone]);

  async function add() {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setTodoMessage("TODO名を入れてね。");
      return;
    }
    if (saving) return;

    setSaving(true);
    setTodoMessage("TODOを保存中...");

    const imageUrl = await imageFileToDataUrl(todoImageFile);
    const fullPayload = {
      title: cleanTitle,
      priority,
      due_date: dueDate || null,
      due_time: dueTime || null,
      location_name: location.trim() || null,
      notify_enabled: Boolean(dueTime),
      image_url: imageUrl,
      done: false,
    };

    let savedTodo: Todo | null = null;
    let saveError: { message?: string } | null = null;

    const fullResult = await supabase
      .from("todos")
      .insert(fullPayload)
      .select("*")
      .single();

    if (fullResult.error) {
      const message = String(fullResult.error.message || "");
      const columnMismatch =
        message.includes("due_time") ||
        message.includes("location_name") ||
        message.includes("notify_enabled") ||
        message.includes("column") ||
        message.includes("schema cache");

      if (columnMismatch) {
        const fallbackPayload = {
          title: cleanTitle,
          priority,
          due_date: dueDate || null,
          done: false,
        };
        const fallbackResult = await supabase
          .from("todos")
          .insert(fallbackPayload)
          .select("*")
          .single();
        if (fallbackResult.error) {
          saveError = fallbackResult.error;
        } else {
          savedTodo = fallbackResult.data as Todo;
          setTodoMessage(
            "TODOを保存したよ。時刻/場所を使うには統合SQLをもう一度実行してね。",
          );
        }
      } else {
        saveError = fullResult.error;
      }
    } else {
      savedTodo = fullResult.data as Todo;
      setTodoMessage("TODOを保存したよ。");
    }

    if (saveError || !savedTodo) {
      setTodoMessage(`TODO保存失敗: ${saveError?.message || "原因不明"}`);
      setSaving(false);
      return;
    }

    setLocalTodos((current) => [
      savedTodo as Todo,
      ...current.filter((todo) => todo.id !== savedTodo?.id),
    ]);
    setSelectedDate(savedTodo.due_date || dueDate || todayKey());
    setTitle("");
    setLocation("");
    setDueTime("");
    setTodoImageFile(null);
    setGuideDraft(
      `TODO「${savedTodo.title}」を追加したよ。${savedTodo.due_time ? savedTodo.due_time + "に通知を見るね。" : "日付の一覧にも表示されるよ。"}`,
    );

    try {
      await refreshSnapshot();
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!edit) return;
    const nextEdit = { ...edit, title: edit.title.trim() || edit.title };
    setEdit(null);
    setTodoMessage("TODOを更新中...");
    const fullResult = await supabase
      .from("todos")
      .update({
        title: nextEdit.title,
        priority: nextEdit.priority,
        due_date: nextEdit.due_date,
        due_time: nextEdit.due_time || null,
        location_name: nextEdit.location_name || null,
        notify_enabled: Boolean(nextEdit.due_time),
      })
      .eq("id", nextEdit.id);

    if (fullResult.error) {
      const message = String(fullResult.error.message || "");
      const columnMismatch =
        message.includes("due_time") ||
        message.includes("location_name") ||
        message.includes("notify_enabled") ||
        message.includes("column") ||
        message.includes("schema cache");
      if (columnMismatch) {
        const fallbackResult = await supabase
          .from("todos")
          .update({
            title: nextEdit.title,
            priority: nextEdit.priority,
            due_date: nextEdit.due_date,
          })
          .eq("id", nextEdit.id);
        if (fallbackResult.error) {
          setTodoMessage("TODO更新失敗: " + fallbackResult.error.message);
          setEdit(edit);
          return;
        }
        setTodoMessage(
          "TODOを更新したよ。時刻/場所を使うには統合SQLをもう一度実行してね。",
        );
      } else {
        setTodoMessage("TODO更新失敗: " + fullResult.error.message);
        setEdit(edit);
        return;
      }
    } else {
      setTodoMessage("TODOを更新したよ。");
    }
    await refreshSnapshot();
  }

  async function toggle(t: Todo) {
    const nextDone = !t.done;
    setLocalDone((current) => ({ ...current, [t.id]: nextDone }));
    setGuideDraft(
      nextDone
        ? `TODO「${t.title}」を完了にしたよ。いい感じ。`
        : `TODO「${t.title}」を未完了に戻したよ。`,
    );
    const { error } = await supabase
      .from("todos")
      .update({ done: nextDone })
      .eq("id", t.id);
    if (error) {
      setLocalDone((current) => ({ ...current, [t.id]: t.done }));
      setTodoMessage("TODO更新失敗: " + error.message);
      return;
    }
    refreshSnapshot();
  }

  async function del(id: string) {
    const target = todos.find((todo) => todo.id === id);
    if (!confirm(`TODO「${target?.title || "このTODO"}」を削除していい？`))
      return;
    setLocalTodos((current) => current.filter((todo) => todo.id !== id));
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
      setTodoMessage("TODO削除失敗: " + error.message);
      await refreshSnapshot();
      return;
    }
    setTodoMessage("TODOを削除したよ。");
    void refreshSnapshot("常時同期中...");
  }

  async function markSelectedDone() {
    const ids = selectedTodos.filter((t) => !t.done).map((t) => t.id);
    if (!ids.length) return setTodoMessage("この日の未完了TODOはないよ。");
    const { error } = await supabase
      .from("todos")
      .update({ done: true })
      .in("id", ids);
    if (error) return setTodoMessage("一括完了に失敗: " + error.message);
    setLocalDone((cur) =>
      ids.reduce((acc, id) => ({ ...acc, [id]: true }), cur),
    );
    setTodoMessage(`${ids.length}件をまとめて完了にしたよ。`);
    await refreshSnapshot();
  }

  async function moveUndatedToSelectedDate() {
    const ids = todos
      .filter((t) => !t.due_date)
      .map((t) => t.id)
      .slice(0, 30);
    if (!ids.length) return setTodoMessage("日付なしTODOはないよ。");
    const { error } = await supabase
      .from("todos")
      .update({ due_date: selectedDate })
      .in("id", ids);
    if (error)
      return setTodoMessage("日付なしTODOの移動に失敗: " + error.message);
    setTodoMessage(
      `日付なしTODO ${ids.length}件を ${selectedDate} に移動したよ。`,
    );
    await refreshSnapshot();
  }

  async function todoAi() {
    const source = todos
      .slice(0, 20)
      .map(
        (t) =>
          `${t.done ? "完了" : "未完了"}: ${t.title} / ${t.due_date || "日付なし"} / ${t.priority}`,
      )
      .join("\n");
    if (!source) return setTodoAiText("分析できるTODOがまだないよ。");
    setTodoAiLoading(true);
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "todoAI", text: source }),
      });
      const json = await res.json();
      setTodoAiText(json.result || "TODOを整理できなかったみたい。");
    } catch {
      setTodoAiText(
        "TODOのAI分析に失敗したよ。APIキーや通信状態を確認してね。",
      );
    } finally {
      setTodoAiLoading(false);
    }
  }

  async function imageToTodos() {
    const imageDataUrl = await imageFileToDataUrl(todoImageFile);
    if (!imageDataUrl) return setTodoMessage("TODO化したい画像を選んでね。");
    setTodoAiLoading(true);
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "imageToTodosAI", imageDataUrl }),
      });
      const json = await res.json().catch(() => ({}));
      const tasks = Array.isArray(json.todos) ? json.todos : [];
      if (!res.ok && !tasks.length) {
        setTodoAiText(
          json.error ||
            json.result ||
            `画像TODO化APIが失敗したよ。HTTP ${res.status}。画像サイズ・Vercel環境変数・/apiのログを確認してね。`,
        );
        return;
      }
      if (!tasks.length) {
        setTodoAiText(
          json.result ||
            "画像からTODO候補を見つけられなかったよ。画像内の文字が小さい場合は、文字が大きく写っている画像で試してね。",
        );
        return;
      }
      const targetDate = selectedDate || todayKey();
      const datedTasks = tasks.map((task: TodoInsertCandidate) => ({
        ...task,
        due_date:
          typeof task.due_date === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(task.due_date)
            ? task.due_date
            : targetDate,
      }));
      const { inserted, lastError, savedTodos } = await insertTodoCandidates(
        datedTasks,
        targetDate,
      );
      if (!inserted) {
        setTodoAiText(
          `画像からTODO候補は見つかったけど保存に失敗したよ。${lastError || "todosテーブルを確認してね。"}`,
        );
        return;
      }
      if (savedTodos.length) {
        setLocalTodos((current) => [
          ...savedTodos,
          ...current.filter(
            (todo) => !savedTodos.some((saved) => saved.id === todo.id),
          ),
        ]);
        setSelectedDate(targetDate);
      }
      setTodoAiText(
        `${inserted}件のTODO候補を追加したよ。${targetDate === todayKey() ? "今日の日付別TODOにも反映したよ。" : `${targetDate} の日付別TODOにも反映したよ。`}`,
      );
      setTodoImageFile(null);
      setGuideDraft(
        "写真からTODOを読み取って追加したよ。画像の情報を行動リストに変えられたね。",
      );
      await refreshSnapshot();
    } catch (error) {
      console.error(error);
      setTodoAiText(
        "写真からTODO化する処理に失敗したよ。画像を圧縮して送る修正版だけど、まだ失敗する場合はVercelのFunctionsログに出たエラー全文が必要だよ。",
      );
    } finally {
      setTodoAiLoading(false);
    }
  }

  const selectedTodos = todos.filter(
    (t) => (t.due_date || getCreatedDateKey(t.created_at)) === selectedDate,
  );
  const selectedDone = selectedTodos.filter((t) => t.done).length;
  const selectedHigh = selectedTodos.filter(
    (t) => !t.done && t.priority === "high",
  ).length;
  const overdueTodos = todos.filter(
    (t) => !t.done && t.due_date && t.due_date < todayKey(),
  ).length;
  const undatedTodos = todos.filter((t) => !t.due_date).length;

  return (
    <div className="space-y-4">
      <TodoUpgradePanel todos={todos} refreshSnapshot={refreshSnapshot} />
      <GlassCard>
        <h2 className="text-xl font-black">TODO</h2>
        <p className="mt-1 text-sm text-white/55">
          写真・AI整理・日付別管理をまとめたTODOページ。
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-2xl bg-black/25 p-3">
            <p className="text-xs text-white/45">選択日の達成</p>
            <p className="text-2xl font-black">
              {selectedDone}/{selectedTodos.length}
            </p>
          </div>
          <div className="rounded-2xl bg-black/25 p-3">
            <p className="text-xs text-white/45">重要未完了</p>
            <p className="text-2xl font-black">{selectedHigh}</p>
          </div>
          <div className="rounded-2xl bg-black/25 p-3">
            <p className="text-xs text-white/45">期限切れ</p>
            <p className="text-2xl font-black">{overdueTodos}</p>
          </div>
          <div className="rounded-2xl bg-black/25 p-3">
            <p className="text-xs text-white/45">日付なし</p>
            <p className="text-2xl font-black">{undatedTodos}</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            onClick={markSelectedDone}
            className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-black"
          >
            選択日の未完了を一括完了
          </button>
          <button
            onClick={moveUndatedToSelectedDate}
            className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black"
          >
            日付なしを選択日に移動
          </button>
        </div>
      </GlassCard>

      <div className="grid gap-3 rounded-[2rem] border border-white/10 bg-black/20 p-4">
        <Field
          placeholder="TODOを書く..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-4">
          <DateField
            label="TODO日付"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
          <TimeField
            label="時刻選択"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            <option value="low">低</option>
            <option value="normal">普通</option>
            <option value="high">高</option>
          </select>
          <Field
            placeholder="場所/地図検索"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setTodoImageFile(e.target.files?.[0] || null)}
          className="w-full rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white/70"
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <button
            onClick={add}
            disabled={saving}
            className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black transition active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? "保存中..." : "TODO追加"}
          </button>
          <button
            onClick={todoAi}
            disabled={todoAiLoading}
            className="rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50"
          >
            TODOをAI整理
          </button>
          <button
            onClick={imageToTodos}
            disabled={todoAiLoading}
            className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-black disabled:opacity-50"
          >
            写真からTODO作成
          </button>
        </div>
        {todoMessage && (
          <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/75">
            {todoMessage}
          </p>
        )}
        {todoAiText && (
          <p className="whitespace-pre-wrap rounded-2xl bg-white/10 px-4 py-3 text-sm leading-7 text-white/75">
            {todoAiText}
          </p>
        )}
      </div>

      <GlassCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-black">日付別TODO</h3>
            <p className="mt-1 text-xs text-white/50">
              追加したTODOはすぐここに表示される。
            </p>
          </div>
          <div className="w-full sm:max-w-xs">
            <DateField
              label="表示する日付"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        {!selectedTodos.length && (
          <p className="mt-4 text-sm text-white/50">
            この日のTODOはまだないよ。
          </p>
        )}
        <div className="mt-4 space-y-3">
          {selectedTodos.map((t) => (
            <div
              id={`todo-${t.id}`}
              data-search-id={`todo-${t.id}`}
              key={t.id}
              className="rounded-3xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggle(t)}
                  aria-label={t.done ? "未完了に戻す" : "完了にする"}
                  className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-base font-black transition active:scale-95 ${t.done ? "border-emerald-200 bg-emerald-300 text-black shadow-lg shadow-emerald-500/20" : "border-white/25 bg-white/10 text-white/50 hover:bg-white/18"}`}
                >
                  {t.done ? "✓" : ""}
                </button>
                <div className="flex-1">
                  <p
                    className={
                      t.done ? "text-white/40 line-through" : "font-black"
                    }
                  >
                    {t.title}
                  </p>
                  <p className="mt-1 text-xs text-white/45">
                    {t.due_date || "日付なし"}
                    {t.due_time ? ` ${t.due_time}` : " 時刻未設定"} / 優先度:
                    {t.priority}
                  </p>
                  <ImagePreview src={t.image_url} />
                  {t.location_name && (
                    <button
                      onClick={() => openMap(t.location_name || "")}
                      className="mt-2 rounded-xl bg-sky-500/20 px-3 py-2 text-xs font-bold text-sky-100"
                    >
                      地図で開く: {t.location_name}
                    </button>
                  )}
                </div>
                <div className="grid gap-2">
                  <button
                    onClick={() =>
                      setGuideDraft(
                        `「${t.title}」を開始したよ。完了じゃなくても、始めた時点で前進だよ。`,
                      )
                    }
                    className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-black"
                  >
                    開始
                  </button>
                  <button
                    onClick={() =>
                      alert(`5分版: ${makeFiveMinuteTodo(t.title)}`)
                    }
                    className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-black text-black"
                  >
                    5分化
                  </button>
                  <button
                    onClick={() => setEdit(t)}
                    className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => del(t.id)}
                    className="rounded-xl bg-red-500 px-3 py-2 text-xs font-bold"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-black">全TODO（一発チェック）</h3>
        <p className="mt-1 text-xs text-white/50">
          丸ボタンを押すだけで直接チェックできる。
        </p>
        <div className="mt-3 space-y-2">
          {todos.slice(0, 30).map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-sm"
            >
              <button
                onClick={() => toggle(t)}
                aria-label={t.done ? "未完了に戻す" : "完了にする"}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition active:scale-95 ${t.done ? "border-emerald-200 bg-emerald-300 text-black" : "border-white/25 bg-black/20 text-white/50 hover:bg-white/15"}`}
              >
                {t.done ? "✓" : ""}
              </button>
              <button
                onClick={() =>
                  setSelectedDate(t.due_date || getCreatedDateKey(t.created_at))
                }
                className="min-w-0 flex-1 text-left"
              >
                <span
                  className={
                    t.done ? "text-white/40 line-through" : "font-bold"
                  }
                >
                  {t.title}
                </span>
                <span className="ml-2 text-xs text-white/45">
                  {t.due_date || "日付なし"}
                </span>
              </button>
              <button
                onClick={() => setEdit(t)}
                className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold"
              >
                編集
              </button>
              <button
                onClick={() => del(t.id)}
                className="rounded-xl bg-red-500 px-3 py-2 text-xs font-bold"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      </GlassCard>

      {edit && (
        <Modal title="TODO編集" onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <Field
              value={edit.title}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
            />
            <DateField
              label="TODO日付"
              value={edit.due_date || ""}
              onChange={(e) => setEdit({ ...edit, due_date: e.target.value })}
            />
            <TimeField
              label="時刻選択"
              value={edit.due_time || ""}
              onChange={(e) => setEdit({ ...edit, due_time: e.target.value })}
            />
            <Field
              placeholder="場所"
              value={edit.location_name || ""}
              onChange={(e) =>
                setEdit({ ...edit, location_name: e.target.value })
              }
            />
            <select
              value={edit.priority}
              onChange={(e) => setEdit({ ...edit, priority: e.target.value })}
              className="w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
            >
              <option value="low">低</option>
              <option value="normal">普通</option>
              <option value="high">高</option>
            </select>
            <button
              onClick={saveEdit}
              className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black"
            >
              変更を保存
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CalendarPanel({ snapshot, refreshSnapshot }: { snapshot: Snapshot | null; refreshSnapshot: (reason?: string) => Promise<void> }) {
  const today = todayKey();
  const [cursorMonth, setCursorMonth] = useState(monthKey(today));
  const [selected, setSelected] = useState(today);
  const monthStart = new Date(`${cursorMonth}-01T00:00:00`);
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstDay = monthStart.getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const cells = Array.from(
    { length: Math.ceil((firstDay + lastDate) / 7) * 7 },
    (_, index) => {
      const day = index - firstDay + 1;
      if (day < 1 || day > lastDate) return null;
      return `${cursorMonth}-${String(day).padStart(2, "0")}`;
    },
  );
  const countForDate = (date: string) =>
    (snapshot?.diaries || []).filter((d) => d.entry_date === date).length +
    (snapshot?.todos || []).filter(
      (t) => (t.due_date || getCreatedDateKey(t.created_at)) === date,
    ).length +
    (snapshot?.tweets || []).filter((t) => t.tweet_date === date).length +
    (snapshot?.coffee || []).filter((c) => c.drink_date === date).length +
    (snapshot?.events || []).filter((e) => e.event_date === date).length;
  const moveMonth = (diff: number) => {
    const d = new Date(`${cursorMonth}-01T00:00:00`);
    d.setMonth(d.getMonth() + diff);
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    setCursorMonth(next);
    setSelected(`${next}-01`);
  };
  const items = [
    ...(snapshot?.diaries || [])
      .filter((d) => d.entry_date === selected)
      .map((d) => ({ type: "Diary", text: d.title || stripHtml(d.content) })),
    ...(snapshot?.todos || [])
      .filter(
        (t) => (t.due_date || getCreatedDateKey(t.created_at)) === selected,
      )
      .map((t) => ({ type: "TODO", text: t.title })),
    ...(snapshot?.tweets || [])
      .filter((t) => t.tweet_date === selected)
      .map((t) => ({ type: "つぶやき", text: t.content })),
    ...(snapshot?.coffee || [])
      .filter((c) => c.drink_date === selected)
      .map((c) => ({ type: "Coffee", text: `${c.coffee_name} ${c.cups}杯` })),
    ...(snapshot?.events || [])
      .filter((e) => e.event_date === selected)
      .map((e) => ({ type: "予定", text: e.title })),
  ];
  return (
    <div className="space-y-4">
      <CalendarQuickAddPanel refreshSnapshot={refreshSnapshot} setSelected={setSelected} setCursorMonth={setCursorMonth} />
      <CalendarEventOpsPanel events={snapshot?.events || []} refreshSnapshot={refreshSnapshot} setSelected={setSelected} />
      <GlassCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-black">月間カレンダー</h2>
            <p className="mt-1 text-sm text-white/55">
              月・年を移動して、記録のある日を一覧できるようにしたよ。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:w-[360px]">
            <button
              onClick={() => moveMonth(-1)}
              className="rounded-2xl bg-white/10 px-3 py-2 font-black"
            >
              前月
            </button>
            <input
              type="month"
              value={cursorMonth}
              onChange={(e) => {
                setCursorMonth(e.target.value);
                setSelected(`${e.target.value}-01`);
              }}
              className="rounded-2xl border border-white/20 bg-slate-950/90 px-3 py-2 text-center font-black text-white [color-scheme:dark]"
            />
            <button
              onClick={() => moveMonth(1)}
              className="rounded-2xl bg-white/10 px-3 py-2 font-black"
            >
              次月
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-black text-white/55">
          {["日", "月", "火", "水", "木", "金", "土"].map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, index) => {
            const active = date === selected;
            const count = date ? countForDate(date) : 0;
            return (
              <button
                key={date || `blank-${index}`}
                disabled={!date}
                onClick={() => date && setSelected(date)}
                className={`min-h-20 rounded-2xl border p-2 text-left transition active:scale-[0.98] ${!date ? "border-transparent bg-transparent" : active ? "border-cyan-200 bg-cyan-300 text-black" : date === today ? "border-emerald-300/50 bg-emerald-300/15" : "border-white/10 bg-black/25 hover:bg-white/10"}`}
              >
                {date && (
                  <>
                    <p className="text-sm font-black">
                      {Number(date.slice(-2))}
                    </p>
                    {count > 0 && (
                      <p
                        className={`mt-2 inline-flex rounded-full px-2 py-1 text-[11px] font-black ${active ? "bg-black/15 text-black" : "bg-white/10 text-white"}`}
                      >
                        {count}件
                      </p>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>
      <GlassCard>
        <h2 className="text-xl font-black">{selected} の記録</h2>
        {!items.length && (
          <p className="mt-3 text-sm text-white/50">
            この日の記録はまだないよ。
          </p>
        )}
        <div className="mt-3 space-y-2">
          {items.map((i, idx) => (
            <div key={idx} className="rounded-2xl bg-black/25 p-3">
              <p className="text-xs text-white/45">{i.type}</p>
              <p className="mt-1">{i.text}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function DiaryPanel({ snapshot, refreshSnapshot, setPage }: PanelProps) {
  type DiaryBlock = {
    id: string;
    kind: "p" | "h1" | "h2" | "h3" | "quote";
    text: string;
    color: string;
    bold: boolean;
    size: "sm" | "base" | "lg" | "xl";
  };
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("普通");
  const [date, setDate] = useState(todayKey());
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [blocks, setBlocks] = useState<DiaryBlock[]>([
    {
      id: `block-${Date.now()}`,
      kind: "p",
      text: "",
      color: "#f8fafc",
      bold: false,
      size: "base",
    },
  ]);
  const [editorMode, setEditorMode] = useState<"blocks" | "html">("blocks");
  const [readMenuTarget, setReadMenuTarget] = useState<Diary | null>(null);
  const [readerTarget, setReaderTarget] = useState<Diary | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);
  const diaries = snapshot?.diaries || [];

  function diaryHasImageInContent(diary: Diary) {
    return /<img\s/i.test(diary.content || "");
  }
  function escapeDiaryHtml(value: string) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\n/g, "<br />");
  }
  function blockClass(block: DiaryBlock) {
    const size =
      block.size === "sm"
        ? "font-size:.95rem;"
        : block.size === "lg"
          ? "font-size:1.18rem;"
          : block.size === "xl"
            ? "font-size:1.35rem;"
            : "";
    const weight = block.bold ? "font-weight:900;" : "";
    return `color:${block.color};${size}${weight}`;
  }
  function blocksToHtml() {
    return blocks
      .filter((block) => block.text.trim())
      .map((block) => {
        const style = blockClass(block);
        const text = escapeDiaryHtml(block.text);
        if (block.kind === "h1") return `<h1 style="${style}">${text}</h1>`;
        if (block.kind === "h2") return `<h2 style="${style}">${text}</h2>`;
        if (block.kind === "h3") return `<h3 style="${style}">${text}</h3>`;
        if (block.kind === "quote")
          return `<blockquote style="${style};border-left:4px solid rgba(255,255,255,.35);padding-left:1rem;opacity:.92">${text}</blockquote>`;
        return `<p style="${style}">${text}</p>`;
      })
      .join("\n");
  }
  function addBlock(afterIndex?: number) {
    const next: DiaryBlock = {
      id: `block-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      kind: "p",
      text: "",
      color: "#f8fafc",
      bold: false,
      size: "base",
    };
    setBlocks((current) => {
      const copy = [...current];
      copy.splice(
        typeof afterIndex === "number" ? afterIndex + 1 : copy.length,
        0,
        next,
      );
      return copy;
    });
  }
  function updateBlock(id: string, patch: Partial<DiaryBlock>) {
    setBlocks((current) =>
      current.map((block) =>
        block.id === id ? { ...block, ...patch } : block,
      ),
    );
  }
  function moveBlock(index: number, dir: -1 | 1) {
    setBlocks((current) => {
      const next = [...current];
      const target = index + dir;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }
  function deleteBlock(id: string) {
    setBlocks((current) =>
      current.length <= 1
        ? current.map((b) => (b.id === id ? { ...b, text: "" } : b))
        : current.filter((block) => block.id !== id),
    );
  }
  function startDiaryLongPress(diary: Diary) {
    longPressTriggered.current = false;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      setReadMenuTarget(diary);
    }, 650);
  }
  function cancelDiaryLongPress() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  async function add() {
    const body = editorMode === "blocks" ? blocksToHtml() : content;
    if (!body.trim() && !image.trim()) return;
    const html = image ? `${body}<p><img src="${image}" /></p>` : body;
    const { error } = await supabase.from("diary_entries").insert({
      entry_date: date,
      mood,
      title: title || "Diary",
      content: html,
      image_url: image || null,
    });
    if (error) return alert(error.message);
    setTitle("");
    setContent("");
    setImage("");
    setBlocks([
      {
        id: `block-${Date.now()}`,
        kind: "p",
        text: "",
        color: "#f8fafc",
        bold: false,
        size: "base",
      },
    ]);
    setGuideDraft(
      "Diaryを保存したよ。ブロックの並びも装飾も、ブログ記事みたいに残せるようにしたよ。",
    );
    await refreshSnapshot();
  }

  const previewHtml = editorMode === "blocks" ? blocksToHtml() : content;

  if (readerTarget) {
    return (
      <div className="space-y-4">
        <GlassCard className="bg-black/35">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black text-white/45">
                {readerTarget.entry_date} / {readerTarget.mood}
              </p>
              <h2 className="mt-1 text-3xl font-black sm:text-4xl">
                {readerTarget.title || "Diary"}
              </h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                onClick={() => setReaderTarget(null)}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black"
              >
                前のページへ戻る
              </button>
              <button
                onClick={() => {
                  setReaderTarget(null);
                  setPage("home");
                }}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black"
              >
                ホームへ戻る
              </button>
            </div>
          </div>
        </GlassCard>
        <article className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl sm:p-8">
          {readerTarget.image_url && !diaryHasImageInContent(readerTarget) && (
            <img
              src={readerTarget.image_url}
              alt="Diary image"
              className="mb-6 w-full rounded-[2rem] object-cover shadow-2xl"
            />
          )}
          <div
            className="diary-content text-base leading-8 text-white/88 sm:text-lg"
            dangerouslySetInnerHTML={{ __html: readerTarget.content }}
          />
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DiaryUpgradePanel snapshot={snapshot} diaries={diaries} setTitle={setTitle} setMood={setMood} setEditorMode={setEditorMode} setBlocks={setBlocks} setPage={setPage} />
      <GlassCard>
        <h2 className="text-2xl font-black">Diary</h2>
        <p className="mt-2 text-sm text-white/60">
          今のブログ風プレビューに、前のブロック移動・色変更・太字・H1/H2/H3を復活させたよ。文章の塊を上下に動かして、記事みたいに組み立てられる。
        </p>
      </GlassCard>
      <div className="grid gap-3">
        <Field
          placeholder="タイトル"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <DateField
            label="Diary日付"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <select
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            <option>最高</option>
            <option>良い</option>
            <option>普通</option>
            <option>疲れた</option>
            <option>しんどい</option>
          </select>
          <select
            value={editorMode}
            onChange={(e) => setEditorMode(e.target.value as "blocks" | "html")}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            <option value="blocks">ブロック編集</option>
            <option value="html">HTML直接編集</option>
          </select>
        </div>
        <div className="space-y-2 rounded-3xl border border-white/10 bg-black/20 p-3">
          <Field
            placeholder="写真URL（任意・URLでもOK）"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
          <label className="block rounded-2xl border border-dashed border-white/25 bg-white/10 p-4 text-sm font-bold text-white/80">
            <span>写真ライブラリから選ぶ（Mac/iPhone対応）</span>
            <input
              type="file"
              accept="image/*"
              className="mt-3 block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:font-black file:text-black"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const dataUrl = await fileToDataUrl(file);
                  setImage(dataUrl);
                  setGuideDraft(
                    "Diary用の写真を読み込んだよ。保存すると日記に添付されるよ。",
                  );
                } catch {
                  alert("写真の読み込みに失敗したよ。別の写真で試してね。");
                }
              }}
            />
          </label>
          {image && (
            <img
              src={image}
              alt="Diary preview"
              className="max-h-72 w-full rounded-3xl object-cover"
            />
          )}
        </div>
        {editorMode === "blocks" ? (
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className="rounded-3xl border border-white/10 bg-black/25 p-3"
              >
                <div className="grid gap-2 md:grid-cols-[92px_1fr_86px_92px_130px]">
                  <select
                    value={block.kind}
                    onChange={(e) =>
                      updateBlock(block.id, {
                        kind: e.target.value as DiaryBlock["kind"],
                      })
                    }
                    className="rounded-2xl border border-white/20 bg-slate-950/90 p-3 text-sm text-white"
                  >
                    <option value="p">本文</option>
                    <option value="h1">H1</option>
                    <option value="h2">H2</option>
                    <option value="h3">H3</option>
                    <option value="quote">引用</option>
                  </select>
                  <TextArea
                    className="min-h-24"
                    placeholder="文章ブロックを書く"
                    value={block.text}
                    onChange={(e) =>
                      updateBlock(block.id, { text: e.target.value })
                    }
                  />
                  <input
                    type="color"
                    value={block.color}
                    onChange={(e) =>
                      updateBlock(block.id, { color: e.target.value })
                    }
                    className="h-full min-h-12 w-full rounded-2xl border border-white/20 bg-slate-950/90 p-2"
                  />
                  <select
                    value={block.size}
                    onChange={(e) =>
                      updateBlock(block.id, {
                        size: e.target.value as DiaryBlock["size"],
                      })
                    }
                    className="rounded-2xl border border-white/20 bg-slate-950/90 p-3 text-sm text-white"
                  >
                    <option value="sm">小</option>
                    <option value="base">標準</option>
                    <option value="lg">大</option>
                    <option value="xl">特大</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() =>
                        updateBlock(block.id, { bold: !block.bold })
                      }
                      className={`rounded-2xl px-3 py-2 text-sm font-black ${block.bold ? "bg-white text-black" : "bg-white/10"}`}
                    >
                      太字
                    </button>
                    <button
                      onClick={() => addBlock(index)}
                      className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black"
                    >
                      追加
                    </button>
                    <button
                      onClick={() => moveBlock(index, -1)}
                      disabled={index === 0}
                      className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black disabled:opacity-35"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveBlock(index, 1)}
                      disabled={index === blocks.length - 1}
                      className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black disabled:opacity-35"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => deleteBlock(block.id)}
                  className="mt-2 rounded-2xl bg-red-500/80 px-3 py-2 text-xs font-black"
                >
                  このブロックを削除
                </button>
              </div>
            ))}
            <button
              onClick={() => addBlock()}
              className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-black"
            >
              ＋ ブロックを追加
            </button>
          </div>
        ) : (
          <TextArea
            className="h-48"
            placeholder="本文。<h1>見出し</h1> や <b>太字</b> も使えるよ。"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        )}
        <GlassCard className="bg-slate-950/60">
          <p className="mb-3 text-xs font-black text-white/45">
            ブログ風プレビュー
          </p>
          <div
            className="diary-content text-base leading-8 text-white/88"
            dangerouslySetInnerHTML={{
              __html:
                previewHtml ||
                "<p style='opacity:.55'>ここにプレビューが出るよ。</p>",
            }}
          />
        </GlassCard>
        <PrimaryButton onClick={add}>Diary保存</PrimaryButton>
      </div>
      <div className="grid gap-3">
        {diaries.map((d) => (
          <div
            key={d.id}
            onPointerDown={() => startDiaryLongPress(d)}
            onPointerUp={cancelDiaryLongPress}
            onPointerCancel={cancelDiaryLongPress}
            onPointerLeave={cancelDiaryLongPress}
            onContextMenu={(e) => e.preventDefault()}
            className="rounded-[1.6rem] border border-white/10 bg-white/[0.075] p-4 shadow-xl transition active:scale-[0.99]"
          >
            <p className="text-xs text-white/45">
              {d.entry_date} / {d.mood}
            </p>
            <h3 className="mt-1 text-xl font-black">{d.title || "Diary"}</h3>
            {d.image_url && !diaryHasImageInContent(d) && (
              <img
                src={d.image_url}
                alt="Diary image"
                className="mt-3 max-h-56 w-full rounded-3xl object-cover"
              />
            )}
            <div
              className="diary-content mt-3 line-clamp-5 text-sm leading-7 text-white/80"
              dangerouslySetInnerHTML={{ __html: d.content }}
            />
            <p className="mt-3 text-xs text-white/35">長押し：日記を読む</p>
          </div>
        ))}
      </div>
      {readMenuTarget && (
        <Modal title="Diaryメニュー" onClose={() => setReadMenuTarget(null)}>
          <div className="space-y-3">
            <p className="text-sm text-white/60">
              {readMenuTarget.entry_date} / {readMenuTarget.title || "Diary"}
            </p>
            <button
              onClick={() => {
                setReaderTarget(readMenuTarget);
                setReadMenuTarget(null);
              }}
              className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black"
            >
              日記を読む
            </button>
            <button
              onClick={() => setReadMenuTarget(null)}
              className="w-full rounded-2xl bg-white/10 px-4 py-3 font-bold"
            >
              閉じる
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function CoffeePanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [name, setName] = useState("コーヒー");
  const [cups, setCups] = useState(1);
  const [mg, setMg] = useState(80);
  const [note, setNote] = useState("");
  const [targetMg, setTargetMg] = useState(400);
  const [drinkTime, setDrinkTime] = useState(() =>
    new Date().toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
  const logs = snapshot?.coffee || [];
  const todayLogs = logs.filter((l) => l.drink_date === todayKey());
  const todayMg = todayLogs.reduce((s, l) => s + Number(l.caffeine_mg || 0), 0);
  const left = Math.max(0, Number(targetMg || 400) - todayMg);
  const cupsLeft = mg ? Math.floor(left / mg) : 0;
  const last7 = Array.from({ length: 7 }).map((_, idx) => {
    const key = dateMinus(todayKey(), idx);
    const total = logs
      .filter((l) => l.drink_date === key)
      .reduce((s, l) => s + Number(l.caffeine_mg || 0), 0);
    return { key, total };
  });
  const presets = [
    { name: "コーヒー", mg: 80, hint: "標準" },
    { name: "カフェラテ", mg: 80, hint: "ミルク系" },
    { name: "エスプレッソ", mg: 65, hint: "短時間" },
    { name: "エナジードリンク", mg: 140, hint: "強め" },
    { name: "デカフェ", mg: 10, hint: "夜向き" },
    { name: "緑茶", mg: 35, hint: "軽め" },
  ];
  const hour = Number((drinkTime || "00:00").slice(0, 2));
  const timingHint =
    hour >= 17
      ? "夕方以降だから、睡眠を守るならデカフェ寄りが安心。"
      : hour >= 14
        ? "午後帯。ここからは量を少し抑えると夜に残りにくいよ。"
        : "午前〜昼は集中の燃料にしやすい時間帯。";
  async function add() {
    const totalMg = Number(cups) * Number(mg);
    const timeMemo = drinkTime
      ? `飲用時刻:${drinkTime}${note ? ` / ${note}` : ""}`
      : note;
    const { error } = await supabase
      .from("coffee_logs")
      .insert({
        drink_date: todayKey(),
        coffee_name: name,
        cups,
        caffeine_mg: totalMg,
        note: timeMemo,
      });
    if (error) return alert(error.message);
    setNote("");
    setGuideDraft(
      `コーヒー記録を追加したよ。今日は合計約${todayMg + totalMg}mg、目安${targetMg}mgまであと約${Math.max(0, targetMg - todayMg - totalMg)}mgだよ。`,
    );
    await refreshSnapshot();
  }
  async function del(id: string) {
    if (!confirm("このコーヒー記録を削除していい？")) return;
    const { error } = await supabase.from("coffee_logs").delete().eq("id", id);
    if (error) return alert("削除失敗: " + error.message);
    await refreshSnapshot();
  }
  const status =
    todayMg >= targetMg
      ? "今日は上限に近いから、ここからはデカフェや水分補給寄りが安心。"
      : todayMg >= targetMg * 0.7
        ? "少し多め。夕方以降は睡眠への影響を見ながらで良さそう。"
        : "まだ余裕あり。集中用の一杯を計画しやすい状態。";
  return (
    <div className="space-y-4">
      <GlassCard className="bg-gradient-to-br from-amber-500/15 to-orange-500/10">
        <h2 className="text-2xl font-black">Coffee Lab</h2>
        <p className="mt-2 text-sm text-white/60">
          今日のカフェイン: <b>{todayMg}mg</b> / 目安{targetMg}
          mg。今の設定ならあと約 <b>{cupsLeft}杯</b>。
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <p className="rounded-2xl bg-black/25 p-3 text-sm text-white/75">
            {status}
          </p>
          <p className="rounded-2xl bg-black/25 p-3 text-sm text-white/75">
            {timingHint}
          </p>
          <p className="rounded-2xl bg-black/25 p-3 text-sm text-white/75">
            水分補給メモ: コーヒー1杯ごとに水を少し足すと安定しやすい。
          </p>
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-xl font-black">クイック記録</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-6">
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => {
                setName(p.name);
                setMg(p.mg);
              }}
              className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black hover:bg-white/15"
            >
              {p.name}
              <br />
              <span className="text-xs text-white/50">
                {p.mg}mg / {p.hint}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-6">
          <Field value={name} onChange={(e) => setName(e.target.value)} />
          <Field
            type="number"
            value={cups}
            onChange={(e) => setCups(Number(e.target.value))}
          />
          <Field
            type="number"
            value={mg}
            onChange={(e) => setMg(Number(e.target.value))}
          />
          <Field
            type="number"
            value={targetMg}
            onChange={(e) => setTargetMg(Number(e.target.value))}
            placeholder="目安mg"
          />
          <TimeField
            label="飲んだ時間"
            value={drinkTime}
            onChange={(e) => setDrinkTime(e.target.value)}
          />
          <Field
            placeholder="メモ"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <div className="mt-3">
          <PrimaryButton onClick={add}>コーヒー記録</PrimaryButton>
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-xl font-black">7日間カフェイン</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-7">
          {last7.map((d) => (
            <div key={d.key} className="rounded-2xl bg-black/25 p-3">
              <p className="text-[11px] text-white/45">{d.key.slice(5)}</p>
              <p className="mt-1 text-lg font-black">{d.total}mg</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-300"
                  style={{
                    width: `${Math.min(100, (d.total / Math.max(1, targetMg)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      <div className="grid gap-3">
        {logs.slice(0, 120).map((l) => (
          <GlassCard key={l.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black">
                  {l.coffee_name} / {l.cups}杯 / {l.caffeine_mg}mg
                </p>
                <p className="mt-1 text-xs text-white/45">{l.drink_date}</p>
                {l.note && (
                  <p className="mt-2 text-sm text-white/65">{l.note}</p>
                )}
              </div>
              <button
                onClick={() => del(l.id)}
                className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-black"
              >
                削除
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}


function readMoneyBudgetSettings(): MoneyBudgetSetting[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("lifeMoneyBudgetsV1") || "[]") as MoneyBudgetSetting[];
  } catch {
    return [];
  }
}

function writeMoneyBudgetSettings(items: MoneyBudgetSetting[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lifeMoneyBudgetsV1", JSON.stringify(items.slice(0, 80)));
}

function readMoneySubscriptions(): MoneySubscription[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("lifeMoneySubscriptionsV1") || "[]") as MoneySubscription[];
  } catch {
    return [];
  }
}

function writeMoneySubscriptions(items: MoneySubscription[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lifeMoneySubscriptionsV1", JSON.stringify(items.slice(0, 120)));
}

function daysUntilMonthlyDue(day: number) {
  const now = new Date();
  const safeDay = Math.min(28, Math.max(1, Number(day || 1)));
  let due = new Date(now.getFullYear(), now.getMonth(), safeDay);
  if (due < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
    due = new Date(now.getFullYear(), now.getMonth() + 1, safeDay);
  }
  const diff = due.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}


function BudgetPanel({
  snapshot,
  refreshSnapshot,
  themeKey,
}: PanelProps & { themeKey: ThemeKey }) {
  const theme = themes[themeKey];
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("食費");
  const [amount, setAmount] = useState(0);
  const [wallet, setWallet] = useState("財布");
  const [source, setSource] = useState("アルバイト");
  const [chargeFrom, setChargeFrom] = useState("財布");
  const [chargeTo, setChargeTo] = useState("Suica");
  const [memo, setMemo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountKind, setAccountKind] = useState("財布");
  const [accountBalance, setAccountBalance] = useState(0);
  const [accountNote, setAccountNote] = useState("");
  const [editAccount, setEditAccount] = useState<BudgetAccount | null>(null);
  const [deleteLogTarget, setDeleteLogTarget] = useState<BudgetLog | null>(
    null,
  );
  const [templateTitle, setTemplateTitle] = useState("ジム代");
  const [templateCategory, setTemplateCategory] = useState("サブスク");
  const [templateAmount, setTemplateAmount] = useState(0);
  const [templateWallet, setTemplateWallet] = useState("銀行");
  const [templateDay, setTemplateDay] = useState(1);
  const [actualBalance, setActualBalance] = useState<Record<string, string>>(
    {},
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptMessage, setReceiptMessage] = useState("");
  const [budgetAiMessage, setBudgetAiMessage] = useState("");
  const [budgetAiLoading, setBudgetAiLoading] = useState(false);
  const [moneyBudgets, setMoneyBudgets] = useState<MoneyBudgetSetting[]>(() =>
    readMoneyBudgetSettings(),
  );
  const [subscriptions, setSubscriptions] = useState<MoneySubscription[]>(() =>
    readMoneySubscriptions(),
  );
  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState(0);
  const [subWallet, setSubWallet] = useState("銀行");
  const [subNextDate, setSubNextDate] = useState(todayKey());
  const [subUsage, setSubUsage] = useState("普通");
  const [subMemo, setSubMemo] = useState("");
  const [subFrequency, setSubFrequency] = useState<"monthly" | "yearly">("monthly");
  const [editLog, setEditLog] = useState<BudgetLog | null>(null);
  const logs = snapshot?.budget || [];
  const accounts = snapshot?.budgetAccounts || [];
  const templates = snapshot?.budgetFixedTemplates || [];
  const incomeSources = [
    "アルバイト",
    "給与",
    "副業",
    "臨時収入",
    "仕送り",
    "返金",
    "貯金移動",
    "その他",
  ];
  const expenseCats = [
    "食費",
    "カフェ",
    "交通費",
    "日用品",
    "サブスク",
    "美容/服",
    "趣味",
    "本/学習",
    "医療",
    "交際",
    "筋トレ/健康",
    "家賃",
    "光熱費",
    "通信費",
    "予備費",
    "その他",
  ];
  const incomeCats = [
    "給与",
    "アルバイト",
    "副業",
    "臨時収入",
    "返金",
    "その他",
  ];
  const defaultWallets = [
    "財布",
    "銀行",
    "Suica",
    "PayPay",
    "クレカ",
    "楽天",
    "予備費",
    "その他",
  ];
  const wallets = Array.from(
    new Set([
      ...defaultWallets,
      ...accounts.map((a) => a.name),
      ...templates.map((t) => t.wallet || "").filter(Boolean),
    ]),
  );
  const accountKinds = [
    "財布",
    "銀行",
    "Suica",
    "PayPay",
    "予備費",
    "電子マネー",
    "クレカ",
    "その他",
  ];
  const totalAssets = accounts.reduce(
    (sum, a) => sum + Number(a.balance || 0),
    0,
  );
  const expense = logs
    .filter((l) => l.type === "expense")
    .reduce((s, l) => s + Number(l.amount), 0);
  const income = logs
    .filter((l) => l.type === "income")
    .reduce((s, l) => s + Number(l.amount), 0);
  const thisMonthLogs = logs.filter((l) => isSameMonth(l.spend_date));
  const monthIncome = thisMonthLogs
    .filter((l) => l.type === "income")
    .reduce((s, l) => s + Number(l.amount), 0);
  const monthExpense = thisMonthLogs
    .filter((l) => l.type === "expense")
    .reduce((s, l) => s + Number(l.amount), 0);
  const fixedMonthly = templates
    .filter((t) => t.active !== false)
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const remainingMonth = Math.max(0, monthIncome - monthExpense - fixedMonthly);
  const dailyBudget = Math.floor(remainingMonth / daysLeftInMonth());
  const spendingRatio = monthIncome > 0 ? Math.min(140, Math.round((monthExpense / monthIncome) * 100)) : monthExpense > 0 ? 100 : 0;
  const fixedRatio = monthIncome > 0 ? Math.min(100, Math.round((fixedMonthly / monthIncome) * 100)) : 0;
  const moneyMood =
    remainingMonth <= 0
      ? "引き締めモード"
      : dailyBudget >= 2000
        ? "余白あり"
        : dailyBudget >= 800
          ? "標準運転"
          : "節約寄り";
  const budgetPaceLabel =
    spendingRatio >= 95
      ? "支出ペース強め"
      : spendingRatio >= 70
        ? "少し注意"
        : "安定ペース";
  const currentCat = thisMonthLogs
    .filter((l) => l.type === "expense")
    .reduce((acc: Record<string, number>, l) => {
      acc[l.category] = (acc[l.category] || 0) + Number(l.amount);
      return acc;
    }, {});
  const previousCat = logs
    .filter((l) => {
      const d = new Date(todayKey() + "T00:00:00");
      d.setMonth(d.getMonth() - 1);
      return (
        String(l.spend_date || "").slice(0, 7) === monthKey(toDateKey(d)) &&
        l.type === "expense"
      );
    })
    .reduce(
      (acc: Record<string, number>, l) => {
        acc[l.category] = (acc[l.category] || 0) + Number(l.amount);
        return acc;
      },
      {} as Record<string, number>,
    );
  const categoryWarnings = Object.entries(currentCat)
    .map(([name, value]) => ({
      name,
      value,
      previous: previousCat[name] || 0,
      diff: value - (previousCat[name] || 0),
    }))
    .filter((x) => x.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 4);
  const topCategory = Object.entries(currentCat).sort((a, b) => b[1] - a[1])[0];
  const topSource = Object.entries(
    logs
      .filter((l) => l.type === "income")
      .reduce((acc: Record<string, number>, l) => {
        const k = l.source || "未設定";
        acc[k] = (acc[k] || 0) + Number(l.amount);
        return acc;
      }, {}),
  ).sort((a, b) => b[1] - a[1])[0];
  const todayExpense = logs
    .filter((l) => l.type === "expense" && l.spend_date === todayKey())
    .reduce((s, l) => s + Number(l.amount || 0), 0);
  const recent7Expense = logs
    .filter((l) => l.type === "expense" && l.spend_date >= dateMinus(todayKey(), 6))
    .reduce((s, l) => s + Number(l.amount || 0), 0);
  const todaySpendable = Math.max(0, dailyBudget - todayExpense);
  const subscriptionMonthly = subscriptions.reduce(
    (sum, sub) => sum + (sub.frequency === "yearly" ? Math.round(Number(sub.amount || 0) / 12) : Number(sub.amount || 0)),
    0,
  );
  const subscriptionYearly = subscriptions.reduce(
    (sum, sub) => sum + (sub.frequency === "yearly" ? Number(sub.amount || 0) : Number(sub.amount || 0) * 12),
    0,
  );
  const freeRemaining = Math.max(0, monthIncome - monthExpense - fixedMonthly - subscriptionMonthly);
  const monthEndForecast = Math.round(totalAssets - (recent7Expense / 7) * daysLeftInMonth());
  const upcomingFixed = templates
    .filter((t) => t.active !== false)
    .map((t) => ({ ...t, daysLeft: daysUntilMonthlyDue(Number(t.due_day || 1)) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);
  const budgetRows = expenseCats.map((cat) => {
    const used = currentCat[cat] || 0;
    const setting = moneyBudgets.find((b) => b.category === cat);
    const limit = Number(setting?.limit || 0);
    const rate = limit ? Math.round((used / limit) * 100) : 0;
    return { category: cat, used, limit, remaining: Math.max(0, limit - used), rate };
  });
  const overBudgetRows = budgetRows.filter((row) => row.limit && row.rate >= 80).slice(0, 4);
  const oftenWallet = Object.entries(
    thisMonthLogs.reduce((acc: Record<string, number>, l) => {
      const k = l.wallet || l.payment_method || "未設定";
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1])[0]?.[0] || "未設定";
  const moneyAlerts = [
    todayExpense > Math.max(3000, dailyBudget) ? `今日の支出が${yen(todayExpense)}。次だけ軽めにできると安定しそう。` : "",
    overBudgetRows[0] ? `${overBudgetRows[0].category}予算を${overBudgetRows[0].rate}%使用しています。少し見える化できてるよ。` : "",
    freeRemaining <= Math.max(1000, remainingMonth * 0.2) ? "自由費の余白が少なめ。固定費とサブスクを見直すと安心感が戻りそう。" : "",
    subscriptionMonthly > 0 ? `サブスク合計は月${yen(subscriptionMonthly)} / 年${yen(subscriptionYearly)}です。` : "",
  ].filter(Boolean);
  const grouped = accountKinds
    .map((kind) => ({ kind, items: accounts.filter((a) => a.kind === kind) }))
    .filter((g) => g.items.length);
  const pressTimer = useRef<number | null>(null);

  function linkedAccountName(
    log: Pick<BudgetLog, "wallet" | "payment_method">,
  ) {
    return String(log.wallet || log.payment_method || "").trim();
  }
  function accountDelta(
    typeValue: "income" | "expense" | "charge",
    amountValue: number,
  ) {
    if (typeValue === "income") return Math.abs(Number(amountValue || 0));
    if (typeValue === "charge") return 0;
    return -Math.abs(Number(amountValue || 0));
  }
  async function applyBalanceChange(accountLabel: string, delta: number) {
    const target = accounts.find((a) => a.name.trim() === accountLabel.trim());
    if (!target)
      return {
        ok: false,
        message: `「${accountLabel}」というお金コーナーがないため、収支ログだけ保存したよ。残高連動したい場合は同じ名前のコーナーを作ってね。`,
      };
    const nextBalance = Number(target.balance || 0) + delta;
    const { error } = await supabase
      .from("budget_accounts")
      .update({ balance: nextBalance })
      .eq("id", target.id);
    if (error)
      return { ok: false, message: `残高更新に失敗: ${error.message}` };
    return {
      ok: true,
      message: `「${target.name}」の残高を${delta >= 0 ? "+" : ""}${yen(delta)}反映したよ。現在残高は${yen(nextBalance)}。`,
    };
  }
  async function transferBalance(
    fromLabel: string,
    toLabel: string,
    amountValue: number,
  ) {
    const cleanFrom = fromLabel.trim();
    const cleanTo = toLabel.trim();
    const value = Math.abs(Number(amountValue || 0));
    if (!cleanFrom || !cleanTo || !value)
      return {
        ok: false,
        message: "チャージ元・チャージ先・金額を確認してね。",
      };
    if (cleanFrom === cleanTo)
      return { ok: false, message: "同じコーナー同士ではチャージできないよ。" };
    const from = accounts.find((a) => a.name.trim() === cleanFrom);
    const to = accounts.find((a) => a.name.trim() === cleanTo);
    if (!from || !to)
      return {
        ok: false,
        message: "チャージ元かチャージ先のお金コーナーが見つからなかったよ。",
      };
    const fromNext = Number(from.balance || 0) - value;
    const toNext = Number(to.balance || 0) + value;
    const first = await supabase
      .from("budget_accounts")
      .update({ balance: fromNext })
      .eq("id", from.id);
    if (first.error)
      return {
        ok: false,
        message: "チャージ元の残高更新に失敗: " + first.error.message,
      };
    const second = await supabase
      .from("budget_accounts")
      .update({ balance: toNext })
      .eq("id", to.id);
    if (second.error)
      return {
        ok: false,
        message: "チャージ先の残高更新に失敗: " + second.error.message,
      };
    return {
      ok: true,
      message: `${cleanFrom}から${cleanTo}へ${yen(value)}チャージしたよ。`,
    };
  }
  async function addCharge() {
    if (!amount || Number(amount) <= 0) return alert("チャージ金額を入れてね");
    const result = await transferBalance(chargeFrom, chargeTo, amount);
    if (!result.ok) return alert(result.message);
    const payload = {
      spend_date: todayKey(),
      type: "charge",
      category: "チャージ",
      amount,
      wallet: chargeTo,
      source: chargeFrom,
      payment_method: chargeTo,
      memo: memo || `${chargeFrom} → ${chargeTo}`,
    } as any;
    const { error } = await supabase.from("budget_logs").insert(payload);
    if (error)
      return alert(
        "チャージ記録の保存に失敗: " +
          error.message +
          "\nSQLを実行して type=charge を許可してね。",
      );
    setAmount(0);
    setMemo("");
    setGuideDraft(result.message);
    await refreshSnapshot();
  }
  function startLogLongPress(log: BudgetLog) {
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
    pressTimer.current = window.setTimeout(() => setDeleteLogTarget(log), 650);
  }
  function cancelLogLongPress() {
    if (pressTimer.current) {
      window.clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  async function add() {
    if (!amount || Number(amount) <= 0) return alert("金額を入れてね");
    const accountLabel = wallet.trim();
    const payload = {
      spend_date: todayKey(),
      type,
      category,
      amount,
      wallet: accountLabel,
      source: type === "income" ? source : null,
      payment_method: accountLabel,
      memo: memo || null,
    };
    const { error } = await supabase.from("budget_logs").insert(payload);
    if (error) return alert("家計簿保存失敗: " + error.message);
    const result = await applyBalanceChange(
      accountLabel,
      accountDelta(type, amount),
    );
    setAmount(0);
    setMemo("");
    setGuideDraft(
      result.message || `${type === "income" ? "収入" : "支出"}を記録したよ。`,
    );
    await refreshSnapshot();
  }
  async function addFromReceipt() {
    const imageDataUrl = await imageFileToDataUrl(receiptFile);
    if (!imageDataUrl) return setReceiptMessage("レシート画像を選んでね。");
    setReceiptMessage("レシートを読み取り中...");
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "receiptToBudgetAI", imageDataUrl }),
      });
      const json = await res.json().catch(() => ({}));
      const item = json.budget || {};
      const nextAmount = Number(item.amount || 0);
      if (!nextAmount)
        return setReceiptMessage(
          json.result ||
            "金額を読み取れなかったよ。金額が大きく写っている写真で試してね。",
        );
      const nextCategory = String(item.category || "その他");
      const nextMemo = String(item.memo || item.store || "レシート");
      const nextWallet = String(item.wallet || wallet || "財布");
      const { error } = await supabase
        .from("budget_logs")
        .insert({
          spend_date: todayKey(),
          type: "expense",
          category: nextCategory,
          amount: nextAmount,
          wallet: nextWallet,
          payment_method: nextWallet,
          memo: nextMemo,
          image_url: imageDataUrl,
        });
      if (error) {
        const fallback = await supabase
          .from("budget_logs")
          .insert({
            spend_date: todayKey(),
            type: "expense",
            category: nextCategory,
            amount: nextAmount,
            wallet: nextWallet,
            payment_method: nextWallet,
            memo: nextMemo,
          });
        if (fallback.error)
          return setReceiptMessage(
            "レシート支出の保存に失敗: " + fallback.error.message,
          );
      }
      await applyBalanceChange(nextWallet, -Math.abs(nextAmount));
      setReceiptFile(null);
      setReceiptMessage(
        `${nextCategory} / ${yen(nextAmount)} を支出登録したよ。`,
      );
      await refreshSnapshot();
    } catch (error) {
      console.error(error);
      setReceiptMessage(
        "レシートAIに失敗したよ。/apiログとOPENAI_API_KEYを確認してね。",
      );
    }
  }
  async function deleteLog() {
    if (!deleteLogTarget) return;
    const accountLabel = linkedAccountName(deleteLogTarget);
    const { error } = await supabase
      .from("budget_logs")
      .delete()
      .eq("id", deleteLogTarget.id);
    if (error) return alert("家計簿削除失敗: " + error.message);
    let result: { ok: boolean; message: string } = {
      ok: true,
      message: "収支ログを削除したよ。",
    };
    if (deleteLogTarget.type === "charge") {
      result = await transferBalance(
        String(deleteLogTarget.wallet || deleteLogTarget.payment_method || ""),
        String(deleteLogTarget.source || ""),
        Number(deleteLogTarget.amount || 0),
      );
    } else {
      const reverseDelta = -accountDelta(
        deleteLogTarget.type,
        Number(deleteLogTarget.amount || 0),
      );
      result = accountLabel
        ? await applyBalanceChange(accountLabel, reverseDelta)
        : {
            ok: false,
            message:
              "収支ログを削除したよ。紐づくコーナー名がなかったため残高は変更してないよ。",
          };
    }
    setDeleteLogTarget(null);
    setGuideDraft(result.message || "収支ログを削除して、残高も戻したよ。");
    await refreshSnapshot();
  }
  async function addAccount() {
    if (!accountName.trim()) return alert("コーナー名を入れてね");
    const exists = accounts.some((a) => a.name.trim() === accountName.trim());
    if (exists)
      return alert(
        "同じ名前のお金コーナーがあるよ。収支連動は名前で行うから、別名にするか既存コーナーを変更してね。",
      );
    const { error } = await supabase
      .from("budget_accounts")
      .insert({
        name: accountName.trim(),
        kind: accountKind,
        balance: accountBalance || 0,
        note: accountNote || null,
      });
    if (error)
      return alert(
        "コーナー作成失敗: " +
          error.message +
          "\n統合SQLを実行しているか確認してね。",
      );
    setAccountName("");
    setAccountBalance(0);
    setAccountNote("");
    setGuideDraft(
      `家計簿に「${accountName}」コーナーを作ったよ。収支で同じ名前を選ぶと残高が自動で増減するよ。`,
    );
    await refreshSnapshot();
  }
  async function saveAccount() {
    if (!editAccount) return;
    const duplicate = accounts.some(
      (a) =>
        a.id !== editAccount.id && a.name.trim() === editAccount.name.trim(),
    );
    if (duplicate)
      return alert(
        "同じ名前のお金コーナーがあるよ。収支連動のため、名前は重複しない形が安全だよ。",
      );
    const { error } = await supabase
      .from("budget_accounts")
      .update({
        name: editAccount.name.trim(),
        kind: editAccount.kind,
        balance: editAccount.balance,
        note: editAccount.note,
      })
      .eq("id", editAccount.id);
    if (error) return alert("コーナー更新失敗: " + error.message);
    setEditAccount(null);
    await refreshSnapshot();
  }
  async function deleteAccount(id: string) {
    if (
      !confirm(
        "このお金コーナーを削除していい？残高カードだけ消えるよ。家計簿ログは残るよ。",
      )
    )
      return;
    const { error } = await supabase
      .from("budget_accounts")
      .delete()
      .eq("id", id);
    if (error) return alert("コーナー削除失敗: " + error.message);
    await refreshSnapshot();
  }
  async function addTemplate() {
    if (!templateTitle.trim() || !templateAmount)
      return alert("固定費名と金額を入れてね");
    const { error } = await supabase
      .from("budget_fixed_templates")
      .insert({
        title: templateTitle.trim(),
        category: templateCategory,
        amount: Math.abs(Number(templateAmount || 0)),
        wallet: templateWallet,
        due_day: templateDay || 1,
        active: true,
        memo: null,
      });
    if (error)
      return alert(
        "固定費テンプレ作成失敗: " + error.message + "\n統合SQLを実行してね。",
      );
    setTemplateAmount(0);
    setGuideDraft(
      `固定費テンプレ「${templateTitle}」を作ったよ。毎月の支出をワンタップ登録できるね。`,
    );
    await refreshSnapshot();
  }
  async function useTemplate(t: BudgetFixedTemplate) {
    const accountLabel = String(t.wallet || wallet || "財布");
    const { error } = await supabase
      .from("budget_logs")
      .insert({
        spend_date: todayKey(),
        type: "expense",
        category: t.category,
        amount: Number(t.amount || 0),
        wallet: accountLabel,
        payment_method: accountLabel,
        memo: `固定費:${t.title}`,
      });
    if (error) return alert("固定費登録失敗: " + error.message);
    await applyBalanceChange(accountLabel, -Math.abs(Number(t.amount || 0)));
    await refreshSnapshot();
  }
  async function deleteTemplate(id: string) {
    const { error } = await supabase
      .from("budget_fixed_templates")
      .delete()
      .eq("id", id);
    if (error) return alert("固定費削除失敗: " + error.message);
    await refreshSnapshot();
  }
  async function adjustAccountToActual(a: BudgetAccount) {
    const actual = Number(actualBalance[a.id] || 0);
    if (!Number.isFinite(actual)) return;
    const diff = actual - Number(a.balance || 0);
    const { error } = await supabase
      .from("budget_accounts")
      .update({ balance: actual })
      .eq("id", a.id);
    if (error) return alert("残高調整に失敗: " + error.message);
    setGuideDraft(
      `「${a.name}」の残高を実残高に合わせたよ。差額は${diff >= 0 ? "+" : ""}${yen(diff)}。`,
    );
    await refreshSnapshot();
  }
  async function runBudgetAi() {
    setBudgetAiLoading(true);
    try {
      const data = {
        logs: thisMonthLogs,
        accounts,
        templates,
        subscriptions,
        moneyBudgets,
        categoryWarnings,
        monthIncome,
        monthExpense,
        fixedMonthly,
        dailyBudget,
        todaySpendable,
        freeRemaining,
        monthEndForecast,
      };
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "budgetAI", data }),
      });
      const json = await res.json();
      setBudgetAiMessage(json.result || "家計簿AIの分析に失敗したみたい。");
    } catch {
      setBudgetAiMessage(
        "家計簿AIに失敗したよ。APIキーや通信状態を確認してね。",
      );
    } finally {
      setBudgetAiLoading(false);
    }
  }

  function saveMoneyBudgets(next: MoneyBudgetSetting[]) {
    setMoneyBudgets(next);
    writeMoneyBudgetSettings(next);
  }

  function updateBudgetLimit(categoryName: string, limit: number) {
    const clean = Math.max(0, Number(limit || 0));
    const exists = moneyBudgets.some((b) => b.category === categoryName);
    const next = exists
      ? moneyBudgets.map((b) => (b.category === categoryName ? { ...b, limit: clean } : b))
      : [
          ...moneyBudgets,
          {
            id: `money-budget-${Date.now()}-${Math.random().toString(16).slice(2)}`,
            category: categoryName,
            limit: clean,
            created_at: new Date().toISOString(),
          },
        ];
    saveMoneyBudgets(next);
  }

  function saveSubscriptions(next: MoneySubscription[]) {
    setSubscriptions(next);
    writeMoneySubscriptions(next);
  }

  function addSubscription() {
    if (!subName.trim() || !subAmount) return alert("サブスク名と金額を入れてね");
    const item: MoneySubscription = {
      id: `money-sub-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: subName.trim(),
      amount: Math.abs(Number(subAmount || 0)),
      wallet: subWallet,
      nextDate: subNextDate || todayKey(),
      frequency: subFrequency,
      usage: subUsage,
      memo: subMemo.trim(),
      created_at: new Date().toISOString(),
    };
    saveSubscriptions([item, ...subscriptions].slice(0, 120));
    setSubName("");
    setSubAmount(0);
    setSubMemo("");
    setGuideDraft(`サブスク「${item.name}」をMoney Hubに追加したよ。月額と年額の見える化に使えるね。`);
  }

  function deleteSubscription(id: string) {
    saveSubscriptions(subscriptions.filter((s) => s.id !== id));
  }

  async function quickExpense(categoryName: string, quickAmount: number, quickMemo = "") {
    const value = Math.abs(Number(quickAmount || 0));
    if (!value) return;
    const accountLabel = wallet || wallets[0] || "財布";
    const { error } = await supabase.from("budget_logs").insert({
      spend_date: todayKey(),
      type: "expense",
      category: categoryName,
      amount: value,
      wallet: accountLabel,
      payment_method: accountLabel,
      memo: quickMemo || `かんたん入力:${categoryName}`,
    });
    if (error) return alert("かんたん支出登録に失敗: " + error.message);
    await applyBalanceChange(accountLabel, -value);
    setGuideDraft(`${categoryName} ${yen(value)} を記録したよ。今日あと使える目安にも反映されるよ。`);
    window.setTimeout(() => void refreshSnapshot("Money Hub同期中..."), 120);
  }

  async function duplicateLog(log: BudgetLog) {
    if (log.type === "charge") {
      setAmount(Number(log.amount || 0));
      setChargeFrom(String(log.source || chargeFrom));
      setChargeTo(String(log.wallet || log.payment_method || chargeTo));
      setMemo(log.memo || "");
      setGuideDraft("チャージ内容を入力欄に複製したよ。確認してから登録できるよ。");
      return;
    }
    const payload = {
      spend_date: todayKey(),
      type: log.type,
      category: log.category,
      amount: Number(log.amount || 0),
      wallet: log.wallet || log.payment_method || wallet,
      source: log.source || null,
      payment_method: log.payment_method || log.wallet || wallet,
      memo: log.memo ? `複製:${log.memo}` : "複製入力",
    };
    const { error } = await supabase.from("budget_logs").insert(payload);
    if (error) return alert("複製に失敗: " + error.message);
    await applyBalanceChange(String(payload.wallet || ""), accountDelta(log.type, Number(log.amount || 0)));
    await refreshSnapshot("Money Hub同期中...");
  }

  async function saveEditedLog() {
    if (!editLog) return;
    const original = logs.find((l) => l.id === editLog.id);
    const payload = {
      spend_date: editLog.spend_date,
      type: editLog.type,
      category: editLog.category,
      amount: Math.abs(Number(editLog.amount || 0)),
      wallet: editLog.wallet || editLog.payment_method || wallet,
      source: editLog.source || null,
      payment_method: editLog.payment_method || editLog.wallet || wallet,
      memo: editLog.memo || null,
    } as any;
    const { error } = await supabase.from("budget_logs").update(payload).eq("id", editLog.id);
    if (error) return alert("収支編集に失敗: " + error.message);
    if (original && original.type !== "charge" && editLog.type !== "charge") {
      const oldAccount = linkedAccountName(original);
      const newAccount = String(payload.wallet || payload.payment_method || "");
      if (oldAccount) await applyBalanceChange(oldAccount, -accountDelta(original.type, Number(original.amount || 0)));
      if (newAccount) await applyBalanceChange(newAccount, accountDelta(editLog.type, Number(editLog.amount || 0)));
    }
    setEditLog(null);
    await refreshSnapshot("Money Hub同期中...");
  }

  return (
    <div className="money-hub-page space-y-4">
      <GlassCard className="future-budget-hero budget-command-hero overflow-hidden">
        <div className="relative z-10 grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)] lg:items-end">
          <div>
            <p className="text-xs font-black tracking-[0.34em] text-sky-100/70">MONEY COMMAND CENTER</p>
            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">Money Hub / マネーハブ</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-sky-50/72">
              収入・支出・チャージ・資金移動・固定費・サブスク・お金のコーナーを一画面で見て、今日あと使える金額まで判断できる司令室だよ。
              既存の保存形式はそのまま使って、見た目と判断しやすさを強化しているよ。
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="future-budget-chip">
                <span>総資産</span>
                <b>{yen(totalAssets)}</b>
              </div>
              <div className="future-budget-chip">
                <span>今月あと使える</span>
                <b>{yen(remainingMonth)}</b>
              </div>
              <div className="future-budget-chip">
                <span>1日目安</span>
                <b>{yen(dailyBudget)}</b>
              </div>
            </div>
          </div>
          <div className="future-budget-orb">
            <span>{moneyMood}</span>
            <b>{budgetPaceLabel}</b>
            <p>支出 {spendingRatio}% / 固定費 {fixedRatio}%</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
              <div className="h-full rounded-full bg-gradient-to-r from-sky-300 via-indigo-300 to-blue-500" style={{ width: `${Math.min(100, Math.max(8, spendingRatio))}%` }} />
            </div>
          </div>
        </div>
      </GlassCard>
      <div className="money-hub-kpi-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["今日あと使える", yen(todaySpendable), "生活判断の中心"],
          ["今日の支出", yen(todayExpense), "本日の使用額"],
          ["今週の支出", yen(recent7Expense), "直近7日"],
          ["自由費残り", yen(freeRemaining), "固定費・サブスク後"],
          ["月末予測", `${yen(monthEndForecast)}前後`, "簡易予測"],
        ].map(([label, value, sub]) => (
          <GlassCard key={label} className="future-money-kpi-card">
            <p className="text-xs font-black text-sky-100/52">{label}</p>
            <p className="mt-2 truncate text-2xl font-black text-white">{value}</p>
            <p className="mt-1 text-xs text-white/45">{sub}</p>
          </GlassCard>
        ))}
      </div>
      {upcomingFixed.length > 0 && (
        <GlassCard className="border-amber-200/20 bg-amber-300/[0.07]">
          <h3 className="text-xl font-black">次に来る支払い予定</h3>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {upcomingFixed.map((item) => (
              <div key={item.id} className="rounded-2xl bg-black/25 p-3">
                <p className="font-black">{item.daysLeft === 0 ? "今日" : `${item.daysLeft}日後`}に {item.title}</p>
                <p className="mt-1 text-sm text-white/58">{yen(Number(item.amount || 0))} / {item.wallet || "未設定"} / 毎月{item.due_day || 1}日</p>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
      <div className="grid gap-3 lg:grid-cols-3">
        <GlassCard>
          <p className="text-xs text-white/45">今月あと使える</p>
          <p className="mt-2 text-3xl font-black text-cyan-100">
            {yen(remainingMonth)}
          </p>
          <p className="mt-1 text-xs text-white/50">
            今日から月末まで1日 {yen(dailyBudget)} 目安
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-white/45">固定費テンプレ合計</p>
          <p className="mt-2 text-3xl font-black text-orange-100">
            {yen(fixedMonthly)}
          </p>
          <p className="mt-1 text-xs text-white/50">
            家賃・サブスク・ジム代など
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-xs text-white/45">カテゴリ警告</p>
          <p className="mt-2 text-3xl font-black text-rose-100">
            {categoryWarnings.length}件
          </p>
          <p className="mt-1 text-xs text-white/50">
            先月より増えた支出カテゴリ
          </p>
        </GlassCard>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr]">
        <GlassCard className="future-money-card">
          <p className="text-xs font-black text-sky-100/60">今月の流れ</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-black/25 p-3">
              <p className="text-xs text-white/45">収入</p>
              <b className="text-xl text-emerald-100">{yen(monthIncome)}</b>
            </div>
            <div className="rounded-2xl bg-black/25 p-3">
              <p className="text-xs text-white/45">支出</p>
              <b className="text-xl text-rose-100">{yen(monthExpense)}</b>
            </div>
          </div>
        </GlassCard>
        <GlassCard className="future-money-card">
          <p className="text-xs font-black text-sky-100/60">AIチェック</p>
          <h3 className="mt-2 text-xl font-black">{moneyMood}</h3>
          <p className="mt-2 text-sm leading-6 text-white/65">
            今日の目安は {yen(dailyBudget)}。固定費を引いた後の余白を基準にしているよ。
          </p>
        </GlassCard>
        <GlassCard className="future-money-card">
          <p className="text-xs font-black text-sky-100/60">増えたカテゴリ</p>
          <div className="mt-3 space-y-2">
            {categoryWarnings.length ? categoryWarnings.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3 rounded-2xl bg-black/25 px-3 py-2">
                <span className="truncate text-sm font-bold text-white/78">{item.name}</span>
                <b className="text-sm text-amber-100">+{yen(item.diff)}</b>
              </div>
            )) : <p className="rounded-2xl bg-black/25 px-3 py-3 text-sm text-white/60">先月より強く増えたカテゴリは少なめ。</p>}
          </div>
        </GlassCard>
      </div>
      <GlassCard className="money-quick-input">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-black">レシートなし簡単入力</h3>
            <p className="mt-1 text-sm text-white/55">金額と用途を押すだけで支出登録できるよ。支払元は現在の「{wallet}」を使うよ。</p>
          </div>
          <select
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-3 text-sm font-black text-white"
          >
            {wallets.map((w) => <option key={w}>{w}</option>)}
          </select>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[100, 300, 500, 1000, 3000].map((value) => (
            <button key={value} onClick={() => setAmount(value)} className={`rounded-2xl px-3 py-3 text-sm font-black ${amount === value ? "bg-sky-200 text-black" : "bg-white/10"}`}>
              {yen(value)}
            </button>
          ))}
          <Field
            type="number"
            placeholder="カスタム"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {["コンビニ", "カフェ", "交通費", "食費", "日用品", "サブスク", "本/学習", "筋トレ/健康"].map((label) => (
            <button
              key={label}
              onClick={() => quickExpense(label === "コンビニ" ? "食費" : label, amount || 0, label)}
              disabled={!amount}
              className="rounded-2xl border border-white/10 bg-white/[0.07] px-3 py-3 text-sm font-black disabled:opacity-40"
            >
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-black">カテゴリ予算</h3>
        <p className="mt-1 text-sm text-white/55">カテゴリごとの月予算をlocalStorageに安全保存するよ。既存家計簿ログは壊さない。</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {budgetRows.map((row) => (
            <div key={row.category} className="rounded-2xl border border-white/10 bg-black/25 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-black">{row.category}</p>
                <span className={`rounded-full px-2 py-1 text-[10px] font-black ${row.limit && row.rate >= 100 ? "bg-rose-300 text-black" : row.limit && row.rate >= 80 ? "bg-amber-300 text-black" : "bg-white/10 text-white/55"}`}>
                  {row.limit ? `${row.rate}%` : "未設定"}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/40">
                <div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-indigo-400" style={{ width: `${Math.min(100, row.limit ? row.rate : 0)}%` }} />
              </div>
              <p className="mt-2 text-xs text-white/52">使用 {yen(row.used)} / 残り {row.limit ? yen(row.remaining) : "未設定"}</p>
              <Field
                type="number"
                placeholder="月予算"
                value={row.limit || ""}
                onChange={(e) => updateBudgetLimit(row.category, Number(e.target.value))}
                className="mt-2"
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-black">サブスク管理</h3>
        <p className="mt-1 text-sm text-white/55">固定費とは別に、サブスクだけを月額・年額で見える化するよ。</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_140px_140px_150px_140px_1fr_130px]">
          <Field placeholder="Apple Music / Runna / iCloud" value={subName} onChange={(e) => setSubName(e.target.value)} />
          <Field type="number" placeholder="金額" value={subAmount || ""} onChange={(e) => setSubAmount(Number(e.target.value))} />
          <select value={subFrequency} onChange={(e) => setSubFrequency(e.target.value as "monthly" | "yearly")} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
            <option value="monthly">月額</option>
            <option value="yearly">年額</option>
          </select>
          <Field type="date" value={subNextDate} onChange={(e) => setSubNextDate(e.target.value)} />
          <select value={subWallet} onChange={(e) => setSubWallet(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
            {wallets.map((w) => <option key={w}>{w}</option>)}
          </select>
          <Field placeholder="使用頻度・解約検討メモ" value={subUsage} onChange={(e) => setSubUsage(e.target.value)} />
          <PrimaryButton onClick={addSubscription}>追加</PrimaryButton>
        </div>
        <TextArea className="mt-3 min-h-20" placeholder="メモ 任意" value={subMemo} onChange={(e) => setSubMemo(e.target.value)} />
        <div className="mt-4 grid gap-3 lg:grid-cols-[260px_1fr]">
          <div className="rounded-3xl border border-sky-200/14 bg-sky-300/10 p-4">
            <p className="text-xs font-black text-sky-100/52">現在のサブスク合計</p>
            <p className="mt-2 text-2xl font-black">{yen(subscriptionMonthly)} / 月</p>
            <p className="mt-1 text-sm text-white/55">{yen(subscriptionYearly)} / 年</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {subscriptions.length ? subscriptions.map((sub) => (
              <div key={sub.id} className="rounded-2xl bg-black/25 p-3">
                <p className="font-black">{sub.name}</p>
                <p className="mt-1 text-sm text-white/60">{yen(sub.amount)} / {sub.frequency === "monthly" ? "月" : "年"} / {sub.wallet}</p>
                <p className="mt-1 text-xs text-white/45">次回 {sub.nextDate} / {sub.usage}</p>
                {sub.memo && <p className="mt-2 text-xs text-white/55">{sub.memo}</p>}
                <button onClick={() => deleteSubscription(sub.id)} className="mt-2 rounded-xl bg-red-500 px-3 py-2 text-xs font-black">削除</button>
              </div>
            )) : <p className="rounded-2xl bg-black/25 p-4 text-sm text-white/55">まだサブスクは登録されていないよ。</p>}
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-xl font-black">固定費テンプレ</h3>
        <p className="mt-1 text-sm text-white/55">
          家賃・サブスク・ジム代を作っておくと、毎月ワンタップで支出登録できる。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Field
            placeholder="例: ジム代"
            value={templateTitle}
            onChange={(e) => setTemplateTitle(e.target.value)}
          />
          <select
            value={templateCategory}
            onChange={(e) => setTemplateCategory(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            {expenseCats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <Field
            type="number"
            placeholder="金額"
            value={templateAmount}
            onChange={(e) => setTemplateAmount(Number(e.target.value))}
          />
          <select
            value={templateWallet}
            onChange={(e) => setTemplateWallet(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            {wallets.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
          <Field
            type="number"
            placeholder="毎月何日"
            value={templateDay}
            onChange={(e) => setTemplateDay(Number(e.target.value))}
          />
          <PrimaryButton onClick={addTemplate}>作成</PrimaryButton>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <div key={t.id} className="rounded-2xl bg-black/25 p-3">
              <p className="font-black">
                {t.title} / {yen(t.amount)}
              </p>
              <p className="text-xs text-white/45">
                {t.category} / {t.wallet || "未設定"} / 毎月{t.due_day || 1}日
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => useTemplate(t)}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-black text-black"
                >
                  今月登録
                </button>
                <button
                  onClick={() => deleteTemplate(t.id)}
                  className="rounded-xl bg-red-500 px-3 py-2 text-xs font-bold"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-xl font-black">レシート写真 → 支出登録</h3>
        <p className="mt-1 text-sm text-white/55">
          金額・店名・カテゴリをAIで読んで、支出と残高に反映する。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
            className="rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white/70"
          />
          <button
            onClick={addFromReceipt}
            className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-black"
          >
            読み取って登録
          </button>
        </div>
        {receiptMessage && (
          <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-white/75">
            {receiptMessage}
          </p>
        )}
      </GlassCard>
      <GlassCard>
        <h3 className="text-xl font-black">お金のコーナー</h3>
        <p className="mt-1 text-sm text-white/55">
          実残高を入れると、記録上の残高との差額が見える。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field
            placeholder="例: メイン財布 / ゆうちょ / Suica"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
          <select
            value={accountKind}
            onChange={(e) => setAccountKind(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            {accountKinds.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <Field
            type="number"
            placeholder="現在の金額"
            value={accountBalance}
            onChange={(e) => setAccountBalance(Number(e.target.value))}
          />
          <Field
            placeholder="メモ 任意"
            value={accountNote}
            onChange={(e) => setAccountNote(e.target.value)}
          />
          <PrimaryButton onClick={addAccount}>コーナー作成</PrimaryButton>
        </div>
      </GlassCard>
      {accounts.length ? (
        <div className="space-y-4">
          {grouped.map((group) => {
            const groupTotal = group.items.reduce(
              (sum, a) => sum + Number(a.balance || 0),
              0,
            );
            return (
              <GlassCard key={group.kind}>
                <div className="flex items-end justify-between gap-3">
                  <h3 className="text-xl font-black">{group.kind}コーナー</h3>
                  <p className="text-2xl font-black text-emerald-100">
                    {yen(groupTotal)}
                  </p>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((a) => {
                    const actual =
                      actualBalance[a.id] === undefined
                        ? NaN
                        : Number(actualBalance[a.id]);
                    const diff = Number.isFinite(actual)
                      ? actual - Number(a.balance || 0)
                      : 0;
                    return (
                      <div
                        key={a.id}
                        className="rounded-3xl border border-white/10 bg-black/25 p-4"
                      >
                        <p
                          className={`inline-flex rounded-full bg-gradient-to-r ${theme.accent} px-3 py-1 text-xs font-black text-black`}
                        >
                          {a.kind}
                        </p>
                        <h4 className="mt-3 text-xl font-black">{a.name}</h4>
                        <p className="mt-2 text-3xl font-black">
                          {yen(Number(a.balance || 0))}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                          記録上の残高
                        </p>
                        <div className="mt-3 grid gap-2">
                          <Field
                            type="number"
                            placeholder="実際の残高を入力"
                            value={actualBalance[a.id] || ""}
                            onChange={(e) =>
                              setActualBalance((cur) => ({
                                ...cur,
                                [a.id]: e.target.value,
                              }))
                            }
                          />
                          {actualBalance[a.id] && (
                            <p
                              className={`rounded-2xl px-3 py-2 text-xs font-black ${diff === 0 ? "bg-emerald-400/15 text-emerald-100" : "bg-amber-400/15 text-amber-100"}`}
                            >
                              ズレ {diff >= 0 ? "+" : ""}
                              {yen(diff)}
                            </p>
                          )}
                          <button
                            onClick={() => adjustAccountToActual(a)}
                            className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-black"
                          >
                            実残高に合わせる
                          </button>
                        </div>
                        {a.note && (
                          <p className="mt-2 text-sm text-white/65">{a.note}</p>
                        )}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setEditAccount(a)}
                            className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold"
                          >
                            変更
                          </button>
                          <button
                            onClick={() => deleteAccount(a.id)}
                            className="rounded-2xl bg-red-500 px-3 py-2 text-sm font-bold"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </div>
      ) : (
        <Empty text="まだお金のコーナーがないよ。財布・銀行・Suica・貯金などを作ると、どこにいくらあるか見えるよ。" />
      )}
      <GlassCard>
        <h3 className="text-xl font-black">チャージ</h3>
        <p className="mt-1 text-xs text-white/50">
          財布からSuica/PayPayなどへ移す時は支出・収入にせず、残高移動として扱うよ。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select
            value={chargeFrom}
            onChange={(e) => setChargeFrom(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            {wallets.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
          <select
            value={chargeTo}
            onChange={(e) => setChargeTo(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            {wallets.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
          <Field
            type="number"
            placeholder="チャージ金額"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <Field
            placeholder="メモ 任意"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <PrimaryButton onClick={addCharge}>チャージする</PrimaryButton>
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-xl font-black">収支を追加</h3>
        <p className="mt-1 text-xs text-white/50">
          選んだコーナー名と同じお金コーナーがあれば、残高も自動で増減するよ。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select
            value={type}
            onChange={(e) => {
              const next = e.target.value as "income" | "expense";
              setType(next);
              setCategory(next === "income" ? "給与" : "食費");
            }}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            <option value="expense">支出</option>
            <option value="income">収入</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            {(type === "income" ? incomeCats : expenseCats).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <Field
            type="number"
            placeholder="金額"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
          <select
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            {wallets.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>
          {type === "income" ? (
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
            >
              {incomeSources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          ) : (
            <Field
              placeholder="メモ 任意"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          )}
          <PrimaryButton onClick={add}>追加</PrimaryButton>
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="text-xl font-black">使いすぎ警告</h3>
        {!categoryWarnings.length && (
          <p className="mt-2 text-sm text-white/55">
            先月より増えたカテゴリはまだ目立ってないよ。
          </p>
        )}
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {categoryWarnings.map((w) => (
            <div key={w.name} className="rounded-2xl bg-rose-500/10 p-3">
              <p className="font-black">
                {w.name} +{yen(w.diff)}
              </p>
              <p className="text-xs text-white/50">
                今月 {yen(w.value)} / 先月 {yen(w.previous)}
              </p>
            </div>
          ))}
        </div>
        <button
          onClick={runBudgetAi}
          disabled={budgetAiLoading}
          className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50"
        >
          AIで家計簿を読む
        </button>
        {budgetAiMessage && (
          <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-black/25 p-4 text-sm leading-7 text-white/75">
            {budgetAiMessage}
          </p>
        )}
      </GlassCard>
      <GuideAiCard
        themeKey={themeKey}
        message={`家計簿を見たよ。総資産は${yen(totalAssets)}。今月は収入${yen(monthIncome)}、支出${yen(monthExpense)}。${topCategory ? `支出で多いのは「${topCategory[0]}」の${yen(topCategory[1])}。` : "支出データはこれから育つよ。"}${topSource ? ` 収入源では「${topSource[0]}」が目立ってるね。` : ""}`}
      />
      <GlassCard>
        <h3 className="text-xl font-black">入力済みの収支</h3>
        <p className="mt-1 text-xs text-white/50">
          編集・複製・削除ができるよ。長押しでも削除確認を開けるよ。
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {logs.slice(0, 120).map((l) => (
            <div
              key={l.id}
              onPointerDown={() => startLogLongPress(l)}
              onPointerUp={cancelLogLongPress}
              onPointerCancel={cancelLogLongPress}
              onPointerLeave={cancelLogLongPress}
              onContextMenu={(e) => e.preventDefault()}
              className="rounded-[1.6rem] border border-white/10 bg-white/[0.075] p-4 shadow-xl"
            >
              <p
                className={`inline-flex rounded-full bg-gradient-to-r ${theme.accent} px-3 py-1 text-xs font-black text-black`}
              >
                {l.type === "income"
                  ? "収入"
                  : l.type === "charge"
                    ? "チャージ"
                    : "支出"}
              </p>
              <p className="mt-2 font-black">
                {l.category} / {yen(l.amount)}
              </p>
              <p className="text-xs text-white/45">
                {l.type === "income"
                  ? `収入源:${l.source || "未設定"}`
                  : l.type === "charge"
                    ? `移動:${l.source || "?"} → ${l.wallet || l.payment_method || "?"}`
                    : `コーナー:${l.wallet || l.payment_method || "未設定"}`}{" "}
                / {l.spend_date}
              </p>
              {l.memo && <p className="mt-2 text-sm text-white/65">{l.memo}</p>}
              <ImagePreview src={l.image_url} />
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  onClick={() => setEditLog(l)}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black"
                >
                  編集
                </button>
                <button
                  onClick={() => duplicateLog(l)}
                  className="rounded-xl bg-sky-300/15 px-3 py-2 text-xs font-black text-sky-50"
                >
                  複製
                </button>
                <button
                  onClick={() => setDeleteLogTarget(l)}
                  className="rounded-xl bg-red-500/85 px-3 py-2 text-xs font-black"
                >
                  削除
                </button>
              </div>
              <p className="mt-3 text-[11px] text-white/35">長押し：削除確認</p>
            </div>
          ))}
        </div>
      </GlassCard>
      {deleteLogTarget && (
        <Modal
          title="この収支を削除する？"
          onClose={() => setDeleteLogTarget(null)}
        >
          <p className="text-sm text-white/65">
            {deleteLogTarget.category} / {yen(deleteLogTarget.amount)} /{" "}
            {deleteLogTarget.spend_date}
          </p>
          <p className="mt-2 text-xs text-white/50">
            削除すると、{linkedAccountName(deleteLogTarget) || "未設定コーナー"}{" "}
            の残高も逆方向に戻すよ。
          </p>
          <button
            onClick={deleteLog}
            className="mt-4 w-full rounded-2xl bg-red-500 px-4 py-3 font-black text-white"
          >
            完全に削除する
          </button>
          <button
            onClick={() => setDeleteLogTarget(null)}
            className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 font-bold"
          >
            キャンセル
          </button>
        </Modal>
      )}
      {editLog && (
        <Modal title="収支ログを編集" onClose={() => setEditLog(null)}>
          <div className="space-y-3">
            <Field
              type="date"
              value={editLog.spend_date}
              onChange={(e) => setEditLog({ ...editLog, spend_date: e.target.value })}
            />
            <select
              value={editLog.type}
              onChange={(e) => setEditLog({ ...editLog, type: e.target.value as BudgetLog["type"] })}
              className="w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
            >
              <option value="expense">支出</option>
              <option value="income">収入</option>
              <option value="charge">チャージ/資金移動</option>
            </select>
            <select
              value={editLog.category}
              onChange={(e) => setEditLog({ ...editLog, category: e.target.value })}
              className="w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
            >
              {[...expenseCats, ...incomeCats, "チャージ"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <Field
              type="number"
              value={editLog.amount}
              onChange={(e) => setEditLog({ ...editLog, amount: Number(e.target.value) })}
            />
            <select
              value={editLog.wallet || editLog.payment_method || wallet}
              onChange={(e) => setEditLog({ ...editLog, wallet: e.target.value, payment_method: e.target.value })}
              className="w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
            >
              {wallets.map((w) => <option key={w}>{w}</option>)}
            </select>
            <TextArea
              value={editLog.memo || ""}
              onChange={(e) => setEditLog({ ...editLog, memo: e.target.value })}
            />
            <button onClick={saveEditedLog} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">
              保存する
            </button>
          </div>
        </Modal>
      )}
      {editAccount && (
        <Modal title="コーナー変更" onClose={() => setEditAccount(null)}>
          <div className="space-y-3">
            <Field
              value={editAccount.name}
              onChange={(e) =>
                setEditAccount({ ...editAccount, name: e.target.value })
              }
            />
            <select
              value={editAccount.kind}
              onChange={(e) =>
                setEditAccount({ ...editAccount, kind: e.target.value })
              }
              className="w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
            >
              {accountKinds.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
            <Field
              type="number"
              value={editAccount.balance}
              onChange={(e) =>
                setEditAccount({
                  ...editAccount,
                  balance: Number(e.target.value),
                })
              }
            />
            <Field
              placeholder="メモ"
              value={editAccount.note || ""}
              onChange={(e) =>
                setEditAccount({ ...editAccount, note: e.target.value })
              }
            />
            <button
              onClick={saveAccount}
              className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black"
            >
              保存
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

type ShoppingItem = {
  id: string;
  name: string;
  category: string;
  checked: boolean;
  memo: string;
  created_at: string;
};
function ShoppingPanel() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("食料品");
  const [memo, setMemo] = useState("");
  const [filter, setFilter] = useState("すべて");
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem("lifeShoppingItems") || "[]"));
    } catch {
      setItems([]);
    }
  }, []);
  function save(next: ShoppingItem[]) {
    setItems(next);
    localStorage.setItem("lifeShoppingItems", JSON.stringify(next));
  }
  function add() {
    const clean = name.trim();
    if (!clean) return;
    const inferred = /薬|包帯|湿布|サプリ/.test(clean)
      ? "医薬品"
      : /充電|電池|ケーブル|家電/.test(clean)
        ? "家電"
        : /服|ズボン|靴下|衣類/.test(clean)
          ? "衣類"
          : category;
    save([
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: clean,
        category: inferred,
        checked: false,
        memo,
        created_at: new Date().toISOString(),
      },
      ...items,
    ]);
    setName("");
    setMemo("");
  }
  const cats = [
    "すべて",
    ...Array.from(
      new Set([
        "食料品",
        "日用品",
        "衣類",
        "家電",
        "医薬品",
        "趣味",
        "その他",
        ...items.map((i) => i.category),
      ]),
    ),
  ];
  const shown =
    filter === "すべて" ? items : items.filter((i) => i.category === filter);
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">買い物リスト</h2>
        <p className="mt-2 text-sm text-white/60">
          買うものをカテゴリ別に管理。今はローカル保存なので、DBを増やさず軽く動く形にしたよ。
        </p>
      </GlassCard>
      <GlassCard>
        <div className="grid gap-3 sm:grid-cols-[1fr_150px_1fr_120px]">
          <Field
            placeholder="買うもの"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
          >
            <option>食料品</option>
            <option>日用品</option>
            <option>衣類</option>
            <option>家電</option>
            <option>医薬品</option>
            <option>趣味</option>
            <option>その他</option>
          </select>
          <Field
            placeholder="メモ 任意"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <PrimaryButton onClick={add}>追加</PrimaryButton>
        </div>
      </GlassCard>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${filter === c ? "bg-white text-black" : "bg-white/10"}`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((item) => (
          <GlassCard key={item.id}>
            <div className="flex items-start gap-3">
              <button
                onClick={() =>
                  save(
                    items.map((x) =>
                      x.id === item.id ? { ...x, checked: !x.checked } : x,
                    ),
                  )
                }
                className={`mt-1 flex h-9 w-9 items-center justify-center rounded-xl border font-black ${item.checked ? "bg-emerald-300 text-black" : "bg-black/20 text-white/40"}`}
              >
                {item.checked ? "✓" : ""}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={`font-black ${item.checked ? "text-white/35 line-through" : ""}`}
                >
                  {item.name}
                </p>
                <p className="mt-1 text-xs text-white/45">{item.category}</p>
                {item.memo && (
                  <p className="mt-2 text-sm text-white/65">{item.memo}</p>
                )}
              </div>
              <button
                onClick={() => save(items.filter((x) => x.id !== item.id))}
                className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-black"
              >
                削除
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function BelongingsPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [itemImageFile, setItemImageFile] = useState<
    Record<string, File | null>
  >({});
  const [belongingAiText, setBelongingAiText] = useState("");
  const [belongingAiLoading, setBelongingAiLoading] = useState(false);
  const [autoClassify, setAutoClassify] = useState(true);
  const [localItems, setLocalItems] = useState<BelongingItem[]>([]);
  const [pendingItemIds, setPendingItemIds] = useState<Record<string, boolean>>({});
  const cards = snapshot?.belongingCards || [];
  const snapshotItems = snapshot?.belongingItems || [];

  useEffect(() => {
    setLocalItems(snapshotItems);
  }, [snapshotItems]);

  const items = localItems.length || snapshotItems.length ? localItems : snapshotItems;

  const itemsByCard = useMemo(() => {
    const grouped: Record<string, BelongingItem[]> = {};
    for (const item of items) {
      const key = item.card_id;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }
    return grouped;
  }, [items]);

  const scheduleBackgroundRefresh = useCallback((label = "持ち物を同期中...") => {
    window.setTimeout(() => {
      void refreshSnapshot(label);
    }, 120);
  }, [refreshSnapshot]);

  async function addCard() {
    if (!title.trim()) return alert("カード名を入れてね");
    const nextTitle = title.trim();
    const { error } = await supabase
      .from("belonging_cards")
      .insert({ title: nextTitle, note: note || null });
    if (error)
      return alert(
        "持ち物カード作成失敗: " +
          error.message +
          "\n統合SQLを実行しているか確認してね。",
      );
    setTitle("");
    setNote("");
    setGuideDraft(
      `持ち物カード「${nextTitle}」を作ったよ。忘れ物チェックに使えるね。`,
    );
    await refreshSnapshot();
  }

  async function deleteCard(card: BelongingCard) {
    if (
      !confirm(
        `「${card.title}」カードを削除していい？中の持ち物も一緒に消えるよ。`,
      )
    )
      return;
    const { error } = await supabase
      .from("belonging_cards")
      .delete()
      .eq("id", card.id);
    if (error) return alert("カード削除失敗: " + error.message);
    setLocalItems((cur) => cur.filter((item) => item.card_id !== card.id));
    await refreshSnapshot();
  }

  async function addItem(cardId: string) {
    const name = (newItem[cardId] || "").trim();
    if (!name) return;
    const tempId = `local-${cardId}-${Date.now()}`;
    const optimisticItem: BelongingItem = {
      id: tempId,
      card_id: cardId,
      name,
      checked: false,
      image_url: null,
      created_at: new Date().toISOString(),
    };
    setLocalItems((cur) => [optimisticItem, ...cur]);
    setNewItem((cur) => ({ ...cur, [cardId]: "" }));
    const file = itemImageFile[cardId] || null;
    setItemImageFile((cur) => ({ ...cur, [cardId]: null }));
    setPendingItemIds((cur) => ({ ...cur, [tempId]: true }));

    const imageUrl = await imageFileToDataUrl(file);
    if (imageUrl) {
      setLocalItems((cur) =>
        cur.map((item) => (item.id === tempId ? { ...item, image_url: imageUrl } : item)),
      );
    }

    const payload = { card_id: cardId, name, checked: false, image_url: imageUrl };
    const result = await supabase
      .from("belonging_items")
      .insert(payload)
      .select("*")
      .single();

    if (result.error) {
      if (hasImageColumnError(result.error)) {
        const fallback = await supabase
          .from("belonging_items")
          .insert({ card_id: cardId, name, checked: false })
          .select("*")
          .single();
        if (fallback.error) {
          setLocalItems((cur) => cur.filter((item) => item.id !== tempId));
          setPendingItemIds((cur) => {
            const next = { ...cur };
            delete next[tempId];
            return next;
          });
          return alert("持ち物追加失敗: " + fallback.error.message);
        }
        setLocalItems((cur) =>
          cur.map((item) => (item.id === tempId ? ((fallback.data as BelongingItem) || { ...item, id: tempId }) : item)),
        );
      } else {
        setLocalItems((cur) => cur.filter((item) => item.id !== tempId));
        setPendingItemIds((cur) => {
          const next = { ...cur };
          delete next[tempId];
          return next;
        });
        return alert("持ち物追加失敗: " + result.error.message);
      }
    } else {
      setLocalItems((cur) =>
        cur.map((item) => (item.id === tempId ? ((result.data as BelongingItem) || item) : item)),
      );
    }

    setPendingItemIds((cur) => {
      const next = { ...cur };
      delete next[tempId];
      return next;
    });
    scheduleBackgroundRefresh();
  }

  async function toggleItem(item: BelongingItem) {
    if (pendingItemIds[item.id]) return;
    const nextChecked = !item.checked;
    setPendingItemIds((cur) => ({ ...cur, [item.id]: true }));
    setLocalItems((cur) =>
      cur.map((current) =>
        current.id === item.id ? { ...current, checked: nextChecked } : current,
      ),
    );

    const { error } = await supabase
      .from("belonging_items")
      .update({ checked: nextChecked })
      .eq("id", item.id);

    if (error) {
      setLocalItems((cur) =>
        cur.map((current) =>
          current.id === item.id ? { ...current, checked: item.checked } : current,
        ),
      );
      alert("チェック更新失敗: " + error.message);
    } else {
      scheduleBackgroundRefresh("持ち物チェックを同期中...");
    }

    setPendingItemIds((cur) => {
      const next = { ...cur };
      delete next[item.id];
      return next;
    });
  }

  async function deleteItem(id: string) {
    const previous = items;
    setLocalItems((cur) => cur.filter((item) => item.id !== id));
    setPendingItemIds((cur) => ({ ...cur, [id]: true }));
    const { error } = await supabase
      .from("belonging_items")
      .delete()
      .eq("id", id);
    if (error) {
      setLocalItems(previous);
      alert("持ち物削除失敗: " + error.message);
    } else {
      scheduleBackgroundRefresh("持ち物削除を同期中...");
    }
    setPendingItemIds((cur) => {
      const next = { ...cur };
      delete next[id];
      return next;
    });
  }

  function classifyBelonging(name: string) {
    if (/服|ズボン|シャツ|靴下|下着|上着|帽子|衣類/.test(name)) return "衣類";
    if (
      /充電|ケーブル|スマホ|イヤホン|電池|PC|パソコン|家電|モバイルバッテリー/.test(
        name,
      )
    )
      return "家電";
    if (/薬|包帯|湿布|絆創膏|サプリ|医薬|マスク/.test(name)) return "医薬品";
    if (/財布|鍵|カード|現金|身分証/.test(name)) return "貴重品";
    if (/タオル|歯ブラシ|シャンプー|洗面|化粧|日用品/.test(name))
      return "日用品";
    return "その他";
  }

  async function belongingsAi() {
    const source = cards
      .map((card) => {
        const cardItems = itemsByCard[card.id] || [];
        const cardText = cardItems
          .map((it) => `${it.checked ? "済" : "未"}:${it.name}`)
          .join(" / ");
        return `${card.title}: ${card.note || ""} ${cardText}`;
      })
      .join("\n");
    if (!source.trim())
      return setBelongingAiText("分析できる持ち物リストがまだないよ。");
    setBelongingAiLoading(true);
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "belongingsAI", text: source }),
      });
      const json = await res.json();
      setBelongingAiText(
        json.result || "持ち物リストを整理できなかったみたい。",
      );
    } catch {
      setBelongingAiText(
        "持ち物AIに失敗したよ。APIキーや通信状態を確認してね。",
      );
    } finally {
      setBelongingAiLoading(false);
    }
  }

  return (
    <div className="belongings-fast-page space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">持ち物</h2>
        <p className="mt-2 text-sm text-white/60">
          チェック操作は先に画面へ反映して、保存は裏側で同期する方式にしたよ。タップ後の待ち時間をかなり減らす設計だよ。
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={belongingsAi}
            disabled={belongingAiLoading}
            className="rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50"
          >
            持ち物をAI整理
          </button>
          <button
            onClick={() => setAutoClassify(!autoClassify)}
            className={`rounded-2xl px-4 py-3 font-black ${autoClassify ? "bg-emerald-300 text-black" : "bg-white/10"}`}
          >
            カード内AI分類 {autoClassify ? "ON" : "OFF"}
          </button>
        </div>
        {belongingAiText && (
          <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-black/25 p-4 text-sm leading-7 text-white/75">
            {belongingAiText}
          </p>
        )}
      </GlassCard>
      <GlassCard>
        <h3 className="text-xl font-black">＋ 持ち物カードを作る</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_160px]">
          <Field
            placeholder="例: ジムの持ち物"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Field
            placeholder="メモ 任意"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <PrimaryButton onClick={addCard}>作成</PrimaryButton>
        </div>
      </GlassCard>
      {!cards.length && (
        <Empty text="まだ持ち物カードがないよ。ジム用・会社用・サウナ用などを作るとここに表示されるよ。" />
      )}
      <div className="belongings-fast-grid grid gap-4 lg:grid-cols-2">
        {cards.map((card) => {
          const cardItems = itemsByCard[card.id] || [];
          const done = cardItems.filter((it) => it.checked).length;
          return (
            <GlassCard
              key={card.id}
              className="belongings-fast-card bg-gradient-to-br from-white/[0.09] to-black/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-2xl font-black">{card.title}</h3>
                  {card.note && (
                    <p className="mt-1 text-sm text-white/55">{card.note}</p>
                  )}
                  <p className="mt-2 text-xs text-white/45">
                    {done}/{cardItems.length} チェック済み
                  </p>
                </div>
                <button
                  onClick={() => deleteCard(card)}
                  className="shrink-0 rounded-2xl bg-red-500 px-3 py-2 text-xs font-black"
                >
                  カード削除
                </button>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_160px_100px]">
                <Field
                  placeholder="例: 財布 / イヤフォン / タオル"
                  value={newItem[card.id] || ""}
                  onChange={(e) =>
                    setNewItem((cur) => ({ ...cur, [card.id]: e.target.value }))
                  }
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setItemImageFile((cur) => ({
                      ...cur,
                      [card.id]: e.target.files?.[0] || null,
                    }))
                  }
                  className="rounded-2xl border border-white/15 bg-white/10 p-3 text-xs text-white/70"
                />
                <button
                  onClick={() => addItem(card.id)}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black"
                >
                  追加
                </button>
              </div>
              <div className="mt-4 space-y-2">
                {cardItems.map((item) => {
                  const pending = Boolean(pendingItemIds[item.id]);
                  return (
                    <div
                      key={item.id}
                      className={`belongings-fast-item flex items-center gap-3 rounded-2xl bg-black/25 p-3 ${pending ? "opacity-80" : ""}`}
                    >
                      <button
                        onClick={() => toggleItem(item)}
                        disabled={pending}
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg font-black transition active:scale-95 disabled:cursor-wait ${item.checked ? "border-emerald-200 bg-emerald-300 text-black" : "border-white/25 bg-white/10 text-white/50"}`}
                        aria-label={item.checked ? "チェックを外す" : "チェックする"}
                      >
                        {pending ? "…" : item.checked ? "✓" : ""}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate ${item.checked ? "text-white/40 line-through" : "font-bold"}`}
                        >
                          {item.name}
                        </p>
                        {autoClassify && (
                          <p className="mt-1 text-[11px] font-black text-sky-100/45">
                            {classifyBelonging(item.name)}
                          </p>
                        )}
                        <ImagePreview src={item.image_url} />
                      </div>
                      <button
                        onClick={() => deleteItem(item.id)}
                        disabled={pending}
                        className="shrink-0 rounded-xl bg-red-500 px-3 py-2 text-xs font-bold disabled:opacity-50"
                      >
                        削除
                      </button>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}


function RoutinesPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [routineMode, setRoutineMode] = useState<"morning" | "night">("morning");
  const [template, setTemplate] = useState("平日朝ルーティン");
  const [conditionMood, setConditionMood] = useState("Good");
  const [conditionNote, setConditionNote] = useState("");
  const [undoCheck, setUndoCheck] = useState<RoutineCheck | null>(null);
  const undoTimer = useRef<number | null>(null);
  const [localRoutineChecks, setLocalRoutineChecks] = useState<RoutineCheck[]>([]);
  const [routineActions, setRoutineActions] = useState<RoutineActionLog[]>(() => readRoutineActionLogs());
  const [conditionLogs, setConditionLogs] = useState<RoutineConditionLog[]>(() => readRoutineConditionLogs());
  const routines = snapshot?.routines || [];
  const checks = useMemo(() => {
    const base = snapshot?.routineChecks || [];
    const seen = new Set(base.map((c) => c.id));
    return [...localRoutineChecks.filter((c) => !seen.has(c.id)), ...base];
  }, [snapshot?.routineChecks, localRoutineChecks]);

  useEffect(() => {
    if (snapshot?.routineChecks?.length)
      setLocalRoutineChecks((current) =>
        current.filter(
          (c) =>
            !snapshot.routineChecks.some(
              (real) =>
                real.routine_id === c.routine_id &&
                real.check_date === c.check_date,
            ),
        ),
      );
  }, [snapshot?.routineChecks]);

  const morningRoutines = useMemo(
    () => routines.filter((r) => classifyRoutineSlot(r) === "morning"),
    [routines],
  );
  const nightRoutines = useMemo(
    () => routines.filter((r) => classifyRoutineSlot(r) === "night"),
    [routines],
  );
  const activeRoutines = routineMode === "morning" ? morningRoutines : nightRoutines;
  const today = todayKey();
  const todayActions = routineActions.filter((a) => a.date === today);
  const activeDone = activeRoutines.filter((r) => checks.some((c) => c.routine_id === r.id && c.check_date === today)).length;
  const activeCompletion = activeRoutines.length ? Math.round((activeDone / activeRoutines.length) * 100) : 0;
  const activeMinutes = activeRoutines.length * (routineMode === "morning" ? 4 : 5);
  const streakDays = calcRoutineGroupStreak(activeRoutines, checks);

  function saveActions(next: RoutineActionLog[]) {
    setRoutineActions(next);
    writeRoutineActionLogs(next);
  }

  function saveConditions(next: RoutineConditionLog[]) {
    setConditionLogs(next);
    writeRoutineConditionLogs(next);
  }

  async function add() {
    if (!title.trim()) return;
    const defaultTime = routineMode === "morning" ? "07:00" : "21:30";
    const prefix = routineMode === "morning" ? "朝: " : "夜: ";
    const { error } = await supabase
      .from("routines")
      .insert({
        title: title.startsWith("朝:") || title.startsWith("夜:") ? title : `${prefix}${title}`,
        routine_time: time || defaultTime,
        note: note || null,
        active: true,
      });
    if (error) return alert("Routine追加失敗: " + error.message);
    setTitle("");
    setNote("");
    setGuideDraft(
      `Routine「${title}」を追加したよ。朝/夜で迷わず動けるようにしていこう。`,
    );
    await refreshSnapshot();
  }

  async function addTemplate() {
    const items = routineTemplateItems(template);
    if (!items.length) return;
    const mode = template.includes("夜") || template.includes("ナイト") ? "night" : "morning";
    const rows = items.map((name, index) => ({
      title: `${mode === "morning" ? "朝" : "夜"}: ${name}`,
      routine_time: mode === "morning" ? `07:${String(index * 4).padStart(2, "0")}` : `21:${String(index * 5).padStart(2, "0")}`,
      note: `${template}から追加`,
      active: true,
    }));
    const { error } = await supabase.from("routines").insert(rows);
    if (error) return alert("テンプレート追加失敗: " + error.message);
    setRoutineMode(mode);
    setGuideDraft(`${template}をRoutineに追加したよ。必要なものだけ残して育てられるよ。`);
    await refreshSnapshot();
  }

  async function check(r: Routine) {
    const exists = checks.some(
      (c) => c.routine_id === r.id && c.check_date === todayKey(),
    );
    if (exists) {
      setGuideDraft(
        `今日は「${r.title}」チェック済みだよ。間違えて押した時は下の取り消しボタンを使えるよ。`,
      );
      return;
    }
    const optimistic: RoutineCheck = {
      id: `local-${r.id}-${Date.now()}`,
      routine_id: r.id,
      check_date: todayKey(),
      created_at: new Date().toISOString(),
    };
    setLocalRoutineChecks((current) => [optimistic, ...current]);
    setUndoCheck(optimistic);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndoCheck(null), 9000);
    setGuideDraft(
      `「${cleanRoutineTitle(r.title)}」を今日の達成にしたよ。画面には先に反映して、保存は裏側で同期するね。`,
    );
    const { data, error } = await supabase
      .from("routine_checks")
      .insert({ routine_id: r.id, check_date: todayKey() })
      .select("*")
      .single();
    if (error) {
      setLocalRoutineChecks((current) =>
        current.filter((c) => c.id !== optimistic.id),
      );
      setUndoCheck(null);
      return alert("チェック失敗: " + error.message);
    }
    if (data) setUndoCheck(data as RoutineCheck);
    window.setTimeout(() => void refreshSnapshot("Routineチェック同期中..."), 140);
  }

  function logRoutineAction(r: Routine, action: RoutineActionLog["action"]) {
    const next = [
      {
        id: `routine-action-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        routine_id: r.id,
        title: cleanRoutineTitle(r.title),
        action,
        date: todayKey(),
        created_at: new Date().toISOString(),
      },
      ...routineActions,
    ].slice(0, 300);
    saveActions(next);
    const label = action === "skip" ? "スキップ" : action === "tomorrow" ? "明日に回す" : "メモ追加";
    setGuideDraft(`「${cleanRoutineTitle(r.title)}」を${label}で記録したよ。完璧じゃなくても流れは残せるよ。`);
  }

  function addRoutineMemo(r: Routine) {
    const memo = prompt(`「${cleanRoutineTitle(r.title)}」のメモを追加`);
    if (!memo?.trim()) return;
    const next = [
      {
        id: `routine-action-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        routine_id: r.id,
        title: cleanRoutineTitle(r.title),
        action: "memo" as const,
        memo: memo.trim(),
        date: todayKey(),
        created_at: new Date().toISOString(),
      },
      ...routineActions,
    ].slice(0, 300);
    saveActions(next);
    setGuideDraft("Routineメモを残したよ。状態の揺れも記録できてる。");
  }

  function saveCondition() {
    const next = [
      {
        id: `routine-condition-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        mode: routineMode,
        date: todayKey(),
        mood: conditionMood,
        completion: activeCompletion,
        note: conditionNote.trim(),
        created_at: new Date().toISOString(),
      },
      ...conditionLogs,
    ].slice(0, 180);
    saveConditions(next);
    setConditionNote("");
    setGuideDraft(`${routineMode === "morning" ? "朝" : "夜"}Routineの状態を保存したよ。明日の自分が少し楽になるね。`);
  }

  async function undoLastCheck() {
    if (!undoCheck) return;
    if (undoCheck.id.startsWith("local-")) {
      setLocalRoutineChecks((current) =>
        current.filter((c) => c.id !== undoCheck.id),
      );
    } else {
      const { error } = await supabase
        .from("routine_checks")
        .delete()
        .eq("id", undoCheck.id);
      if (error) return alert("取り消し失敗: " + error.message);
    }
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    setUndoCheck(null);
    setGuideDraft(
      "直前のRoutineチェックを取り消したよ。誤タップでも戻せるから大丈夫。",
    );
    void refreshSnapshot("Routineチェック同期中...");
  }

  async function del(id: string) {
    if (!confirm("このRoutineを削除していい？")) return;
    const { error } = await supabase.from("routines").delete().eq("id", id);
    if (error) return alert(error.message);
    await refreshSnapshot();
  }

  const modeLabel = routineMode === "morning" ? "Morning Routine" : "Night Routine";
  const modeSub =
    routineMode === "morning"
      ? "朝に迷わず1日を始めるための起動リスト。"
      : "反省よりも、明日の自分を軽くするための終了リスト。";

  return (
    <div className="routine-command-page space-y-4">
      <GlassCard className="future-routine-hero">
        <div className="grid gap-5 lg:grid-cols-[1fr_420px] lg:items-end">
          <div>
            <p className="text-xs font-black tracking-[0.34em] text-sky-100/65">LIFE COMMAND OS / ROUTINE</p>
            <h2 className="mt-3 text-4xl font-black sm:text-5xl">Routine / ルーティン</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/66">
              MorningとNightを分けて、毎日の開始と終了を迷わず進めるページ。完璧にやる前提ではなく、最低限版やスキップも記録できるようにしたよ。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="future-routine-stat">
              <span>完了率</span>
              <b>{activeCompletion}%</b>
            </div>
            <div className="future-routine-stat">
              <span>連続</span>
              <b>{streakDays}日</b>
            </div>
            <div className="future-routine-stat">
              <span>所要目安</span>
              <b>{activeMinutes}分</b>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setRoutineMode("morning")}
          className={`rounded-3xl border px-5 py-4 text-left transition ${routineMode === "morning" ? "border-sky-200/35 bg-sky-300/15" : "border-white/10 bg-white/[0.05]"}`}
        >
          <p className="text-xl font-black">🌅 Morning Routine</p>
          <p className="mt-1 text-sm text-white/58">朝の起動率を上げる</p>
        </button>
        <button
          onClick={() => setRoutineMode("night")}
          className={`rounded-3xl border px-5 py-4 text-left transition ${routineMode === "night" ? "border-indigo-200/35 bg-indigo-300/15" : "border-white/10 bg-white/[0.05]"}`}
        >
          <p className="text-xl font-black">🌙 Night Routine</p>
          <p className="mt-1 text-sm text-white/58">明日の自分を軽くする</p>
        </button>
      </div>

      <GlassCard>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-2xl font-black">{modeLabel}</h3>
            <p className="mt-1 text-sm text-white/58">{modeSub}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_160px]">
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="rounded-2xl border border-white/15 bg-slate-950/90 px-4 py-3 text-sm font-black text-white"
            >
              {["平日朝ルーティン", "休日朝ルーティン", "仕事前ルーティン", "疲れている日の短縮版", "ナイトルーティン通常版", "ナイトルーティン最低限版"].map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <button onClick={addTemplate} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black">
              テンプレ追加
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-3 sm:grid-cols-[1fr_160px]">
        <Field
          placeholder={routineMode === "morning" ? "例: 水を飲む / 今日の予定確認" : "例: 明日の持ち物準備 / 家計簿をつける"}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TimeField value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <TextArea
        placeholder="メモ 任意。最低限版・疲れている日の扱いなども書けるよ。"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <PrimaryButton onClick={add}>Routineを追加</PrimaryButton>

      {undoCheck && (
        <div className="sticky top-3 z-40 rounded-3xl border border-amber-200/30 bg-amber-400/20 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-black text-amber-100">直前のRoutineチェックを記録したよ</p>
              <p className="text-sm text-white/65">間違えて押した場合は取り消せるよ。</p>
            </div>
            <button onClick={undoLastCheck} className="rounded-2xl bg-amber-300 px-4 py-3 font-black text-black">
              取り消す
            </button>
          </div>
        </div>
      )}

      {!activeRoutines.length && (
        <Empty text={`${modeLabel} はまだ空だよ。テンプレ追加か、1つだけ手入力して始められるよ。`} />
      )}

      <div className="routine-card-grid grid gap-3 lg:grid-cols-2">
        {activeRoutines.map((r) => {
          const stats = calcRoutineStats(r.id, checks);
          const action = todayActions.find((a) => a.routine_id === r.id);
          return (
            <GlassCard key={r.id} className="future-routine-card relative overflow-hidden">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black text-sky-100/50">{classifyRoutineSlot(r) === "morning" ? "MORNING" : "NIGHT"}</p>
                  <h3 className="mt-1 truncate pr-2 text-xl font-black">{cleanRoutineTitle(r.title)}</h3>
                  <p className="mt-1 text-sm text-white/55">{r.routine_time ? `${r.routine_time}ごろ` : "時間なし"}</p>
                </div>
                <div className={`rounded-2xl px-4 py-2 text-center font-black text-black ${stats.doneToday ? "bg-emerald-300" : "bg-sky-200"}`}>
                  <p className="text-[10px] leading-none opacity-70">連続</p>
                  <p className="mt-1 text-2xl leading-none">{stats.currentStreak}日</p>
                </div>
              </div>

              {r.note && <p className="mt-3 whitespace-pre-wrap text-sm text-white/65">{r.note}</p>}

              <div className="mt-4 grid grid-cols-7 gap-1">
                {stats.recent7.map((day) => (
                  <div key={day.date} className={`rounded-xl py-2 text-center text-xs font-black ${day.done ? "bg-emerald-300 text-black" : "bg-white/10 text-white/35"}`}>
                    {Number(day.date.slice(8, 10))}
                  </div>
                ))}
              </div>

              {action && (
                <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white/62">
                  今日の扱い: {action.action === "skip" ? "スキップ" : action.action === "tomorrow" ? "明日に回す" : `メモ ${action.memo || ""}`}
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button onClick={() => check(r)} className={`rounded-2xl px-4 py-3 text-sm font-black ${stats.doneToday ? "bg-emerald-400 text-black" : "bg-white text-black"}`}>
                  {stats.doneToday ? "完了済み" : "完了"}
                </button>
                <button onClick={() => logRoutineAction(r, "skip")} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">
                  スキップ
                </button>
                <button onClick={() => logRoutineAction(r, "tomorrow")} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">
                  明日へ
                </button>
                <button onClick={() => addRoutineMemo(r)} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">
                  メモ
                </button>
              </div>
              <button onClick={() => del(r.id)} className="mt-2 w-full rounded-2xl bg-red-500/80 px-4 py-3 text-sm font-black">
                削除
              </button>
            </GlassCard>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_.9fr]">
        <GlassCard>
          <h3 className="text-xl font-black">コンディション記録</h3>
          <p className="mt-1 text-sm text-white/55">Routine完了後に軽く状態を残せるよ。</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]">
            <select
              value={conditionMood}
              onChange={(e) => setConditionMood(e.target.value)}
              className="rounded-2xl border border-white/15 bg-slate-950/90 px-4 py-3 text-sm font-black text-white"
            >
              {["Good", "眠気あり", "疲労感あり", "不安少し", "集中できた", "最低限でOK"].map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <Field
              placeholder="今日の一言"
              value={conditionNote}
              onChange={(e) => setConditionNote(e.target.value)}
            />
          </div>
          <button onClick={saveCondition} className="mt-3 w-full rounded-2xl bg-sky-200 px-4 py-3 font-black text-black">
            状態を保存
          </button>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-black">Routine達成ログ</h3>
          <div className="mt-4 space-y-2">
            {conditionLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="rounded-2xl bg-black/25 p-3">
                <p className="text-sm font-black">{log.date} / {log.mode === "morning" ? "朝" : "夜"} / {log.completion}%</p>
                <p className="mt-1 text-xs text-white/55">{log.mood} {log.note}</p>
              </div>
            ))}
            {!conditionLogs.length && <p className="text-sm text-white/55">まだ状態ログはないよ。</p>}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}


type RoutineActionLog = {
  id: string;
  routine_id: string;
  title: string;
  action: "skip" | "tomorrow" | "memo";
  date: string;
  memo?: string;
  created_at: string;
};

type RoutineConditionLog = {
  id: string;
  mode: "morning" | "night";
  date: string;
  mood: string;
  completion: number;
  note: string;
  created_at: string;
};

function readRoutineActionLogs(): RoutineActionLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("lifeRoutineActionLogs") || "[]") as RoutineActionLog[];
  } catch {
    return [];
  }
}

function writeRoutineActionLogs(items: RoutineActionLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lifeRoutineActionLogs", JSON.stringify(items.slice(0, 300)));
}

function readRoutineConditionLogs(): RoutineConditionLog[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("lifeRoutineConditionLogs") || "[]") as RoutineConditionLog[];
  } catch {
    return [];
  }
}

function writeRoutineConditionLogs(items: RoutineConditionLog[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lifeRoutineConditionLogs", JSON.stringify(items.slice(0, 180)));
}

function cleanRoutineTitle(title: string) {
  return String(title || "").replace(/^(朝|夜)\s*[:：]\s*/, "").trim();
}

function classifyRoutineSlot(r: Routine): "morning" | "night" {
  const text = `${r.title || ""} ${r.note || ""}`;
  if (/夜|ナイト|寝る|風呂|明日|スマホを置く|就寝/.test(text)) return "night";
  if (/朝|モーニング|起床|水を飲む|顔を洗う|朝食|外出準備/.test(text)) return "morning";
  const hour = Number(String(r.routine_time || "").slice(0, 2));
  if (Number.isFinite(hour) && hour >= 18) return "night";
  return "morning";
}

function routineTemplateItems(name: string) {
  const map: Record<string, string[]> = {
    "平日朝ルーティン": ["起床", "水を飲む", "顔を洗う", "歯磨き", "朝食", "今日の予定確認", "Mind Captureで整理", "外出準備"],
    "休日朝ルーティン": ["起床", "水を飲む", "部屋を少し整える", "朝食", "今日やりたいことを1つ決める", "Mind Captureで整理"],
    "仕事前ルーティン": ["持ち物確認", "今日の予定確認", "最重要タスクを1つ決める", "外出準備"],
    "疲れている日の短縮版": ["水を飲む", "歯磨き", "服を整える", "今日の最低限を1つ決める"],
    "ナイトルーティン通常版": ["風呂", "歯磨き", "明日の予定確認", "明日の服/持ち物準備", "家計簿をつける", "今日のメモ整理", "Mind Captureで頭を空にする", "スマホを置く"],
    "ナイトルーティン最低限版": ["歯磨き", "明日の予定確認", "持ち物だけ準備", "スマホを置く"],
  };
  return map[name] || [];
}

function calcRoutineGroupStreak(routines: Routine[], checks: RoutineCheck[]) {
  if (!routines.length) return 0;
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    const date = dateMinus(todayKey(), i);
    const doneCount = routines.filter((r) => checks.some((c) => c.routine_id === r.id && c.check_date === date)).length;
    if (doneCount > 0) streak += 1;
    else break;
  }
  return streak;
}


function TrashPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [trashType, setTrashType] = useState("");
  const [weekday, setWeekday] = useState<number>(1);
  const [notifyTime, setNotifyTime] = useState("");
  const [note, setNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<TrashRule | null>(null);
  const rules = snapshot?.trash || [];

  async function addRule() {
    if (!trashType.trim()) return;
    const { error } = await supabase.from("trash_rules").insert({
      trash_type: trashType.trim(),
      weekday,
      notify_time: notifyTime || null,
      note: note || null,
      active: true,
    });
    if (error) return alert("ゴミの日を追加できませんでした: " + error.message);
    setTrashType("");
    setNotifyTime("");
    setNote("");
    setGuideDraft(
      "ゴミの日を追加したよ。忘れやすい予定は、見える場所に置くだけでもかなり楽になるよ。",
    );
    await refreshSnapshot("手動同期中...");
  }

  async function toggleRule(rule: TrashRule) {
    const { error } = await supabase
      .from("trash_rules")
      .update({ active: !rule.active })
      .eq("id", rule.id);
    if (error) return alert("更新できませんでした: " + error.message);
    await refreshSnapshot("手動同期中...");
  }

  async function deleteRule() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("trash_rules")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) return alert("削除できませんでした: " + error.message);
    setDeleteTarget(null);
    await refreshSnapshot("手動同期中...");
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">ゴミの日</h2>
        <p className="mt-2 text-sm text-white/60">
          曜日・時刻を登録して、捨て忘れを減らすページ。
        </p>
      </GlassCard>
      <div className="grid gap-3 lg:grid-cols-[1fr_150px_170px]">
        <Field
          placeholder="燃えるゴミ / 資源ゴミ / ダンボール..."
          value={trashType}
          onChange={(e) => setTrashType(e.target.value)}
        />
        <select
          value={weekday}
          onChange={(e) => setWeekday(Number(e.target.value))}
          className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white [color-scheme:dark]"
        >
          {[0, 1, 2, 3, 4, 5, 6].map((d) => (
            <option key={d} value={d}>
              {weekdayLabel(d)}曜日
            </option>
          ))}
        </select>
        <TimeField
          label="通知時刻選択"
          value={notifyTime}
          onChange={(e) => setNotifyTime(e.target.value)}
        />
      </div>
      <TextArea
        className="h-24"
        placeholder="場所・注意点など"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <PrimaryButton onClick={addRule}>ゴミの日を追加</PrimaryButton>
      {!rules.length && <Empty text="まだゴミの日が登録されていないよ。" />}
      <div className="grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => (
          <GlassCard key={rule.id} className={rule.active ? "" : "opacity-55"}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-black">{rule.trash_type}</p>
                <p className="mt-1 text-sm text-white/60">
                  {weekdayLabel(rule.weekday)}曜日
                  {rule.notify_time
                    ? ` / ${String(rule.notify_time).slice(0, 5)}`
                    : ""}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${rule.active ? "bg-emerald-300 text-black" : "bg-white/10 text-white/60"}`}
              >
                {rule.active ? "通知ON" : "OFF"}
              </span>
            </div>
            {rule.note && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-white/65">
                {rule.note}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => toggleRule(rule)}
                className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold"
              >
                {rule.active ? "OFFにする" : "ONにする"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(rule)}
                className="rounded-2xl bg-red-500/80 px-3 py-2 text-sm font-black"
              >
                削除
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4">
          <GlassCard className="w-full max-w-md bg-slate-950">
            <h3 className="text-xl font-black">本当に削除する？</h3>
            <p className="mt-3 text-sm text-white/65">
              {deleteTarget.trash_type} のゴミの日設定を削除するよ。
            </p>
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={deleteRule}
                className="rounded-2xl bg-red-500 px-4 py-3 font-black text-white"
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-2xl bg-white/10 px-4 py-3 font-bold"
              >
                キャンセル
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function MapPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [placeDate, setPlaceDate] = useState(todayKey());
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("思い出");
  const [address, setAddress] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [note, setNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PlaceLog | null>(null);
  const places = snapshot?.places || [];

  async function addPlace() {
    if (!title.trim()) return;
    const { error } = await supabase.from("place_logs").insert({
      place_date: placeDate,
      title: title.trim(),
      category: category || "思い出",
      address: address || null,
      map_url: mapUrl || null,
      note: note || null,
    });
    if (error) return alert("場所を追加できませんでした: " + error.message);
    setTitle("");
    setAddress("");
    setMapUrl("");
    setNote("");
    setGuideDraft(
      "場所の記録を追加したよ。日記や写真と一緒に、思い出の地図が育っていく感じだね。",
    );
    await refreshSnapshot("手動同期中...");
  }

  async function deletePlace() {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from("place_logs")
      .delete()
      .eq("id", deleteTarget.id);
    if (error) return alert("削除できませんでした: " + error.message);
    setDeleteTarget(null);
    await refreshSnapshot("手動同期中...");
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">地図</h2>
        <p className="mt-2 text-sm text-white/60">
          カフェ・サウナ・散歩・思い出の場所を記録するシンプル地図ページ。
        </p>
      </GlassCard>
      <div className="grid gap-3 lg:grid-cols-[150px_1fr_160px]">
        <DateField
          label="日付選択"
          value={placeDate}
          onChange={(e) => setPlaceDate(e.target.value)}
        />
        <Field
          placeholder="場所名"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white [color-scheme:dark]"
        >
          <option>思い出</option>
          <option>カフェ</option>
          <option>サウナ</option>
          <option>ランニング</option>
          <option>買い物</option>
          <option>仕事</option>
          <option>その他</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          placeholder="住所・駅名・検索語"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <div className="rounded-2xl border border-white/15 bg-white/10 p-4 text-sm text-white/65">
          URL入力は廃止。住所・駅名・場所名から地図アプリを直接開くよ。
        </div>
      </div>
      <TextArea
        className="h-24"
        placeholder="その場所のメモ"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <PrimaryButton onClick={addPlace}>場所を追加</PrimaryButton>
      {!places.length && <Empty text="まだ場所の記録がないよ。" />}
      <div className="grid gap-3 sm:grid-cols-2">
        {places.map((place) => (
          <GlassCard key={place.id}>
            <p className="text-xs text-white/45">
              {place.place_date} / {place.category}
            </p>
            <h3 className="mt-1 text-xl font-black">{place.title}</h3>
            {place.address && (
              <p className="mt-2 text-sm text-white/65">{place.address}</p>
            )}
            {place.note && (
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/65">
                {place.note}
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openMap(place.address || place.title)}
                className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-black"
              >
                地図アプリで開く
              </button>
              <button
                type="button"
                onClick={() => openAppleMap(place.address || place.title)}
                className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black"
              >
                Apple Maps
              </button>
              <button
                type="button"
                onClick={() => openGoogleMap(place.address || place.title)}
                className="rounded-2xl bg-sky-400 px-3 py-2 text-sm font-black text-black"
              >
                Google Maps
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(place)}
                className="rounded-2xl bg-red-500/80 px-3 py-2 text-sm font-black text-white"
              >
                削除
              </button>
            </div>
          </GlassCard>
        ))}
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4">
          <GlassCard className="w-full max-w-md bg-slate-950">
            <h3 className="text-xl font-black">本当に削除する？</h3>
            <p className="mt-3 text-sm text-white/65">
              {deleteTarget.title} の場所記録を削除するよ。
            </p>
            <div className="mt-5 grid gap-3">
              <button
                type="button"
                onClick={deletePlace}
                className="rounded-2xl bg-red-500 px-4 py-3 font-black text-white"
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-2xl bg-white/10 px-4 py-3 font-bold"
              >
                キャンセル
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function HeatmapPanel({ snapshot }: { snapshot: Snapshot | null }) {
  const days = Array.from({ length: 30 }, (_, i) =>
    dateMinus(todayKey(), 29 - i),
  );
  const count = (d: string) =>
    (snapshot?.diaries.filter((x) => x.entry_date === d).length || 0) +
    (snapshot?.tweets.filter((x) => x.tweet_date === d).length || 0) +
    (snapshot?.todos.filter((x) => x.due_date === d).length || 0) +
    (snapshot?.coffee.filter((x) => x.drink_date === d).length || 0) +
    (snapshot?.budget.filter((x) => x.spend_date === d).length || 0);
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">人生ヒートマップ</h2>
        <p className="mt-2 text-sm text-white/60">
          直近30日の記録量を色の濃さで表示。
        </p>
      </GlassCard>
      <div className="grid grid-cols-10 gap-2">
        {days.map((d) => {
          const c = count(d);
          return (
            <div
              key={d}
              title={`${d}: ${c}件`}
              className={`aspect-square rounded-xl border border-white/10 ${c > 5 ? "bg-red-400" : c > 3 ? "bg-orange-400" : c > 1 ? "bg-emerald-400" : c > 0 ? "bg-sky-400" : "bg-white/10"}`}
            >
              <span className="sr-only">{d}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SecondBrainSearch({
  snapshot,
  setPage,
}: {
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
}) {
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const all = [
      ...(snapshot?.memos || []).map((x) => ({
        page: "memos" as PageKey,
        type: "メモ",
        date: getCreatedDateKey(x.created_at),
        text: x.content,
      })),
      ...(snapshot?.diaries || []).map((x) => ({
        page: "diary" as PageKey,
        type: "Diary",
        date: x.entry_date,
        text: `${x.title || ""} ${stripHtml(x.content)}`,
      })),
      ...(snapshot?.tweets || []).map((x) => ({
        page: "tweets" as PageKey,
        type: "つぶやき",
        date: x.tweet_date,
        text: x.content,
      })),
      ...(snapshot?.places || []).map((x) => ({
        page: "map" as PageKey,
        type: "地図",
        date: x.place_date,
        text: `${x.title} ${x.address || ""}`,
      })),
    ];
    return q ? all.filter((r) => r.text.includes(q)) : all.slice(0, 30);
  }, [snapshot, q]);
  return (
    <div className="space-y-4">
      <Field
        placeholder="第二の脳検索 例: 江ノ島 / 疲れた / コーヒー"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div className="space-y-3">
        {rows.map((r, i) => (
          <button
            key={i}
            onClick={() => setPage(r.page)}
            className="w-full rounded-3xl border border-white/10 bg-black/25 p-4 text-left"
          >
            <p className="text-xs text-white/45">
              {r.type} / {r.date}
            </p>
            <p className="mt-2 line-clamp-3">{r.text}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
function AutoTagsPanel({ snapshot }: { snapshot: Snapshot | null }) {
  const rows = [
    ...(snapshot?.diaries || []).map((d) => ({
      date: d.entry_date,
      text: `${d.title || ""} ${stripHtml(d.content)}`,
    })),
    ...(snapshot?.tweets || []).map((t) => ({
      date: t.tweet_date,
      text: t.content,
    })),
    ...(snapshot?.memos || []).map((m) => ({
      date: getCreatedDateKey(m.created_at),
      text: m.content,
    })),
  ].slice(0, 60);
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">自動人生タグ</h2>
        <p className="mt-2 text-sm text-white/60">
          Diary・つぶやき・メモの内容からタグを自動推定。
        </p>
      </GlassCard>
      {rows.map((r, i) => (
        <GlassCard key={i}>
          <p className="text-xs text-white/45">{r.date}</p>
          <p className="mt-2 line-clamp-2">{r.text}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {tagWords(r.text).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-3 py-1 text-xs font-black text-black"
              >
                {tag}
              </span>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}
function ChronologyPanel({ snapshot }: { snapshot: Snapshot | null }) {
  const years = useMemo(() => {
    const map = new Map<string, string[]>();
    [
      ...userMilestones(snapshot?.userProfile).map(
        (m) => `${m.date} ユーザー: ${m.label}`,
      ),
      ...(snapshot?.diaries || []).map(
        (d) =>
          `${d.entry_date} Diary: ${d.title || stripHtml(d.content).slice(0, 40)}`,
      ),
      ...(snapshot?.places || []).map(
        (p) => `${p.place_date} 場所: ${p.title}`,
      ),
      ...(snapshot?.tweets || []).map(
        (t) => `${t.tweet_date} つぶやき: ${t.content.slice(0, 40)}`,
      ),
    ].forEach((s) => {
      const y = s.slice(0, 4);
      map.set(y, [...(map.get(y) || []), s]);
    });
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [snapshot]);
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">自分年表</h2>
        <p className="mt-2 text-sm text-white/60">
          ユーザーページの生年月日・入学年もここに反映するよ。
        </p>
      </GlassCard>
      {years.map(([year, items]) => (
        <GlassCard key={year}>
          <h3 className="text-3xl font-black">{year}</h3>
          <div className="mt-3 space-y-2">
            {items.sort().map((it) => (
              <p key={it} className="rounded-2xl bg-black/25 p-3 text-sm">
                {it}
              </p>
            ))}
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function AnniversaryPanel({ snapshot }: { snapshot: Snapshot | null }) {
  const md = todayKey().slice(5);
  const rows = [
    ...(snapshot?.diaries || []).filter((d) => d.entry_date.slice(5) === md),
    ...(snapshot?.tweets || []).filter((t) => t.tweet_date.slice(5) === md),
    ...(snapshot?.places || []).filter((p) => p.place_date.slice(5) === md),
  ];
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">過去の今日</h2>
        <p className="mt-2 text-sm text-white/60">同じ月日の記録を表示。</p>
      </GlassCard>
      {!rows.length && (
        <Empty text="過去の同じ日の記録はまだ見つからないよ。" />
      )}
      {rows.map((r: any) => (
        <GlassCard key={r.id}>
          <p className="text-xs text-white/45">
            {r.entry_date || r.tweet_date || r.place_date}
          </p>
          <p className="mt-2">{r.title || r.content || r.trash_type}</p>
        </GlassCard>
      ))}
    </div>
  );
}
function ConditionPanel({ snapshot }: { snapshot: Snapshot | null }) {
  const today = todayKey();
  const caffeine =
    snapshot?.coffee
      .filter((c) => c.drink_date === today)
      .reduce((s, c) => s + Number(c.caffeine_mg), 0) || 0;
  const undone =
    snapshot?.todos.filter((t) => t.due_date === today && !t.done).length || 0;
  const sleep = snapshot?.sleep.find((s) => s.sleep_date === today);
  const score = Math.max(
    20,
    Math.min(
      95,
      85 -
        Math.floor(caffeine / 80) * 3 -
        undone * 6 +
        (sleep?.quality === "良い" ? 10 : 0),
    ),
  );
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">AIコンディション予測</h2>
        <p className="mt-4 text-6xl font-black">{score}</p>
        <p className="mt-2 text-sm text-white/60">
          カフェイン・TODO・睡眠から簡易予測。今日は
          {score >= 75
            ? "集中しやすそう"
            : score >= 55
              ? "通常運転"
              : "少し回復優先が良さそう"}
          。
        </p>
      </GlassCard>
    </div>
  );
}
function CafeAtlasPanel({
  snapshot,
  setPage,
}: {
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
}) {
  const names = [
    ...new Set((snapshot?.coffee || []).map((c) => c.coffee_name)),
  ];
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">カフェ図鑑</h2>
        <p className="mt-2 text-sm text-white/60">飲んだコーヒー名を図鑑化。</p>
      </GlassCard>
      {!names.length && (
        <Empty text="コーヒーページで記録すると図鑑が育つよ。" />
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {names.map((n) => {
          const logs = (snapshot?.coffee || []).filter(
            (c) => c.coffee_name === n,
          );
          return (
            <button
              key={n}
              onClick={() => setPage("coffee")}
              className="rounded-3xl border border-white/10 bg-black/25 p-4 text-left"
            >
              <div className="text-3xl">☕</div>
              <h3 className="mt-2 text-xl font-black">{n}</h3>
              <p className="mt-1 text-sm text-white/55">
                {logs.length}回 / 合計
                {logs.reduce((s, c) => s + Number(c.cups), 0)}杯
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function GoalsPanel({ snapshot }: { snapshot: Snapshot | null }) {
  const goals = [
    {
      title: "Body Sculptural Beauty",
      target: "2028/08/12",
      value: "体脂肪率10%以下",
    },
    { title: "10km 47分", target: "長期", value: "Wind Hunt強化" },
    { title: "VO2MAX 56", target: "長期", value: "心肺能力" },
    {
      title: "Diary資産",
      target: "継続",
      value: `${snapshot?.diaries.length || 0}件`,
    },
  ];
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">未来目標ボード</h2>
      </GlassCard>
      <div className="grid gap-3 sm:grid-cols-2">
        {goals.map((g) => (
          <GlassCard key={g.title}>
            <h3 className="text-xl font-black">{g.title}</h3>
            <p className="mt-1 text-sm text-white/55">{g.target}</p>
            <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm">
              {g.value}
            </p>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
function IdealsPanel({
  snapshot,
  refreshSnapshot,
}: {
  snapshot: Snapshot | null;
  refreshSnapshot: () => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [edit, setEdit] = useState<IdealItem | null>(null);
  const ideals = snapshot?.ideals || [];
  async function add() {
    if (!title.trim() && !description.trim() && !image)
      return alert("理想像のタイトル・文章・画像のどれかを入れてね");
    const { error } = await supabase
      .from("ideal_items")
      .insert({
        title: title || "理想像",
        description: description || null,
        image_url: image || null,
      });
    if (error)
      return alert(
        "理想ページ保存失敗: " +
          error.message +
          "\n統合SQLを実行しているか確認してね。",
      );
    setTitle("");
    setDescription("");
    setImage("");
    setGuideDraft(
      "理想像を保存したよ。未来の自分の方向が少し見えやすくなったね。",
    );
    await refreshSnapshot();
  }
  async function saveEdit() {
    if (!edit) return;
    const { error } = await supabase
      .from("ideal_items")
      .update({
        title: edit.title,
        description: edit.description,
        image_url: edit.image_url,
      })
      .eq("id", edit.id);
    if (error) return alert("理想像の更新失敗: " + error.message);
    setEdit(null);
    await refreshSnapshot();
  }
  async function del(id: string) {
    if (!confirm("この理想を削除していい？")) return;
    const { error } = await supabase.from("ideal_items").delete().eq("id", id);
    if (error) return alert("削除失敗: " + error.message);
    await refreshSnapshot();
  }
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">理想</h2>
        <p className="mt-2 text-sm text-white/60">
          理想の画像と文章を保存する場所。写真ライブラリから画像を貼れて、あとから変更・削除もできるよ。
        </p>
      </GlassCard>
      <GlassCard>
        <div className="grid gap-3">
          <Field
            placeholder="理想像のタイトル 例: 戦える細マッチョ"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <TextArea
            className="h-32"
            placeholder="理想像を文章で語る。身体・生活・雰囲気・未来の自分など。"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className="block rounded-2xl border border-dashed border-white/25 bg-white/10 p-4 text-sm font-bold text-white/80">
            <span>理想画像を選ぶ（Mac/iPhone写真ライブラリ対応）</span>
            <input
              type="file"
              accept="image/*"
              className="mt-3 block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:font-black file:text-black"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  setImage(await fileToDataUrl(file));
                } catch {
                  alert("画像の読み込みに失敗したよ。別の画像で試してね。");
                }
              }}
            />
          </label>
          {image && (
            <img
              src={image}
              alt="ideal preview"
              className="max-h-80 w-full rounded-3xl object-cover"
            />
          )}
          <PrimaryButton onClick={add}>理想像を保存</PrimaryButton>
        </div>
      </GlassCard>
      {!ideals.length && (
        <Empty text="まだ理想像がないよ。画像や文章を保存するとここに並ぶよ。" />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ideals.map((item) => (
          <GlassCard key={item.id} className="overflow-hidden p-0">
            <div className="p-4">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="h-56 w-full rounded-3xl object-cover"
                />
              ) : (
                <div className="flex h-56 items-center justify-center rounded-3xl bg-white/10 text-5xl">
                  🌌
                </div>
              )}
              <h3 className="mt-4 text-xl font-black">{item.title}</h3>
              {item.description && (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/70">
                  {item.description}
                </p>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEdit(item)}
                  className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold"
                >
                  変更
                </button>
                <button
                  onClick={() => del(item.id)}
                  className="rounded-2xl bg-red-500 px-3 py-2 text-sm font-bold"
                >
                  削除
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
      {edit && (
        <Modal title="理想像を変更" onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <Field
              value={edit.title}
              onChange={(e) => setEdit({ ...edit, title: e.target.value })}
            />
            <TextArea
              className="h-32"
              value={edit.description || ""}
              onChange={(e) =>
                setEdit({ ...edit, description: e.target.value })
              }
            />
            <Field
              placeholder="画像URL / data URL"
              value={edit.image_url || ""}
              onChange={(e) => setEdit({ ...edit, image_url: e.target.value })}
            />
            <label className="block rounded-2xl border border-dashed border-white/25 bg-white/10 p-4 text-sm font-bold text-white/80">
              <span>新しい画像を選ぶ</span>
              <input
                type="file"
                accept="image/*"
                className="mt-3 block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:font-black file:text-black"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    setEdit({ ...edit, image_url: await fileToDataUrl(file) });
                  } catch {
                    alert("画像の読み込みに失敗したよ。");
                  }
                }}
              />
            </label>
            {edit.image_url && (
              <img
                src={edit.image_url}
                alt="edit preview"
                className="max-h-72 w-full rounded-3xl object-cover"
              />
            )}
            <button
              onClick={saveEdit}
              className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black"
            >
              保存
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}


type MindCaptureCategory =
  | "calendar"
  | "todo"
  | "shopping"
  | "diary"
  | "budget"
  | "workout"
  | "routine"
  | "promptvault"

  | "projectlab"
  | "bugcenter"
  | "decisionlog"
  | "futureletter"
  | "timeline"
  | "memo"
  | "inbox";

type MindCaptureConfidence = "確定候補" | "確認が必要" | "保留推奨";

type MindCaptureCandidate = {
  id: string;
  category: MindCaptureCategory;
  content: string;
  save: boolean;
  confidence: MindCaptureConfidence;
  date?: string | null;
  amount?: number | null;
  note?: string | null;
  source?: "ai" | "local" | "manual";
};

type MindCaptureState = {
  labels: string[];
  summary: string;
};

type MindCaptureResult = {
  candidates: MindCaptureCandidate[];
  state: MindCaptureState;
  source: "ai" | "local" | "manual";
};

type MindInboxItem = {
  id: string;
  content: string;
  originalCategory?: MindCaptureCategory;
  created_at: string;
};

const mindCaptureCategoryMeta: Record<
  MindCaptureCategory,
  { label: string; short: string; emoji: string; tone: string }
> = {
  calendar: { label: "カレンダー候補", short: "今日の予定", emoji: "📅", tone: "border-sky-300/25 bg-sky-400/10" },
  todo: { label: "TODO候補", short: "今日のTODO", emoji: "✅", tone: "border-cyan-300/25 bg-cyan-400/10" },
  shopping: { label: "買い物リスト候補", short: "買い物", emoji: "🛒", tone: "border-emerald-300/25 bg-emerald-400/10" },
  diary: { label: "日記/感情ログ候補", short: "日記", emoji: "📖", tone: "border-fuchsia-300/25 bg-fuchsia-400/10" },
  budget: { label: "家計簿候補", short: "家計簿", emoji: "👛", tone: "border-amber-300/25 bg-amber-400/10" },
  workout: { label: "ワークアウトメモ候補", short: "ワークアウト", emoji: "💪", tone: "border-rose-300/25 bg-rose-400/10" },
  routine: { label: "ルーティン候補", short: "Routine", emoji: "🌅", tone: "border-indigo-300/25 bg-indigo-400/10" },
  projectlab: { label: "Project Lab候補", short: "Project Lab", emoji: "🧪", tone: "border-cyan-300/25 bg-cyan-400/10" },
  bugcenter: { label: "Bug Report候補", short: "Bug", emoji: "🐞", tone: "border-red-300/25 bg-red-400/10" },
  decisionlog: { label: "Decision Log候補", short: "Decision", emoji: "🧩", tone: "border-violet-300/25 bg-violet-400/10" },
  futureletter: { label: "Future Letter候補", short: "Future Letter", emoji: "✉️", tone: "border-indigo-300/25 bg-indigo-400/10" },
  timeline: { label: "Timeline候補", short: "Timeline", emoji: "🕰️", tone: "border-slate-300/25 bg-slate-400/10" },
  promptvault: { label: "Prompt Vault候補", short: "Prompt", emoji: "📦", tone: "border-emerald-300/25 bg-emerald-400/10" },
  memo: { label: "通常メモ候補", short: "メモ", emoji: "📝", tone: "border-blue-300/25 bg-blue-400/10" },
  inbox: { label: "保留ボックス / Mind Inbox", short: "Mind Inbox", emoji: "📥", tone: "border-white/20 bg-white/10" },
};


function HomeMindCaptureCard({
  refreshSnapshot,
  setPage,
}: {
  refreshSnapshot: (reason?: string) => Promise<void>;
  setPage: (p: PageKey) => void;
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<MindCaptureResult | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const localPreview = useMemo(
    () => (text.trim() ? buildLocalMindCaptureResult(text) : null),
    [text],
  );
  const activeResult = result || localPreview;
  const topCandidates = (activeResult?.candidates || []).slice(0, 4);
  const stateLabels = activeResult?.state.labels?.length
    ? activeResult.state.labels
    : ["入力待ち", "思考を一括整理", "保存前確認あり"];

  function showBanner(message: string) {
    setBanner(message);
    window.setTimeout(() => setBanner(null), 3000);
  }

  async function organizeHomeMindCapture() {
    if (!text.trim()) {
      showBanner("Mind Captureに入力すると整理できます");
      return;
    }
    setOrganizing(true);
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mindCaptureAI", text }),
      });
      const json = await response.json();
      const normalized = normalizeMindCaptureResult(json, text);
      setResult(normalized.candidates.length ? normalized : buildLocalMindCaptureResult(text));
      showBanner("AI仕分け結果を作成しました");
    } catch {
      setResult(buildLocalMindCaptureResult(text));
      showBanner("ローカル仕分けで整理しました");
    } finally {
      setOrganizing(false);
    }
  }

  async function saveTopCandidates() {
    const candidates = (activeResult?.candidates || []).filter((candidate) => candidate.save).slice(0, 8);
    if (!candidates.length) {
      showBanner("保存する候補がまだありません");
      return;
    }
    setSaving(true);
    const counts: Record<string, number> = {};
    for (const candidate of candidates) {
      await persistMindCaptureCandidate(candidate);
      const label = mindCaptureCategoryMeta[candidate.category].short;
      counts[label] = (counts[label] || 0) + 1;
    }
    await refreshSnapshot("Mind Capture保存中...");
    setSaving(false);
    const summary = Object.entries(counts).map(([label, count]) => `${label} ${count}件`).join(" / ");
    showBanner(summary ? `${summary}を保存しました` : "保存しました");
  }

  function openFullMindCapture() {
    try {
      if (text.trim()) localStorage.setItem("lifeMindCaptureDraft", text);
    } catch {
      // localStorageが使えなくても遷移はできる
    }
    setPage("braindump");
  }

  return (
    <GlassCard className="future-mind-capture-home relative overflow-hidden p-5 sm:p-6">
      {banner && (
        <div className="absolute right-4 top-4 z-10 rounded-2xl border border-cyan-200/30 bg-slate-950/85 px-4 py-2 text-xs font-black text-cyan-50 shadow-2xl backdrop-blur-xl">
          {banner}
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)] lg:items-stretch">
        <div>
          <p className="future-kicker">CORE / MIND CAPTURE</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Mind Capture
              </h3>
              <p className="mt-2 text-sm font-bold text-cyan-50/72">
                思考を、予定・行動・記録へ変換する。
              </p>
            </div>
            <button
              type="button"
              onClick={openFullMindCapture}
              className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/15 active:scale-[0.98]"
            >
              詳細確認へ →
            </button>
          </div>
          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setResult(null);
            }}
            className="mt-4 min-h-[150px] w-full resize-none rounded-[1.6rem] border border-cyan-200/18 bg-slate-950/42 px-4 py-4 text-base leading-7 text-white outline-none placeholder:text-cyan-50/38 focus:border-cyan-200/45 focus:bg-slate-950/55 sm:min-h-[170px]"
            placeholder="頭の中にあることを、そのまま書いてください。予定、買い物、感情、アイデア、出費、全部まとめて大丈夫です。"
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={organizeHomeMindCapture}
              disabled={organizing || !text.trim()}
              className="rounded-2xl bg-white px-5 py-4 text-sm font-black text-black shadow-[0_0_28px_rgba(191,219,254,.20)] transition active:scale-[0.98] disabled:opacity-50"
            >
              {organizing ? "整理中..." : "思考を整理する"}
            </button>
            <button
              type="button"
              onClick={saveTopCandidates}
              disabled={saving || !activeResult?.candidates.some((candidate) => candidate.save)}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 text-sm font-black text-white transition hover:bg-white/15 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? "保存中..." : "候補を保存"}
            </button>
          </div>
        </div>

        <div className="grid gap-3">
          <div className="rounded-[1.4rem] border border-cyan-200/16 bg-black/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-100/55">今日の脳内状態</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {stateLabels.slice(0, 5).map((label) => (
                <span key={label} className="rounded-full border border-cyan-200/18 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-50">
                  {label}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm leading-7 text-white/62">
              {activeResult?.state.summary || "予定・TODO・買い物・感情・出費・アイデアを、保存前に確認できる候補へ整理します。"}
            </p>
          </div>

          <div className="rounded-[1.4rem] border border-white/12 bg-black/18 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-white">AI仕分けプレビュー</p>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/60">
                {topCandidates.length || 0}件
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {topCandidates.length ? (
                topCandidates.map((candidate) => {
                  const meta = mindCaptureCategoryMeta[candidate.category];
                  return (
                    <div key={candidate.id} className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[11px] font-black text-cyan-50">
                          {meta.emoji} {meta.short}
                        </span>
                        <span className="text-[11px] font-black text-white/45">{candidate.confidence}</span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/78">{candidate.content}</p>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-2xl border border-dashed border-cyan-200/18 bg-cyan-300/5 p-4 text-sm leading-7 text-white/54">
                  ここにカレンダー候補、TODO候補、買い物候補、Mind Inbox候補が表示されます。
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}

function BrainDumpPanel({
  refreshSnapshot,
  setPage,
}: {
  refreshSnapshot: (reason?: string) => Promise<void>;
  setPage: (p: PageKey) => void;
}) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<MindCaptureResult | null>(null);
  const [organizing, setOrganizing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [inboxItems, setInboxItems] = useState<MindInboxItem[]>([]);
  const voice = useVoiceInput((spoken) =>
    setText((current) => `${current}${current ? "\n" : ""}${spoken}`),
  );
  const preview = useMemo(() => buildLocalMindCaptureResult(text), [text]);
  const activeResult = result || preview;

  useEffect(() => {
    setInboxItems(readMindInboxItems());
    try {
      const draft = localStorage.getItem("lifeMindCaptureDraft");
      if (draft) {
        setText(draft);
        setResult(buildLocalMindCaptureResult(draft));
        localStorage.removeItem("lifeMindCaptureDraft");
      }
    } catch {
      // localStorageが使えない環境でも画面は止めない
    }
  }, []);

  function showBanner(message: string) {
    setBanner(message);
    window.setTimeout(() => setBanner(null), 3000);
  }

  function updateCandidate(id: string, patch: Partial<MindCaptureCandidate>) {
    setResult((current) => {
      const base = current || preview;
      return {
        ...base,
        candidates: base.candidates.map((candidate) =>
          candidate.id === id ? { ...candidate, ...patch } : candidate,
        ),
      };
    });
  }

  function moveToInbox(id: string) {
    updateCandidate(id, { category: "inbox", save: true, confidence: "保留推奨" });
    showBanner("Mind Inboxに保留しました");
  }

  async function organize() {
    if (!text.trim()) return;
    setOrganizing(true);
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "mindCaptureAI", text }),
      });
      const json = await response.json().catch(() => null);
      const normalized = normalizeMindCaptureResult(json, text);
      setResult(normalized.candidates.length ? normalized : buildLocalMindCaptureResult(text));
    } catch {
      setResult(buildLocalMindCaptureResult(text));
    } finally {
      setOrganizing(false);
    }
  }

  async function saveCandidate(candidate: MindCaptureCandidate) {
    const message = await persistMindCaptureCandidate(candidate);
    setInboxItems(readMindInboxItems());
    showBanner(message);
    setResult((current) => {
      if (!current) return current;
      return {
        ...current,
        candidates: current.candidates.map((row) =>
          row.id === candidate.id ? { ...row, save: false } : row,
        ),
      };
    });
    await refreshSnapshot("手動同期中...");
  }

  async function saveSelected() {
    const selected = activeResult.candidates.filter((candidate) => candidate.save);
    if (!selected.length) {
      showBanner("保存する候補が選ばれていません");
      return;
    }
    setSaving(true);
    const counts: Record<string, number> = {};
    for (const candidate of selected) {
      const message = await persistMindCaptureCandidate(candidate);
      const label = mindCaptureCategoryMeta[candidate.category].short;
      counts[label] = (counts[label] || 0) + 1;
      setBanner(message);
    }
    setInboxItems(readMindInboxItems());
    setResult((current) =>
      current
        ? {
            ...current,
            candidates: current.candidates.map((candidate) =>
              candidate.save ? { ...candidate, save: false } : candidate,
            ),
          }
        : current,
    );
    await refreshSnapshot("手動同期中...");
    setSaving(false);
    const summary = Object.entries(counts)
      .map(([label, count]) => `${label} ${count}件`)
      .join(" / ");
    showBanner(summary ? `${summary}を保存しました` : "保存しました");
    setGuideDraft(`Mind Captureで整理した内容を保存したよ。${summary || "必要な場所へ振り分けたよ。"}`);
  }

  async function sendInboxItem(item: MindInboxItem, category: MindCaptureCategory) {
    const message = await persistMindCaptureCandidate({
      id: item.id,
      category,
      content: item.content,
      save: true,
      confidence: category === "inbox" ? "保留推奨" : "確認が必要",
      date: null,
      amount: extractYenAmount(item.content),
      note: "Mind Inboxから移動",
      source: "manual",
    });
    const next = readMindInboxItems().filter((row) => row.id !== item.id);
    writeMindInboxItems(next);
    setInboxItems(next);
    await refreshSnapshot("Mind Inbox整理中...");
    showBanner(message);
  }

  function updateInboxItem(item: MindInboxItem, content: string) {
    const next = readMindInboxItems().map((row) =>
      row.id === item.id ? { ...row, content } : row,
    );
    writeMindInboxItems(next);
    setInboxItems(next);
  }

  function deleteInboxItem(id: string) {
    const next = readMindInboxItems().filter((row) => row.id !== id);
    writeMindInboxItems(next);
    setInboxItems(next);
    showBanner("Mind Inboxから削除しました");
  }

  const grouped = groupMindCaptureCandidates(activeResult.candidates);

  return (
    <div className="space-y-4">
      {banner && (
        <div className="fixed inset-x-4 top-4 z-[120] mx-auto max-w-md rounded-3xl border border-cyan-200/30 bg-slate-950/90 px-5 py-4 text-sm font-black text-cyan-50 shadow-2xl backdrop-blur-2xl">
          {banner}
        </div>
      )}

      <GlassCard className="overflow-hidden border-cyan-200/20 bg-cyan-400/[0.08] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-100/70">
              LIFE COMMAND OS / CORE FEATURE
            </p>
            <h2 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
              Mind Capture / マインドキャプチャ
            </h2>
            <p className="mt-2 text-lg font-black text-cyan-50/85">
              思考を、予定・行動・記録へ変換する。
            </p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
              頭の中の予定、TODO、買い物、感情、日記、出費、アイデア、メモをまとめて受け止めて、保存前にカテゴリ別の候補へ整理する場所だよ。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-black text-white/75 sm:min-w-80">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-2xl">{activeResult.candidates.length}</p>
              <p>候補</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-2xl">{activeResult.candidates.filter((c) => c.save).length}</p>
              <p>保存予定</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
              <p className="text-2xl">{inboxItems.length}</p>
              <p>Inbox</p>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_.9fr]">
        <GlassCard className="border-cyan-200/20 bg-slate-950/45 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-2xl font-black">Mind Capture入力カード</h3>
              <p className="mt-1 text-sm text-white/55">まだ保存されないから、まずは一括で吐き出して大丈夫。</p>
            </div>
            <button
              onClick={voice.start}
              className={`shrink-0 rounded-2xl px-4 py-3 text-sm font-black transition active:scale-95 ${voice.listening ? "bg-rose-300 text-black" : "border border-white/15 bg-white/10 text-white"}`}
            >
              {voice.listening ? "聞いてる..." : "音声入力"}
            </button>
          </div>
          <TextArea
            className="mt-4 min-h-[280px] border-cyan-200/20 bg-slate-950/55 text-base leading-7"
            placeholder="頭の中にあることを、そのまま書いてください。予定、買い物、感情、アイデア、出費、全部まとめて大丈夫です。"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
            <button
              onClick={organize}
              disabled={!text.trim() || organizing}
              className="rounded-2xl bg-white px-5 py-4 font-black text-black transition active:scale-[0.99] disabled:opacity-50"
            >
              {organizing ? "整理中..." : "思考を整理する"}
            </button>
            <button
              onClick={() => {
                setResult(null);
                setText("");
              }}
              className="rounded-2xl border border-white/15 bg-white/10 px-5 py-4 font-black text-white transition active:scale-[0.99]"
            >
              入力をリセット
            </button>
          </div>
        </GlassCard>

        <GlassCard className="border-blue-200/20 bg-blue-400/[0.07] p-5">
          <h3 className="text-2xl font-black">今日の脳内状態</h3>
          <p className="mt-2 text-sm leading-7 text-white/58">
            診断ではなく、メモ整理の補助表示だよ。保存前の優先順位を見やすくするための軽いサマリー。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {activeResult.state.labels.map((label) => (
              <span key={label} className="rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-2 text-sm font-black text-cyan-50">
                {label}
              </span>
            ))}
          </div>
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-white/72">
            {activeResult.state.summary}
          </div>
          <div className="mt-4 rounded-3xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-white/45">AI仕分けの扱い</p>
            <p className="mt-2 text-sm leading-7 text-white/62">
              確定候補はそのまま保存しやすいもの。確認が必要なものは編集推奨。保留推奨はMind Inboxに置いて後で見直せるよ。
            </p>
          </div>
        </GlassCard>
      </div>

      <GlassCard className="border-cyan-200/20 bg-slate-950/45 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-100/60">REVIEW BEFORE SAVE</p>
            <h3 className="mt-1 text-3xl font-black">AI仕分け結果</h3>
          </div>
          <button
            onClick={saveSelected}
            disabled={saving || !activeResult.candidates.some((candidate) => candidate.save)}
            className="rounded-2xl bg-white px-5 py-3 font-black text-black transition active:scale-[0.99] disabled:opacity-50"
          >
            {saving ? "保存中..." : "選択した候補を保存"}
          </button>
        </div>
        {!activeResult.candidates.length ? (
          <Empty text="入力すると、ここにカレンダー候補・TODO候補・買い物候補などが表示されるよ。" />
        ) : (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {(Object.keys(mindCaptureCategoryMeta) as MindCaptureCategory[]).map((category) => {
              const rows = grouped[category] || [];
              if (!rows.length) return null;
              const meta = mindCaptureCategoryMeta[category];
              return (
                <div key={category} className={`rounded-[1.6rem] border p-4 ${meta.tone}`}>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h4 className="text-lg font-black">{meta.emoji} {meta.short}</h4>
                    <span className="rounded-full bg-black/25 px-3 py-1 text-xs font-black text-white/70">{rows.length}件</span>
                  </div>
                  <div className="space-y-3">
                    {rows.map((candidate) => (
                      <MindCaptureCandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        onUpdate={updateCandidate}
                        onMoveInbox={moveToInbox}
                        onSave={saveCandidate}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <GlassCard className="border-white/15 bg-white/[0.06] p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-2xl font-black">Mind Inbox</h3>
            <p className="mt-1 text-sm text-white/55">曖昧なもの・まだ決めたくないものを保留しておく場所。</p>
          </div>
          <button
            onClick={() => {
              localStorage.setItem("lifeMindInboxItems", "[]");
              setInboxItems([]);
              showBanner("Mind Inboxを空にしました");
            }}
            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-white"
          >
            Inboxを空にする
          </button>
        </div>
        {inboxItems.length ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {inboxItems.slice(0, 12).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <TextArea
                  className="min-h-20 bg-black/25 p-3 text-sm"
                  value={item.content}
                  onChange={(e) => updateInboxItem(item, e.target.value)}
                />
                <p className="mt-2 text-xs text-white/40">{new Date(item.created_at).toLocaleString("ja-JP")}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["memo", "todo", "calendar", "budget", "shopping", "routine", "diary"] as MindCaptureCategory[]).map((category) => (
                    <button
                      key={category}
                      onClick={() => sendInboxItem(item, category)}
                      className="rounded-xl bg-white/10 px-2 py-2 text-xs font-black"
                    >
                      {mindCaptureCategoryMeta[category].short}へ
                    </button>
                  ))}
                  <button onClick={() => deleteInboxItem(item.id)} className="rounded-xl bg-red-500 px-2 py-2 text-xs font-black">
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="保留中のMind Inboxは空だよ。" />
        )}
      </GlassCard>
    </div>
  );
}

function MindCaptureCandidateCard({
  candidate,
  onUpdate,
  onMoveInbox,
  onSave,
}: {
  candidate: MindCaptureCandidate;
  onUpdate: (id: string, patch: Partial<MindCaptureCandidate>) => void;
  onMoveInbox: (id: string) => void;
  onSave: (candidate: MindCaptureCandidate) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/45 p-3 shadow-inner">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <label className="inline-flex items-center gap-2 text-sm font-black text-white/80">
          <input
            type="checkbox"
            checked={candidate.save}
            onChange={(e) => onUpdate(candidate.id, { save: e.target.checked })}
            className="h-4 w-4 accent-cyan-300"
          />
          保存する
        </label>
        <span className={`rounded-full px-3 py-1 text-xs font-black ${candidate.confidence === "確定候補" ? "bg-emerald-300/15 text-emerald-100" : candidate.confidence === "確認が必要" ? "bg-amber-300/15 text-amber-100" : "bg-white/10 text-white/65"}`}>
          {candidate.confidence}
        </span>
      </div>
      <TextArea
        className="mt-3 min-h-24 bg-black/25 p-3 text-sm leading-6"
        value={candidate.content}
        onChange={(e) => onUpdate(candidate.id, { content: e.target.value })}
      />
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px_150px]">
        <select
          value={candidate.category}
          onChange={(e) => onUpdate(candidate.id, { category: e.target.value as MindCaptureCategory })}
          className="rounded-2xl border border-white/15 bg-slate-950/90 px-3 py-2 text-sm font-black text-white"
        >
          {(Object.keys(mindCaptureCategoryMeta) as MindCaptureCategory[]).map((category) => (
            <option key={category} value={category}>{mindCaptureCategoryMeta[category].short}</option>
          ))}
        </select>
        <button
          onClick={() => onUpdate(candidate.id, { save: false })}
          className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-black text-white"
        >
          保存しない
        </button>
        <button
          onClick={() => onMoveInbox(candidate.id)}
          className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-black text-white"
        >
          保留へ
        </button>
      </div>
      <button
        onClick={() => onSave(candidate)}
        className="mt-2 w-full rounded-2xl bg-white px-3 py-2 text-sm font-black text-black"
      >
        この候補だけ保存
      </button>
    </div>
  );
}

function groupMindCaptureCandidates(candidates: MindCaptureCandidate[]) {
  return candidates.reduce(
    (acc, candidate) => {
      acc[candidate.category] = [...(acc[candidate.category] || []), candidate];
      return acc;
    },
    {} as Partial<Record<MindCaptureCategory, MindCaptureCandidate[]>>,
  );
}

function normalizeMindCaptureResult(input: any, originalText: string): MindCaptureResult {
  const local = buildLocalMindCaptureResult(originalText);
  const rawCandidates = Array.isArray(input?.candidates) ? input.candidates : [];
  const candidates = rawCandidates
    .map((row: any, index: number) => normalizeMindCaptureCandidate(row, index, "ai"))
    .filter((row: MindCaptureCandidate | null): row is MindCaptureCandidate => Boolean(row))
    .slice(0, 24);
  const labels = Array.isArray(input?.state?.labels)
    ? input.state.labels.map((label: unknown) => String(label).trim()).filter(Boolean).slice(0, 8)
    : local.state.labels;
  return {
    candidates,
    source: candidates.length ? "ai" : "local",
    state: {
      labels: labels.length ? labels : local.state.labels,
      summary: String(input?.state?.summary || local.state.summary).slice(0, 220),
    },
  };
}

function normalizeMindCaptureCandidate(row: any, index: number, source: "ai" | "local"): MindCaptureCandidate | null {
  const content = String(row?.content || row?.title || row?.text || "").trim();
  if (!content) return null;
  const category = isMindCaptureCategory(row?.category) ? row.category : inferMindCaptureCategory(content);
  const confidenceText = String(row?.confidence || "");
  const confidence: MindCaptureConfidence =
    confidenceText === "確定候補" || confidenceText === "確認が必要" || confidenceText === "保留推奨"
      ? confidenceText
      : inferMindCaptureConfidence(content, category);
  const amount = Number(row?.amount || extractYenAmount(content) || 0) || null;
  return {
    id: `${source}-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    category,
    content: content.slice(0, 300),
    save: category !== "inbox" && confidence !== "保留推奨",
    confidence,
    date: typeof row?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.date) ? row.date : inferDateKey(content),
    amount,
    note: typeof row?.note === "string" ? row.note.slice(0, 160) : null,
    source,
  };
}

function buildLocalMindCaptureResult(text: string): MindCaptureResult {
  const lines = splitMindCaptureLines(text);
  const candidates = lines.map((line, index) => normalizeMindCaptureCandidate({ content: line }, index, "local")).filter((row): row is MindCaptureCandidate => Boolean(row));
  return {
    source: "local",
    candidates,
    state: buildMindCaptureState(text, candidates),
  };
}

function splitMindCaptureLines(text: string) {
  return String(text || "")
    .split(/\r?\n|[。！？!?]+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 24);
}

function isMindCaptureCategory(value: unknown): value is MindCaptureCategory {
  return typeof value === "string" && value in mindCaptureCategoryMeta;
}

function inferMindCaptureCategory(text: string): MindCaptureCategory {
  const line = String(text || "");
  if (/(\d{1,3}(?:,\d{3})*|\d+)\s*円|使った|支払|支出|収入|予算|家計簿/.test(line)) return "budget";
  if (/バグ|エラー|build|ビルド|表示がおかしい|保存されない|崩れ|不具合/.test(line)) return "bugcenter";
  if (/プロジェクト|アップデート|実装|GitHub|デプロイ|次にやる|開発/.test(line)) return "projectlab";
  if (/迷って|決める|判断|選択肢|結論|方針/.test(line)) return "decisionlog";
  if (/プロンプト|AIに伝える|依頼文|コピペ/.test(line)) return "promptvault";
  if (/未来の自分|手紙|年末|誕生日|目標日/.test(line)) return "futureletter";
  if (/タイムライン|今日やった|時系列|振り返り/.test(line)) return "timeline";
  if (/朝ルーティン|夜ルーティン|モーニング|ナイトルーティン|寝る前|起床後|習慣に|習慣化|毎朝|毎晩|毎日|ルーティン/.test(line)) return "routine";
  if (/筋トレ|ジム|ワークアウト|ランニング|有酸素|肩|胸|背中|脚|腕|腹筋|レッグ|ベンチ|プレス|スクワット/.test(line)) return "workout";
  if (/買う|買い|購入|欲しい|牛乳|卵|米|パン|日用品|スーパー|コンビニ|Amazon|アマゾン/.test(line)) return "shopping";
  if (/今日|明日|明後日|来週|\d{1,2}時|予定|予約|集合|面談|病院|歯医者|美容院|会う|打ち合わせ/.test(line)) return "calendar";
  if (/する|やる|確認|連絡|提出|送る|作る|準備|掃除|洗濯|電話|メール|返す|調べる|修正|登録|必要|忘れ/.test(line)) return "todo";
  if (/疲|眠|寝不足|不安|焦|嬉|楽しい|つら|しんど|気分|感情|日記|集中できない/.test(line)) return "diary";
  if (/アイデア|思いついた|企画|ネタ|メモ|考え|構想/.test(line)) return "memo";
  return line.length > 45 ? "memo" : "inbox";
}

function inferMindCaptureConfidence(content: string, category: MindCaptureCategory): MindCaptureConfidence {
  if (category === "inbox") return "保留推奨";
  if (category === "budget" && !extractYenAmount(content)) return "確認が必要";
  if (category === "calendar" && !inferDateKey(content) && !/\d{1,2}時/.test(content)) return "確認が必要";
  if (/かも|たぶん|いつか|迷|未定|わから/.test(content)) return "保留推奨";
  if (content.length < 4) return "確認が必要";
  return "確定候補";
}

function inferDateKey(content: string) {
  const today = todayKey();
  if (/明後日/.test(content)) return dateMinus(today, -2);
  if (/明日/.test(content)) return dateMinus(today, -1);
  if (/今日/.test(content)) return today;
  const slash = content.match(/(\d{1,2})[\/月](\d{1,2})日?/);
  if (slash) {
    const now = new Date();
    const month = Number(slash[1]);
    const day = Number(slash[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${now.getFullYear()}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return null;
}

function extractYenAmount(content: string) {
  const match = String(content || "").replace(/,/g, "").match(/(\d+)\s*円/);
  return match ? Math.max(0, Number(match[1])) : null;
}

function buildMindCaptureState(text: string, candidates: MindCaptureCandidate[]): MindCaptureState {
  const labels: string[] = [];
  const raw = String(text || "");
  const todoLike = candidates.filter((c) => c.category === "todo" || c.category === "calendar").length;
  if (todoLike >= 3) labels.push("やること多め");
  if (/疲|眠|寝不足|だる|しんど/.test(raw)) labels.push("疲労感あり");
  if (/不安|焦|怖|心配|緊張/.test(raw)) labels.push("不安少し強め");
  if (/アイデア|思いついた|企画|ネタ|構想/.test(raw)) labels.push("アイデア量多め");
  if (candidates.some((c) => c.category === "calendar")) labels.push("予定整理が必要");
  if (candidates.some((c) => c.category === "budget")) labels.push("お金メモあり");
  if (candidates.some((c) => c.category === "routine")) labels.push("ルーティン化候補あり");
  if (!labels.length) labels.push("整理しやすい状態");
  return {
    labels: labels.slice(0, 6),
    summary: `候補は${candidates.length}件。保存前にカテゴリと内容を確認して、曖昧なものはMind Inboxへ置ける状態だよ。`,
  };
}

function readMindInboxItems(): MindInboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("lifeMindInboxItems") || "[]") as MindInboxItem[];
  } catch {
    return [];
  }
}

function writeMindInboxItems(items: MindInboxItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("lifeMindInboxItems", JSON.stringify(items.slice(0, 120)));
}

function addMindInboxItem(candidate: MindCaptureCandidate) {
  const next: MindInboxItem[] = [
    {
      id: `mind-inbox-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      content: candidate.content,
      originalCategory: candidate.category,
      created_at: new Date().toISOString(),
    },
    ...readMindInboxItems(),
  ];
  writeMindInboxItems(next);
}

function inferShoppingCategory(content: string) {
  if (/薬|包帯|湿布|サプリ|病院/.test(content)) return "医薬品";
  if (/充電|電池|ケーブル|家電|イヤホン/.test(content)) return "家電";
  if (/服|ズボン|靴下|衣類|シューズ|靴/.test(content)) return "衣類";
  if (/本|ノート|文房具|教材/.test(content)) return "学習";
  if (/牛乳|卵|米|パン|肉|魚|野菜|食/.test(content)) return "食料品";
  return "その他";
}

function inferBudgetCategory(content: string) {
  if (/カフェ|コーヒー/.test(content)) return "カフェ";
  if (/電車|バス|交通|タクシー/.test(content)) return "交通";
  if (/服|靴|衣類/.test(content)) return "服";
  if (/本|教材|学習/.test(content)) return "学習";
  if (/病院|薬|医療/.test(content)) return "医療";
  if (/牛乳|飯|ご飯|食|スーパー|コンビニ/.test(content)) return "食費";
  return "その他";
}

function inferMood(content: string) {
  if (/嬉|最高|楽しい|良かった|できた/.test(content)) return "良い";
  if (/不安|焦|怖|緊張/.test(content)) return "不安";
  if (/疲|眠|しんど|つら/.test(content)) return "疲れ";
  return "普通";
}

function addShoppingFromMindCapture(candidate: MindCaptureCandidate) {
  const current = (() => {
    try {
      return JSON.parse(localStorage.getItem("lifeShoppingItems") || "[]") as ShoppingItem[];
    } catch {
      return [];
    }
  })();
  const item: ShoppingItem = {
    id: `mind-shopping-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: candidate.content.replace(/買う|買いたい|購入/g, "").trim().slice(0, 80) || candidate.content.slice(0, 80),
    category: inferShoppingCategory(candidate.content),
    checked: false,
    memo: "Mind Captureから追加",
    created_at: new Date().toISOString(),
  };
  localStorage.setItem("lifeShoppingItems", JSON.stringify([item, ...current].slice(0, 300)));
}

async function persistMindCaptureCandidate(candidate: MindCaptureCandidate) {
  const content = candidate.content.trim();
  if (!content) return "空の候補は保存しませんでした";
  if (candidate.category === "inbox") {
    addMindInboxItem(candidate);
    return "Mind Inboxに保留しました";
  }
  try {
    if (candidate.category === "todo") {
      await insertTodoCandidates([{ title: content, priority: candidate.confidence === "確定候補" ? "normal" : "low", due_date: candidate.date || null }], candidate.date || todayKey());
      return "TODOに保存しました";
    }
    if (candidate.category === "calendar") {
      const { error } = await supabase.from("calendar_events").insert({
        title: content.slice(0, 100),
        event_date: candidate.date || todayKey(),
        note: candidate.note || `Mind Captureから追加: ${content}`,
      });
      if (error) throw error;
      return "カレンダーに保存しました";
    }
    if (candidate.category === "shopping") {
      addShoppingFromMindCapture(candidate);
      return "買い物リストに保存しました";
    }
    if (candidate.category === "diary") {
      const { error } = await supabase.from("diary_entries").insert({
        entry_date: candidate.date || todayKey(),
        mood: inferMood(content),
        title: "Mind Capture",
        content,
      });
      if (error) throw error;
      return "日記に保存しました";
    }
    if (candidate.category === "budget") {
      const amount = candidate.amount || extractYenAmount(content) || 0;
      if (!amount) {
        addMindInboxItem({ ...candidate, category: "inbox" });
        return "金額が曖昧なのでMind Inboxに保留しました";
      }
      const { error } = await supabase.from("budget_logs").insert({
        spend_date: candidate.date || todayKey(),
        type: /収入|もらった|給料/.test(content) ? "income" : "expense",
        category: inferBudgetCategory(content),
        amount,
        memo: content,
        wallet: "財布",
        payment_method: "財布",
      } as any);
      if (error) throw error;
      return "家計簿に保存しました";
    }
    if (candidate.category === "workout") {
      const { error } = await supabase.from("memos").insert({ content: `ワークアウトメモ: ${content}` });
      if (error) throw error;
      return "ワークアウトメモに保存しました";
    }
    if (candidate.category === "routine") {
      const lower = content.toLowerCase();
      const routineTime =
        /夜|寝る前|ナイト/.test(content)
          ? "21:30"
          : /朝|起床|モーニング/.test(content)
            ? "07:00"
            : null;
      const { error } = await supabase.from("routines").insert({
        title: content.slice(0, 80),
        routine_time: routineTime,
        note: `Mind Captureから追加: ${content}`,
        active: true,
      });
      if (error) throw error;
      return "Routineに保存しました";
    }
    if (
      candidate.category === "projectlab" ||
      candidate.category === "bugcenter" ||
      candidate.category === "decisionlog" ||
      candidate.category === "futureletter" ||
      candidate.category === "timeline" ||
      candidate.category === "promptvault"
    ) {
      const config = lifeModuleConfigs.find((row) => row.key === candidate.category);
      addLifeModuleItem(candidate.category, {
        title: content.slice(0, 80),
        note: content,
        category: mindCaptureCategoryMeta[candidate.category].short,
        status: "未整理",
      });
      return `${config?.title || "Life module"}に保存しました`;
    }
    const { error } = await supabase.from("memos").insert({ content });
    if (error) throw error;
    return "メモに保存しました";
  } catch (error) {
    console.error(error);
    addMindInboxItem({ ...candidate, category: "inbox" });
    return "保存に失敗したためMind Inboxに保留しました";
  }
}


type LifeModuleKey =
  | "todaycommand"
  | "lowenergy"
  | "outing"
  | "shoppingmission"
  | "paymentcalendar"
  | "subscriptions"
  | "decisionlog"
  | "projectlab"
  | "promptvault"
  | "bugcenter"
  | "recovery"
  | "reset"
  | "weeklyreview"
  | "monthlyreview"
  | "lifescore"
  | "skilltree"
  | "archive"
  | "futureletter"
  | "emergencynote"
  | "placelog"
  | "sleepprep"
  | "timeline";

type LifeModuleItem = {
  id: string;
  title: string;
  note: string;
  category: string;
  status: string;
  amount?: number;
  date?: string;
  created_at: string;
  updated_at: string;
};

type LifeModuleConfig = {
  key: LifeModuleKey;
  page: PageKey;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  placeholder: string;
  categories: string[];
  statuses: string[];
  quickLinks: PageKey[];
};

const lifeModuleConfigs: LifeModuleConfig[] = [
  { key: "todaycommand", page: "todaycommand", title: "Today Command / 今日の司令室", subtitle: "今日だけに集中する", description: "予定、TODO、支出、Routine、Mind Inboxを今日用にまとめるページ。", icon: "🧭", placeholder: "今日の一言メモ / やらなくていいこと / 最重要タスク", categories: ["最重要", "今日やる", "やらなくていい", "メモ"], statuses: ["今日", "完了", "保留"], quickLinks: ["todos", "calendar", "budget", "routines", "braindump"] },
  { key: "lowenergy", page: "lowenergy", title: "Low Energy Mode / 低エネルギーモード", subtitle: "今日はこれだけでOK", description: "疲れている日でも生活を崩しきらないための最低限モード。", icon: "🫧", placeholder: "水を飲む / 家計簿1件だけ / 明日の予定確認", categories: ["最低限", "明日に回す", "回復", "メモ"], statuses: ["今日でOK", "明日へ", "済み"], quickLinks: ["routines", "recovery", "reset", "braindump"] },
  { key: "outing", page: "outing", title: "Outing Mode / 外出モード", subtitle: "外出前と外出中の確認", description: "持ち物、買い物、交通費、目的地メモ、財布残高をまとめて確認。", icon: "🎒", placeholder: "モバイルバッテリー確認 / 傘 / 交通費メモ", categories: ["持ち物", "外出TODO", "買うもの", "帰宅後"], statuses: ["未確認", "OK", "帰宅後"], quickLinks: ["belongings", "shopping", "budget", "calendar"] },
  { key: "shoppingmission", page: "shoppingmission", title: "Shopping Mission / 買い物ミッション", subtitle: "買い忘れを減らす", description: "買うもの、予算、店舗、今買わなくていいものを管理。", icon: "🛒", placeholder: "牛乳 / 卵 / 予算1500円 / 今は買わないもの", categories: ["必須", "余裕があれば", "今買わない", "よく買う"], statuses: ["未購入", "購入済み", "保留"], quickLinks: ["shopping", "budget"] },
  { key: "paymentcalendar", page: "paymentcalendar", title: "Payment Calendar / 支払いカレンダー", subtitle: "支払い予定だけを見る", description: "固定費、サブスク、カード支払い、給料日前後を確認。", icon: "💳", placeholder: "スマホ代 4980円 / 支払元 銀行 / 毎月25日", categories: ["固定費", "サブスク", "カード", "給料"], statuses: ["未払い", "支払い済み", "確認"], quickLinks: ["budget", "calendar"] },
  { key: "subscriptions", page: "subscriptions", title: "Subscription Center / サブスク管理", subtitle: "月額と年額を見える化", description: "サブスク名、月額、次回更新日、使用頻度、解約候補を管理。", icon: "🔁", placeholder: "Apple Music 1080円 / 使用頻度 高 / 継続", categories: ["必須", "趣味", "学習", "健康", "解約候補"], statuses: ["継続", "見直し", "解約候補"], quickLinks: ["budget"] },
  { key: "decisionlog", page: "decisionlog", title: "Decision Log / 決断ログ", subtitle: "迷ったことと決めたこと", description: "選択肢、メリット、デメリット、最終決定を残す。", icon: "🧩", placeholder: "迷っていること / 選択肢A/B / 結論 / 理由", categories: ["未決定", "決定済み", "見返し"], statuses: ["検討中", "決定", "保留"], quickLinks: ["memos", "projectlab"] },
  { key: "projectlab", page: "projectlab", title: "Project Lab / プロジェクト管理", subtitle: "開発と生活改善の研究所", description: "目的、状態、次にやること、バグ、AI依頼文、GitHubメモを管理。", icon: "🧪", placeholder: "Life Command OS大型更新 / 次: Money Hub / 注意: Wind Huntに触れない", categories: ["目的", "次にやる", "バグ", "GitHub", "AI依頼"], statuses: ["未着手", "進行中", "完了"], quickLinks: ["bugcenter", "promptvault", "decisionlog"] },
  { key: "promptvault", page: "promptvault", title: "Prompt Vault / AI依頼文保管庫", subtitle: "成功した依頼文を保存", description: "コピペ用プロンプト、カテゴリ、成功/失敗メモを管理。", icon: "📦", placeholder: "AIに渡す文章をここへ保存。コード修正用 / 画像生成用 / GitHub用", categories: ["メモアプリ", "コード修正", "画像生成", "GitHub", "成功"], statuses: ["使える", "改善中", "失敗"], quickLinks: ["projectlab", "bugcenter"] },
  { key: "bugcenter", page: "bugcenter", title: "Bug Report Center / バグ報告センター", subtitle: "AIへ渡しやすく記録", description: "バグ名、発生条件、期待、実際、ログ、優先度、状態を管理。", icon: "🐞", placeholder: "バグ名 / 発生ページ / 期待 / 実際 / エラーログ", categories: ["高", "中", "低", "UI", "保存", "Build"], statuses: ["未修正", "調査中", "修正済み"], quickLinks: ["projectlab", "promptvault"] },
  { key: "recovery", page: "recovery", title: "Recovery Page / 回復ページ", subtitle: "消耗した時の避難所", description: "休憩候補、やらなくていいこと、安心メモ、深呼吸タイマー。", icon: "🛟", placeholder: "今の状態 / 休憩候補 / やらなくていいこと", categories: ["安心", "休憩", "明日へ", "最低限"], statuses: ["今やる", "後で", "回復済み"], quickLinks: ["lowenergy", "reset", "sleepprep"] },
  { key: "reset", page: "reset", title: "Reset Button / 生活リセット", subtitle: "崩れた日を立て直す", description: "失敗を責めず、明日に回すTODOと今夜の最低限だけ残す。", icon: "🔄", placeholder: "明日へ回す / 今夜は歯磨きと予定確認だけ", categories: ["明日へ", "今夜最低限", "家計簿だけ", "安心メモ"], statuses: ["整理中", "明日へ", "完了"], quickLinks: ["lowenergy", "recovery", "sleepprep"] },
  { key: "weeklyreview", page: "weeklyreview", title: "Weekly Review / 週次レビュー", subtitle: "1週間を整える", description: "支出、TODO完了、Routine、メモ、気分、来週の予算を確認。", icon: "📆", placeholder: "今週よかったこと / 来週気をつけること", categories: ["支出", "TODO", "Routine", "気分", "来週"], statuses: ["下書き", "完了", "見返し"], quickLinks: ["budget", "routines", "todos", "diary"] },
  { key: "monthlyreview", page: "monthlyreview", title: "Monthly Review / 月次レビュー", subtitle: "月末の生活改善", description: "収入、支出、カテゴリ、サブスク、Routine、来月目標を確認。", icon: "🗓️", placeholder: "今月の支出 / 来月の目標 / 来月の予算", categories: ["お金", "Routine", "目標", "反省なし振り返り"], statuses: ["下書き", "完了", "来月へ"], quickLinks: ["budget", "subscriptions", "goals"] },
  { key: "lifescore", page: "lifescore", title: "Life Score / 生活スコア", subtitle: "ゲーム感覚で見える化", description: "予定、TODO、お金、Routine、Mind Inboxを軽く点数化。", icon: "🎮", placeholder: "今日のスコアメモ / お金安定 / 予定多め", categories: ["お金", "予定", "Routine", "メモ整理"], statuses: ["安定", "多め", "回復"], quickLinks: ["todaycommand", "weeklyreview"] },
  { key: "skilltree", page: "skilltree", title: "Skill Tree / 生活スキルツリー", subtitle: "生活改善を育てる", description: "お金管理、朝習慣、夜習慣、整理力をバッジ化。", icon: "🌳", placeholder: "家計簿3日継続 / Mind Inbox整理 / サブスク見直し", categories: ["お金管理", "朝習慣", "夜習慣", "整理力"], statuses: ["未開放", "進行中", "達成"], quickLinks: ["budget", "routines", "braindump"] },
  { key: "archive", page: "archive", title: "Archive / 人生アーカイブ", subtitle: "大事な言葉と思い出", description: "成長ログ、励ましメモ、未来の自分へ残す場所。", icon: "🏛️", placeholder: "大事な言葉 / 成長ログ / 乗り越えたこと", categories: ["大事な言葉", "成長ログ", "思い出", "未来の自分へ"], statuses: ["保存", "お気に入り", "見返し"], quickLinks: ["memos", "diary"] },
  { key: "futureletter", page: "futureletter", title: "Future Letter / 未来の自分への手紙", subtitle: "未来日付に向けたメッセージ", description: "宛先日、タイトル、本文、今の気持ちを残す。", icon: "✉️", placeholder: "2028年8月12日の自分へ / 今の努力をどう思ってる？", categories: ["1ヶ月後", "誕生日", "年末", "目標日"], statuses: ["未開封", "開封日待ち", "開封済み"], quickLinks: ["goals", "archive"] },
  { key: "emergencynote", page: "emergencynote", title: "Emergency Note / 緊急メモ", subtitle: "急ぎで見る重要情報", description: "病院、役所、問い合わせ、重要契約、トラブル対応メモ。", icon: "🛡️", placeholder: "病院メモ / 問い合わせ先 / 手続きメモ", categories: ["病院", "役所", "契約", "トラブル"], statuses: ["重要", "確認済み", "非表示風"], quickLinks: ["memos"] },
  { key: "placelog", page: "placelog", title: "Cafe / Place Log / 行った場所ログ", subtitle: "場所と思い出と支出", description: "場所名、金額、滞在時間、集中度、また行きたいかを記録。", icon: "📍", placeholder: "カフェ名 / 支出520円 / 集中度4/5 / また行きたい", categories: ["カフェ", "サウナ", "ジム", "図書館", "散歩"], statuses: ["また行きたい", "普通", "微妙"], quickLinks: ["map", "budget", "cafe"] },
  { key: "sleepprep", page: "sleepprep", title: "Sleep Prep / 睡眠準備", subtitle: "寝る前の安心導線", description: "ナイトルーティン、明日の予定、持ち物、家計簿、安心メモ。", icon: "🌙", placeholder: "明日の予定確認 / スマホ終了 / 安心メモ", categories: ["明日の準備", "安心メモ", "ナイトルーティン", "家計簿"], statuses: ["今夜", "完了", "明日へ"], quickLinks: ["routines", "calendar", "belongings", "budget"] },
  { key: "timeline", page: "timeline", title: "Timeline / 生活タイムライン", subtitle: "今日の流れを時系列で見る", description: "予定、支出、メモ、Routine、日記、Mind Captureの流れを整理。", icon: "🕰️", placeholder: "07:30 朝ルーティン / 12:20 メモ / 21:30 ナイトルーティン", categories: ["予定", "支出", "メモ", "Routine", "日記"], statuses: ["記録", "重要", "振り返り"], quickLinks: ["diary", "budget", "routines"] },
];

const lifeModuleConfigsByKey = Object.fromEntries(
  lifeModuleConfigs.map((config) => [config.key, config]),
) as Record<LifeModuleKey, LifeModuleConfig>;

function readLifeModuleItems(key: LifeModuleKey): LifeModuleItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(`lifeModule:${key}`) || "[]") as LifeModuleItem[];
  } catch {
    return [];
  }
}

function writeLifeModuleItems(key: LifeModuleKey, items: LifeModuleItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`lifeModule:${key}`, JSON.stringify(items.slice(0, 400)));
}

function addLifeModuleItem(key: LifeModuleKey, input: Partial<LifeModuleItem>) {
  const now = new Date().toISOString();
  const item: LifeModuleItem = {
    id: `module-${key}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: String(input.title || "無題").slice(0, 120),
    note: String(input.note || ""),
    category: String(input.category || "メモ"),
    status: String(input.status || "未整理"),
    amount: Number(input.amount || 0) || undefined,
    date: input.date || todayKey(),
    created_at: now,
    updated_at: now,
  };
  writeLifeModuleItems(key, [item, ...readLifeModuleItems(key)]);
  return item;
}

function calcLifeScore(snapshot: Snapshot | null) {
  const today = todayKey();
  const todos = snapshot?.todos || [];
  const todayTodos = todos.filter((t) => t.due_date === today);
  const doneTodos = todayTodos.filter((t) => t.done).length;
  const routines = (snapshot?.routines || []).filter((r) => r.active);
  const routineDone = routines.filter((r) => (snapshot?.routineChecks || []).some((c) => c.routine_id === r.id && c.check_date === today)).length;
  const todayExpense = (snapshot?.budget || []).filter((b) => b.type === "expense" && b.spend_date === today).reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const inbox = readMindInboxItems().length;
  const todoScore = todayTodos.length ? Math.round((doneTodos / todayTodos.length) * 25) : 18;
  const routineScore = routines.length ? Math.round((routineDone / routines.length) * 25) : 15;
  const moneyScore = todayExpense <= 3000 ? 22 : todayExpense <= 6000 ? 16 : 10;
  const inboxScore = inbox <= 2 ? 20 : inbox <= 6 ? 14 : 8;
  return Math.min(100, todoScore + routineScore + moneyScore + inboxScore);
}

function buildTimelineRows(snapshot: Snapshot | null, moduleItems: LifeModuleItem[]) {
  const today = todayKey();
  const rows: { time: string; title: string; body: string; page: PageKey }[] = [];
  (snapshot?.events || []).filter((e) => e.event_date === today).forEach((e) => rows.push({ time: e.start_time || "予定", title: e.title, body: e.note || "予定", page: "calendar" }));
  (snapshot?.budget || []).filter((b) => b.spend_date === today).forEach((b) => rows.push({ time: "支出", title: `${b.type === "income" ? "収入" : b.type === "charge" ? "移動" : "支出"} ${yen(Number(b.amount || 0))}`, body: `${b.category} ${b.memo || ""}`, page: "budget" }));
  (snapshot?.memos || []).filter((m) => getCreatedDateKey(m.created_at) === today).slice(0, 8).forEach((m) => rows.push({ time: "メモ", title: "メモ追加", body: m.content, page: "memos" }));
  moduleItems.forEach((item) => rows.push({ time: item.date || today, title: item.title, body: item.note, page: "timeline" }));
  return rows.slice(0, 30);
}

function LifeModulePanel({
  config,
  snapshot,
  setPage,
  refreshSnapshot,
}: {
  config: LifeModuleConfig;
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
  refreshSnapshot: (reason?: string) => Promise<void>;
}) {
  const [items, setItems] = useState<LifeModuleItem[]>(() => readLifeModuleItems(config.key));
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState(config.categories[0] || "メモ");
  const [status, setStatus] = useState(config.statuses[0] || "未整理");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayKey());
  const [editing, setEditing] = useState<LifeModuleItem | null>(null);

  function persist(next: LifeModuleItem[]) {
    setItems(next);
    writeLifeModuleItems(config.key, next);
  }

  function addItem() {
    if (!title.trim() && !note.trim()) return;
    const item = addLifeModuleItem(config.key, { title: title.trim() || note.slice(0, 60), note, category, status, amount, date });
    setItems([item, ...items].slice(0, 400));
    setTitle("");
    setNote("");
    setAmount(0);
  }

  function updateItem() {
    if (!editing) return;
    const now = new Date().toISOString();
    const next = items.map((item) =>
      item.id === editing.id ? { ...editing, updated_at: now } : item,
    );
    persist(next);
    setEditing(null);
  }

  function deleteItem(id: string) {
    persist(items.filter((item) => item.id !== id));
  }

  async function connectToMoney(item: LifeModuleItem) {
    const value = Number(item.amount || extractYenAmount(`${item.title} ${item.note}`) || 0);
    if (!value) return alert("金額が見つからないよ。金額を入れると家計簿に送れるよ。");
    const { error } = await supabase.from("budget_logs").insert({
      spend_date: item.date || todayKey(),
      type: "expense",
      category: config.key === "placelog" ? "カフェ" : config.key === "shoppingmission" ? "食費" : "その他",
      amount: value,
      wallet: "財布",
      payment_method: "財布",
      memo: `${config.title}: ${item.title}`,
    } as any);
    if (error) return alert("家計簿登録に失敗: " + error.message);
    await refreshSnapshot("Life Moduleから家計簿へ同期中...");
    persist(items.map((row) => row.id === item.id ? { ...row, status: "家計簿登録済み" } : row));
  }

  const score = calcLifeScore(snapshot);
  const timelineRows = config.key === "timeline" ? buildTimelineRows(snapshot, items) : [];
  const todayBudget = (snapshot?.budget || []).filter((b) => b.spend_date === todayKey() && b.type === "expense").reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const undoneTodos = (snapshot?.todos || []).filter((t) => !t.done).slice(0, 3);
  const todayEvents = (snapshot?.events || []).filter((e) => e.event_date === todayKey()).slice(0, 4);
  const mindInboxCount = readMindInboxItems().length;

  return (
    <div className="life-module-page space-y-4">
      <GlassCard className="life-module-hero">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-end">
          <div>
            <p className="text-xs font-black tracking-[0.32em] text-sky-100/60">LIFE COMMAND OS / MODULE</p>
            <h2 className="mt-2 text-3xl font-black sm:text-5xl">{config.icon} {config.title}</h2>
            <p className="mt-2 text-lg font-black text-sky-50/82">{config.subtitle}</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">{config.description}</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="life-module-stat"><span>記録</span><b>{items.length}</b></div>
            <div className="life-module-stat"><span>Inbox</span><b>{mindInboxCount}</b></div>
            <div className="life-module-stat"><span>Score</span><b>{score}</b></div>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <GlassCard>
          <h3 className="text-xl font-black">追加 / 編集</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_160px_160px]">
            <Field placeholder={config.placeholder} value={title} onChange={(e) => setTitle(e.target.value)} />
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
              {config.categories.map((name) => <option key={name}>{name}</option>)}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
              {config.statuses.map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[160px_160px_1fr]">
            <Field type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <Field type="number" placeholder="金額 任意" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
            <TextArea className="min-h-24" placeholder="詳細メモ" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <PrimaryButton onClick={addItem}>追加する</PrimaryButton>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-black">連携ショートカット</h3>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {config.quickLinks.map((pageKey) => {
              const nav = navItems.find((n) => n.key === pageKey);
              return (
                <button key={pageKey} onClick={() => setPage(pageKey)} className="rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left">
                  <p className="text-lg">{nav?.icon || "🔗"}</p>
                  <p className="mt-1 text-sm font-black">{nav?.label || pageKey}</p>
                </button>
              );
            })}
          </div>
          <div className="mt-4 rounded-3xl border border-sky-200/14 bg-sky-300/10 p-4">
            <p className="text-sm leading-7 text-sky-50/78">
              {config.key === "todaycommand" && `今日の予定 ${todayEvents.length}件 / 未完了TODO ${undoneTodos.length}件 / 今日の支出 ${yen(todayBudget)}。`}
              {config.key === "lowenergy" && "最低限3つだけ表示する設計。水・家計簿1件・明日の予定確認だけでもOK。"}
              {config.key === "outing" && "持ち物・買い物・交通費・財布残高を見る導線をまとめているよ。"}
              {config.key === "shoppingmission" && "購入済みにしたものは金額を入れて家計簿登録候補にできるよ。"}
              {config.key === "paymentcalendar" && "Money Hubの固定費やサブスクと一緒に確認する前提のページだよ。"}
              {config.key === "lifescore" && `今日のLife Scoreは ${score}点。ゲーム感覚の目安として軽く見てね。`}
              {!["todaycommand","lowenergy","outing","shoppingmission","paymentcalendar","lifescore"].includes(config.key) && "このページの記録はlocalStorageに追加保存するから、既存Supabaseデータは壊さないよ。"}
            </p>
          </div>
        </GlassCard>
      </div>

      {config.key === "timeline" && (
        <GlassCard>
          <h3 className="text-xl font-black">今日のタイムライン</h3>
          <div className="mt-4 space-y-2">
            {timelineRows.map((row, index) => (
              <button key={`${row.title}-${index}`} onClick={() => setPage(row.page)} className="w-full rounded-2xl bg-black/25 p-3 text-left">
                <p className="text-xs font-black text-sky-100/55">{row.time}</p>
                <p className="mt-1 font-black">{row.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-white/55">{row.body}</p>
              </button>
            ))}
            {!timelineRows.length && <Empty text="今日のタイムラインはまだ空だよ。" />}
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="text-xl font-black">記録一覧</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} id={`life-module-${config.key}-${item.id}`} className="rounded-3xl border border-white/10 bg-black/24 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black text-sky-100/50">{item.category} / {item.status}</p>
                  <h4 className="mt-1 truncate text-lg font-black">{item.title}</h4>
                </div>
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[10px] font-black text-white/55">{item.date}</span>
              </div>
              {item.amount ? <p className="mt-2 text-xl font-black text-sky-100">{yen(item.amount)}</p> : null}
              {item.note && <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-white/62">{item.note}</p>}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button onClick={() => setEditing(item)} className="rounded-xl bg-white/10 px-2 py-2 text-xs font-black">編集</button>
                {(config.key === "shoppingmission" || config.key === "placelog" || config.key === "paymentcalendar") && (
                  <button onClick={() => connectToMoney(item)} className="rounded-xl bg-sky-300/20 px-2 py-2 text-xs font-black text-sky-50">家計簿</button>
                )}
                <button onClick={() => deleteItem(item.id)} className="rounded-xl bg-red-500 px-2 py-2 text-xs font-black">削除</button>
              </div>
            </div>
          ))}
          {!items.length && <Empty text="まだ記録がないよ。上の入力欄から追加できるよ。" />}
        </div>
      </GlassCard>

      {editing && (
        <Modal title="記録を編集" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className="w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
              {config.categories.map((name) => <option key={name}>{name}</option>)}
            </select>
            <select value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value })} className="w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
              {config.statuses.map((name) => <option key={name}>{name}</option>)}
            </select>
            <Field type="date" value={editing.date || todayKey()} onChange={(e) => setEditing({ ...editing, date: e.target.value })} />
            <Field type="number" value={editing.amount || ""} onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })} />
            <TextArea value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
            <button onClick={updateItem} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">保存する</button>
          </div>
        </Modal>
      )}
    </div>
  );
}



type TodoBoostMeta = {
  focus: "must" | "should" | "could";
  energy: "low" | "mid" | "high";
  minutes: number;
  postpone: number;
  steps: string[];
};

type MemoBoostMeta = {
  kind: string;
  tags: string[];
  pinned: boolean;
  favorite: boolean;
  archived: boolean;
  updated_at: string;
};

type FutureLetterItem = {
  id: string;
  title: string;
  letterType: string;
  openDate: string;
  body: string;
  currentMood: string;
  futureLine: string;
  source?: string;
  created_at: string;
  updated_at: string;
};

type AiNewsSavedItem = {
  id: string;
  title: string;
  summary: string;
  category: string;
  importance: string;
  relation: string;
  source: string;
  publishedAt: string;
  readLater: boolean;
  created_at: string;
};

const TODO_BOOST_KEY = "lifeTodoBoostMetaV1";
const MEMO_BOOST_KEY = "lifeMemoBoostMetaV1";
const FUTURE_LETTER_KEY = "lifeFutureLettersV1";
const AI_NEWS_SAVED_KEY = "lifeAiNewsSavedItemsV1";

function readLifeJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLifeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function readTodoBoostMeta(): Record<string, TodoBoostMeta> {
  return readLifeJson<Record<string, TodoBoostMeta>>(TODO_BOOST_KEY, {});
}

function writeTodoBoostMeta(value: Record<string, TodoBoostMeta>) {
  writeLifeJson(TODO_BOOST_KEY, value);
}

function getTodoBoost(meta: Record<string, TodoBoostMeta>, id: string): TodoBoostMeta {
  return meta[id] || { focus: "should", energy: "mid", minutes: 15, postpone: 0, steps: [] };
}

function readMemoBoostMeta(): Record<string, MemoBoostMeta> {
  return readLifeJson<Record<string, MemoBoostMeta>>(MEMO_BOOST_KEY, {});
}

function writeMemoBoostMeta(value: Record<string, MemoBoostMeta>) {
  writeLifeJson(MEMO_BOOST_KEY, value);
}

function getMemoBoost(meta: Record<string, MemoBoostMeta>, id: string): MemoBoostMeta {
  return meta[id] || {
    kind: "通常メモ",
    tags: [],
    pinned: false,
    favorite: false,
    archived: false,
    updated_at: new Date().toISOString(),
  };
}

function readFutureLetters(): FutureLetterItem[] {
  return readLifeJson<FutureLetterItem[]>(FUTURE_LETTER_KEY, []);
}

function writeFutureLetters(items: FutureLetterItem[]) {
  writeLifeJson(FUTURE_LETTER_KEY, items.slice(0, 300));
}

function addFutureLetter(input: Partial<FutureLetterItem>) {
  const now = new Date().toISOString();
  const item: FutureLetterItem = {
    id: `future-letter-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title: input.title || "未来の自分への手紙",
    letterType: input.letterType || "未来の自分へ",
    openDate: input.openDate || dateMinus(todayKey(), -30),
    body: input.body || "",
    currentMood: input.currentMood || "普通",
    futureLine: input.futureLine || "未来の自分へ、今の気持ちを忘れないでね。",
    source: input.source || "manual",
    created_at: now,
    updated_at: now,
  };
  writeFutureLetters([item, ...readFutureLetters()]);
  return item;
}

function readAiNewsSavedItems(): AiNewsSavedItem[] {
  return readLifeJson<AiNewsSavedItem[]>(AI_NEWS_SAVED_KEY, []);
}

function writeAiNewsSavedItems(items: AiNewsSavedItem[]) {
  writeLifeJson(AI_NEWS_SAVED_KEY, items.slice(0, 200));
}

function stripHtmlText(value: string) {
  return String(value || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

function templateFutureLetterBody(templateName: string) {
  const map: Record<string, string> = {
    "今の自分の状態": "今の自分の状態：\n\n今の生活：\n\n今の気持ち：\n\n未来の自分へ残したいこと：",
    "今頑張っていること": "今頑張っていること：\n\nなぜ頑張っているか：\n\n未来の自分に見てほしいところ：",
    "未来の自分に聞きたいこと": "未来の自分に聞きたいこと：\n\n今の自分が迷っていること：\n\n答え合わせしたいこと：",
    "忘れてほしくないこと": "忘れてほしくないこと：\n\n大事にしたい感覚：\n\n今の自分からの一言：",
    "未来の自分への一言": "未来の自分へ。\n\n今の自分はここで踏ん張っているよ。\n\n開封した時、少しでも前に進めていたらうれしい。",
    "今の悩み": "今の悩み：\n\n本当はどうしたいか：\n\n未来の自分に託したいこと：",
    "今の目標": "今の目標：\n\n期限：\n\n小さな次の一歩：\n\n未来の自分へ：",
    "開封した時に思い出してほしいこと": "開封した時に思い出してほしいこと：\n\nこの日の空気：\n\nこの時期の自分が大事にしていたこと：",
  };
  return map[templateName] || "";
}

function splitTags(value: string) {
  return String(value || "")
    .split(/[,\s、#]+/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12);
}

function buildTodoSteps(title: string) {
  const lower = title.toLowerCase();
  if (/家計簿|money|hub|予算|支出/.test(lower)) {
    return [
      "現在の家計簿コードを確認",
      "入力フォームを確認",
      "支出履歴の表示を確認",
      "保存処理を確認",
      "スマホ表示を確認",
      "npm run build を実行",
    ];
  }
  if (/ui|gui|デザイン|スマホ|画面/.test(lower)) {
    return [
      "現実のスクショを確認",
      "崩れている箇所を1つ選ぶ",
      "CSSだけで直せるか確認",
      "スマホ幅で表示確認",
      "PC版が崩れていないか確認",
    ];
  }
  return [
    "目的を1行で書く",
    "最初の5分でできる作業に分ける",
    "必要なファイルや情報を確認",
    "小さい修正を1つ実行",
    "保存・表示・buildを確認",
  ];
}

function parseAiNewsCards(result: string): AiNewsSavedItem[] {
  const source = String(result || "").trim();
  if (!source) {
    return [
      {
        id: "sample-ai-news-1",
        title: "AIニュースを取得するとここにカード化されます",
        summary: "ニュース取得後、内容を3行要約カードとして保存・TODO化・Project Lab化できます。",
        category: "AIツール",
        importance: "中",
        relation: "Life Command OSに関係あり",
        source: "未取得",
        publishedAt: todayKey(),
        readLater: false,
        created_at: new Date().toISOString(),
      },
    ];
  }
  const chunks = source
    .split(/\n\s*\n|---+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 8);
  return chunks.map((chunk, index) => {
    const lines = chunk.split("\n").map((line) => line.replace(/^[-*#\d.\s]+/, "").trim()).filter(Boolean);
    const title = lines[0]?.slice(0, 90) || `AIニュース ${index + 1}`;
    const body = lines.slice(1).join(" ") || chunk;
    const category =
      /ui|ux|デザイン/i.test(chunk) ? "UI/UX" :
      /openai|chatgpt/i.test(chunk) ? "ChatGPT / OpenAI" :
      /program|code|開発|typescript|next/i.test(chunk) ? "プログラミング" :
      /image|画像/i.test(chunk) ? "画像生成" :
      "生成AI";
    const relation =
      /ui|ux|app|アプリ|開発|code|コード/i.test(chunk)
        ? "Life Command OSに関係あり"
        : /fitness|筋トレ|health/i.test(chunk)
          ? "筋トレアプリに関係あり"
          : "今は関係薄い";
    return {
      id: `ai-news-card-${Date.now()}-${index}`,
      title,
      summary: body.slice(0, 220),
      category,
      importance: relation === "Life Command OSに関係あり" ? "高" : "中",
      relation,
      source: "AIニュース",
      publishedAt: todayKey(),
      readLater: false,
      created_at: new Date().toISOString(),
    };
  });
}

function TodoUpgradePanel({
  todos,
  refreshSnapshot,
}: {
  todos: Todo[];
  refreshSnapshot: (reason?: string) => Promise<void>;
}) {
  const [meta, setMeta] = useState<Record<string, TodoBoostMeta>>(() => readTodoBoostMeta());
  const activeTodos = todos.filter((todo) => !todo.done).slice(0, 80);
  const todayTodos = activeTodos.filter((todo) => !todo.due_date || todo.due_date <= todayKey()).slice(0, 30);

  function saveMeta(next: Record<string, TodoBoostMeta>) {
    setMeta(next);
    writeTodoBoostMeta(next);
  }

  function updateTodoMeta(id: string, patch: Partial<TodoBoostMeta>) {
    const current = getTodoBoost(meta, id);
    saveMeta({ ...meta, [id]: { ...current, ...patch } });
  }

  async function postponeTodo(todo: Todo) {
    const current = getTodoBoost(meta, todo.id);
    updateTodoMeta(todo.id, { postpone: current.postpone + 1 });
    const { error } = await supabase
      .from("todos")
      .update({ due_date: dateMinus(todayKey(), -1) })
      .eq("id", todo.id);
    if (error) return alert("先送り保存に失敗: " + error.message);
    setGuideDraft("明日に回したよ。責めるためじゃなく、次に着手しやすくする記録だよ。");
    await refreshSnapshot("TODO先送り中...");
  }

  async function addStepTodos(todo: Todo) {
    const steps = getTodoBoost(meta, todo.id).steps.length
      ? getTodoBoost(meta, todo.id).steps
      : buildTodoSteps(todo.title);
    const rows = steps.map((step) => ({
      title: `${todo.title} / ${step}`,
      priority: todo.priority || "normal",
      due_date: todo.due_date || todayKey(),
      done: false,
    }));
    const { error } = await supabase.from("todos").insert(rows);
    if (error) return alert("分解TODOの保存に失敗: " + error.message);
    setGuideDraft("大きいTODOを小さいステップに分解して追加したよ。");
    await refreshSnapshot("TODO分解を同期中...");
  }

  const focusLabels: Record<TodoBoostMeta["focus"], string> = {
    must: "絶対やる",
    should: "できればやる",
    could: "余裕があれば",
  };
  const energyLabels: Record<TodoBoostMeta["energy"], string> = {
    low: "低エネルギー",
    mid: "中エネルギー",
    high: "高エネルギー",
  };

  return (
    <GlassCard className="todo-command-upgrade">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.28em] text-sky-100/55">TODO COMMAND</p>
          <h3 className="mt-2 text-2xl font-black">今日の3つ / エネルギー別TODO</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">
            全部やる前提ではなく、今日の体力で選びやすい形に整理するカードだよ。
          </p>
        </div>
        <div className="rounded-2xl bg-sky-300/10 px-4 py-3 text-sm font-black text-sky-50">
          未完了 {activeTodos.length}件
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {(["must", "should", "could"] as TodoBoostMeta["focus"][]).map((focus) => {
          const bucket = todayTodos.filter((todo) => getTodoBoost(meta, todo.id).focus === focus).slice(0, 5);
          return (
            <div key={focus} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="font-black">{focusLabels[focus]}</p>
              <div className="mt-3 space-y-2">
                {bucket.map((todo) => {
                  const itemMeta = getTodoBoost(meta, todo.id);
                  return (
                    <div key={todo.id} className="rounded-2xl bg-white/[0.06] p-3">
                      <p className="text-sm font-black">{todo.title}</p>
                      <p className="mt-1 text-xs text-white/48">
                        {energyLabels[itemMeta.energy]} / {itemMeta.minutes}分 / 先送り{itemMeta.postpone}回
                      </p>
                    </div>
                  );
                })}
                {!bucket.length && <p className="text-sm text-white/45">ここはまだ空だよ。</p>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {todayTodos.slice(0, 8).map((todo) => {
          const itemMeta = getTodoBoost(meta, todo.id);
          return (
            <div key={todo.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
              <p className="font-black">{todo.title}</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <select
                  value={itemMeta.focus}
                  onChange={(e) => updateTodoMeta(todo.id, { focus: e.target.value as TodoBoostMeta["focus"] })}
                  className="rounded-2xl border border-white/15 bg-slate-950/90 p-3 text-sm text-white"
                >
                  <option value="must">絶対</option>
                  <option value="should">できれば</option>
                  <option value="could">余裕</option>
                </select>
                <select
                  value={itemMeta.energy}
                  onChange={(e) => updateTodoMeta(todo.id, { energy: e.target.value as TodoBoostMeta["energy"] })}
                  className="rounded-2xl border border-white/15 bg-slate-950/90 p-3 text-sm text-white"
                >
                  <option value="low">低</option>
                  <option value="mid">中</option>
                  <option value="high">高</option>
                </select>
                <select
                  value={itemMeta.minutes}
                  onChange={(e) => updateTodoMeta(todo.id, { minutes: Number(e.target.value) })}
                  className="rounded-2xl border border-white/15 bg-slate-950/90 p-3 text-sm text-white"
                >
                  {[3, 5, 15, 30, 60].map((m) => <option key={m} value={m}>{m}分</option>)}
                </select>
                <button onClick={() => postponeTodo(todo)} className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black">
                  明日へ
                </button>
              </div>
              <div className="mt-3 rounded-2xl bg-sky-300/10 p-3">
                <p className="text-xs font-black text-sky-100/60">分解ステップ</p>
                <div className="mt-2 space-y-1 text-sm text-white/65">
                  {(itemMeta.steps.length ? itemMeta.steps : buildTodoSteps(todo.title)).map((step) => (
                    <p key={step}>・{step}</p>
                  ))}
                </div>
                <button onClick={() => addStepTodos(todo)} className="mt-3 rounded-2xl bg-sky-200 px-4 py-2 text-sm font-black text-black">
                  ステップをTODOに追加
                </button>
              </div>
              {itemMeta.postpone >= 3 && (
                <p className="mt-3 rounded-2xl bg-amber-300/10 p-3 text-sm text-amber-50/80">
                  このTODOは{itemMeta.postpone}回先送りされています。小さく分解すると進めやすいかもしれません。
                </p>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

function MemoUpgradePanel({
  memos,
  refreshSnapshot,
  onDraft,
}: {
  memos: Memo[];
  refreshSnapshot: (reason?: string) => Promise<void>;
  onDraft: (text: string) => void;
}) {
  const [meta, setMeta] = useState<Record<string, MemoBoostMeta>>(() => readMemoBoostMeta());
  const [query, setQuery] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [kindInput, setKindInput] = useState("通常メモ");

  function saveMeta(next: Record<string, MemoBoostMeta>) {
    setMeta(next);
    writeMemoBoostMeta(next);
  }

  function updateMemoMeta(id: string, patch: Partial<MemoBoostMeta>) {
    const current = getMemoBoost(meta, id);
    saveMeta({ ...meta, [id]: { ...current, ...patch, updated_at: new Date().toISOString() } });
  }

  async function convertMemo(memo: Memo, target: "todo" | "diary" | "future" | "project" | "bug" | "decision" | "inbox" | "prompt") {
    const text = memo.content.trim();
    if (!text) return;
    if (target === "todo") {
      const { error } = await supabase.from("todos").insert({
        title: text.slice(0, 90),
        priority: "normal",
        due_date: todayKey(),
        done: false,
      });
      if (error) return alert("TODO化に失敗: " + error.message);
      await refreshSnapshot("メモをTODO化中...");
      return;
    }
    if (target === "diary") {
      const { error } = await supabase.from("diary_entries").insert({
        entry_date: todayKey(),
        mood: "普通",
        title: "メモからDiary",
        content: `<p>${text.replace(/\n/g, "<br />")}</p>`,
        image_url: null,
      });
      if (error) return alert("Diary化に失敗: " + error.message);
      await refreshSnapshot("メモをDiaryへ同期中...");
      return;
    }
    if (target === "future") {
      addFutureLetter({
        title: `メモから未来の自分へ`,
        body: text,
        openDate: dateMinus(todayKey(), -30),
        source: "memo",
      });
      setGuideDraft("メモからFuture Letterを作ったよ。");
      return;
    }
    if (target === "project") addLifeModuleItem("projectlab", { title: text.slice(0, 80), note: text, category: "メモから", status: "未着手" });
    if (target === "bug") addLifeModuleItem("bugcenter", { title: text.slice(0, 80), note: text, category: "メモから", status: "未修正" });
    if (target === "decision") addLifeModuleItem("decisionlog", { title: text.slice(0, 80), note: text, category: "メモから", status: "検討中" });
    if (target === "prompt") {
      const promptText = `以下のメモをもとに、実装指示として整理してください。\n\n【目的】\n\n【守ること】\n- 既存機能を壊さない\n- 既存データを壊さない\n\n【元メモ】\n${text}`;
      addLifeModuleItem("promptvault", { title: text.slice(0, 80), note: promptText, category: "AI依頼文", status: "使える" });
      onDraft(promptText);
    }
    if (target === "inbox") {
      const next = [
        {
          id: `mind-inbox-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          content: text,
          originalCategory: "memo" as MindCaptureCategory,
          created_at: new Date().toISOString(),
        },
        ...readMindInboxItems(),
      ];
      writeMindInboxItems(next);
    }
    setGuideDraft("メモを別ページへ送ったよ。");
  }

  const enhancedMemos = memos
    .map((memo) => ({ memo, meta: getMemoBoost(meta, memo.id) }))
    .filter(({ memo, meta }) => {
      const haystack = `${memo.content} ${meta.kind} ${meta.tags.join(" ")}`.toLowerCase();
      return !query.trim() || haystack.includes(query.toLowerCase());
    })
    .sort((a, b) => Number(b.meta.pinned) - Number(a.meta.pinned) || Number(b.meta.favorite) - Number(a.meta.favorite))
    .slice(0, 18);

  return (
    <GlassCard className="memo-command-upgrade">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.28em] text-sky-100/55">MEMO COMMAND</p>
          <h3 className="mt-2 text-2xl font-black">探せる・分類できるメモ</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">
            タグ、種類、ピン留め、変換ボタンで、メモを生活OSの入口にするよ。
          </p>
        </div>
        <Field placeholder="タグ・内容で検索" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {enhancedMemos.map(({ memo, meta }) => (
          <div key={memo.id} className={`rounded-3xl border p-4 ${meta.archived ? "border-white/5 bg-black/10 opacity-60" : "border-white/10 bg-black/20"}`}>
            <div className="flex items-center justify-between gap-2">
              <select
                value={meta.kind}
                onChange={(e) => updateMemoMeta(memo.id, { kind: e.target.value })}
                className="min-w-0 rounded-2xl border border-white/15 bg-slate-950/90 p-2 text-sm text-white"
              >
                {["通常メモ", "アイデア", "気づき", "買い物候補", "予定候補", "家計簿候補", "ルーティン候補", "AI依頼文", "バグメモ", "重要メモ", "後で読む", "開発メモ"].map((kind) => <option key={kind}>{kind}</option>)}
              </select>
              <div className="flex gap-1">
                <button onClick={() => updateMemoMeta(memo.id, { pinned: !meta.pinned })} className="rounded-xl bg-white/10 px-2 py-1 text-xs">{meta.pinned ? "📌" : "ピン"}</button>
                <button onClick={() => updateMemoMeta(memo.id, { favorite: !meta.favorite })} className="rounded-xl bg-white/10 px-2 py-1 text-xs">{meta.favorite ? "⭐" : "☆"}</button>
              </div>
            </div>
            <p className="mt-3 line-clamp-5 whitespace-pre-wrap text-sm leading-6 text-white/70">{memo.content}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {meta.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-sky-300/10 px-2 py-1 text-[11px] font-black text-sky-100">#{tag}</span>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-[1fr_88px] gap-2">
              <Field placeholder="#タグ追加" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
              <button
                onClick={() => {
                  const tags = Array.from(new Set([...meta.tags, ...splitTags(tagInput)]));
                  updateMemoMeta(memo.id, { tags });
                  setTagInput("");
                }}
                className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-black"
              >
                追加
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                ["todo", "TODO"],
                ["diary", "Diary"],
                ["future", "手紙"],
                ["prompt", "AI依頼文"],
                ["project", "開発"],
                ["bug", "バグ"],
                ["decision", "決断"],
                ["inbox", "Inbox"],
              ].map(([target, label]) => (
                <button key={target} onClick={() => convertMemo(memo, target as any)} className="rounded-xl bg-white/10 px-2 py-2 text-xs font-black">
                  {label}へ
                </button>
              ))}
            </div>
            <button onClick={() => updateMemoMeta(memo.id, { archived: !meta.archived })} className="mt-2 w-full rounded-xl bg-white/5 px-2 py-2 text-xs font-black">
              {meta.archived ? "アーカイブ解除" : "アーカイブ"}
            </button>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function DiaryUpgradePanel({
  snapshot,
  diaries,
  setTitle,
  setMood,
  setEditorMode,
  setBlocks,
  setPage,
}: {
  snapshot: Snapshot | null;
  diaries: Diary[];
  setTitle: (value: string) => void;
  setMood: (value: string) => void;
  setEditorMode: (value: "blocks" | "html") => void;
  setBlocks: (value: any) => void;
  setPage: (page: PageKey) => void;
}) {
  const today = todayKey();
  const todayEvents = (snapshot?.events || []).filter((e) => e.event_date === today).length;
  const todayTodos = (snapshot?.todos || []).filter((t) => t.due_date === today);
  const doneTodos = todayTodos.filter((t) => t.done).length;
  const todayExpense = (snapshot?.budget || []).filter((b) => b.spend_date === today && b.type === "expense").reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const todayMemos = (snapshot?.memos || []).filter((m) => getCreatedDateKey(m.created_at) === today).length;
  const routines = (snapshot?.routines || []).filter((r) => r.active);
  const morning = routines.filter((r) => classifyRoutineSlot(r) === "morning");
  const night = routines.filter((r) => classifyRoutineSlot(r) === "night");
  const checks = snapshot?.routineChecks || [];
  const morningRate = morning.length ? Math.round((morning.filter((r) => checks.some((c) => c.routine_id === r.id && c.check_date === today)).length / morning.length) * 100) : 0;
  const nightRate = night.length ? Math.round((night.filter((r) => checks.some((c) => c.routine_id === r.id && c.check_date === today)).length / night.length) * 100) : 0;

  function applyTemplate(name: string) {
    const templates: Record<string, string[]> = {
      "今日のまとめ": ["今日よかったこと：", "今日しんどかったこと：", "今日進んだこと：", "明日に回すこと：", "明日の自分へ："],
      "生活ログ": [`予定：${todayEvents}件`, `TODO完了：${doneTodos}件`, `支出：${yen(todayExpense)}`, `朝ルーティン：${morningRate}%`, `夜ルーティン：${nightRate}%`, "今日の一言："],
      "次に活かす": ["今日の反省ではなく、次に活かすこと：", "小さく変えること：", "明日の最初の一手："],
    };
    setTitle(name);
    setEditorMode("blocks");
    setBlocks((templates[name] || templates["今日のまとめ"]).map((text, index) => ({
      id: `diary-template-${Date.now()}-${index}`,
      kind: index === 0 ? "h2" : "p",
      text,
      color: "#f8fafc",
      bold: index === 0,
      size: index === 0 ? "lg" : "base",
    })));
  }

  function latestDiaryToFutureLetter() {
    const latest = diaries[0];
    if (!latest) return alert("Future LetterにするDiaryがまだないよ。");
    addFutureLetter({
      title: `${latest.entry_date}の自分から`,
      letterType: "未来の自分へ",
      openDate: dateMinus(todayKey(), -30),
      body: stripHtmlText(latest.content),
      currentMood: latest.mood || "普通",
      futureLine: "この日の自分の気持ちを、未来の自分に届ける。",
      source: "diary",
    });
    setGuideDraft("DiaryからFuture Letterを作ったよ。");
    setPage("futureletter");
  }

  return (
    <GlassCard className="diary-command-upgrade">
      <h3 className="text-2xl font-black">今日のまとめカード</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["予定", `${todayEvents}件`],
          ["TODO完了", `${doneTodos}件`],
          ["支出", yen(todayExpense)],
          ["朝Routine", `${morningRate}%`],
          ["夜Routine", night.length ? `${nightRate}%` : "未設定"],
          ["Mind Capture", `${readMindInboxItems().length}件`],
          ["メモ", `${todayMemos}件`],
          ["気分", "記録待ち"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-black/25 p-3">
            <p className="text-xs font-black text-sky-100/50">{label}</p>
            <p className="mt-1 text-xl font-black">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {["今日のまとめ", "生活ログ", "次に活かす"].map((name) => (
          <button key={name} onClick={() => applyTemplate(name)} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">
            {name}テンプレ
          </button>
        ))}
        <button onClick={latestDiaryToFutureLetter} className="rounded-2xl bg-sky-200 px-4 py-3 text-sm font-black text-black">
          Diaryから手紙
        </button>
      </div>
    </GlassCard>
  );
}

function FutureLetterPanel({
  snapshot,
  setPage,
}: {
  snapshot: Snapshot | null;
  setPage: (page: PageKey) => void;
}) {
  const [letters, setLetters] = useState<FutureLetterItem[]>(() => readFutureLetters());
  const [title, setTitle] = useState("");
  const [letterType, setLetterType] = useState("未来の自分へ");
  const [openDate, setOpenDate] = useState(dateMinus(todayKey(), -30));
  const [body, setBody] = useState("");
  const [currentMood, setCurrentMood] = useState("普通");
  const [futureLine, setFutureLine] = useState("");
  const [editing, setEditing] = useState<FutureLetterItem | null>(null);

  function saveLetters(next: FutureLetterItem[]) {
    setLetters(next);
    writeFutureLetters(next);
  }

  function add() {
    if (!body.trim() && !title.trim()) return;
    const item = addFutureLetter({ title: title || "未来の自分への手紙", letterType, openDate, body, currentMood, futureLine });
    setLetters([item, ...letters]);
    setTitle("");
    setBody("");
    setFutureLine("");
  }

  function update() {
    if (!editing) return;
    const next = letters.map((letter) =>
      letter.id === editing.id ? { ...editing, updated_at: new Date().toISOString() } : letter,
    );
    saveLetters(next);
    setEditing(null);
  }

  function remove(id: string) {
    saveLetters(letters.filter((letter) => letter.id !== id));
  }

  function fromLatestDiary() {
    const latest = snapshot?.diaries?.[0];
    if (!latest) return alert("Diaryがまだないよ。");
    const item = addFutureLetter({
      title: `${latest.entry_date}の自分から`,
      letterType: "Diaryから未来の自分へ",
      openDate: dateMinus(todayKey(), -30),
      body: stripHtmlText(latest.content),
      currentMood: latest.mood || "普通",
      futureLine: "この日を未来の自分に届ける。",
      source: "diary",
    });
    setLetters([item, ...letters]);
  }

  const openable = letters.filter((letter) => letter.openDate <= todayKey()).length;

  return (
    <div className="future-letter-page space-y-4">
      <GlassCard className="future-letter-hero">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.34em] text-sky-100/60">TIME CAPSULE</p>
            <h2 className="mt-2 text-4xl font-black">Future Letter / 未来の自分への手紙</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
              未来の日付に向けて手紙を封印する時間カプセル。開封日になったら、過去の自分からの手紙として読めるよ。
            </p>
          </div>
          <div className="rounded-3xl border border-sky-200/16 bg-sky-300/10 p-4">
            <p className="text-xs font-black text-sky-100/55">開封できます</p>
            <p className="mt-1 text-3xl font-black">{openable}通</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-2xl font-black">手紙を書く</h3>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_180px_180px]">
          <Field placeholder="タイトル" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={letterType} onChange={(e) => setLetterType(e.target.value)} className="rounded-2xl border border-white/15 bg-slate-950/90 p-4 text-white">
            {["未来の自分へ", "落ち込んだ時の自分へ", "目標を達成した自分へ", "迷っている自分へ", "誕生日の自分へ", "年末の自分へ", "2028年8月12日の自分へ"].map((name) => <option key={name}>{name}</option>)}
          </select>
          <Field type="date" value={openDate} onChange={(e) => setOpenDate(e.target.value)} />
          <select value={currentMood} onChange={(e) => setCurrentMood(e.target.value)} className="rounded-2xl border border-white/15 bg-slate-950/90 p-4 text-white">
            {["良い", "普通", "疲れ気味", "不安あり", "達成感あり", "頭がごちゃついている", "落ち着いている", "眠い"].map((name) => <option key={name}>{name}</option>)}
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["今の自分の状態", "今頑張っていること", "未来の自分に聞きたいこと", "忘れてほしくないこと", "未来の自分への一言", "今の悩み", "今の目標", "開封した時に思い出してほしいこと"].map((name) => (
            <button key={name} onClick={() => setBody(templateFutureLetterBody(name))} className="rounded-full bg-white/10 px-3 py-2 text-xs font-black">
              {name}
            </button>
          ))}
        </div>
        <TextArea className="mt-3 min-h-56" placeholder="未来の自分に向けて書く" value={body} onChange={(e) => setBody(e.target.value)} />
        <Field className="mt-3" placeholder="未来の自分への一言" value={futureLine} onChange={(e) => setFutureLine(e.target.value)} />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <PrimaryButton onClick={add}>手紙を封印する</PrimaryButton>
          <button onClick={fromLatestDiary} className="rounded-2xl bg-white/10 px-4 py-3 font-black">最新Diaryから作る</button>
          <button onClick={() => setPage("diary")} className="rounded-2xl bg-white/10 px-4 py-3 font-black">Diaryへ</button>
        </div>
      </GlassCard>

      <div className="grid gap-3 lg:grid-cols-2">
        {letters.map((letter) => {
          const open = letter.openDate <= todayKey();
          const days = Math.max(0, Math.ceil((new Date(letter.openDate).getTime() - new Date(todayKey()).getTime()) / 86400000));
          return (
            <GlassCard key={letter.id} className={`future-letter-envelope ${open ? "future-letter-openable" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-sky-100/50">{letter.letterType}</p>
                  <h3 className="mt-1 text-2xl font-black">{letter.title}</h3>
                  <p className="mt-1 text-sm text-white/50">開封日 {letter.openDate} / {letter.currentMood}</p>
                </div>
                <span className={`rounded-full px-3 py-2 text-xs font-black ${open ? "bg-sky-200 text-black" : "bg-white/10 text-white/60"}`}>
                  {open ? "開封できます" : `封印中 あと${days}日`}
                </span>
              </div>
              <div className={`mt-4 rounded-3xl border p-4 ${open ? "border-sky-200/20 bg-sky-300/10" : "border-white/10 bg-black/25 blur-[1px]"}`}>
                <p className="whitespace-pre-wrap text-sm leading-7 text-white/75">
                  {open ? letter.body : "開封日まで内容は封印中です。"}
                </p>
                {open && letter.futureLine && <p className="mt-3 font-black text-sky-100">{letter.futureLine}</p>}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => setEditing(letter)} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">編集</button>
                <button onClick={() => remove(letter.id)} className="rounded-2xl bg-red-500 px-4 py-3 text-sm font-black">削除</button>
              </div>
            </GlassCard>
          );
        })}
        {!letters.length && <Empty text="まだ手紙はないよ。1通だけ未来の自分に残してみよう。" />}
      </div>

      {editing && (
        <Modal title="Future Letterを編集" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <Field type="date" value={editing.openDate} onChange={(e) => setEditing({ ...editing, openDate: e.target.value })} />
            <TextArea value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
            <Field value={editing.futureLine} onChange={(e) => setEditing({ ...editing, futureLine: e.target.value })} />
            <button onClick={update} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">保存する</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function AiNewsUpgradePanel({ result }: { result: string }) {
  const [savedItems, setSavedItems] = useState<AiNewsSavedItem[]>(() => readAiNewsSavedItems());
  const [cards, setCards] = useState<AiNewsSavedItem[]>(() => parseAiNewsCards(result));
  useEffect(() => {
    setCards(parseAiNewsCards(result));
  }, [result]);

  function saveSavedItems(next: AiNewsSavedItem[]) {
    setSavedItems(next);
    writeAiNewsSavedItems(next);
  }

  async function sendNews(card: AiNewsSavedItem, target: "memo" | "todo" | "project" | "prompt" | "future" | "decision" | "later") {
    const text = `【AIニュース】${card.title}\nカテゴリ: ${card.category}\n重要度: ${card.importance}\n関係度: ${card.relation}\n\n${card.summary}`;
    if (target === "memo") {
      const { error } = await supabase.from("memos").insert({ content: text });
      if (error) return alert("メモ保存に失敗: " + error.message);
    }
    if (target === "todo") {
      const { error } = await supabase.from("todos").insert({ title: `AIニュース確認: ${card.title}`.slice(0, 100), priority: "normal", due_date: todayKey(), done: false });
      if (error) return alert("TODO化に失敗: " + error.message);
    }
    if (target === "project") addLifeModuleItem("projectlab", { title: `AIニュース改善案: ${card.title}`.slice(0, 100), note: `${text}\n\n改善案:\n- Life Command OSに活かせる導線を検討\n- UI/AI検索/自動分類への応用を考える`, category: "AIニュース", status: "未着手" });
    if (target === "prompt") addLifeModuleItem("promptvault", { title: `AIニュース依頼文: ${card.title}`.slice(0, 100), note: `次のAIニュースをLife Command OSの改善案に変換してください。\n\n${text}`, category: "AI依頼文", status: "使える" });
    if (target === "future") addFutureLetter({ title: `AI時代の未来の自分へ`, body: text, openDate: dateMinus(todayKey(), -30), source: "ai-news" });
    if (target === "decision") addLifeModuleItem("decisionlog", { title: `AIニュース判断: ${card.title}`.slice(0, 100), note: text, category: "AIニュース", status: "検討中" });
    if (target === "later") {
      saveSavedItems([{ ...card, id: `saved-ai-news-${Date.now()}`, readLater: true, created_at: new Date().toISOString() }, ...savedItems]);
    }
    setGuideDraft("AIニュースを指定先へ送ったよ。");
  }

  return (
    <GlassCard className="ai-news-command-room">
      <h3 className="text-2xl font-black">AIニュース室</h3>
      <p className="mt-2 text-sm leading-6 text-white/60">
        ニュースをカード化して、メモ・TODO・Project Lab・Prompt Vaultへ送れるようにしたよ。
      </p>
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {cards.map((card) => (
          <div key={card.id} className="rounded-3xl border border-white/10 bg-black/25 p-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-300/10 px-3 py-1 text-xs font-black text-sky-100">{card.category}</span>
              <span className="rounded-full bg-amber-300/10 px-3 py-1 text-xs font-black text-amber-100">重要度 {card.importance}</span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/60">{card.relation}</span>
            </div>
            <h4 className="mt-3 text-xl font-black">{card.title}</h4>
            <p className="mt-2 line-clamp-5 text-sm leading-7 text-white/68">{card.summary}</p>
            <p className="mt-2 text-xs text-white/40">{card.source} / {card.publishedAt}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                ["memo", "メモ"],
                ["todo", "TODO"],
                ["project", "改善案"],
                ["prompt", "依頼文"],
                ["future", "手紙"],
                ["decision", "決断"],
                ["later", "あとで"],
              ].map(([target, label]) => (
                <button key={target} onClick={() => sendNews(card, target as any)} className="rounded-xl bg-white/10 px-2 py-2 text-xs font-black">
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {savedItems.length > 0 && (
        <div className="mt-4 rounded-3xl bg-white/[0.06] p-4">
          <p className="font-black">あとで読む {savedItems.length}件</p>
        </div>
      )}
    </GlassCard>
  );
}


function QuickAddFab({
  open,
  onOpen,
  onClose,
  setPage,
  refreshSnapshot,
}: {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  setPage: (p: PageKey) => void;
  refreshSnapshot: (reason?: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [amount, setAmount] = useState(0);

  async function save(category: MindCaptureCategory) {
    if (!text.trim() && category !== "budget") return;
    const message = await persistMindCaptureCandidate({
      id: `quick-${Date.now()}`,
      category,
      content: text || `かんたん支出 ${yen(amount)}`,
      save: true,
      confidence: "確認が必要",
      amount: amount || extractYenAmount(text),
      date: todayKey(),
      source: "manual",
    });
    setText("");
    setAmount(0);
    await refreshSnapshot("Quick Add同期中...");
    setGuideDraft(message);
    onClose();
  }

  return (
    <>
      <button
        onClick={onOpen}
        className="quick-add-fab fixed bottom-24 right-4 z-[85] flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl font-black text-black shadow-2xl lg:bottom-6"
        aria-label="Quick Add"
      >
        ＋
      </button>
      {open && (
        <Modal title="Quick Add / どこでも追加" onClose={onClose}>
          <div className="space-y-3">
            <TextArea
              className="min-h-28"
              placeholder="すぐ記録したいこと。メモ、TODO、予定、家計簿、買い物、Routine候補など。"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Field type="number" placeholder="金額 任意" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([
                ["memo", "メモ"],
                ["todo", "TODO"],
                ["budget", "家計簿"],
                ["shopping", "買い物"],
                ["calendar", "予定"],
                ["routine", "Routine"],
                ["inbox", "Mind Inbox"],
              ] as [MindCaptureCategory, string][]).map(([cat, label]) => (
                <button key={cat} onClick={() => save(cat)} className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black">
                  {label}
                </button>
              ))}
            </div>
            <button onClick={() => { setPage("braindump"); onClose(); }} className="w-full rounded-2xl bg-sky-200 px-4 py-3 font-black text-black">
              Mind Captureを開く
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function CommandPaletteModal({
  snapshot,
  setPage,
  onClose,
  openSearch,
  openQuickAdd,
}: {
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
  onClose: () => void;
  openSearch: () => void;
  openQuickAdd: () => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => collectGlobalSearchResults(snapshot, query), [snapshot, query]);
  const pageResults = useMemo(
    () => navItems.filter((item) => `${item.label} ${item.key}`.toLowerCase().includes(query.toLowerCase())).slice(0, 10),
    [query],
  );
  return (
    <Modal title="Command Palette / ⌘K" onClose={onClose}>
      <div className="space-y-3">
        <Field autoFocus placeholder="ページ移動 / 今日の支出 / ナイトルーティン / 未整理メモ" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => { openQuickAdd(); onClose(); }} className="rounded-2xl bg-white px-4 py-3 font-black text-black">Quick Add</button>
          <button onClick={() => { openSearch(); onClose(); }} className="rounded-2xl bg-white/10 px-4 py-3 font-black">AI検索</button>
        </div>
        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {pageResults.map((item) => (
            <button key={item.key} onClick={() => { setPage(item.key); onClose(); }} className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-left">
              <p className="font-black">{item.icon} {item.label}</p>
            </button>
          ))}
          {results.slice(0, 10).map((row) => (
            <button key={row.id} onClick={() => { setPage(row.page); onClose(); }} className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-left">
              <p className="text-xs font-black text-sky-100/60">{row.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-white/70">{row.body}</p>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}




type MailItem = {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  receivedAt: string;
  unread: boolean;
  important: boolean;
  hasAttachment: boolean;
  source: "manual" | "gmail-ready" | "outlook-ready";
};

type MailDraftItem = {
  id: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "sent-log";
};

type CalendarDraft = {
  title: string;
  event_date: string;
  start_time: string;
  end_time: string;
  category: string;
  note: string;
  location: string;
  repeat: string;
  notify: string;
  allDay: boolean;
  confidence: "保存OK" | "確認が必要";
};

const MAIL_ITEMS_KEY = "lifeMailManualInboxV1";
const MAIL_DRAFTS_KEY = "lifeMailDraftsV1";
const MAIL_SETTINGS_KEY = "lifeMailSettingsV1";

function readMailItems(): MailItem[] {
  return readLifeJson<MailItem[]>(MAIL_ITEMS_KEY, []);
}

function writeMailItems(items: MailItem[]) {
  writeLifeJson(MAIL_ITEMS_KEY, items.slice(0, 300));
}

function readMailDrafts(): MailDraftItem[] {
  return readLifeJson<MailDraftItem[]>(MAIL_DRAFTS_KEY, []);
}

function writeMailDrafts(items: MailDraftItem[]) {
  writeLifeJson(MAIL_DRAFTS_KEY, items.slice(0, 300));
}

function readMailSettings() {
  return readLifeJson(MAIL_SETTINGS_KEY, {
    provider: "未連携",
    email: "",
    lastSync: "",
    syncLimit: 20,
  });
}

function writeMailSettings(value: { provider: string; email: string; lastSync: string; syncLimit: number }) {
  writeLifeJson(MAIL_SETTINGS_KEY, value);
}

function toDateKeyFromDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysKey(base: string, days: number) {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toDateKeyFromDate(d);
}

function getWeekRange(offsetWeeks = 0) {
  const today = new Date(`${todayKey()}T00:00:00`);
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const start = new Date(today);
  start.setDate(today.getDate() + mondayOffset + offsetWeeks * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: toDateKeyFromDate(start), end: toDateKeyFromDate(end) };
}

function getMonthRange() {
  const today = new Date(`${todayKey()}T00:00:00`);
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: toDateKeyFromDate(start), end: toDateKeyFromDate(end) };
}

function inRange(date: string | null | undefined, start: string, end: string) {
  return Boolean(date && date >= start && date <= end);
}

function detectSearchRange(query: string) {
  const q = query.toLowerCase();
  if (/先週/.test(q)) return getWeekRange(-1);
  if (/来週/.test(q)) return getWeekRange(1);
  if (/今週/.test(q)) return getWeekRange(0);
  if (/今月/.test(q)) return getMonthRange();
  if (/昨日/.test(q)) {
    const d = addDaysKey(todayKey(), -1);
    return { start: d, end: d };
  }
  if (/明日/.test(q)) {
    const d = addDaysKey(todayKey(), 1);
    return { start: d, end: d };
  }
  if (/今日/.test(q)) return { start: todayKey(), end: todayKey() };
  return null;
}

function categoryFromText(text: string) {
  if (/歯医者|病院|通院|クリニック/.test(text)) return "通院";
  if (/支払い|スマホ代|家賃|給料|請求|引き落とし/.test(text)) return "支払い";
  if (/仕事|勤務|バイト|会議|打ち合わせ/.test(text)) return "仕事";
  if (/買い物|スーパー|コンビニ|薬局/.test(text)) return "買い物";
  if (/締切|提出|期限/.test(text)) return "締切";
  if (/ルーティン|習慣|毎日|毎週/.test(text)) return "ルーティン";
  if (/休み|休息|睡眠/.test(text)) return "休息";
  if (/アプリ|開発|コード|UI|GUI/.test(text)) return "アプリ開発";
  return "その他";
}

function parseQuickCalendarText(input: string): CalendarDraft {
  const text = input.trim();
  const today = todayKey();
  let eventDate = today;
  let startTime = "";
  let repeat = "なし";
  let confidence: CalendarDraft["confidence"] = "保存OK";

  if (/明日/.test(text)) eventDate = addDaysKey(today, 1);
  if (/今日/.test(text)) eventDate = today;
  const daysLater = text.match(/(\d+)日後/);
  if (daysLater) eventDate = addDaysKey(today, Number(daysLater[1]));
  const md = text.match(/(\d{1,2})月(\d{1,2})日/);
  if (md) {
    const year = new Date().getFullYear();
    eventDate = `${year}-${String(Number(md[1])).padStart(2, "0")}-${String(Number(md[2])).padStart(2, "0")}`;
  }
  const ymd = text.match(/(20\d{2})[\/\-年](\d{1,2})[\/\-月](\d{1,2})/);
  if (ymd) {
    eventDate = `${ymd[1]}-${String(Number(ymd[2])).padStart(2, "0")}-${String(Number(ymd[3])).padStart(2, "0")}`;
  }

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const weekMatch = text.match(/来週([日月火水木金土])/);
  if (weekMatch) {
    const target = weekdays.indexOf(weekMatch[1]);
    const nextWeek = getWeekRange(1).start;
    const base = new Date(`${nextWeek}T00:00:00`);
    base.setDate(base.getDate() + (target === 0 ? 6 : target - 1));
    eventDate = toDateKeyFromDate(base);
  }

  const timeMatch = text.match(/(\d{1,2})[:時](\d{2})?/);
  if (timeMatch) startTime = `${String(Number(timeMatch[1])).padStart(2, "0")}:${String(timeMatch[2] ? Number(timeMatch[2]) : 0).padStart(2, "0")}`;
  if (/朝/.test(text) && !startTime) {
    startTime = "08:00";
    confidence = "確認が必要";
  }
  if (/夜/.test(text) && !startTime) {
    startTime = "20:00";
    confidence = "確認が必要";
  }
  if (/毎週/.test(text)) repeat = "毎週";
  if (/毎月/.test(text)) repeat = "毎月";
  if (/毎日/.test(text)) repeat = "毎日";

  let title = text
    .replace(/今日|明日|来週[日月火水木金土]|毎週|毎月|毎日/g, "")
    .replace(/\d+日後/g, "")
    .replace(/\d{1,2}月\d{1,2}日/g, "")
    .replace(/\d{1,2}[:時]\d{0,2}/g, "")
    .replace(/に|の予定|予定|で/g, " ")
    .trim();
  if (!title) title = "予定";

  const category = categoryFromText(text);
  return {
    title: title.slice(0, 100),
    event_date: eventDate,
    start_time: startTime,
    end_time: "",
    category,
    note: `自然文から追加: ${text}${startTime ? ` / 開始 ${startTime}` : ""} / カテゴリ ${category} / 繰り返し ${repeat}`,
    location: "",
    repeat,
    notify: "なし",
    allDay: !startTime,
    confidence,
  };
}

function buildLifeSearchAnswer(snapshot: Snapshot | null, query: string) {
  const q = query.trim();
  if (!q) return null;
  const range = detectSearchRange(q);
  const budget = snapshot?.budget || [];
  const events = snapshot?.events || [];
  const todos = snapshot?.todos || [];
  const memos = snapshot?.memos || [];
  const diaries = snapshot?.diaries || [];
  const mail = readMailItems();
  const futures = readFutureLetters();
  const modules = lifeModuleConfigs.flatMap((config) =>
    readLifeModuleItems(config.key).map((item) => ({ config, item })),
  );

  if (/支出|料金|使った|カフェ代|交通費|サブスク|費/.test(q)) {
    const selected = range
      ? budget.filter((b) => inRange(b.spend_date, range.start, range.end))
      : budget;
    const expense = selected.filter((b) => b.type === "expense");
    const categoryHint = /カフェ/.test(q) ? "カフェ" : /交通/.test(q) ? "交通費" : /サブスク/.test(q) ? "サブスク" : "";
    const filtered = categoryHint ? expense.filter((b) => b.category.includes(categoryHint) || (b.memo || "").includes(categoryHint)) : expense;
    const total = filtered.reduce((sum, b) => sum + Number(b.amount || 0), 0);
    const byCategory = filtered.reduce<Record<string, number>>((acc, b) => {
      acc[b.category || "その他"] = (acc[b.category || "その他"] || 0) + Number(b.amount || 0);
      return acc;
    }, {});
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];
    return {
      title: `${range ? `${range.start}〜${range.end}` : "対象期間"}の支出まとめ`,
      page: "budget" as PageKey,
      lines: [
        `合計支出：${yen(total)}`,
        topCategory ? `一番多いカテゴリ：${topCategory[0]} ${yen(topCategory[1])}` : "カテゴリ別支出：該当なし",
        `該当履歴：${filtered.length}件`,
      ],
      records: filtered.slice(0, 8).map((b) => `${b.spend_date} ${b.category} ${yen(b.amount)} ${b.memo || ""}`),
    };
  }

  if (/予定|カレンダー|明日|来週|今日|昨日|通院|支払い予定/.test(q)) {
    const selected = range ? events.filter((e) => inRange(e.event_date, range.start, range.end)) : events.slice(0, 12);
    const dueTodos = range ? todos.filter((t) => inRange(t.due_date, range.start, range.end)) : todos.filter((t) => !t.done).slice(0, 8);
    return {
      title: `${range ? `${range.start}〜${range.end}` : "近日"}の予定`,
      page: "calendar" as PageKey,
      lines: [
        `予定：${selected.length}件`,
        `関連TODO：${dueTodos.length}件`,
        selected.length ? `次の予定：${selected[0].event_date} ${selected[0].title}` : "予定はまだ見つかっていません",
      ],
      records: [
        ...selected.slice(0, 8).map((e) => `${e.event_date} ${e.start_time || ""} ${e.title}`),
        ...dueTodos.slice(0, 5).map((t) => `TODO期限 ${t.due_date || "未設定"} ${t.title}`),
      ],
    };
  }

  if (/未完了|TODO|先送り/.test(q)) {
    const meta = readTodoBoostMeta();
    const selected = todos.filter((t) => !t.done);
    const sorted = /先送り/.test(q)
      ? [...selected].sort((a, b) => getTodoBoost(meta, b.id).postpone - getTodoBoost(meta, a.id).postpone)
      : selected;
    return {
      title: /先送り/.test(q) ? "先送りが多いTODO" : "未完了TODO",
      page: "todos" as PageKey,
      lines: [`未完了：${selected.length}件`, `表示：${Math.min(sorted.length, 10)}件`],
      records: sorted.slice(0, 10).map((t) => `${t.due_date || "期限なし"} ${t.title} / 先送り${getTodoBoost(meta, t.id).postpone}回`),
    };
  }

  if (/比較|先週より|今週と先週/.test(q) && /支出|料金|使った/.test(q)) {
    const thisWeek = getWeekRange(0);
    const lastWeek = getWeekRange(-1);
    const thisRows = budget.filter((b) => inRange(b.spend_date, thisWeek.start, thisWeek.end));
    const lastRows = budget.filter((b) => inRange(b.spend_date, lastWeek.start, lastWeek.end));
    const thisTotal = sumExpense(thisRows);
    const lastTotal = sumExpense(lastRows);
    const diff = thisTotal - lastTotal;
    return {
      title: "今週と先週の支出比較",
      page: "budget" as PageKey,
      lines: [
        `今週：${yen(thisTotal)}`,
        `先週：${yen(lastTotal)}`,
        `差額：${diff >= 0 ? "+" : ""}${yen(diff)}`,
      ],
      records: Object.entries(budgetCategoryTotals(thisRows)).slice(0, 8).map(([category, amount]) => `今週 ${category}: ${yen(amount)}`),
    };
  }

  if (/予定がない日|空いてる日|空き日/.test(q)) {
    const targetRange = /来週/.test(q) ? getWeekRange(1) : getWeekRange(0);
    const freeDays = getFreeDaysFromEvents(events, targetRange);
    return {
      title: "予定が少ない日",
      page: "calendar" as PageKey,
      lines: [
        `対象：${targetRange.start}〜${targetRange.end}`,
        `予定がない日：${freeDays.length}日`,
      ],
      records: freeDays.map((day) => `${day} は予定が少なめです`),
    };
  }

  if (/今日やること|今日の司令|今日まとめ/.test(q)) {
    const digest = buildCalendarTodoDigest(snapshot, { start: todayKey(), end: todayKey() });
    return {
      title: "今日やることまとめ",
      page: "todaycommand" as PageKey,
      lines: [
        `今日の予定：${digest.events.length}件`,
        `今日期限のTODO：${digest.todos.length}件`,
        `今日の支出：${yen(sumExpense(budget.filter((b) => b.spend_date === todayKey())))}`,
      ],
      records: [
        ...digest.events.slice(0, 6).map((e) => `予定 ${e.start_time || ""} ${e.title}`),
        ...digest.todos.slice(0, 6).map((t) => `TODO ${t.title}`),
      ],
    };
  }

  if (/paypay|suica|pasmo|財布|残高|銀行/i.test(q)) {
    const accounts = snapshot?.budgetAccounts || [];
    const selected = accounts.filter((a) => {
      const text = `${a.name} ${a.kind}`.toLowerCase();
      return !q || text.includes(q.toLowerCase()) || /残高|財布/.test(q);
    });
    const total = selected.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    return {
      title: "財布・電子マネー残高",
      page: "budget" as PageKey,
      lines: [`対象残高：${yen(total)}`, `口座/財布：${selected.length}件`],
      records: selected.slice(0, 10).map((a) => `${a.name}: ${yen(a.balance)} ${a.kind || ""}`),
    };
  }

  if (/メール|未返信|請求書|予約|添付/.test(q)) {
    const selected = mail.filter((m) =>
      /未返信/.test(q)
        ? /確認|返信|お願いします|要返信/.test(`${m.subject} ${m.body}`)
        : /請求書/.test(q)
          ? /請求|領収|ご利用金額|支払い|¥|円/.test(`${m.subject} ${m.body}`)
          : /添付/.test(q)
            ? m.hasAttachment
            : true,
    );
    return {
      title: "メール検索結果",
      page: "mail" as PageKey,
      lines: [`該当メール：${selected.length}件`, "メール本文は手動取り込み分だけ検索対象です"],
      records: selected.slice(0, 8).map((m) => `${m.receivedAt} ${m.from}「${m.subject}」`),
    };
  }

  if (/手紙|Future|開封/.test(q)) {
    const openable = futures.filter((f) => f.openDate <= todayKey());
    return {
      title: "Future Letter確認",
      page: "futureletter" as PageKey,
      lines: [`開封できる手紙：${openable.length}通`, `保存済み：${futures.length}通`],
      records: openable.slice(0, 8).map((f) => `${f.openDate} ${f.title}`),
    };
  }

  if (/メモ|依頼文|Project|バグ|日記|Diary|レビュー/.test(q)) {
    const rangeMemos = range ? memos.filter((m) => inRange(getCreatedDateKey(m.created_at), range.start, range.end)) : memos;
    const rangeDiaries = range ? diaries.filter((d) => inRange(d.entry_date, range.start, range.end)) : diaries;
    return {
      title: "メモ・日記・モジュール検索",
      page: "memos" as PageKey,
      lines: [
        `メモ：${rangeMemos.length}件`,
        `Diary：${rangeDiaries.length}件`,
        `Life Modules：${modules.length}件`,
      ],
      records: [
        ...rangeMemos.slice(0, 4).map((m) => `メモ ${m.content.slice(0, 60)}`),
        ...rangeDiaries.slice(0, 4).map((d) => `Diary ${d.entry_date} ${d.title || ""}`),
        ...modules.slice(0, 4).map(({ config, item }) => `${config.title} ${item.title}`),
      ],
    };
  }

  return null;
}

async function saveSearchAnswerToMemo(answer: ReturnType<typeof buildLifeSearchAnswer>) {
  if (!answer) return;
  const content = `【AI検索メモ】${answer.title}\n\n${answer.lines.join("\n")}\n\n${answer.records.join("\n")}`;
  const { error } = await supabase.from("memos").insert({ content });
  if (error) return alert("メモ保存に失敗: " + error.message);
  setGuideDraft("AI検索結果をメモに保存したよ。");
}

function CalendarQuickAddPanel({
  refreshSnapshot,
  setSelected,
  setCursorMonth,
}: {
  refreshSnapshot: (reason?: string) => Promise<void>;
  setSelected: (date: string) => void;
  setCursorMonth: (month: string) => void;
}) {
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<CalendarDraft | null>(null);
  const [saving, setSaving] = useState(false);

  function makeDraft(text = input) {
    const next = parseQuickCalendarText(text);
    setDraft(next);
    setSelected(next.event_date);
    setCursorMonth(next.event_date.slice(0, 7));
  }

  async function saveDraft() {
    if (!draft) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("calendar_events").insert({
        title: draft.title,
        event_date: draft.event_date,
        note: [
          draft.note,
          draft.location ? `場所: ${draft.location}` : "",
          draft.notify !== "なし" ? `通知: ${draft.notify}` : "",
        ].filter(Boolean).join("\n"),
      });
      if (error) return alert("予定の保存に失敗: " + error.message);
      setGuideDraft("予定をカレンダーに追加したよ。");
      setInput("");
      setDraft(null);
      await refreshSnapshot("カレンダー同期中...");
    } finally {
      setSaving(false);
    }
  }

  const quicks = [
    ["明日14時に歯医者", "通院"],
    ["今日18時に買い物", "買い物"],
    ["毎週金曜20時に家計簿チェック", "ルーティン"],
    ["3日後にスマホ代支払い", "支払い"],
  ];

  return (
    <GlassCard className="calendar-command-upgrade">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.3em] text-sky-100/55">CALENDAR COMMAND</p>
          <h2 className="mt-2 text-2xl font-black">手軽に予定追加</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            自然な日本語から日付・時間・カテゴリ候補を作って、確認してから保存するよ。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {quicks.map(([text, label]) => (
            <button key={text} onClick={() => { setInput(text); makeDraft(text); }} className="rounded-full bg-white/10 px-3 py-2 text-xs font-black">
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_140px]">
        <Field
          placeholder="例: 明日14時に歯医者 / 来週月曜9時に仕事 / 3日後にスマホ代支払い"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={() => makeDraft()} className="rounded-2xl bg-white px-4 py-3 font-black text-black">
          予定候補
        </button>
      </div>

      {draft && (
        <div className="mt-4 rounded-3xl border border-sky-200/16 bg-sky-300/10 p-4">
          <div className="grid gap-3 md:grid-cols-3">
            <Field value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            <DateField label="日付" value={draft.event_date} onChange={(e) => setDraft({ ...draft, event_date: e.target.value })} />
            <Field placeholder="開始時間 例 14:00" value={draft.start_time} onChange={(e) => setDraft({ ...draft, start_time: e.target.value, allDay: !e.target.value })} />
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="rounded-2xl border border-white/15 bg-slate-950/90 p-4 text-white">
              {["仕事", "外出", "通院", "支払い", "締切", "ルーティン", "買い物", "休息", "アプリ開発", "その他"].map((c) => <option key={c}>{c}</option>)}
            </select>
            <Field placeholder="場所 任意" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
            <select value={draft.notify} onChange={(e) => setDraft({ ...draft, notify: e.target.value })} className="rounded-2xl border border-white/15 bg-slate-950/90 p-4 text-white">
              {["なし", "10分前", "30分前", "1時間前", "前日"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <TextArea className="mt-3 min-h-24" value={draft.note} onChange={(e) => setDraft({ ...draft, note: e.target.value })} />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-2 text-xs font-black ${draft.confidence === "保存OK" ? "bg-emerald-300/20 text-emerald-50" : "bg-amber-300/20 text-amber-50"}`}>
              {draft.confidence}
            </span>
            {draft.confidence === "確認が必要" && <span className="text-sm text-white/55">曖昧な表現があるので、日付や時間を確認してから保存してね。</span>}
            <button onClick={saveDraft} disabled={saving} className="ml-auto rounded-2xl bg-sky-200 px-4 py-3 font-black text-black disabled:opacity-50">
              {saving ? "保存中" : "確認して保存"}
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );
}



function budgetCategoryTotals(rows: BudgetLog[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    if (row.type !== "expense") return acc;
    const key = row.category || "その他";
    acc[key] = (acc[key] || 0) + Number(row.amount || 0);
    return acc;
  }, {});
}

function sumExpense(rows: BudgetLog[]) {
  return rows.filter((row) => row.type === "expense").reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

function getFreeDaysFromEvents(events: EventItem[], range: { start: string; end: string }) {
  const days: string[] = [];
  const cursor = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  while (cursor <= end) {
    const key = toDateKeyFromDate(cursor);
    if (!events.some((event) => event.event_date === key)) days.push(key);
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function buildCalendarTodoDigest(snapshot: Snapshot | null, range: { start: string; end: string }) {
  const events = (snapshot?.events || []).filter((event) => inRange(event.event_date, range.start, range.end));
  const todos = (snapshot?.todos || []).filter((todo) => !todo.done && inRange(todo.due_date, range.start, range.end));
  return { events, todos };
}

function MailOAuthBridgePanel() {
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  function checkGmailOAuth() {
    window.location.href = "/api/mail/gmail/start";
  }

  return (
    <div className="rounded-3xl border border-sky-200/16 bg-sky-300/10 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.28em] text-sky-100/55">GMAIL OAUTH BRIDGE</p>
          <h3 className="mt-1 text-xl font-black">Gmail本格連携の入口</h3>
          <p className="mt-2 text-sm leading-6 text-white/62">
            OAuth開始APIを追加済み。環境変数が未設定なら安全に説明を返し、設定後はGoogle認証へ進める土台だよ。
          </p>
        </div>
        <button onClick={checkGmailOAuth} disabled={loading} className="rounded-2xl bg-white px-4 py-3 font-black text-black disabled:opacity-50">
          {loading ? "確認中" : "Gmail連携を確認"}
        </button>
      </div>
      {status && <p className="mt-3 rounded-2xl bg-black/25 p-3 text-sm leading-6 text-white/75">{status}</p>}
      <div className="mt-3 grid gap-2 text-xs text-white/45 sm:grid-cols-2">
        <p>必要ENV: GOOGLE_CLIENT_ID</p>
        <p>必要ENV: GOOGLE_CLIENT_SECRET</p>
        <p>必要ENV: GOOGLE_GMAIL_REDIRECT_URI</p>
        <p>推奨ENV: NEXT_PUBLIC_APP_URL</p>
      </div>
    </div>
  );
}

function CalendarEventOpsPanel({
  events,
  refreshSnapshot,
  setSelected,
}: {
  events: EventItem[];
  refreshSnapshot: (reason?: string) => Promise<void>;
  setSelected: (date: string) => void;
}) {
  const [filter, setFilter] = useState<"today" | "tomorrow" | "week" | "month" | "payment" | "todo" | "routine" | "list">("today");
  const [editing, setEditing] = useState<EventItem | null>(null);

  const range =
    filter === "tomorrow"
      ? { start: addDaysKey(todayKey(), 1), end: addDaysKey(todayKey(), 1) }
      : filter === "week" || filter === "payment" || filter === "todo" || filter === "routine"
        ? getWeekRange(0)
        : filter === "month"
          ? getMonthRange()
          : { start: todayKey(), end: todayKey() };

  const shown = events
    .filter((event) => (filter === "list" ? true : inRange(event.event_date, range.start, range.end)))
    .filter((event) => {
      const text = `${event.title} ${event.note || ""}`;
      if (filter === "payment") return /支払|請求|家賃|スマホ|サブスク|給料|引き落とし/.test(text);
      if (filter === "todo") return /TODO|締切|提出|期限/.test(text);
      if (filter === "routine") return /Routine|ルーティン|毎週|毎月|毎日/.test(text);
      return true;
    })
    .slice(0, 20);

  async function deleteEvent(event: EventItem) {
    const ok = window.confirm(`「${event.title}」を削除しますか？`);
    if (!ok) return;
    const { error } = await supabase.from("calendar_events").delete().eq("id", event.id);
    if (error) return alert("削除に失敗: " + error.message);
    setGuideDraft("予定を削除したよ。");
    await refreshSnapshot("カレンダー更新中...");
  }

  async function duplicateEvent(event: EventItem) {
    const { error } = await supabase.from("calendar_events").insert({
      title: `${event.title} コピー`,
      event_date: event.event_date,
      note: event.note || "",
    });
    if (error) return alert("複製に失敗: " + error.message);
    setGuideDraft("予定を複製したよ。");
    await refreshSnapshot("カレンダー更新中...");
  }

  async function eventToTodo(event: EventItem) {
    const { error } = await supabase.from("todos").insert({
      title: event.title,
      priority: "normal",
      due_date: event.event_date,
      done: false,
    });
    if (error) return alert("TODO化に失敗: " + error.message);
    setGuideDraft("予定をTODOに追加したよ。");
    await refreshSnapshot("TODO同期中...");
  }

  async function eventToDiary(event: EventItem) {
    const { error } = await supabase.from("diary_entries").insert({
      entry_date: event.event_date,
      mood: "普通",
      title: `予定ログ: ${event.title}`,
      content: `<p>${event.title}</p><p>${event.note || ""}</p>`,
      image_url: null,
    });
    if (error) return alert("Diary化に失敗: " + error.message);
    setGuideDraft("予定をDiaryへ送ったよ。");
    await refreshSnapshot("Diary同期中...");
  }

  function eventToMindInbox(event: EventItem) {
    writeMindInboxItems([
      {
        id: `mind-inbox-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        content: `予定候補: ${event.event_date} ${event.title}\n${event.note || ""}`,
        originalCategory: "calendar" as MindCaptureCategory,
        created_at: new Date().toISOString(),
      },
      ...readMindInboxItems(),
    ]);
    setGuideDraft("予定をMind Inboxへ送ったよ。");
  }

  async function saveEdit() {
    if (!editing) return;
    const { error } = await supabase.from("calendar_events").update({
      title: editing.title,
      event_date: editing.event_date,
      note: editing.note,
    }).eq("id", editing.id);
    if (error) return alert("編集保存に失敗: " + error.message);
    setSelected(editing.event_date);
    setEditing(null);
    setGuideDraft("予定を編集したよ。");
    await refreshSnapshot("カレンダー更新中...");
  }

  return (
    <GlassCard className="calendar-ops-panel">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.28em] text-sky-100/55">CALENDAR OPS</p>
          <h3 className="mt-1 text-2xl font-black">予定リスト / 編集・変換</h3>
          <p className="mt-2 text-sm leading-6 text-white/60">
            今日・明日・今週・支払い予定を切り替えて、予定をTODOやDiaryにも送れるよ。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["today", "今日"],
            ["tomorrow", "明日"],
            ["week", "今週"],
            ["month", "今月"],
            ["payment", "支払い"],
            ["todo", "TODO期限"],
            ["routine", "ルーティン"],
            ["list", "一覧"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key as typeof filter)}
              className={`rounded-full px-3 py-2 text-xs font-black ${filter === key ? "bg-white text-black" : "bg-white/10 text-white/72"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {shown.map((event) => (
          <div key={event.id} className="rounded-3xl border border-white/10 bg-black/24 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs text-sky-100/55">{event.event_date} {event.start_time || ""}</p>
                <h4 className="mt-1 text-lg font-black">{event.title}</h4>
                <p className="mt-1 line-clamp-2 text-sm text-white/55">{event.note || "メモなし"}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                <button onClick={() => setEditing(event)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black">編集</button>
                <button onClick={() => duplicateEvent(event)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black">複製</button>
                <button onClick={() => eventToTodo(event)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black">TODO</button>
                <button onClick={() => eventToDiary(event)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black">Diary</button>
                <button onClick={() => deleteEvent(event)} className="rounded-xl bg-red-500/80 px-3 py-2 text-xs font-black">削除</button>
              </div>
            </div>
            <button onClick={() => eventToMindInbox(event)} className="mt-3 rounded-xl bg-white/5 px-3 py-2 text-xs font-black">
              Mind Inboxへ送る
            </button>
          </div>
        ))}
        {!shown.length && <Empty text="この条件の予定はまだないよ。" />}
      </div>

      {editing && (
        <Modal title="予定を編集" onClose={() => setEditing(null)}>
          <div className="space-y-3">
            <Field value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
            <DateField label="日付" value={editing.event_date} onChange={(e) => setEditing({ ...editing, event_date: e.target.value })} />
            <TextArea value={editing.note || ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
            <button onClick={saveEdit} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">保存する</button>
          </div>
        </Modal>
      )}
    </GlassCard>
  );
}




function GmailLivePanel({
  items,
  persistItems,
  setCompose,
}: {
  items: MailItem[];
  persistItems: (next: MailItem[]) => void;
  setCompose: (next: { to: string; cc: string; bcc: string; subject: string; body: string }) => void;
}) {
  const [status, setStatus] = useState<{ connected?: boolean; email?: string; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [remoteMessages, setRemoteMessages] = useState<MailItem[]>([]);

  async function loadStatus() {
    setLoading(true);
    try {
      const res = await fetch("/api/mail/gmail/status");
      const json = await res.json();
      setStatus(json);
    } catch {
      setStatus({ connected: false, message: "Gmail連携状態の確認に失敗しました。" });
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ maxResults: "10" });
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/mail/gmail/messages?${params.toString()}`);
      const json = await res.json();
      if (!json.ok) {
        alert(json.message || "Gmail取得に失敗しました。");
        return;
      }
      const mapped: MailItem[] = (json.messages || []).map((m: any) => ({
        id: `gmail-${m.id}`,
        from: m.from || "Gmail",
        to: m.to || "",
        subject: m.subject || "(件名なし)",
        body: m.body || m.snippet || "",
        receivedAt: m.date || todayKey(),
        unread: Boolean(m.unread),
        important: Boolean(m.important),
        hasAttachment: Boolean(m.hasAttachment),
        source: "gmail-ready",
      }));
      setRemoteMessages(mapped);
      const known = new Set(items.map((item) => item.id));
      const merged = [...mapped.filter((item) => !known.has(item.id)), ...items].slice(0, 300);
      persistItems(merged);
      setGuideDraft(`Gmailから${mapped.length}件読み込んだよ。`);
    } catch {
      alert("Gmail受信箱の取得に失敗しました。");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
  }, []);

  return (
    <div className="rounded-3xl border border-emerald-200/18 bg-emerald-300/10 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.28em] text-emerald-100/60">GMAIL LIVE</p>
          <h3 className="mt-1 text-xl font-black">Gmail本格連携</h3>
          <p className="mt-2 text-sm leading-6 text-white/62">
            OAuth token交換後、Gmail受信箱を安全にサーバー経由で取得するよ。送信も確認画面からだけ行う設計。
          </p>
          <p className="mt-2 text-sm font-black text-emerald-50/85">
            状態: {status?.connected ? `連携済み ${status.email || ""}` : status?.message || "確認中"}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <button onClick={() => (window.location.href = "/api/mail/gmail/start")} className="rounded-2xl bg-white px-4 py-3 font-black text-black">
            Gmail再連携
          </button>
          <button onClick={loadStatus} disabled={loading} className="rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50">
            状態確認
          </button>
          <button onClick={loadMessages} disabled={loading || !status?.connected} className="rounded-2xl bg-emerald-200 px-4 py-3 font-black text-black disabled:opacity-50">
            受信箱取得
          </button>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_140px]">
        <Field placeholder="Gmail検索 例: newer_than:7d invoice / from:xxx" value={q} onChange={(e) => setQ(e.target.value)} />
        <button onClick={loadMessages} disabled={loading || !status?.connected} className="rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50">
          検索取得
        </button>
      </div>
      {remoteMessages.length > 0 && (
        <div className="mt-3 grid gap-2">
          {remoteMessages.slice(0, 5).map((mail) => (
            <div key={mail.id} className="rounded-2xl bg-black/22 p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-black">{mail.subject}</p>
                  <p className="truncate text-xs text-white/45">From: {mail.from}</p>
                </div>
                <button
                  onClick={() => setCompose({ to: mail.from, cc: "", bcc: "", subject: `Re: ${mail.subject}`, body: `\n\n--- 元メール ---\n${mail.body}` })}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-black"
                >
                  返信下書き
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function MailPanel({ snapshot, refreshSnapshot, setPage }: PanelProps) {
  const [settings, setSettings] = useState(readMailSettings);
  const [items, setItems] = useState<MailItem[]>(() => readMailItems());
  const [drafts, setDrafts] = useState<MailDraftItem[]>(() => readMailDrafts());
  const [selected, setSelected] = useState<MailItem | null>(null);
  const [paste, setPaste] = useState("");
  const [compose, setCompose] = useState({ to: "", cc: "", bcc: "", subject: "", body: "" });
  const [confirmSend, setConfirmSend] = useState(false);
  const [query, setQuery] = useState("");

  function persistItems(next: MailItem[]) {
    setItems(next);
    writeMailItems(next);
  }

  function persistDrafts(next: MailDraftItem[]) {
    setDrafts(next);
    writeMailDrafts(next);
  }

  function saveSettings() {
    const next = { ...settings, lastSync: new Date().toLocaleString(), provider: settings.provider || "Gmail準備中" };
    setSettings(next);
    writeMailSettings(next);
    setGuideDraft("メール連携設定を保存したよ。OAuthトークンはlocalStorageに保存しない設計メモとして扱っているよ。");
  }

  function importMail() {
    if (!paste.trim()) return;
    const lines = paste.split("\n").map((line) => line.trim()).filter(Boolean);
    const subjectLine = lines.find((line) => /^件名[:：]/.test(line));
    const fromLine = lines.find((line) => /^差出人[:：]|^From[:：]/i.test(line));
    const subject = subjectLine?.replace(/^件名[:：]/, "") || lines[0]?.slice(0, 80) || "手動取り込みメール";
    const from = fromLine?.replace(/^差出人[:：]|^From[:：]/i, "") || "手動取り込み";
    const item: MailItem = {
      id: `mail-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      from,
      to: settings.email || "",
      subject,
      body: paste,
      receivedAt: todayKey(),
      unread: true,
      important: /重要|至急|確認|返信|請求|予約/.test(paste),
      hasAttachment: /添付|attachment/i.test(paste),
      source: "manual",
    };
    persistItems([item, ...items]);
    setPaste("");
  }

  function saveDraft(status: MailDraftItem["status"] = "draft") {
    const now = new Date().toISOString();
    const item: MailDraftItem = {
      id: `mail-draft-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...compose,
      createdAt: now,
      updatedAt: now,
      status,
    };
    persistDrafts([item, ...drafts]);
    setGuideDraft(status === "sent-log" ? "送信ログとして保存したよ。実送信はメールアプリで確認してね。" : "メール下書きを保存したよ。");
  }

  function openMailto() {
    const params = new URLSearchParams();
    if (compose.cc) params.set("cc", compose.cc);
    if (compose.bcc) params.set("bcc", compose.bcc);
    params.set("subject", compose.subject);
    params.set("body", compose.body);
    window.location.href = `mailto:${compose.to}?${params.toString()}`;
    saveDraft("sent-log");
    setConfirmSend(false);
  }

  async function sendViaGmailApi() {
    const res = await fetch("/api/mail/gmail/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(compose),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      alert(json.message || "Gmail送信に失敗しました。");
      return;
    }
    saveDraft("sent-log");
    setConfirmSend(false);
    setGuideDraft("Gmailからメールを送信したよ。");
  }

  async function mailToMemo(item: MailItem) {
    const { error } = await supabase.from("memos").insert({ content: `【メールメモ】${item.subject}\nFrom: ${item.from}\n\n${item.body}` });
    if (error) return alert("メモ保存に失敗: " + error.message);
    await refreshSnapshot("メールをメモへ保存中...");
  }

  async function mailToTodo(item: MailItem) {
    const { error } = await supabase.from("todos").insert({
      title: `メール対応: ${item.subject}`.slice(0, 100),
      priority: item.important ? "high" : "normal",
      due_date: todayKey(),
      done: false,
    });
    if (error) return alert("TODO化に失敗: " + error.message);
    await refreshSnapshot("メールをTODOへ保存中...");
  }

  function mailToCalendarCandidate(item: MailItem) {
    const draft = parseQuickCalendarText(item.body);
    addLifeModuleItem("paymentcalendar", {
      title: `メール予定候補: ${item.subject}`,
      note: `${draft.event_date} ${draft.start_time} ${draft.title}\n\n元メール:\n${item.body}`,
      category: "メール予定候補",
      status: "確認",
    });
    setGuideDraft("メールから予定候補を作ったよ。カレンダー保存前に確認できるようPayment Calendarへ送ったよ。");
    setPage("paymentcalendar");
  }

  async function mailToBudgetCandidate(item: MailItem) {
    const amount = extractYenAmount(item.body);
    if (!amount) return alert("金額が見つからなかったよ。本文に¥や円の金額があると候補化できるよ。");
    addLifeModuleItem("paymentcalendar", {
      title: `メール支払い候補: ${item.subject}`,
      note: `支出候補 ${yen(amount)}\nカテゴリ未設定\n\n元メール:\n${item.body}`,
      category: "請求書候補",
      status: "確認",
      amount,
    });
    setGuideDraft("メールから家計簿候補を作ったよ。いきなり保存せず確認ボックスへ送ったよ。");
    setPage("paymentcalendar");
  }

  const filtered = items.filter((item) =>
    !query.trim() || `${item.from} ${item.subject} ${item.body}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="mail-command-page space-y-4">
      <GlassCard className="mail-command-hero">
        <p className="text-xs font-black tracking-[0.32em] text-sky-100/55">LIFE COMMAND OS / MAIL</p>
        <h2 className="mt-2 text-4xl font-black">Mail / メール</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-white/62">
          Gmail / Outlook連携を見据えたメールMVP。今は安全優先で、手動取り込み・下書き・mailto送信・TODO/予定/家計簿候補化に対応しているよ。
        </p>
      </GlassCard>

      <MailOAuthBridgePanel />
      <GmailLivePanel items={items} persistItems={persistItems} setCompose={setCompose} />

      <div className="grid gap-4 xl:grid-cols-[.9fr_1.1fr]">
        <GlassCard>
          <h3 className="text-xl font-black">メール連携設定</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <select value={settings.provider} onChange={(e) => setSettings({ ...settings, provider: e.target.value })} className="rounded-2xl border border-white/15 bg-slate-950/90 p-4 text-white">
              <option>未連携</option>
              <option>Gmail準備中</option>
              <option>Outlook準備中</option>
            </select>
            <Field placeholder="接続中メールアドレス表示用" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
            <Field type="number" placeholder="同期件数" value={settings.syncLimit} onChange={(e) => setSettings({ ...settings, syncLimit: Number(e.target.value) })} />
            <button onClick={saveSettings} className="rounded-2xl bg-white px-4 py-3 font-black text-black">設定を保存</button>
          </div>
          <p className="mt-3 rounded-2xl bg-amber-300/10 p-3 text-sm leading-6 text-amber-50/80">
            Gmail本格連携にはGoogle OAuth、サーバー側トークン保管、必要最小限スコープが必要です。トークンをlocalStorageへ平文保存しない設計にしているよ。
          </p>
          <p className="mt-2 text-xs text-white/45">最終同期: {settings.lastSync || "未同期"}</p>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-black">メール本文を手動取り込み</h3>
          <TextArea className="mt-4 min-h-40" placeholder="メール本文を貼り付け。件名: / 差出人: を含めると自動で読み取るよ。" value={paste} onChange={(e) => setPaste(e.target.value)} />
          <button onClick={importMail} className="mt-3 rounded-2xl bg-sky-200 px-4 py-3 font-black text-black">受信箱に追加</button>
        </GlassCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <GlassCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-black">受信箱</h3>
            <Field placeholder="メール検索" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="mt-4 space-y-2">
            {filtered.map((item) => (
              <button key={item.id} onClick={() => { setSelected(item); persistItems(items.map((m) => m.id === item.id ? { ...m, unread: false } : m)); }} className="w-full rounded-2xl border border-white/10 bg-black/24 p-3 text-left">
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 truncate font-black">{item.subject}</p>
                  <span className="shrink-0 text-xs text-white/45">{item.receivedAt}</span>
                </div>
                <p className="mt-1 text-xs text-sky-100/55">From: {item.from} {item.unread ? " / 未読" : ""} {item.hasAttachment ? " / 添付あり" : ""}</p>
                <p className="mt-1 line-clamp-2 text-sm text-white/55">{item.body}</p>
              </button>
            ))}
            {!filtered.length && <Empty text="メールはまだないよ。手動取り込みから始められるよ。" />}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-xl font-black">本文 / 返信 / 連携</h3>
          {selected ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-white/45">{selected.receivedAt} / From: {selected.from}</p>
              <h4 className="text-2xl font-black">{selected.subject}</h4>
              <p className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-3xl bg-black/25 p-4 text-sm leading-7 text-white/72">{selected.body}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button onClick={() => mailToMemo(selected)} className="rounded-xl bg-white/10 px-2 py-2 text-xs font-black">メモ</button>
                <button onClick={() => mailToTodo(selected)} className="rounded-xl bg-white/10 px-2 py-2 text-xs font-black">TODO</button>
                <button onClick={() => mailToCalendarCandidate(selected)} className="rounded-xl bg-white/10 px-2 py-2 text-xs font-black">予定候補</button>
                <button onClick={() => mailToBudgetCandidate(selected)} className="rounded-xl bg-white/10 px-2 py-2 text-xs font-black">家計簿候補</button>
              </div>
              <button onClick={() => setCompose({ ...compose, to: selected.from, subject: `Re: ${selected.subject}`, body: `\n\n--- 元メール ---\n${selected.body}` })} className="w-full rounded-2xl bg-sky-200 px-4 py-3 font-black text-black">返信下書きを作る</button>
            </div>
          ) : (
            <Empty text="メールを選ぶと本文を表示するよ。" />
          )}
        </GlassCard>
      </div>

      <GlassCard>
        <h3 className="text-xl font-black">新規メール / 下書き</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field placeholder="宛先" value={compose.to} onChange={(e) => setCompose({ ...compose, to: e.target.value })} />
          <Field placeholder="CC" value={compose.cc} onChange={(e) => setCompose({ ...compose, cc: e.target.value })} />
          <Field placeholder="BCC" value={compose.bcc} onChange={(e) => setCompose({ ...compose, bcc: e.target.value })} />
        </div>
        <Field className="mt-3" placeholder="件名" value={compose.subject} onChange={(e) => setCompose({ ...compose, subject: e.target.value })} />
        <TextArea className="mt-3 min-h-48" placeholder="本文" value={compose.body} onChange={(e) => setCompose({ ...compose, body: e.target.value })} />
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button onClick={() => saveDraft("draft")} className="rounded-2xl bg-white/10 px-4 py-3 font-black">下書き保存</button>
          <button onClick={() => setConfirmSend(true)} className="rounded-2xl bg-white px-4 py-3 font-black text-black">送信確認</button>
          <a className="rounded-2xl bg-sky-300/10 px-4 py-3 text-center font-black" href={`mailto:${compose.to}`}>メールアプリを開く</a>
        </div>
        {drafts.length > 0 && <p className="mt-3 text-sm text-white/50">保存済み下書き/送信ログ: {drafts.length}件</p>}
      </GlassCard>

      {confirmSend && (
        <Modal title="送信前確認" onClose={() => setConfirmSend(false)}>
          <div className="space-y-3">
            <p className="text-sm text-white/70">この内容で送信しますか？Gmail APIで送る場合も、この確認画面からだけ送信できる設計です。</p>
            <div className="rounded-2xl bg-black/25 p-3 text-sm">
              <p>宛先: {compose.to}</p>
              <p>件名: {compose.subject}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button onClick={sendViaGmailApi} className="rounded-2xl bg-emerald-200 px-4 py-3 font-black text-black">Gmail APIで送信</button>
              <button onClick={openMailto} className="rounded-2xl bg-white/10 px-4 py-3 font-black">メールアプリで確認</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


type GlobalSearchResult = {
  page: PageKey;
  title: string;
  body: string;
  id: string;
  kind?: "page" | "record";
};
function classifyBrainDump(text: string) {
  const lines = String(text || "")
    .split(/\r?\n|[。！？!?]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const todoWords =
    /(する|やる|買う|行く|予約|確認|連絡|提出|支払|送る|作る|準備|掃除|洗濯|電話|メール|返す|調べる|必要|忘れ)/;
  const eventWords =
    /(予定|集合|予約|面談|病院|歯医者|美容院|イベント|ライブ|会う)/;
  const buyWords = /(買う|購入|欲しい|必要|スーパー|コンビニ|Amazon|アマゾン)/;
  const todos: TodoInsertCandidate[] = [];
  const memos: string[] = [];
  const later: string[] = [];
  for (const line of lines) {
    if (todoWords.test(line))
      todos.push({
        title: line.slice(0, 120),
        priority: /今日|急ぎ|至急|重要|必ず/.test(line) ? "high" : "normal",
        due_date: /今日/.test(line) ? todayKey() : null,
      });
    else if (eventWords.test(line)) memos.push(`予定候補: ${line}`);
    else if (buyWords.test(line))
      todos.push({
        title: line.slice(0, 120),
        priority: "normal",
        due_date: null,
      });
    else if (/あとで|後で|読む|調べ/.test(line)) later.push(line);
    else memos.push(line);
  }
  if (
    !todos.length &&
    !memos.length &&
    !later.length &&
    String(text || "").trim()
  )
    memos.push(String(text).trim());
  return {
    todos: todos.slice(0, 12),
    memos: memos.slice(0, 12),
    later: later.slice(0, 12),
  };
}
function useVoiceInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  function start() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(
        "このブラウザは音声入力に未対応みたい。スマホのキーボード音声入力でも代用できるよ。",
      );
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.continuous = false;
    setListening(true);
    rec.onresult = (event: any) => {
      const text = Array.from(event.results)
        .map((r: any) => r[0]?.transcript || "")
        .join(" ")
        .trim();
      if (text) onText(text);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }
  return { listening, start };
}

function collectGlobalSearchResults(
  snapshot: Snapshot | null,
  query: string,
): GlobalSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const aliases: Record<string, string[]> = {
    "先週のカフェ代": ["カフェ"],
    "今日の支出": ["支出", "家計簿"],
    "明日の予定": ["明日", "予定"],
    "未完了の買い物": ["買い物"],
    "最近書いたアイデア": ["アイデア", "メモ"],
    "夜ルーティン": ["夜", "Routine", "ルーティン"],
    "ルーティン達成率": ["Routine", "ルーティン"],
    "Mind Inbox": ["Mind Inbox", "保留"],
  };
  const expanded = [q, ...(aliases[query.trim()] || [])].map((x) => x.toLowerCase());
  const hit = (text: string) => expanded.some((word) => text.toLowerCase().includes(word));
  const rows: GlobalSearchResult[] = [];
  navItems.forEach((item) => {
    const iconLabel = item.icon.startsWith("/") || item.icon.startsWith("http") ? "🏠" : item.icon;
    if (hit(`${item.label} ${iconLabel} ${item.key}`))
      rows.push({
        page: item.key,
        title: `${iconLabel} ${item.label}`,
        body: `${item.label}ページへ移動`,
        id: `page-${item.key}`,
        kind: "page",
      });
  });
  (snapshot?.memos || []).forEach((m) => {
    if (hit(m.content))
      rows.push({
        page: "memos",
        title: "メモ",
        body: m.content,
        id: `memo-${m.id}`,
        kind: "record",
      });
  });
  (snapshot?.tweets || []).forEach((t) => {
    if (hit(t.content))
      rows.push({
        page: "tweets",
        title: `つぶやき ${t.tweet_date}`,
        body: t.content,
        id: `tweet-${t.id}`,
        kind: "record",
      });
  });
  (snapshot?.todos || []).forEach((t) => {
    if (hit(`${t.title} ${t.location_name || ""}`))
      rows.push({
        page: "todos",
        title: "TODO",
        body: t.title,
        id: `todo-${t.id}`,
        kind: "record",
      });
  });
  (snapshot?.diaries || []).forEach((d) => {
    if (hit(`${d.title || ""} ${d.content}`))
      rows.push({
        page: "diary",
        title: `Diary ${d.entry_date}`,
        body: `${d.title || ""} ${d.content}`,
        id: `diary-${d.id}`,
        kind: "record",
      });
  });
  (snapshot?.budget || []).forEach((b) => {
    if (hit(`${b.category} ${b.memo || ""} ${b.wallet || ""}`))
      rows.push({
        page: "budget",
        title: `家計簿 ${yen(b.amount)}`,
        body: `${b.type === "income" ? "収入" : "支出"} ${b.category} ${b.memo || ""}`,
        id: `budget-${b.id}`,
        kind: "record",
      });
  });
  (snapshot?.coffee || []).forEach((c) => {
    if (hit(`${c.coffee_name} ${c.note || ""}`))
      rows.push({
        page: "coffee",
        title: `コーヒー ${c.drink_date}`,
        body: `${c.coffee_name} ${c.cups}杯 ${c.note || ""}`,
        id: `coffee-${c.id}`,
        kind: "record",
      });
  });
  (snapshot?.events || []).forEach((e) => {
    if (hit(`${e.title} ${e.note || ""}`))
      rows.push({
        page: "calendar",
        title: `予定 ${e.event_date}`,
        body: `${e.title} ${e.note || ""}`,
        id: `event-${e.id}`,
        kind: "record",
      });
  });
  (snapshot?.places || []).forEach((p) => {
    if (hit(`${p.title} ${p.address || ""} ${p.note || ""}`))
      rows.push({
        page: "map",
        title: `場所 ${p.place_date}`,
        body: `${p.title} ${p.address || ""}`,
        id: `place-${p.id}`,
        kind: "record",
      });
  });
  (snapshot?.belongingCards || []).forEach((c) => {
    if (hit(`${c.title} ${c.note || ""}`))
      rows.push({
        page: "belongings",
        title: "持ち物カード",
        body: `${c.title} ${c.note || ""}`,
        id: `belonging-card-${c.id}`,
        kind: "record",
      });
  });
  (snapshot?.belongingItems || []).forEach((i) => {
    if (hit(i.name))
      rows.push({
        page: "belongings",
        title: "持ち物",
        body: i.name,
        id: `belonging-item-${i.id}`,
        kind: "record",
      });
  });
  (snapshot?.routines || []).forEach((r) => {
    if (hit(`${r.title} ${r.note || ""} ${r.routine_time || ""} Routine ルーティン`))
      rows.push({
        page: "routines",
        title: "Routine",
        body: `${cleanRoutineTitle(r.title)} ${r.note || ""}`,
        id: `routine-${r.id}`,
        kind: "record",
      });
  });
  readMindInboxItems().forEach((item) => {
    if (hit(`${item.content} Mind Inbox 保留`))
      rows.push({
        page: "braindump",
        title: "Mind Inbox",
        body: item.content,
        id: item.id,
        kind: "record",
      });
  });
  readMailItems().forEach((mail) => {
    if (hit(`${mail.from} ${mail.to} ${mail.subject} ${mail.body} メール 未返信 請求 予定`))
      rows.push({
        page: "mail",
        title: `メール ${mail.from}`,
        body: `${mail.subject} ${mail.body}`,
        id: `mail-${mail.id}`,
        kind: "record",
      });
  });
  lifeModuleConfigs.forEach((config) => {
    readLifeModuleItems(config.key).forEach((item) => {
      if (hit(`${config.title} ${config.description} ${item.title} ${item.note} ${item.category} ${item.status}`))
        rows.push({
          page: config.page,
          title: config.title,
          body: `${item.title} ${item.note}`,
          id: `life-module-${config.key}-${item.id}`,
          kind: "record",
        });
    });
  });
  return rows.slice(0, 120);
}

function GlobalSearchModal({
  snapshot,
  setPage,
  onClose,
}: {
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [aiHint, setAiHint] = useState("");
  const [aiSearching, setAiSearching] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(
    () => collectGlobalSearchResults(snapshot, deferredQuery),
    [snapshot, deferredQuery],
  );
  const smartAnswer = useMemo(
    () => buildLifeSearchAnswer(snapshot, deferredQuery),
    [snapshot, deferredQuery],
  );

  async function runAISearch() {
    if (!query.trim()) return;
    setAiSearching(true);
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "searchAI",
          text: JSON.stringify({
            query,
            resultPreview: results.slice(0, 12),
            counts: {
              memos: snapshot?.memos?.length || 0,
              todos: snapshot?.todos?.length || 0,
              budget: snapshot?.budget?.length || 0,
              routines: snapshot?.routines?.length || 0,
              events: snapshot?.events?.length || 0,
              mindInbox: readMindInboxItems().length,
              mail: readMailItems().length,
            },
          }),
        }),
      });
      const json = await res.json();
      setAiHint(json.result || "AI検索の補助結果を取得できなかったよ。");
    } catch {
      setAiHint("AI検索に失敗したよ。OPENAI_API_KEYか通信状態を確認してね。");
    } finally {
      setAiSearching(false);
    }
  }
  function jump(page: PageKey, id: string) {
    setPage(page);
    onClose();
    setTimeout(() => {
      if (id.startsWith("page-")) return;
      const el =
        document.getElementById(id) ||
        document.querySelector(`[data-search-id="${id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLElement) {
        el.style.outline = "3px solid rgba(255,255,255,.85)";
        window.setTimeout(() => {
          el.style.outline = "";
        }, 1800);
      }
    }, 250);
  }
  return (
    <Modal title="AI検索 / 全ページ検索" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid gap-2 sm:grid-cols-[1fr_150px]">
          <Field
            autoFocus
            placeholder="予定、支出、メモ、TODO、メールをまとめて検索できます"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            onClick={runAISearch}
            disabled={!query.trim() || aiSearching}
            className="rounded-2xl bg-white px-4 py-3 font-black text-black disabled:opacity-50"
          >
            {aiSearching ? "AI検索中" : "AI検索"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {["先週の支出", "明日の予定", "未完了TODO", "カフェ代", "開封できる手紙", "未整理メモ", "今月のサブスク", "未返信メール"].map((chip) => (
            <button key={chip} onClick={() => setQuery(chip)} className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white/75">
              {chip}
            </button>
          ))}
        </div>
        {smartAnswer && (
          <div className="global-search-answer-card rounded-3xl border border-sky-200/16 bg-sky-300/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black tracking-[0.24em] text-sky-100/55">AI SEARCH ANSWER</p>
                <h3 className="mt-1 text-xl font-black">{smartAnswer.title}</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => jump(smartAnswer.page, `page-${smartAnswer.page}`)} className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-black">
                  ページで見る
                </button>
                <button onClick={() => saveSearchAnswerToMemo(smartAnswer)} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">
                  メモ保存
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {smartAnswer.lines.map((line) => (
                <p key={line} className="rounded-2xl bg-black/20 p-3 text-sm font-black text-sky-50/88">{line}</p>
              ))}
            </div>
            {smartAnswer.records.length > 0 && (
              <div className="mt-3 space-y-1 rounded-2xl bg-black/20 p-3 text-sm text-white/68">
                {smartAnswer.records.map((line) => <p key={line}>・{line}</p>)}
              </div>
            )}
          </div>
        )}
        {aiHint && (
          <p className="rounded-2xl border border-sky-200/16 bg-sky-300/10 p-3 text-sm leading-6 text-sky-50/82">
            {aiHint}
          </p>
        )}
        {!query.trim() && (
          <p className="text-sm text-white/55">
メモ、TODO、家計簿、予定、Routine、メール、Mind Inboxをまとめて探せるよ。先週の支出や明日の予定も通常検索で回答カード化するよ。
          </p>
        )}
        <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => jump(r.page, r.id)}
              className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-left"
            >
              <p className="text-xs font-black text-cyan-100">
                {r.kind === "page" ? "ページ移動" : "記録"} / {r.title}
              </p>
              <p className="mt-1 line-clamp-2 text-sm text-white/75">
                {r.body}
              </p>
            </button>
          ))}
          {query.trim() && !results.length && (
            <Empty text="該当する記録が見つからなかったよ。" />
          )}
        </div>
      </div>
    </Modal>
  );
}

function FocusTimerPanel({
  snapshot,
  setPage,
}: {
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
}) {
  const initialTimer = useMemo(() => readFocusTimerState(), []);
  const [mode, setMode] = useState<"stopwatch" | "countdown">(
    initialTimer.mode,
  );
  const [running, setRunning] = useState(initialTimer.running);
  const [seconds, setSeconds] = useState(initialTimer.seconds);
  const [preset, setPreset] = useState(initialTimer.preset);
  const [startedAt, setStartedAt] = useState<number | null>(
    initialTimer.startedAt,
  );
  const [launchFlash, setLaunchFlash] = useState(false);

  useEffect(() => {
    saveFocusTimerState({ mode, running, seconds, preset, startedAt });
  }, [mode, running, seconds, preset, startedAt]);

  useEffect(() => {
    const syncFromStorage = () => {
      const restored = readFocusTimerState();
      setMode(restored.mode);
      setRunning(restored.running);
      setSeconds(restored.seconds);
      setPreset(restored.preset);
      setStartedAt(restored.startedAt);
    };
    window.addEventListener("focus", syncFromStorage);
    document.addEventListener("visibilitychange", syncFromStorage);
    return () => {
      window.removeEventListener("focus", syncFromStorage);
      document.removeEventListener("visibilitychange", syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((s) => (mode === "countdown" ? Math.max(0, s - 1) : s + 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, mode]);

  useEffect(() => {
    if (mode === "countdown" && running && seconds === 0) {
      setRunning(false);
      saveFocusTimerState({
        mode,
        running: false,
        seconds: 0,
        preset,
        startedAt,
      });
      playSoftNotice();
      setGuideDraft(
        "集中タイマーが終わったよ。小さく区切れたのえらい。休憩しても大丈夫。",
      );
    }
  }, [seconds, mode, running, preset, startedAt]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const focusTodos = (snapshot?.todos || []).filter((t) => !t.done).slice(0, 3);
  const elapsedMinutes = startedAt
    ? Math.floor((Date.now() - startedAt) / 60000)
    : 0;

  function switchMode(nextMode: "stopwatch" | "countdown") {
    setMode(nextMode);
    setRunning(false);
    setSeconds(nextMode === "countdown" ? preset * 60 : 0);
    setStartedAt(null);
  }

  function startTimer() {
    const now = Date.now();
    setRunning(true);
    setStartedAt((current) => current || now);
    setLaunchFlash(true);
    window.setTimeout(() => setLaunchFlash(false), 900);
  }

  function resetTimer() {
    setRunning(false);
    setSeconds(mode === "countdown" ? preset * 60 : 0);
    setStartedAt(null);
  }

  return (
    <div className="space-y-4">
      {launchFlash && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 text-center">
          <div className="rounded-[2rem] border border-white/15 bg-white p-8 text-black shadow-2xl">
            <p className="text-5xl font-black">START</p>
            <p className="mt-2 text-sm font-black">最初の一歩だけでOK</p>
          </div>
        </div>
      )}
      <GlassCard>
        <p className="text-xs font-black text-cyan-100/70">集中タイマー</p>
        <h2 className="mt-2 text-3xl font-black">
          ストップウォッチ / カウントダウン
        </h2>
        <p className="mt-2 text-sm text-white/60">
          ページを移動しても時間を保存するように直したよ。戻ってきても続きから見られる。
        </p>
      </GlassCard>
      <div className="grid gap-4 lg:grid-cols-[1fr_.8fr]">
        <GlassCard className="text-center">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => switchMode("countdown")}
              className={`rounded-2xl px-4 py-3 font-black ${mode === "countdown" ? "bg-white text-black" : "bg-white/10"}`}
            >
              カウントダウン
            </button>
            <button
              type="button"
              onClick={() => switchMode("stopwatch")}
              className={`rounded-2xl px-4 py-3 font-black ${mode === "stopwatch" ? "bg-white text-black" : "bg-white/10"}`}
            >
              ストップウォッチ
            </button>
          </div>
          <p className="mt-8 text-7xl font-black tracking-tight sm:text-8xl">
            {mm}:{ss}
          </p>
          {mode === "countdown" && (
            <div className="mt-5 grid grid-cols-4 gap-2">
              {[5, 10, 25, 50].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setPreset(m);
                    setSeconds(m * 60);
                    setRunning(false);
                    setStartedAt(null);
                  }}
                  className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold"
                >
                  {m}分
                </button>
              ))}
            </div>
          )}
          <div className="mt-6 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={startTimer}
              className="rounded-2xl bg-emerald-300 px-4 py-3 font-black text-black"
            >
              開始
            </button>
            <button
              type="button"
              onClick={() => setRunning(false)}
              className="rounded-2xl bg-white/10 px-4 py-3 font-black"
            >
              停止
            </button>
            <button
              type="button"
              onClick={resetTimer}
              className="rounded-2xl bg-white/10 px-4 py-3 font-black"
            >
              リセット
            </button>
          </div>
        </GlassCard>
        <GlassCard>
          <h3 className="text-xl font-black">集中中に扱う3つ</h3>
          <div className="mt-3 space-y-2">
            {focusTodos.length ? (
              focusTodos.map((t) => (
                <div key={t.id} className="rounded-2xl bg-black/25 p-3">
                  <p className="font-bold">{t.title}</p>
                  <p className="mt-1 text-xs text-white/45">
                    5分版: {makeFiveMinuteTodo(t.title)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/55">
                未完了TODOが少なめ。自由作業にも使えるよ。
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPage("todos")}
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-black text-black"
          >
            TODOへ移動
          </button>
          {running && elapsedMinutes >= 90 && (
            <div className="mt-3 rounded-2xl border border-amber-200/30 bg-amber-300/10 p-3 text-sm text-amber-50">
              Hyperfocus保護:
              90分以上続いてるよ。水分・トイレ・肩の力だけ確認できると安心。
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

function LifeHubPanel({
  snapshot,
  setPage,
}: {
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
}) {
  const allText = [
    ...(snapshot?.memos || []),
    ...(snapshot?.tweets || []),
    ...(snapshot?.diaries || []),
  ]
    .map((x: any) => `${x.title || ""} ${x.content || ""}`)
    .join(" ");
  const todos = snapshot?.todos || [];
  const undone = todos.filter((t) => !t.done);
  const recent = [
    ...(snapshot?.diaries || []),
    ...(snapshot?.tweets || []),
    ...(snapshot?.places || []),
  ].slice(0, 8);
  const assets =
    snapshot?.budgetAccounts.reduce((s, a) => s + Number(a.balance || 0), 0) ||
    0;
  const monthLogs = (snapshot?.budget || []).filter((b) =>
    isSameMonth(b.spend_date),
  );
  const monthExpense = monthLogs
    .filter((b) => b.type === "expense")
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const stressSpend = monthLogs
    .filter((b) =>
      /疲|不安|ストレス|しんど|深夜|衝動/.test(`${b.memo || ""} ${allText}`),
    )
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const goodSpend = monthLogs
    .filter((b) =>
      /サウナ|カフェ|ラン|ジム|本|学習|音楽|江ノ島/.test(
        `${b.category} ${b.memo || ""}`,
      ),
    )
    .reduce((s, b) => s + Number(b.amount || 0), 0);
  const keywords = [
    "サウナ",
    "青春ラン",
    "Wind Hunt",
    "江ノ島",
    "カフェ",
    "ストグリ",
    "ジム",
    "睡眠",
    "家計簿",
  ].filter((w) => allText.includes(w));
  const exp =
    (snapshot?.diaries.length || 0) * 8 +
    (snapshot?.todos.filter((t) => t.done).length || 0) * 10 +
    (snapshot?.routineChecks.length || 0) * 6 +
    (snapshot?.places.length || 0) * 15;
  const systems = [
    {
      title: "思考マップ",
      body: keywords.length
        ? keywords.map((w) => `#${w}`).join(" → ")
        : "記録が増えるほど、言葉同士のつながりが見えるよ。",
      action: "検索へ",
      page: "search" as PageKey,
    },
    {
      title: "AI人生アーカイブ",
      body: recent.length
        ? recent
            .map((r: any) => r.entry_date || r.tweet_date || r.place_date)
            .slice(0, 4)
            .join(" / ")
        : "写真・Diary・地図・支出の月次振り返りの土台。",
      action: "年表へ",
      page: "chronology" as PageKey,
    },
    {
      title: "忘れてること検出",
      body:
        undone.length > 0
          ? `未完了TODOが${undone.length}件。まず1つだけ見ればOK。`
          : "TODOは軽め。記録の止まりを見守る場所。",
      action: "TODOへ",
      page: "todos" as PageKey,
    },
    {
      title: "今どこまでやった？",
      body: undone[0] ? `途中候補: ${undone[0].title}` : "途中の候補は少なめ。",
      action: "集中へ",
      page: "focus" as PageKey,
    },
    {
      title: "切り替えブリッジ",
      body: "ページ移動前に、次の場所の意味を短く確認するための導線。",
      action: "Mind Captureへ",
      page: "braindump" as PageKey,
    },
    {
      title: "逆算ナビ",
      body: "出発時刻から、準備・持ち物・移動を逆算する土台。",
      action: "持ち物へ",
      page: "belongings" as PageKey,
    },
    {
      title: "未来の自分AI",
      body: undone[0]
        ? `後回しにすると残りやすい候補: ${undone[0].title}`
        : "未来負担は軽め。",
      action: "TODOへ",
      page: "todos" as PageKey,
    },
    {
      title: "お金の体力ゲージ",
      body: `総資産 ${yen(assets)} / 今月支出 ${yen(monthExpense)}`,
      action: "家計簿へ",
      page: "budget" as PageKey,
    },
    {
      title: "ストレス支出検出",
      body: `候補 ${yen(stressSpend)}。疲れている日の支出を見える化。`,
      action: "家計簿へ",
      page: "budget" as PageKey,
    },
    {
      title: "使ってよかった支出",
      body: `幸福投資候補 ${yen(goodSpend)}。サウナ・カフェ・運動系を拾うよ。`,
      action: "家計簿へ",
      page: "budget" as PageKey,
    },
    {
      title: "脳覚醒ヒートマップ",
      body: "コーヒー記録から覚醒しやすい時間帯を見やすくする土台。",
      action: "コーヒーへ",
      page: "coffee" as PageKey,
    },
    {
      title: "やる順AI",
      body:
        undone
          .slice(0, 3)
          .map((t) => t.title)
          .join(" → ") || "今は順番候補が少なめ。",
      action: "TODOへ",
      page: "todos" as PageKey,
    },
    {
      title: "NFC/QR探し物支援",
      body: "財布・鍵・イヤホンの最後の記録場所を持ち物と連動する土台。",
      action: "持ち物へ",
      page: "belongings" as PageKey,
    },
    {
      title: "人生RPG化",
      body: `Life EXP ${exp} / Lv.${Math.floor(exp / 100) + 1}`,
      action: "EXPへ",
      page: "exp" as PageKey,
    },
  ];
  return (
    <div className="space-y-4">
      <GlassCard>
        <p className="text-xs font-black text-fuchsia-100/70">
          第二の脳 拡張室
        </p>
        <h2 className="mt-1 text-3xl font-black">生活OSラボ</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">
          思考マップ、逆算ナビ、お金の体力ゲージ、人生RPG化まで、既存データを壊さずに横断表示する場所。
        </p>
      </GlassCard>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {systems.map((x) => (
          <GlassCard key={x.title}>
            <h3 className="text-xl font-black">{x.title}</h3>
            <p className="mt-2 min-h-12 text-sm leading-6 text-white/65">
              {x.body}
            </p>
            <button
              onClick={() => setPage(x.page)}
              className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-black"
            >
              {x.action}
            </button>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}

function UserPanel({ snapshot, refreshSnapshot, setPage }: PanelProps) {
  const profile = snapshot?.userProfile || {};
  const [form, setForm] = useState<UserProfile>(profile);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setForm(snapshot?.userProfile || {});
  }, [snapshot?.userProfile]);
  const update = (key: keyof UserProfile, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));
  async function saveProfile() {
    setMessage("保存中...");
    const { error } = await supabase
      .from("app_settings")
      .upsert({
        key: "user_profile",
        value: form,
        updated_at: new Date().toISOString(),
      });
    if (error) return setMessage("保存失敗: " + error.message);
    setGuideDraft("ユーザー情報を保存したよ。自分年表にも反映されるよ。");
    setMessage("保存したよ。自分年表にも反映済み。");
    await refreshSnapshot("手動同期中...");
  }
  const milestones = userMilestones(form);
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">ユーザーページ</h2>
        <p className="mt-2 text-sm text-white/60">
          生年月日・入学年・個人メモを保存する場所。ここに入れた節目は自分年表に反映するよ。
        </p>
      </GlassCard>
      <GlassCard>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            placeholder="名前"
            value={form.name || ""}
            onChange={(e) => update("name", e.target.value)}
          />
          <Field
            placeholder="ニックネーム"
            value={form.nickname || ""}
            onChange={(e) => update("nickname", e.target.value)}
          />
          <DateField
            label="生年月日"
            value={form.birthday || ""}
            onChange={(e) => update("birthday", e.target.value)}
          />
          <Field
            placeholder="出生地・地元など"
            value={form.birthplace || ""}
            onChange={(e) => update("birthplace", e.target.value)}
          />
          <Field
            placeholder="血液型など（任意）"
            value={form.bloodType || ""}
            onChange={(e) => update("bloodType", e.target.value)}
          />
          <Field
            placeholder="小学校入学年 例: 2009"
            value={form.elementaryStartYear || ""}
            onChange={(e) =>
              update(
                "elementaryStartYear",
                e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
              )
            }
          />
          <Field
            placeholder="中学校入学年 例: 2015"
            value={form.juniorHighStartYear || ""}
            onChange={(e) =>
              update(
                "juniorHighStartYear",
                e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
              )
            }
          />
          <Field
            placeholder="高校入学年 例: 2018"
            value={form.highSchoolStartYear || ""}
            onChange={(e) =>
              update(
                "highSchoolStartYear",
                e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
              )
            }
          />
          <Field
            placeholder="大学・専門学校など入学年"
            value={form.universityStartYear || ""}
            onChange={(e) =>
              update(
                "universityStartYear",
                e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
              )
            }
          />
          <Field
            placeholder="仕事・社会生活の開始年"
            value={form.jobStartYear || ""}
            onChange={(e) =>
              update(
                "jobStartYear",
                e.target.value.replace(/[^0-9]/g, "").slice(0, 4),
              )
            }
          />
        </div>
        <TextArea
          className="mt-3 h-32"
          placeholder="個人メモ・大切にしたいこと"
          value={form.memo || ""}
          onChange={(e) => update("memo", e.target.value)}
        />
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            onClick={saveProfile}
            className="rounded-2xl bg-white px-4 py-3 font-black text-black"
          >
            ユーザー情報を保存
          </button>
          <button
            onClick={() => setPage("chronology")}
            className="rounded-2xl bg-white/10 px-4 py-3 font-black"
          >
            自分年表を見る
          </button>
        </div>
        {message && (
          <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-white/75">
            {message}
          </p>
        )}
      </GlassCard>
      <GlassCard>
        <h3 className="text-xl font-black">年表に反映される節目</h3>
        {!milestones.length && (
          <p className="mt-3 text-sm text-white/50">
            生年月日や入学年を入れるとここに表示されるよ。
          </p>
        )}
        <div className="mt-3 space-y-2">
          {milestones.map((m) => (
            <p
              key={`${m.date}-${m.label}`}
              className="rounded-2xl bg-black/25 p-3 text-sm"
            >
              <span className="font-black">{m.date}</span>　{m.label}
            </p>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

function ExpPanel({
  snapshot,
  setPage,
}: {
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
}) {
  const exp =
    (snapshot?.diaries.length || 0) * 8 +
    (snapshot?.todos.filter((t) => t.done).length || 0) * 10 +
    (snapshot?.routineChecks.length || 0) * 6 +
    (snapshot?.places.length || 0) * 15 +
    (snapshot?.coffee.length || 0) * 4;
  const level = Math.floor(exp / 100) + 1;
  const next = exp % 100;
  const cards = [
    { p: "diary" as PageKey, title: "Diary", exp: "+8" },
    { p: "todos" as PageKey, title: "TODO達成", exp: "+10" },
    { p: "routines" as PageKey, title: "習慣チェック", exp: "+6" },
    { p: "map" as PageKey, title: "場所記録", exp: "+15" },
  ];
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">Life EXP</h2>
        <p className="mt-4 text-6xl font-black">Lv.{level}</p>
        <div className="mt-4 h-3 rounded-full bg-white/10">
          <div
            className="h-3 rounded-full bg-emerald-400"
            style={{ width: `${next}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white/55">
          総EXP {exp} / 次のレベルまで {100 - next}
        </p>
      </GlassCard>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <button
            key={c.title}
            onClick={() => setPage(c.p)}
            className="rounded-3xl border border-white/10 bg-black/25 p-4 text-left"
          >
            <p className="text-xl font-black">{c.title}</p>
            <p className="mt-1 text-sm text-emerald-200">{c.exp} EXP</p>
          </button>
        ))}
      </div>
    </div>
  );
}
function NightModePanel({ setPage }: { setPage: (p: PageKey) => void }) {
  return (
    <div className="space-y-4">
      <GlassCard className="bg-indigo-950/50">
        <h2 className="text-3xl font-black">静かな夜モード</h2>
        <p className="mt-3 text-sm leading-7 text-white/70">
          夜は情報量を減らして、Diary・つぶやき・睡眠だけに絞るモード。焦らず一日の終わりを残すための場所。
        </p>
      </GlassCard>
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => setPage("diary")}
          className="rounded-3xl bg-white/10 p-5 text-left font-black"
        >
          📖 Diary
        </button>
        <button
          onClick={() => setPage("tweets")}
          className="rounded-3xl bg-white/10 p-5 text-left font-black"
        >
          💬 つぶやき
        </button>
        <button
          onClick={() => setPage("home")}
          className="rounded-3xl bg-white/10 p-5 text-left font-black"
        >
          🏠 ホーム
        </button>
      </div>
    </div>
  );
}

type AiNewsPrefs = { want: string; avoid: string };
const AI_NEWS_PREF_KEY = "lifeAiNewsPrefs";

function readAiNewsPrefs(): AiNewsPrefs {
  if (typeof window === "undefined")
    return {
      want: "筋トレ、ランニング、サウナ、健康、睡眠、運動科学",
      avoid: "政治、事故、事件、炎上、災害",
    };
  try {
    const raw = localStorage.getItem(AI_NEWS_PREF_KEY);
    return raw
      ? { want: "", avoid: "", ...JSON.parse(raw) }
      : {
          want: "筋トレ、ランニング、サウナ、健康、睡眠、運動科学",
          avoid: "政治、事故、事件、炎上、災害",
        };
  } catch {
    return {
      want: "筋トレ、ランニング、サウナ、健康、睡眠、運動科学",
      avoid: "政治、事故、事件、炎上、災害",
    };
  }
}

type TrainFavorite = { id: string; name: string; from: string; to: string };

function TrainPanel({
  snapshot,
  setPage,
}: {
  snapshot: Snapshot | null;
  setPage: (p: PageKey) => void;
}) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [via, setVia] = useState("");
  const [departMode, setDepartMode] = useState<"now" | "depart" | "arrive">(
    "now",
  );
  const [time, setTime] = useState("");
  const [aiText, setAiText] = useState(
    "出発駅と到着駅を入れると、移動の方針を一緒に整理するよ。",
  );
  const [loading, setLoading] = useState(false);
  const [favName, setFavName] = useState("");
  const [favorites, setFavorites] = useState<TrainFavorite[]>([]);

  useEffect(() => {
    try {
      setFavorites(
        JSON.parse(localStorage.getItem("lifeTrainFavorites") || "[]"),
      );
    } catch {
      setFavorites([]);
    }
  }, []);

  function saveFavorites(next: TrainFavorite[]) {
    setFavorites(next);
    if (typeof window !== "undefined")
      localStorage.setItem(
        "lifeTrainFavorites",
        JSON.stringify(next.slice(0, 20)),
      );
  }

  const todayTodos = (snapshot?.todos || []).filter(
    (t) => !t.done && t.due_date === todayKey(),
  ).length;
  const caffeine = (snapshot?.coffee || [])
    .filter((c) => c.drink_date === todayKey())
    .reduce((sum, c) => sum + Number(c.caffeine_mg || 0), 0);
  const fatigueHint =
    todayTodos >= 5 || caffeine >= 300
      ? "今日は情報負荷が高め。乗換少なめ・徒歩少なめのルートを優先すると安全。"
      : "今日は通常モード。早さ優先と楽さ優先を比べる余裕がありそう。";

  function transitUrl(kind: "google" | "apple") {
    const origin = encodeURIComponent(from.trim());
    const destination = encodeURIComponent(to.trim());
    if (!origin || !destination) return "";
    if (kind === "apple")
      return `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=r`;
    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=transit`;
  }

  function openTransit(kind: "google" | "apple") {
    const url = transitUrl(kind);
    if (!url) return setAiText("出発駅と到着駅を入れてから開けるよ。");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function addFavorite() {
    if (!from.trim() || !to.trim())
      return setAiText("お気に入りにするには、出発駅と到着駅が必要だよ。");
    const next = [
      {
        id: String(Date.now()),
        name: favName.trim() || `${from} → ${to}`,
        from: from.trim(),
        to: to.trim(),
      },
      ...favorites.filter(
        (f) => !(f.from === from.trim() && f.to === to.trim()),
      ),
    ].slice(0, 20);
    saveFavorites(next);
    setFavName("");
    setGuideDraft(
      "電車ルートをお気に入りに保存したよ。よく使う移動がワンタップに近づいたね。",
    );
  }

  async function askTrainAi() {
    const route = `${from || "未入力"} → ${to || "未入力"}${via ? ` / 経由候補: ${via}` : ""}`;
    setLoading(true);
    try {
      const context = `電車移動の相談。ルート: ${route}。時刻指定: ${departMode}${time ? ` ${time}` : ""}。今日の未完了TODO: ${todayTodos}件。今日のカフェイン: ${caffeine}mg。方針: 早さ、乗換少なさ、徒歩少なさ、疲労配慮を比べて短く助言。実際の時刻表はGoogle/Appleマップで確認する前提。`;
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "navigationAI", text: context }),
      });
      const json = await res.json().catch(() => ({}));
      setAiText(
        json.result ||
          `${fatigueHint}\n\nまずはGoogleマップで候補を開いて、乗換回数と徒歩時間が少ない順に見るのがよさそう。`,
      );
    } catch {
      setAiText(
        `${fatigueHint}\n\nAI接続に失敗したから、今はローカル助言だけ出すね。Googleマップで候補を開いて、乗換回数・徒歩時間・到着時刻を比べるのが安全。`,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard className="overflow-hidden bg-gradient-to-br from-cyan-400/15 via-fuchsia-400/10 to-emerald-400/10">
        <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <p className="text-xs font-black text-cyan-100/75">
              Transit Command
            </p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">電車ページ</h2>
            <p className="mt-3 text-sm leading-7 text-white/68">
              乗換検索はGoogle/Appleマップへ軽量連携。アプリ内ではお気に入り・AI方針・疲労配慮を扱って、全体速度を落とさない設計。
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-black text-white/45">今日の移動AI判断</p>
            <p className="mt-2 text-sm leading-7 text-white/75">
              {fatigueHint}
            </p>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_.95fr]">
        <GlassCard>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              placeholder="出発駅 例: 蒲田"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <Field
              placeholder="到着駅 例: 新宿"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_160px_160px]">
            <Field
              placeholder="経由・メモ 任意"
              value={via}
              onChange={(e) => setVia(e.target.value)}
            />
            <select
              value={departMode}
              onChange={(e) => setDepartMode(e.target.value as any)}
              className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"
            >
              <option value="now">今すぐ</option>
              <option value="depart">出発時刻</option>
              <option value="arrive">到着時刻</option>
            </select>
            <TimeField
              value={time}
              onChange={(e) => setTime(e.target.value)}
              label="時刻 任意"
            />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <button
              onClick={() => openTransit("google")}
              className="rounded-2xl bg-white px-4 py-3 font-black text-black"
            >
              Google乗換
            </button>
            <button
              onClick={() => openTransit("apple")}
              className="rounded-2xl bg-white/10 px-4 py-3 font-black"
            >
              Appleマップ
            </button>
            <button
              onClick={askTrainAi}
              disabled={loading}
              className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-black disabled:opacity-50"
            >
              {loading ? "AI確認中..." : "電車AIに相談"}
            </button>
          </div>
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-black text-cyan-100/70">AIメモ</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/75">
              {aiText}
            </p>
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs font-black text-amber-100/70">よく使うルート</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Field
              placeholder="名前 例: 家→ジム"
              value={favName}
              onChange={(e) => setFavName(e.target.value)}
            />
            <button
              onClick={addFavorite}
              className="rounded-2xl bg-white px-4 py-3 font-black text-black"
            >
              保存
            </button>
          </div>
          <div className="mt-4 space-y-2">
            {!favorites.length && (
              <p className="rounded-2xl bg-black/25 p-4 text-sm text-white/55">
                まだ保存ルートはないよ。駅を入れて保存するとここに出る。
              </p>
            )}
            {favorites.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-white/10 bg-black/25 p-3"
              >
                <button
                  onClick={() => {
                    setFrom(f.from);
                    setTo(f.to);
                    setAiText(
                      `${f.name} をセットしたよ。必要なら乗換検索かAI相談へ進めるね。`,
                    );
                  }}
                  className="w-full text-left"
                >
                  <p className="font-black">{f.name}</p>
                  <p className="mt-1 text-xs text-white/50">
                    {f.from} → {f.to}
                  </p>
                </button>
                <button
                  onClick={() =>
                    saveFavorites(favorites.filter((x) => x.id !== f.id))
                  }
                  className="mt-2 rounded-xl bg-white/10 px-3 py-1 text-xs font-bold text-white/70"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          onClick={() => setPage("map")}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left font-black"
        >
          🗺️ 地図ページへ
        </button>
        <button
          onClick={() => setPage("calendar")}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left font-black"
        >
          📅 予定確認
        </button>
        <button
          onClick={() => setPage("todos")}
          className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-left font-black"
        >
          ✅ TODO確認
        </button>
      </div>
    </div>
  );
}

function AiNewsPanel() {
  const [prefs, setPrefs] = useState<AiNewsPrefs>(() => readAiNewsPrefs());
  const [result, setResult] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("lifeAiNewsLastResult") || ""
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function savePrefs(next = prefs) {
    localStorage.setItem(AI_NEWS_PREF_KEY, JSON.stringify(next));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  }

  async function loadNews() {
    savePrefs();
    setLoading(true);
    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "aiNews",
          want: prefs.want,
          avoid: prefs.avoid,
        }),
      });
      const json = await res.json();
      const text =
        json.result ||
        "ニュースをうまく取得できなかったみたい。少し時間を置いて試してね。";
      setResult(text);
      localStorage.setItem("lifeAiNewsLastResult", text);
    } catch {
      setResult(
        "通信が少し詰まったみたい。アプリ本体は壊れてないから、時間を置いてもう一度で大丈夫だよ。",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-black text-pink-100/70">癒し系案内AI</p>
            <h2 className="mt-1 text-3xl font-black">AIニュース</h2>
            <p className="mt-2 text-sm leading-7 text-white/65">
              聞きたいニュースと聞きたくないニュースを保存して、好みに合う話題だけをやさしくまとめるページ。
            </p>
          </div>
          <button
            onClick={loadNews}
            disabled={loading}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-black disabled:opacity-50"
          >
            {loading ? "探してる..." : "今日のニュースを聞く"}
          </button>
        </div>
      </GlassCard>
      <div className="grid gap-4 lg:grid-cols-2">
        <GlassCard>
          <p className="text-sm font-black text-emerald-100">
            聞きたいニュース
          </p>
          <TextArea
            rows={6}
            value={prefs.want}
            onChange={(e) => {
              const next = { ...prefs, want: e.target.value };
              setPrefs(next);
              savePrefs(next);
            }}
            placeholder="例: 筋トレ、ランニング、サウナ、睡眠、健康、運動科学"
          />
          <p className="mt-2 text-xs text-white/45">
            入力すると自動保存されるよ。
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-sm font-black text-rose-100">
            聞きたくないニュース
          </p>
          <TextArea
            rows={6}
            value={prefs.avoid}
            onChange={(e) => {
              const next = { ...prefs, avoid: e.target.value };
              setPrefs(next);
              savePrefs(next);
            }}
            placeholder="例: 政治、事故、事件、災害、炎上"
          />
          <p className="mt-2 text-xs text-white/45">
            ここに入れた話題は表示から外す方向で覚えるよ。
          </p>
        </GlassCard>
      </div>
      {saved && (
        <p className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-100">
          好みを保存したよ。
        </p>
      )}
      <GuideAiCard
        themeKey="mirai"
        message={
          result ||
          "しゅうやくんの好みに合わせて、筋トレ・ランニング・サウナ系のニュースを中心にやさしく案内するね。苦手な政治・事故・事件系は避ける設定にできるよ。"
        }
        loading={loading}
        onRefresh={loadNews}
      />
      <AiNewsUpgradePanel result={result} />
    </div>
  );
}

function SettingsPanel({
  themeKey,
  onChangeTheme,
  visualMode,
  onChangeVisualMode,
}: {
  themeKey: ThemeKey;
  onChangeTheme: (theme: ThemeKey) => void;
  visualMode: VisualMode;
  onChangeVisualMode: (mode: VisualMode) => void;
}) {
  const [notify, setNotify] = useState<NotifySettings>(() =>
    getNotifySettings(),
  );
  function updateNotify(next: NotifySettings) {
    setNotify(next);
    saveNotifySettings(next);
  }
  async function askPermission() {
    if (!("Notification" in window))
      return alert("このブラウザは通知に対応していないみたい。");
    const result = await Notification.requestPermission();
    if (result === "granted")
      requestLocalNotification(
        "通知テスト",
        "Life Command OSからのやさしい通知だよ",
        `test-notice-${Date.now()}`,
      );
    else alert("ブラウザ側で通知が許可されなかったよ。設定から許可してね。");
  }
  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">通知設定</h2>
        <p className="mt-2 text-sm leading-7 text-white/60">
          Todo・習慣・ゴミの日の時刻通知を、アプリを開いている間に確認するよ。音は小さめ、バイブは短め。端末が消音/通知拒否の場合は端末設定を優先するよ。
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <button
            onClick={() =>
              updateNotify({ ...notify, enabled: !notify.enabled })
            }
            className={`rounded-2xl px-4 py-3 font-black ${notify.enabled ? "bg-emerald-400 text-black" : "bg-white/10 text-white"}`}
          >
            通知 {notify.enabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={() => updateNotify({ ...notify, sound: !notify.sound })}
            className={`rounded-2xl px-4 py-3 font-black ${notify.sound ? "bg-sky-300 text-black" : "bg-white/10 text-white"}`}
          >
            小さい音 {notify.sound ? "ON" : "OFF"}
          </button>
          <button
            onClick={() =>
              updateNotify({ ...notify, vibrate: !notify.vibrate })
            }
            className={`rounded-2xl px-4 py-3 font-black ${notify.vibrate ? "bg-violet-300 text-black" : "bg-white/10 text-white"}`}
          >
            短いバイブ {notify.vibrate ? "ON" : "OFF"}
          </button>
        </div>
        <button
          onClick={askPermission}
          className="mt-3 w-full rounded-2xl bg-white px-4 py-3 font-black text-black"
        >
          通知テスト / 許可する
        </button>
      </GlassCard>
      <GlassCard className="bg-gradient-to-br from-white/10 via-cyan-400/10 to-fuchsia-400/10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black text-cyan-100/70">Visual Engine</p>
            <h2 className="mt-1 text-2xl font-black">UI / GUIモード</h2>
            <p className="mt-2 text-sm leading-7 text-white/60">全ページの雰囲気だけを切り替える軽量モード。記録データや既存テーブルは触らないよ。</p>
          </div>
          <p className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs font-black text-white/65">現在: {visualModes[visualMode].emoji} {visualModes[visualMode].name}</p>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {Object.entries(visualModes).map(([key, mode]) => (
            <button
              key={key}
              onClick={() => onChangeVisualMode(key as VisualMode)}
              className={`rounded-3xl border border-white/10 bg-black/25 p-4 text-left shadow-xl transition hover:scale-[1.01] ${visualMode === key ? "ring-2 ring-cyan-200" : ""}`}
            >
              <div className="text-3xl">{mode.emoji}</div>
              <h3 className="mt-3 font-black">{mode.name}</h3>
              <p className="mt-1 text-xs leading-5 text-white/55">{mode.description}</p>
            </button>
          ))}
        </div>
      </GlassCard>
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(themes).map(([key, theme]) => (
          <button
            key={key}
            onClick={() => onChangeTheme(key as ThemeKey)}
            className={`rounded-3xl border ${theme.card} p-5 text-left shadow-2xl transition hover:scale-[1.01] ${themeKey === key ? "ring-2 ring-white/70" : ""}`}
          >
            <div
              className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r ${theme.accent} text-3xl`}
            >
              {theme.emoji}
            </div>
            <h2 className="mt-4 text-xl font-black">{theme.name}</h2>
            <p className="mt-1 text-sm text-white/55">このテーマに切り替える</p>
          </button>
        ))}
      </div>
    </div>
  );
}
function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3">
      <div className="max-h-[88vh] w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/95 p-5 backdrop-blur-xl">
          <h2 className="text-xl font-black">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold"
          >
            閉じる
          </button>
        </div>
        <div className="max-h-[calc(88vh-76px)] overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
