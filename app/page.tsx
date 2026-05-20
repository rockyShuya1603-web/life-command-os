"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ThemeKey, themes, getStoredTheme, saveTheme } from "@/lib/themes";

type PageKey =
  | "home" | "memos" | "tweets" | "todos" | "calendar" | "diary" | "coffee" | "budget" | "shopping" | "belongings" | "routines" | "trash" | "map"
  | "heatmap" | "lifehub" | "braindump" | "focus" | "search" | "tags" | "chronology" | "anniversary" | "condition" | "cafe" | "goals" | "ideals" | "exp" | "night" | "settings";

type Memo = { id: string; content: string; image_url?: string | null; created_at: string };
type Tweet = { id: string; tweet_date: string; content: string; mood: string | null; image_url?: string | null; created_at: string };
type Todo = { id: string; title: string; done: boolean; priority: string; due_date: string | null; due_time?: string | null; location_name?: string | null; location_url?: string | null; notify_enabled?: boolean | null; image_url?: string | null; created_at: string };
type EventItem = { id: string; title: string; event_date: string; note: string | null; created_at: string };
type Diary = { id: string; entry_date: string; mood: string; title?: string | null; content: string; image_url?: string | null; created_at: string };
type CoffeeLog = { id: string; drink_date: string; coffee_name: string; cups: number; caffeine_mg: number; note: string | null; created_at: string };
type BudgetLog = { id: string; spend_date: string; type: "income" | "expense" | "charge"; category: string; amount: number; memo: string | null; source?: string | null; wallet?: string | null; payment_method?: string | null; image_url?: string | null; created_at: string };
type BudgetFixedTemplate = { id: string; title: string; category: string; amount: number; wallet: string | null; due_day: number | null; active: boolean; memo: string | null; created_at: string };
type Routine = { id: string; title: string; routine_time: string | null; note: string | null; active: boolean; created_at: string };
type RoutineCheck = { id: string; routine_id: string; check_date: string; created_at: string };
type TrashRule = { id: string; trash_type: string; weekday: number; notify_time: string | null; note: string | null; active: boolean; created_at: string };
type PlaceLog = { id: string; place_date: string; title: string; category: string; address: string | null; map_url: string | null; note: string | null; created_at: string };
type SleepLog = { id: string; sleep_date: string; bedtime: string | null; wake_time: string | null; quality: string | null; note: string | null; created_at: string };
type BudgetAccount = { id: string; name: string; kind: string; balance: number; note: string | null; created_at: string };
type IdealItem = { id: string; title: string; image_url: string | null; description: string | null; created_at: string };
type BelongingCard = { id: string; title: string; note: string | null; created_at: string };
type BelongingItem = { id: string; card_id: string; name: string; checked: boolean; image_url?: string | null; created_at: string };

type Snapshot = {
  memos: Memo[]; tweets: Tweet[]; todos: Todo[]; events: EventItem[]; diaries: Diary[]; coffee: CoffeeLog[]; budget: BudgetLog[]; budgetAccounts: BudgetAccount[]; budgetFixedTemplates: BudgetFixedTemplate[]; ideals: IdealItem[]; belongingCards: BelongingCard[]; belongingItems: BelongingItem[]; routines: Routine[]; trash: TrashRule[]; places: PlaceLog[]; sleep: SleepLog[]; routineChecks: RoutineCheck[];
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
  { key: "routines", label: "習慣", icon: "🔁" },
  { key: "trash", label: "ゴミ", icon: "🗑️" },
  { key: "map", label: "地図", icon: "🗺️" },
  { key: "heatmap", label: "ヒートマップ", icon: "🔥" },
  { key: "lifehub", label: "生活OS", icon: "🧬" },
  { key: "braindump", label: "脳ダンプ", icon: "🧺" },
  { key: "focus", label: "集中タイマー", icon: "⏱️" },
  { key: "search", label: "検索", icon: "🧠" },
  { key: "tags", label: "タグ", icon: "🏷️" },
  { key: "chronology", label: "自分年表", icon: "📜" },
  { key: "anniversary", label: "過去の今日", icon: "⏳" },
  { key: "condition", label: "予測", icon: "🔮" },
  { key: "cafe", label: "カフェ図鑑", icon: "☕" },
  { key: "goals", label: "目標", icon: "🌌" },
  { key: "ideals", label: "理想", icon: "🖼️" },
  { key: "exp", label: "EXP", icon: "🎮" },
  { key: "night", label: "夜モード", icon: "🌙" },
  { key: "settings", label: "設定", icon: "🎨" },
];

const todayKey = () => toDateKey(new Date());
function toDateKey(date: Date) { const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, "0"); const d = String(date.getDate()).padStart(2, "0"); return `${y}-${m}-${d}`; }
function getCreatedDateKey(value: string) { return new Date(value).toISOString().slice(0, 10); }
function yen(value: number) { return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value || 0); }
function weekdayLabel(day: number) { return ["日", "月", "火", "水", "木", "金", "土"][day] || "?"; }
function dateMinus(dateKey: string, days: number) { const d = new Date(dateKey + "T00:00:00"); d.setDate(d.getDate() - days); return toDateKey(d); }
function monthKey(dateKey = todayKey()) { return String(dateKey || todayKey()).slice(0, 7); }
function isSameMonth(dateKey: string | null | undefined, target = todayKey()) { return String(dateKey || "").slice(0, 7) === monthKey(target); }
function daysLeftInMonth(dateKey = todayKey()) { const d = new Date(dateKey + "T00:00:00"); const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); return Math.max(1, end.getDate() - d.getDate() + 1); }
type NotifySettings = { enabled: boolean; sound: boolean; vibrate: boolean };
function getNotifySettings(): NotifySettings {
  if (typeof window === "undefined") return { enabled: true, sound: true, vibrate: true };
  try {
    const raw = localStorage.getItem("lifeNotifySettings");
    return raw ? { enabled: true, sound: true, vibrate: true, ...JSON.parse(raw) } : { enabled: true, sound: true, vibrate: true };
  } catch {
    return { enabled: true, sound: true, vibrate: true };
  }
}
function saveNotifySettings(settings: NotifySettings) {
  if (typeof window !== "undefined") localStorage.setItem("lifeNotifySettings", JSON.stringify(settings));
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
    return new Set(JSON.parse(localStorage.getItem("lifeDismissedNotices") || "[]") as string[]);
  } catch {
    return new Set<string>();
  }
}
function dismissNoticeKey(key: string) {
  if (typeof window === "undefined") return;
  const set = getDismissedNoticeKeys();
  set.add(key);
  localStorage.setItem("lifeDismissedNotices", JSON.stringify(Array.from(set).slice(-500)));
}
function requestLocalNotification(title: string, body: string, noticeKey: string, onAppNotice?: (notice: AppNotice) => void) {
  const settings = getNotifySettings();
  if (!settings.enabled || getDismissedNoticeKeys().has(noticeKey)) return;
  playSoftNotice();
  onAppNotice?.({ key: noticeKey, title, body });
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, silent: true });
  }
}
function isDueNow(dateKey: string | null | undefined, timeValue: string | null | undefined) {
  if (!dateKey || !timeValue) return false;
  const now = new Date();
  return dateKey === toDateKey(now) && timeValue.slice(0, 5) === `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}
function setGuideDraft(message: string) { if (typeof window === "undefined") return; localStorage.setItem("lifeGuideMessage", message); window.dispatchEvent(new CustomEvent("life-guide-message", { detail: message })); }
function stripHtml(value: string) { return String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); }
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
    const mode = parsed.mode === "stopwatch" || parsed.mode === "countdown" ? parsed.mode : "countdown";
    const preset = Number.isFinite(Number(parsed.preset)) ? Math.max(1, Number(parsed.preset)) : 25;
    const savedSeconds = Number.isFinite(Number(parsed.seconds)) ? Math.max(0, Math.floor(Number(parsed.seconds))) : preset * 60;
    const updatedAt = Number.isFinite(Number(parsed.updatedAt)) ? Number(parsed.updatedAt) : Date.now();
    const running = Boolean(parsed.running);
    const elapsed = running ? Math.max(0, Math.floor((Date.now() - updatedAt) / 1000)) : 0;
    return {
      mode,
      preset,
      running,
      seconds: mode === "countdown" ? Math.max(0, savedSeconds - elapsed) : savedSeconds + elapsed,
      updatedAt: Date.now(),
      startedAt: typeof parsed.startedAt === "number" ? parsed.startedAt : null,
    };
  } catch {
    return fallback;
  }
}

function saveFocusTimerState(state: Omit<FocusTimerState, "updatedAt">) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FOCUS_TIMER_STORAGE_KEY, JSON.stringify({ ...state, updatedAt: Date.now() }));
}

function restoreScrollIfUnexpectedlyRaised(scrollY: number) {
  if (typeof window === "undefined") return;
  window.requestAnimationFrame(() => {
    const active = document.activeElement as HTMLElement | null;
    const tag = active?.tagName?.toLowerCase();
    const isEditing = tag === "input" || tag === "textarea" || tag === "select" || active?.isContentEditable;
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
  if (typeof window === "undefined" || typeof document === "undefined") return fileToDataUrl(file);

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
  return message.includes("image_url") || message.includes("column") || message.includes("schema cache");
}

type TodoInsertCandidate = { title?: unknown; priority?: unknown; due_date?: unknown };
function localTodoCandidatesFromText(text: string): TodoInsertCandidate[] {
  const raw = String(text || "").trim();
  if (!raw) return [];
  const lines = raw
    .split(/\r?\n|[。！？!?]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const keywords = /(する|やる|買う|行く|行か|予約|確認|連絡|提出|支払|払う|送る|作る|準備|持って|持参|更新|修正|掃除|洗濯|申請|登録|電話|メール|返す|見る|調べる|受け取る|持つ|必要|忘れ)/;
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
  return [{ title: raw.split(/\r?\n|[。！？!?]+/)[0].slice(0, 120), priority: "normal", due_date: null }];
}
function normalizeTodoPriority(value: unknown) {
  const priority = String(value || "normal");
  return priority === "low" || priority === "normal" || priority === "high" ? priority : "normal";
}
async function insertTodoCandidates(tasks: TodoInsertCandidate[], fallbackDate = todayKey()) {
  let inserted = 0;
  let lastError = "";
  const savedTodos: Todo[] = [];
  for (const task of tasks.slice(0, 10)) {
    const title = String(task?.title || "").trim().slice(0, 120);
    if (!title) continue;
    const dueDate = typeof task.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.due_date) ? task.due_date : fallbackDate;
    const payload = { title, priority: normalizeTodoPriority(task.priority), due_date: dueDate, done: false };
    const result = await supabase.from("todos").insert(payload).select("*").single();
    if (result.error) {
      lastError = result.error.message;
      continue;
    }
    if (result.data) savedTodos.push(result.data as Todo);
    inserted += 1;
  }
  return { inserted, lastError, savedTodos };
}

function ImagePreview({ src, alt = "添付画像" }: { src?: string | null; alt?: string }) {
  if (!src) return null;
  return <img src={src} alt={alt} className="mt-3 max-h-72 w-full rounded-3xl border border-white/10 object-cover" />;
}

function openMap(text: string) { const q = encodeURIComponent(text.trim()); if (q) window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank", "noopener,noreferrer"); }
function tagWords(text: string) {
  const src = text.toLowerCase(); const tags: string[] = [];
  if (/疲|しんど|眠|だる/.test(src)) tags.push("#回復");
  if (/嬉|楽|最高|できた|成功/.test(src)) tags.push("#達成");
  if (/走|ラン|ジム|筋トレ|bike|バイク/.test(src)) tags.push("#運動");
  if (/カフェ|coffee|コーヒー/.test(src)) tags.push("#カフェ");
  if (/不安|怖|緊張|焦/.test(src)) tags.push("#不安");
  if (/冒険|地図|散歩|江ノ島|旅行/.test(src)) tags.push("#冒険");
  return tags.length ? tags : ["#生活ログ"];
}
function calcStreak(routineId: string, checks: RoutineCheck[]) {
  const set = new Set(checks.filter((c) => c.routine_id === routineId).map((c) => c.check_date));
  let streak = 0; let cursor = todayKey();
  while (set.has(cursor)) { streak += 1; cursor = dateMinus(cursor, 1); }
  return streak;
}

async function loadSnapshot(): Promise<Snapshot> {
  const [memos, tweets, todos, events, diaries, coffee, budget, budgetAccounts, budgetFixedTemplates, ideals, belongingCards, belongingItems, routines, trash, places, sleep, routineChecks] = await Promise.all([
    supabase.from("memos").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("tweets").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("todos").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("calendar_events").select("*").order("event_date", { ascending: false }).limit(80),
    supabase.from("diary_entries").select("*").order("entry_date", { ascending: false }).order("created_at", { ascending: false }).limit(80),
    supabase.from("coffee_logs").select("*").order("drink_date", { ascending: false }).limit(80),
    supabase.from("budget_logs").select("*").order("spend_date", { ascending: false }).limit(80),
    supabase.from("budget_accounts").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("budget_fixed_templates").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("ideal_items").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("belonging_cards").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("belonging_items").select("*").order("created_at", { ascending: true }).limit(500),
    supabase.from("routines").select("*").order("created_at", { ascending: false }).limit(80),
    supabase.from("trash_rules").select("*").order("weekday", { ascending: true }).limit(80),
    supabase.from("place_logs").select("*").order("place_date", { ascending: false }).limit(80),
    supabase.from("sleep_logs").select("*").order("sleep_date", { ascending: false }).limit(80),
    supabase.from("routine_checks").select("*").order("check_date", { ascending: false }).limit(300),
  ]);
  return { memos: memos.data || [], tweets: tweets.data || [], todos: todos.data || [], events: events.data || [], diaries: diaries.data || [], coffee: coffee.data || [], budget: budget.data || [], budgetAccounts: budgetAccounts.data || [], budgetFixedTemplates: budgetFixedTemplates.data || [], ideals: ideals.data || [], belongingCards: belongingCards.data || [], belongingItems: belongingItems.data || [], routines: routines.data || [], trash: trash.data || [], places: places.data || [], sleep: sleep.data || [], routineChecks: routineChecks.data || [] };
}

export default function Home() {
  const [page, setPage] = useState<PageKey>("home");
  const [themeKey, setThemeKey] = useState<ThemeKey>("hanabi");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [syncStatus, setSyncStatus] = useState("同期準備中");
  const [appNotice, setAppNotice] = useState<AppNotice | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const syncingRef = useRef(false);
  const realtimeRefreshTimerRef = useRef<number | null>(null);
  const firedNoticeRef = useRef<Set<string>>(new Set());
  const theme = themes[themeKey];
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
      const time = new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
      setSyncStatus(reason.startsWith("手動") ? `手動同期完了 ${time}` : `常時同期ON ${time}`);
    } catch (error) {
      console.error(error);
      setSyncStatus("同期失敗");
    } finally {
      syncingRef.current = false;
    }
  }, []);
  useEffect(() => {
    let alive = true;
    const localTheme = getStoredTheme();
    setThemeKey(localTheme);
    (async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("value")
          .eq("key", "theme")
          .maybeSingle();
        const cloudTheme = data?.value?.theme as ThemeKey | undefined;
        if (alive && cloudTheme && cloudTheme in themes) {
          setThemeKey(cloudTheme);
          saveTheme(cloudTheme);
        }
      } catch {
        // テーマ同期に失敗してもアプリ本体は止めない
      }
    })();
    refreshSnapshot("初回同期中...");
    return () => { alive = false; };
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
    const channel = syncTables.reduce((current, table) => {
      return current.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        if (!alive) return;
        setSyncStatus("常時同期中...");
        if (realtimeRefreshTimerRef.current) window.clearTimeout(realtimeRefreshTimerRef.current);
        realtimeRefreshTimerRef.current = window.setTimeout(() => {
          realtimeRefreshTimerRef.current = null;
          refreshSnapshot("常時同期中...");
        }, 450);
      });
    }, supabase.channel(`life-command-os-realtime-sync-${Date.now()}`));

    channel.subscribe((status) => {
      if (!alive) return;
      if (status === "SUBSCRIBED") setSyncStatus("常時同期ON");
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") setSyncStatus("同期エラー");
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
    const onVisibility = () => { if (!document.hidden) refreshSnapshot("画面復帰同期中..."); };
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
        if (!t.done && t.notify_enabled && isDueNow(t.due_date, t.due_time) && !firedNoticeRef.current.has(key) && !getDismissedNoticeKeys().has(key)) {
          firedNoticeRef.current.add(key);
          requestLocalNotification("TODOの時間", t.title, key, setAppNotice);
        }
      });
      (snapshot?.routines || []).forEach((r) => {
        const key = `routine-${r.id}-${toDateKey(now)}-${r.routine_time || ""}`;
        if (r.active && isDueNow(toDateKey(now), r.routine_time) && !firedNoticeRef.current.has(key) && !getDismissedNoticeKeys().has(key)) {
          firedNoticeRef.current.add(key);
          requestLocalNotification("習慣の時間", r.title, key, setAppNotice);
        }
      });
      (snapshot?.trash || []).forEach((r) => {
        const key = `trash-${r.id}-${toDateKey(now)}-${r.notify_time || ""}`;
        if (r.active && r.weekday === now.getDay() && isDueNow(toDateKey(now), r.notify_time) && !firedNoticeRef.current.has(key) && !getDismissedNoticeKeys().has(key)) {
          firedNoticeRef.current.add(key);
          requestLocalNotification("ゴミの日", `${r.trash_type}の日だよ`, key, setAppNotice);
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
          .upsert({ key: "theme", value: { theme: next }, updated_at: new Date().toISOString() });
        setGuideDraft(`テーマを「${themes[next].name}」に同期したよ。PCとスマホでも同じ色に近づくはず。`);
      } catch {
        setGuideDraft(`テーマはこの端末に保存したよ。クラウド同期だけ少し失敗したみたい。`);
      }
    })();
  }
  const panelProps = { snapshot, refreshSnapshot, setPage };
  return (
    <main className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${theme.bg} text-white`}>
      {appNotice && (
        <div className="fixed inset-x-3 top-3 z-[100] mx-auto max-w-md rounded-3xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl">
          <p className="text-sm font-black text-white">{appNotice.title}</p>
          <p className="mt-1 text-sm leading-6 text-white/75">{appNotice.body}</p>
          <button
            type="button"
            onClick={() => { dismissNoticeKey(appNotice.key); firedNoticeRef.current.add(appNotice.key); setAppNotice(null); }}
            className="mt-3 w-full rounded-2xl bg-white px-4 py-2 text-sm font-black text-black"
          >
            閉じる
          </button>
        </div>
      )}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-70" style={{ backgroundImage: theme.pattern, backgroundSize: "34px 34px, 34px 34px, 34px 34px, 34px 34px" }} />
      <div className="pointer-events-none fixed inset-0 z-0 bg-black/20" aria-hidden="true" />
      <div className="relative z-10 mx-auto flex max-w-7xl gap-4 px-3 pb-32 pt-4 sm:px-4 sm:pt-6 lg:pb-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/45 p-3 shadow-2xl backdrop-blur-xl lg:block">
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
                    active ? `bg-gradient-to-r ${theme.accent} font-black text-black shadow-lg` : "text-white/72 hover:bg-white/10"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </aside>
        <div className="min-w-0 flex-1">
        <header className={`rounded-[1.75rem] border ${theme.card} p-4 shadow-2xl backdrop-blur-xl sm:rounded-[2rem] sm:p-5`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-bold text-white/65 sm:text-sm">{theme.emoji} Life Command OS</p><h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 text-xs leading-6 text-white/55 sm:text-sm">生活ログ・思い出・習慣・お金・カフェ・未来目標をまとめる人生OS</p><div className="mt-3 flex flex-wrap items-center gap-2"><div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1 text-xs font-black text-emerald-100"><span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />{syncStatus}</div><button type="button" onClick={() => refreshSnapshot("手動同期中...")} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white/85 transition hover:bg-white/15 active:scale-95">手動同期</button></div></div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center"><button type="button" onClick={() => setGlobalSearchOpen(true)} className="fixed right-3 top-3 z-[70] rounded-2xl border border-white/15 bg-white px-4 py-3 text-sm font-black text-black shadow-xl transition active:scale-95 sm:static sm:py-2">🔎 検索</button><select value={themeKey} onChange={(e) => changeTheme(e.target.value as ThemeKey)} className="w-full rounded-2xl border border-white/20 bg-slate-950/90 px-3 py-3 text-sm text-white outline-none [color-scheme:dark] sm:w-auto sm:py-2">
              {Object.entries(themes).map(([key, value]) => <option key={key} value={key}>{value.emoji} {value.name}</option>)}
            </select></div>
          </div>
        </header>
        <section className={`mt-4 rounded-[1.75rem] border ${theme.card} p-3 shadow-2xl backdrop-blur-xl sm:mt-5 sm:rounded-[2rem] sm:p-6`}>
          {page === "home" && <HomePanel themeKey={themeKey} {...panelProps} />}
          {page === "memos" && <MemosPanel {...panelProps} />}
          {page === "tweets" && <TweetsPanel {...panelProps} />}
          {page === "todos" && <TodosPanel {...panelProps} />}
          {page === "calendar" && <CalendarPanel snapshot={snapshot} />}
          {page === "diary" && <DiaryPanel {...panelProps} />}
          {page === "coffee" && <CoffeePanel {...panelProps} />}
          {page === "budget" && <BudgetPanel themeKey={themeKey} {...panelProps} />}
          {page === "shopping" && <ShoppingPanel />}
          {page === "belongings" && <BelongingsPanel {...panelProps} />}
          {page === "routines" && <RoutinesPanel {...panelProps} />}
          {page === "trash" && <TrashPanel {...panelProps} />}
          {page === "map" && <MapPanel {...panelProps} />}
          {page === "heatmap" && <HeatmapPanel snapshot={snapshot} />}
          {page === "lifehub" && <LifeHubPanel snapshot={snapshot} setPage={setPage} />}
          {page === "braindump" && <BrainDumpPanel refreshSnapshot={refreshSnapshot} setPage={setPage} />}
          {page === "focus" && <FocusTimerPanel snapshot={snapshot} setPage={setPage} />}
          {page === "search" && <SecondBrainSearch snapshot={snapshot} setPage={setPage} />}
          {page === "tags" && <AutoTagsPanel snapshot={snapshot} />}
          {page === "chronology" && <ChronologyPanel snapshot={snapshot} />}
          {page === "anniversary" && <AnniversaryPanel snapshot={snapshot} />}
          {page === "condition" && <ConditionPanel snapshot={snapshot} />}
          {page === "cafe" && <CafeAtlasPanel snapshot={snapshot} setPage={setPage} />}
          {page === "goals" && <GoalsPanel snapshot={snapshot} />}
          {page === "ideals" && <IdealsPanel snapshot={snapshot} refreshSnapshot={refreshSnapshot} />}
          {page === "exp" && <ExpPanel snapshot={snapshot} setPage={setPage} />}
          {page === "night" && <NightModePanel setPage={setPage} />}
          {page === "settings" && <SettingsPanel themeKey={themeKey} onChangeTheme={changeTheme} />}
        </section>
        </div>
      </div>
      {globalSearchOpen && <GlobalSearchModal snapshot={snapshot} setPage={setPage} onClose={() => setGlobalSearchOpen(false)} />}
      <style jsx global>{`
        input[type="time"], input[type="date"], input[type="datetime-local"], select { color-scheme: dark; color: #f8fafc; background-color: rgba(2,6,23,.92); border-color: rgba(255,255,255,.22); }
        input[type="time"]::-webkit-calendar-picker-indicator, input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(1); opacity: .95; }
        .diary-content h1 { font-size: 2.25rem; line-height: 1.1; font-weight: 900; margin: .7rem 0; }
        .diary-content h2 { font-size: 1.75rem; line-height: 1.2; font-weight: 900; margin: .6rem 0; }
        .diary-content h3 { font-size: 1.35rem; line-height: 1.25; font-weight: 900; margin: .5rem 0; }
        .diary-content img { max-width: 100%; border-radius: 24px; margin: 14px 0; }
        .diary-content blockquote { margin: .8rem 0; border-radius: 18px; background: rgba(255,255,255,.06); padding: .75rem 1rem; }
        .nav-scroll::-webkit-scrollbar { width: 8px; }
        .nav-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.18); border-radius: 999px; }
        .nav-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/85 px-2 py-2 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-6xl snap-x gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => { const active = page === item.key; return <button key={item.key} onClick={() => setPage(item.key)} className={`min-w-[76px] snap-start rounded-2xl px-2 py-2 text-center text-[11px] transition sm:min-w-0 sm:flex-1 ${active ? `bg-gradient-to-r ${theme.accent} font-black text-black` : "bg-white/[0.04] text-white/65 hover:bg-white/10"}`}><div className="text-lg">{item.icon}</div><div>{item.label}</div></button>; })}
        </div>
      </nav>
    </main>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <div className={`rounded-[1.6rem] border border-white/10 bg-white/[0.075] p-4 shadow-xl ${className}`}>{children}</div>; }
function PrimaryButton({ children, onClick, disabled }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean }) { return <button onClick={onClick} disabled={disabled} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black transition active:scale-[0.99] disabled:opacity-50">{children}</button>; }
function Field(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-inner outline-none placeholder:text-white/40 [color-scheme:dark] focus:border-white/45 ${props.className || ""}`} />; }
function TimeField(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label = "時刻選択", className, ...rest } = props;
  return <label className={`block rounded-2xl border border-white/25 bg-slate-950/95 px-4 py-2 text-left shadow-inner ${className || ""}`}><span className="mb-1 block text-[11px] font-black tracking-wide text-cyan-100/80">{label}</span><input {...rest} type="time" className="w-full bg-transparent py-1 text-base font-black text-white outline-none [color-scheme:dark]" /></label>;
}
function DateField(props: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const { label = "日付選択", className, ...rest } = props;
  return <label className={`block rounded-2xl border border-white/25 bg-slate-950/95 px-4 py-2 text-left shadow-inner ${className || ""}`}><span className="mb-1 block text-[11px] font-black tracking-wide text-cyan-100/80">{label}</span><input {...rest} type="date" className="w-full bg-transparent py-1 text-base font-black text-white outline-none [color-scheme:dark]" /></label>;
}
function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={`w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white shadow-inner outline-none placeholder:text-white/40 [color-scheme:dark] focus:border-white/45 ${props.className || ""}`} />; }
function Empty({ text }: { text: string }) { return <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-6 text-center text-sm text-white/50">{text}</div>; }

type PanelProps = { snapshot: Snapshot | null; refreshSnapshot: (reason?: string) => Promise<void>; setPage: (p: PageKey) => void };

function HomePanel({ themeKey, snapshot, refreshSnapshot, setPage }: PanelProps & { themeKey: ThemeKey }) {
  const theme = themes[themeKey]; const [guideMessage, setGuideMessage] = useState("おかえり。今日の記録を一緒に整えるね。"); const [loading, setLoading] = useState(false);
  async function refreshGuide() {
    setLoading(true);
    try { const data = await loadSnapshot(); await refreshSnapshot(); const res = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "guideAI", data }) }); const json = await res.json(); const msg = json.result || localGuide(data); setGuideMessage(msg); setGuideDraft(msg); } catch { const msg = localGuide(snapshot); setGuideMessage(msg); setGuideDraft(msg); } finally { setLoading(false); }
  }
  useEffect(() => { const saved = localStorage.getItem("lifeGuideMessage"); if (saved) setGuideMessage(saved); const handler = (e: Event) => setGuideMessage((e as CustomEvent<string>).detail || "記録を受け取ったよ。"); window.addEventListener("life-guide-message", handler as EventListener); return () => window.removeEventListener("life-guide-message", handler as EventListener); }, []);
  const now = new Date();
  const dateLabel = now.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
  const timeLabel = now.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  return <div className="space-y-4"><LifeAssistPanel snapshot={snapshot} setPage={setPage} /><div className="grid gap-4 lg:grid-cols-[0.72fr_1.28fr]"><GlassCard className="p-5"><p className="text-xs font-bold text-white/55">{theme.emoji} Life Command OS</p><h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{dateLabel}</h2><p className="mt-3 text-5xl font-black tracking-tight sm:text-6xl">{timeLabel}</p><p className="mt-3 text-sm leading-7 text-white/60">ページ一覧は下のバーと左メニューに任せて、ホーム上部は軽くしたよ。</p></GlassCard><GuideAiCard themeKey={themeKey} message={guideMessage} onRefresh={refreshGuide} loading={loading} /></div></div>;
}

function makeFiveMinuteTodo(title: string) {
  const clean = String(title || "").trim() || "作業";
  if (/掃除|片付|整理/.test(clean)) return `${clean}のうち、机の上か床の一角だけを5分触る`;
  if (/買|スーパー|支払|予約|連絡/.test(clean)) return `${clean}に必要な画面/メモを開くだけやる`;
  if (/書|作|開発|コード|資料/.test(clean)) return `${clean}の最初の1行だけ作る`;
  return `${clean}を5分だけ始める。終わらせなくて大丈夫`;
}

function LifeAssistPanel({ snapshot, setPage }: { snapshot: Snapshot | null; setPage: (p: PageKey) => void }) {
  const today = todayKey();
  const todos = (snapshot?.todos || []).filter((t) => !t.done);
  const todayTodos = todos.filter((t) => (t.due_date || getCreatedDateKey(t.created_at)) === today);
  const now3 = (todayTodos.length ? todayTodos : todos).slice(0, 3);
  const laterItems = [...(snapshot?.memos || []), ...(snapshot?.tweets || [])].filter((m: any) => /あとで|後で|読む|調べ|買いたい|行きたい/.test(String(m.content || ""))).slice(0, 4);
  const monthLogs = (snapshot?.budget || []).filter((b) => isSameMonth(b.spend_date));
  const income = monthLogs.filter((b) => b.type === "income").reduce((s, b) => s + Number(b.amount || 0), 0);
  const expense = monthLogs.filter((b) => b.type === "expense").reduce((s, b) => s + Number(b.amount || 0), 0);
  const fixed = (snapshot?.budgetFixedTemplates || []).filter((f) => f.active).reduce((s, f) => s + Number(f.amount || 0), 0);
  const todayUsable = Math.floor(Math.max(0, income - expense - fixed) / daysLeftInMonth());
  const caffeine = (snapshot?.coffee || []).filter((c) => c.drink_date === today).reduce((s, c) => s + Number(c.caffeine_mg || 0), 0);
  const fatigueScore = todos.length + (caffeine > 300 ? 2 : 0) + ((snapshot?.sleep?.[0]?.quality || "").includes("悪") ? 3 : 0);
  const recentWords = [...(snapshot?.diaries || []), ...(snapshot?.memos || []), ...(snapshot?.tweets || [])].map((x: any) => `${x.title || ""} ${x.content || ""}`).join(" ");
  const memoryTags = ["サウナ", "青春ラン", "Wind Hunt", "江ノ島", "カフェ", "ストグリ", "ジム"].filter((w) => recentWords.includes(w));
  const doneToday = (snapshot?.todos || []).filter((t) => t.done && getCreatedDateKey(t.created_at) === today).length + (snapshot?.routineChecks || []).filter((r) => r.check_date === today).length;
  const happySpend = monthLogs.filter((b) => /サウナ|カフェ|ラン|ジム|音楽|本|学習/.test(`${b.category} ${b.memo || ""}`)).reduce((s, b) => s + Number(b.amount || 0), 0);
  return <div className="grid gap-3 xl:grid-cols-3">
    <GlassCard className="xl:col-span-3"><div className="grid gap-3 md:grid-cols-4"><div><p className="text-xs font-black text-cyan-100/70">朝ブリーフィング</p><p className="mt-1 text-sm text-white/70">今日のTODO {todayTodos.length}件 / カフェイン {caffeine}mg</p></div><div><p className="text-xs font-black text-emerald-100/70">やった感</p><p className="mt-1 text-sm text-white/70">今日の達成 {doneToday}個</p></div><div><p className="text-xs font-black text-amber-100/70">幸福コスパ候補</p><p className="mt-1 text-sm text-white/70">今月 {yen(happySpend)}</p></div><div><p className="text-xs font-black text-fuchsia-100/70">次の導線</p><button onClick={() => setPage(todos.length ? "todos" : "braindump")} className="mt-1 rounded-2xl bg-white px-3 py-2 text-xs font-black text-black">{todos.length ? "TODOへ" : "脳ダンプへ"}</button></div></div></GlassCard>
    <GlassCard><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-cyan-100/70">ワーキングメモリ軽量化</p><h2 className="mt-1 text-2xl font-black">今やる3つ</h2></div><button onClick={() => setPage("todos")} className="rounded-2xl bg-white px-3 py-2 text-xs font-black text-black">TODOへ</button></div><div className="mt-4 space-y-2">{now3.length ? now3.map((t) => <div key={t.id} className="rounded-2xl bg-black/25 p-3 text-sm font-bold">{t.title}<p className="mt-1 text-xs text-white/45">5分版: {makeFiveMinuteTodo(t.title)}</p></div>) : <p className="text-sm text-white/55">今すぐ扱うTODOは少なめ。いい感じに余白があるよ。</p>}</div></GlassCard>
    <GlassCard><p className="text-xs font-black text-emerald-100/70">QOLガード</p><h2 className="mt-1 text-2xl font-black">今日あと使える額</h2><p className="mt-3 text-4xl font-black">{yen(todayUsable)}</p><p className="mt-2 text-sm text-white/55">収入・今月支出・固定費テンプレから日割りで計算。</p><p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm">{fatigueScore >= 6 ? "脳疲労が強めの日。TODO表示を3つに絞るのが相性よさそう。" : "今日はまだ処理余力が残りやすい状態に見えるよ。"}</p></GlassCard>
    <GlassCard><p className="text-xs font-black text-amber-100/70">ADHDサポート</p><h2 className="mt-1 text-2xl font-black">外出前・衝動買い・カフェイン</h2><div className="mt-3 space-y-2 text-sm text-white/75"><p>🎒 外出前: 財布・鍵・イヤホン・充電を確認しやすくする入口。</p><p>🛒 衝動買い: {fatigueScore >= 6 ? "今日は警戒寄り。買う前に後でBOXへ逃がすと安全。" : "今日は通常モード。"}</p><p>☕ カフェイン: 約{caffeine}mg / {caffeine >= 300 ? "夜の覚醒に残りやすいかも" : "まだ強すぎない範囲"}</p></div><div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setPage("belongings")} className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold">持ち物へ</button><button onClick={() => setPage("coffee")} className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold">コーヒーへ</button></div></GlassCard>
    <GlassCard className="xl:col-span-2"><p className="text-xs font-black text-fuchsia-100/70">後で読むBOX / 途中だったもの</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{laterItems.length ? laterItems.map((item: any) => <div key={item.id} className="rounded-2xl bg-black/25 p-3 text-sm text-white/75">{String(item.content || "").slice(0, 90)}</div>) : <p className="text-sm text-white/55">「あとで」「調べる」「買いたい」と書いたメモやつぶやきがここに集まるよ。</p>}<div className="rounded-2xl bg-black/25 p-3 text-sm text-white/75">前回途中候補: {todos[0]?.title || snapshot?.memos?.[0]?.content?.slice(0, 40) || "まだ候補なし"}</div></div></GlassCard>
    <GlassCard><p className="text-xs font-black text-sky-100/70">ライフログ自動記憶</p><h2 className="mt-1 text-xl font-black">最近の軸</h2><p className="mt-3 text-sm text-white/65">{memoryTags.length ? memoryTags.join(" / ") : "よく出る言葉が増えると、ここに自動で並ぶよ。"}</p></GlassCard>
  </div>;
}

function localGuide(data: Snapshot | null) { const today = todayKey(); const todos = data?.todos.filter((t) => t.due_date === today && !t.done).length || 0; const caffeine = data?.coffee.filter((c) => c.drink_date === today).reduce((s, c) => s + Number(c.caffeine_mg || 0), 0) || 0; const routines = data?.routineChecks.filter((c) => c.check_date === today).length || 0; return `しゅうやくん、今日のログを見たよ。未完了TODOは${todos}件、カフェインは約${caffeine}mg、習慣チェックは${routines}件。全部を完璧にしなくても、今日の流れはちゃんと残ってるよ。まずは一番軽いページから触れたら大丈夫。`; }
function GuideAiCard({ themeKey, message, onRefresh, loading }: { themeKey: ThemeKey; message: string; onRefresh?: () => void; loading?: boolean }) { const theme = themes[themeKey]; return <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.08] shadow-2xl"><div className="relative h-72 bg-black/30 sm:h-80"><img src="/life-ai-guide.png" alt="案内係AI" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" /><div className="absolute bottom-4 left-4 right-4"><p className={`inline-flex rounded-full bg-gradient-to-r ${theme.accent} px-3 py-1 text-xs font-black text-black`}>癒し系案内AI</p><h3 className="mt-2 text-2xl font-black">今日もおつかれさま。</h3></div></div><div className="p-4 sm:p-5"><div className="relative rounded-3xl border border-white/10 bg-black/30 p-4"><div className="absolute -top-2 left-8 h-4 w-4 rotate-45 border-l border-t border-white/10 bg-black/30" /><p className="whitespace-pre-wrap text-sm leading-7 text-white/82">{message}</p></div>{onRefresh && <button onClick={onRefresh} disabled={loading} className="mt-3 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-black disabled:opacity-50">{loading ? "読んでる..." : "今日の内容から話しかけてもらう"}</button>}</div></div>; }

function MemosPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [edit, setEdit] = useState<Memo | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Memo | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [residentAiOn, setResidentAiOn] = useState(true);
  const [memoAiMode, setMemoAiMode] = useState<"annotate" | "classify" | "support">("annotate");
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
    const { error } = await supabase.from("memos").update({ content: editContent }).eq("id", edit.id);
    if (error) return alert(error.message);
    setEdit(null);
    await refreshSnapshot();
  }
  async function del() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("memos").delete().eq("id", deleteTarget.id);
    if (error) return alert(error.message);
    setDeleteTarget(null);
    setGuideDraft("メモを削除したよ。必要な整理ができたね。");
    await refreshSnapshot();
  }
  async function memoAi() {
    const text = content.trim() || memos.slice(0, 5).map((m) => m.content).join("\n---\n");
    if (!text) return setAiText("AIに渡せるメモがまだないよ。");
    setAiLoading(true);
    try {
      const res = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "memoSmartAI", text }) });
      const json = await res.json();
      setAiText(json.result || "整理できなかったみたい。");
    } catch {
      setAiText("AI整理に失敗したよ。APIキーや通信状態を確認してね。");
    } finally {
      setAiLoading(false);
    }
  }

  async function residentMemoAi(target?: Memo) {
    const base = target?.content || content.trim() || memos.slice(0, 8).map((m) => m.content).join("\n---\n");
    if (!base.trim()) return setAiText("常駐AIが見るメモがまだないよ。");
    setAiLoading(true);
    try {
      const prompt = memoAiMode === "annotate"
        ? `次のメモに、短い注釈・補足・抜けていそうな観点を付けて。\n${base}`
        : memoAiMode === "classify"
          ? `次のメモをカテゴリ分けして、タグ候補と保存先の候補を出して。\n${base}`
          : `次のメモをもとに、次に取りやすい小さな行動と注意点を出して。\n${base}`;
      const res = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "memoSmartAI", text: prompt }) });
      const json = await res.json();
      setAiText(json.result || "常駐AIの補助を作れなかったみたい。");
    } catch {
      setAiText("常駐AIに失敗したよ。APIキーや通信状態を確認してね。");
    } finally {
      setAiLoading(false);
    }
  }

  async function memoToTodos() {
    const text = content.trim() || memos.slice(0, 5).map((m) => m.content).join("\n---\n");
    if (!text) return setAiText("TODO化できるメモがまだないよ。");
    setAiLoading(true);
    try {
      const res = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "memoToTodosAI", text }) });
      const json = await res.json().catch(() => ({}));
      const tasks = Array.isArray(json.todos) ? json.todos : [];
      if (!res.ok && !tasks.length) {
        setAiText(json.error || "TODO化APIが失敗したよ。VercelのOPENAI_API_KEYを確認してね。");
        return;
      }
      if (!tasks.length) {
        setAiText(json.result || "TODO候補は見つからなかったよ。");
        return;
      }
      const { inserted, lastError } = await insertTodoCandidates(tasks);
      if (!inserted) {
        setAiText(`TODO候補は見つかったけど保存に失敗したよ。${lastError || "todosテーブルを確認してね。"}`);
        return;
      }
      setAiText(`${inserted}件のTODO候補を追加したよ。`);
      setGuideDraft("メモからTODOを抜き出して追加したよ。頭の中の材料が行動リストになったね。");
      await refreshSnapshot();
    } catch (error) {
      console.error(error);
      setAiText("TODO化に失敗したよ。/api の応答かVercelの環境変数を確認してね。");
    } finally {
      setAiLoading(false);
    }
  }
  return <div className="space-y-4">
    <GlassCard className="bg-gradient-to-br from-cyan-400/10 to-fuchsia-400/10"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-2xl font-black">メモ常駐AI</h2><p className="mt-1 text-sm text-white/60">注釈・付け足し・分類・補助を、メモページ内でいつでも呼び出せるようにしたよ。</p></div><button onClick={() => setResidentAiOn(!residentAiOn)} className={`rounded-2xl px-4 py-3 font-black ${residentAiOn ? "bg-emerald-300 text-black" : "bg-white/10"}`}>{residentAiOn ? "AI ON" : "AI OFF"}</button></div>{residentAiOn && <div className="mt-4 grid gap-2 sm:grid-cols-[180px_1fr]"><select value={memoAiMode} onChange={(e) => setMemoAiMode(e.target.value as any)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-3 text-white"><option value="annotate">注釈</option><option value="classify">分類</option><option value="support">補助</option></select><button onClick={() => residentMemoAi()} disabled={aiLoading} className="rounded-2xl bg-white px-4 py-3 font-black text-black disabled:opacity-50">今のメモをAI補助</button></div>}</GlassCard>
    <TextArea className="h-32" placeholder="メモを書く... 画像も添付できるよ" value={content} onChange={(e) => setContent(e.target.value)} />
    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white/70" />
    <div className="grid gap-2 sm:grid-cols-3"><PrimaryButton onClick={add}>メモを保存</PrimaryButton><button onClick={memoAi} disabled={aiLoading} className="rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50">AIで整理</button><button onClick={memoToTodos} disabled={aiLoading} className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-black disabled:opacity-50">メモからTODO作成</button></div>
    {aiText && <GlassCard><p className="whitespace-pre-wrap text-sm leading-7 text-white/78">{aiText}</p></GlassCard>}
    {!memos.length && <Empty text="まだメモがないよ。追加するとここにカード表示されるよ。" />}
    <div className="grid gap-3">
      {memos.map((m) => <div id={`memo-${m.id}`} data-search-id={`memo-${m.id}`} key={m.id}><GlassCard>
        <p className="whitespace-pre-wrap text-sm leading-7">{m.content}</p>
        <ImagePreview src={m.image_url} />
        <p className="mt-2 text-xs text-white/40">{new Date(m.created_at).toLocaleString("ja-JP")}</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button onClick={() => residentMemoAi(m)} className="rounded-2xl bg-cyan-300 px-3 py-2 text-sm font-black text-black">AI注釈</button>
          <button onClick={() => { setEdit(m); setEditContent(m.content); }} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold">編集</button>
          <button onClick={() => setDeleteTarget(m)} className="rounded-2xl bg-red-500 px-3 py-2 text-sm font-bold">削除</button>
        </div>
      </GlassCard></div>)}
    </div>
    {edit && <Modal title="メモ編集" onClose={() => setEdit(null)}><TextArea className="h-48" value={editContent} onChange={(e) => setEditContent(e.target.value)} /><button onClick={save} className="mt-3 w-full rounded-2xl bg-white px-4 py-3 font-black text-black">保存</button></Modal>}
    {deleteTarget && <Modal title="本当に削除する？" onClose={() => setDeleteTarget(null)}><p className="line-clamp-5 whitespace-pre-wrap text-sm text-white/65">{deleteTarget.content}</p><button onClick={del} className="mt-4 w-full rounded-2xl bg-red-500 px-4 py-3 font-black text-white">完全に削除する</button><button onClick={() => setDeleteTarget(null)} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 font-bold">キャンセル</button></Modal>}
  </div>;
}

function TweetsPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("普通");
  const [deleteTarget, setDeleteTarget] = useState<Tweet | null>(null);
  const tweets = snapshot?.tweets || [];
  async function add() {
    if (!content.trim()) return;
    const { error } = await supabase.from("tweets").insert({ tweet_date: todayKey(), content, mood });
    if (error) return alert(error.message);
    setContent("");
    setGuideDraft("つぶやきを受け取ったよ。軽く外に出せただけでも、心の圧は少し下がりやすいよ。");
    await refreshSnapshot();
  }
  async function del() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("tweets").delete().eq("id", deleteTarget.id);
    if (error) return alert("つぶやき削除失敗: " + error.message);
    setDeleteTarget(null);
    setGuideDraft("つぶやきを削除したよ。不要なログを整理できたね。");
    await refreshSnapshot();
  }
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-[1fr_180px]"><TextArea placeholder="軽い愚痴・一言メモ..." value={content} onChange={(e) => setContent(e.target.value)} /><select value={mood} onChange={(e) => setMood(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"><option>最高</option><option>良い</option><option>普通</option><option>疲れた</option><option>しんどい</option></select></div><PrimaryButton onClick={add}>つぶやく</PrimaryButton><div className="space-y-3">{tweets.map((t) => <div id={`tweet-${t.id}`} data-search-id={`tweet-${t.id}`} key={t.id}><GlassCard><p className="text-xs text-white/45">{t.tweet_date} / {t.mood}</p><p className="mt-2 whitespace-pre-wrap">{t.content}</p><ImagePreview src={t.image_url} /><button onClick={() => setDeleteTarget(t)} className="mt-3 w-full rounded-2xl bg-red-500 px-3 py-2 text-sm font-bold">削除</button></GlassCard></div>)}</div>{deleteTarget && <Modal title="つぶやきを削除する？" onClose={() => setDeleteTarget(null)}><p className="whitespace-pre-wrap text-sm text-white/65">{deleteTarget.content}</p><button onClick={del} className="mt-4 w-full rounded-2xl bg-red-500 px-4 py-3 font-black text-white">完全に削除する</button><button onClick={() => setDeleteTarget(null)} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 font-bold">キャンセル</button></Modal>}</div>;
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
    setLocalTodos((current) => current.filter((local) => !snapshot.todos.some((todo) => todo.id === local.id)));
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

    const fullResult = await supabase.from("todos").insert(fullPayload).select("*").single();

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
        const fallbackResult = await supabase.from("todos").insert(fallbackPayload).select("*").single();
        if (fallbackResult.error) {
          saveError = fallbackResult.error;
        } else {
          savedTodo = fallbackResult.data as Todo;
          setTodoMessage("TODOを保存したよ。時刻/場所を使うには統合SQLをもう一度実行してね。");
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

    setLocalTodos((current) => [savedTodo as Todo, ...current.filter((todo) => todo.id !== savedTodo?.id)]);
    setSelectedDate(savedTodo.due_date || dueDate || todayKey());
    setTitle("");
    setLocation("");
    setDueTime("");
    setTodoImageFile(null);
    setGuideDraft(`TODO「${savedTodo.title}」を追加したよ。${savedTodo.due_time ? savedTodo.due_time + "に通知を見るね。" : "日付の一覧にも表示されるよ。"}`);

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
      const columnMismatch = message.includes("due_time") || message.includes("location_name") || message.includes("notify_enabled") || message.includes("column") || message.includes("schema cache");
      if (columnMismatch) {
        const fallbackResult = await supabase.from("todos").update({ title: nextEdit.title, priority: nextEdit.priority, due_date: nextEdit.due_date }).eq("id", nextEdit.id);
        if (fallbackResult.error) {
          setTodoMessage("TODO更新失敗: " + fallbackResult.error.message);
          setEdit(edit);
          return;
        }
        setTodoMessage("TODOを更新したよ。時刻/場所を使うには統合SQLをもう一度実行してね。");
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
    setGuideDraft(nextDone ? `TODO「${t.title}」を完了にしたよ。いい感じ。` : `TODO「${t.title}」を未完了に戻したよ。`);
    const { error } = await supabase.from("todos").update({ done: nextDone }).eq("id", t.id);
    if (error) {
      setLocalDone((current) => ({ ...current, [t.id]: t.done }));
      setTodoMessage("TODO更新失敗: " + error.message);
      return;
    }
    refreshSnapshot();
  }

  async function del(id: string) {
    const target = todos.find((todo) => todo.id === id);
    if (!confirm(`TODO「${target?.title || "このTODO"}」を削除していい？`)) return;
    setLocalTodos((current) => current.filter((todo) => todo.id !== id));
    const { error } = await supabase.from("todos").delete().eq("id", id);
    if (error) {
      setTodoMessage("TODO削除失敗: " + error.message);
      await refreshSnapshot();
      return;
    }
    setTodoMessage("TODOを削除したよ。");
    await refreshSnapshot();
  }

  async function markSelectedDone() {
    const ids = selectedTodos.filter((t) => !t.done).map((t) => t.id);
    if (!ids.length) return setTodoMessage("この日の未完了TODOはないよ。");
    const { error } = await supabase.from("todos").update({ done: true }).in("id", ids);
    if (error) return setTodoMessage("一括完了に失敗: " + error.message);
    setLocalDone((cur) => ids.reduce((acc, id) => ({ ...acc, [id]: true }), cur));
    setTodoMessage(`${ids.length}件をまとめて完了にしたよ。`);
    await refreshSnapshot();
  }

  async function moveUndatedToSelectedDate() {
    const ids = todos.filter((t) => !t.due_date).map((t) => t.id).slice(0, 30);
    if (!ids.length) return setTodoMessage("日付なしTODOはないよ。");
    const { error } = await supabase.from("todos").update({ due_date: selectedDate }).in("id", ids);
    if (error) return setTodoMessage("日付なしTODOの移動に失敗: " + error.message);
    setTodoMessage(`日付なしTODO ${ids.length}件を ${selectedDate} に移動したよ。`);
    await refreshSnapshot();
  }


  async function todoAi() {
    const source = todos.slice(0, 20).map((t) => `${t.done ? "完了" : "未完了"}: ${t.title} / ${t.due_date || "日付なし"} / ${t.priority}`).join("\n");
    if (!source) return setTodoAiText("分析できるTODOがまだないよ。");
    setTodoAiLoading(true);
    try {
      const res = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "todoAI", text: source }) });
      const json = await res.json();
      setTodoAiText(json.result || "TODOを整理できなかったみたい。");
    } catch {
      setTodoAiText("TODOのAI分析に失敗したよ。APIキーや通信状態を確認してね。");
    } finally {
      setTodoAiLoading(false);
    }
  }

  async function imageToTodos() {
    const imageDataUrl = await imageFileToDataUrl(todoImageFile);
    if (!imageDataUrl) return setTodoMessage("TODO化したい画像を選んでね。");
    setTodoAiLoading(true);
    try {
      const res = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "imageToTodosAI", imageDataUrl }) });
      const json = await res.json().catch(() => ({}));
      const tasks = Array.isArray(json.todos) ? json.todos : [];
      if (!res.ok && !tasks.length) {
        setTodoAiText(json.error || json.result || `画像TODO化APIが失敗したよ。HTTP ${res.status}。画像サイズ・Vercel環境変数・/apiのログを確認してね。`);
        return;
      }
      if (!tasks.length) {
        setTodoAiText(json.result || "画像からTODO候補を見つけられなかったよ。画像内の文字が小さい場合は、文字が大きく写っている画像で試してね。");
        return;
      }
      const targetDate = selectedDate || todayKey();
      const datedTasks = tasks.map((task: TodoInsertCandidate) => ({
        ...task,
        due_date: typeof task.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(task.due_date) ? task.due_date : targetDate,
      }));
      const { inserted, lastError, savedTodos } = await insertTodoCandidates(datedTasks, targetDate);
      if (!inserted) {
        setTodoAiText(`画像からTODO候補は見つかったけど保存に失敗したよ。${lastError || "todosテーブルを確認してね。"}`);
        return;
      }
      if (savedTodos.length) {
        setLocalTodos((current) => [
          ...savedTodos,
          ...current.filter((todo) => !savedTodos.some((saved) => saved.id === todo.id)),
        ]);
        setSelectedDate(targetDate);
      }
      setTodoAiText(`${inserted}件のTODO候補を追加したよ。${targetDate === todayKey() ? "今日の日付別TODOにも反映したよ。" : `${targetDate} の日付別TODOにも反映したよ。`}`);
      setTodoImageFile(null);
      setGuideDraft("写真からTODOを読み取って追加したよ。画像の情報を行動リストに変えられたね。");
      await refreshSnapshot();
    } catch (error) {
      console.error(error);
      setTodoAiText("写真からTODO化する処理に失敗したよ。画像を圧縮して送る修正版だけど、まだ失敗する場合はVercelのFunctionsログに出たエラー全文が必要だよ。");
    } finally {
      setTodoAiLoading(false);
    }
  }

  const selectedTodos = todos.filter((t) => (t.due_date || getCreatedDateKey(t.created_at)) === selectedDate);
  const selectedDone = selectedTodos.filter((t) => t.done).length;
  const selectedHigh = selectedTodos.filter((t) => !t.done && t.priority === "high").length;
  const overdueTodos = todos.filter((t) => !t.done && t.due_date && t.due_date < todayKey()).length;
  const undatedTodos = todos.filter((t) => !t.due_date).length;

  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-xl font-black">TODO</h2>
        <p className="mt-1 text-sm text-white/55">写真・AI整理・日付別管理をまとめたTODOページ。</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-2xl bg-black/25 p-3"><p className="text-xs text-white/45">選択日の達成</p><p className="text-2xl font-black">{selectedDone}/{selectedTodos.length}</p></div>
          <div className="rounded-2xl bg-black/25 p-3"><p className="text-xs text-white/45">重要未完了</p><p className="text-2xl font-black">{selectedHigh}</p></div>
          <div className="rounded-2xl bg-black/25 p-3"><p className="text-xs text-white/45">期限切れ</p><p className="text-2xl font-black">{overdueTodos}</p></div>
          <div className="rounded-2xl bg-black/25 p-3"><p className="text-xs text-white/45">日付なし</p><p className="text-2xl font-black">{undatedTodos}</p></div>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2"><button onClick={markSelectedDone} className="rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-black">選択日の未完了を一括完了</button><button onClick={moveUndatedToSelectedDate} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">日付なしを選択日に移動</button></div>
      </GlassCard>

      <div className="grid gap-3 rounded-[2rem] border border-white/10 bg-black/20 p-4">
        <Field placeholder="TODOを書く..." value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-4">
          <DateField label="TODO日付" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <TimeField label="時刻選択" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
            <option value="low">低</option>
            <option value="normal">普通</option>
            <option value="high">高</option>
          </select>
          <Field placeholder="場所/地図検索" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>
        <input type="file" accept="image/*" onChange={(e) => setTodoImageFile(e.target.files?.[0] || null)} className="w-full rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white/70" />
        <div className="grid gap-2 sm:grid-cols-3">
          <button onClick={add} disabled={saving} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black transition active:scale-[0.98] disabled:opacity-50">
            {saving ? "保存中..." : "TODO追加"}
          </button>
          <button onClick={todoAi} disabled={todoAiLoading} className="rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50">TODOをAI整理</button>
          <button onClick={imageToTodos} disabled={todoAiLoading} className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-black disabled:opacity-50">写真からTODO作成</button>
        </div>
        {todoMessage && <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/75">{todoMessage}</p>}
        {todoAiText && <p className="whitespace-pre-wrap rounded-2xl bg-white/10 px-4 py-3 text-sm leading-7 text-white/75">{todoAiText}</p>}
      </div>

      <GlassCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-black">日付別TODO</h3>
            <p className="mt-1 text-xs text-white/50">追加したTODOはすぐここに表示される。</p>
          </div>
          <div className="w-full sm:max-w-xs"><DateField label="表示する日付" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></div>
        </div>
        {!selectedTodos.length && <p className="mt-4 text-sm text-white/50">この日のTODOはまだないよ。</p>}
        <div className="mt-4 space-y-3">
          {selectedTodos.map((t) => (
            <div id={`todo-${t.id}`} data-search-id={`todo-${t.id}`} key={t.id} className="rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="flex items-start gap-3">
                <button onClick={() => toggle(t)} aria-label={t.done ? "未完了に戻す" : "完了にする"} className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-base font-black transition active:scale-95 ${t.done ? "border-emerald-200 bg-emerald-300 text-black shadow-lg shadow-emerald-500/20" : "border-white/25 bg-white/10 text-white/50 hover:bg-white/18"}`}>{t.done ? "✓" : ""}</button>
                <div className="flex-1">
                  <p className={t.done ? "text-white/40 line-through" : "font-black"}>{t.title}</p>
                  <p className="mt-1 text-xs text-white/45">{t.due_date || "日付なし"}{t.due_time ? ` ${t.due_time}` : " 時刻未設定"} / 優先度:{t.priority}</p>
                  <ImagePreview src={t.image_url} />
                  {t.location_name && <button onClick={() => openMap(t.location_name || "")} className="mt-2 rounded-xl bg-sky-500/20 px-3 py-2 text-xs font-bold text-sky-100">地図で開く: {t.location_name}</button>}
                </div>
                <div className="grid gap-2">
                  <button onClick={() => setGuideDraft(`「${t.title}」を開始したよ。完了じゃなくても、始めた時点で前進だよ。`)} className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-black">開始</button>
                  <button onClick={() => alert(`5分版: ${makeFiveMinuteTodo(t.title)}`)} className="rounded-xl bg-amber-300 px-3 py-2 text-xs font-black text-black">5分化</button>
                  <button onClick={() => setEdit(t)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">編集</button>
                  <button onClick={() => del(t.id)} className="rounded-xl bg-red-500 px-3 py-2 text-xs font-bold">削除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="text-lg font-black">全TODO（一発チェック）</h3>
        <p className="mt-1 text-xs text-white/50">丸ボタンを押すだけで直接チェックできる。</p>
        <div className="mt-3 space-y-2">
          {todos.slice(0, 30).map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-white/10 p-3 text-sm">
              <button onClick={() => toggle(t)} aria-label={t.done ? "未完了に戻す" : "完了にする"} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition active:scale-95 ${t.done ? "border-emerald-200 bg-emerald-300 text-black" : "border-white/25 bg-black/20 text-white/50 hover:bg-white/15"}`}>{t.done ? "✓" : ""}</button>
              <button onClick={() => setSelectedDate(t.due_date || getCreatedDateKey(t.created_at))} className="min-w-0 flex-1 text-left">
                <span className={t.done ? "text-white/40 line-through" : "font-bold"}>{t.title}</span>
                <span className="ml-2 text-xs text-white/45">{t.due_date || "日付なし"}</span>
              </button>
              <button onClick={() => setEdit(t)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold">編集</button>
            </div>
          ))}
        </div>
      </GlassCard>

      {edit && (
        <Modal title="TODO編集" onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <Field value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            <DateField label="TODO日付" value={edit.due_date || ""} onChange={(e) => setEdit({ ...edit, due_date: e.target.value })} />
            <TimeField label="時刻選択" value={edit.due_time || ""} onChange={(e) => setEdit({ ...edit, due_time: e.target.value })} />
            <Field placeholder="場所" value={edit.location_name || ""} onChange={(e) => setEdit({ ...edit, location_name: e.target.value })} />
            <select value={edit.priority} onChange={(e) => setEdit({ ...edit, priority: e.target.value })} className="w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
              <option value="low">低</option>
              <option value="normal">普通</option>
              <option value="high">高</option>
            </select>
            <button onClick={saveEdit} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">変更を保存</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CalendarPanel({ snapshot }: { snapshot: Snapshot | null }) { const [selected, setSelected] = useState(todayKey()); const items = [...(snapshot?.diaries || []).filter((d) => d.entry_date === selected).map((d) => ({ type: "Diary", text: d.title || stripHtml(d.content) })), ...(snapshot?.todos || []).filter((t) => (t.due_date || getCreatedDateKey(t.created_at)) === selected).map((t) => ({ type: "TODO", text: t.title })), ...(snapshot?.tweets || []).filter((t) => t.tweet_date === selected).map((t) => ({ type: "つぶやき", text: t.content })), ...(snapshot?.coffee || []).filter((c) => c.drink_date === selected).map((c) => ({ type: "Coffee", text: `${c.coffee_name} ${c.cups}杯` }))]; return <div className="space-y-4"><DateField label="日付選択" value={selected} onChange={(e) => setSelected(e.target.value)} /><GlassCard><h2 className="text-xl font-black">{selected} の記録</h2>{!items.length && <p className="mt-3 text-sm text-white/50">この日の記録はまだないよ。</p>}<div className="mt-3 space-y-2">{items.map((i, idx) => <div key={idx} className="rounded-2xl bg-black/25 p-3"><p className="text-xs text-white/45">{i.type}</p><p className="mt-1">{i.text}</p></div>)}</div></GlassCard></div>; }

function DiaryPanel({ snapshot, refreshSnapshot, setPage }: PanelProps) {
  type DiaryBlock = { id: string; kind: "p" | "h1" | "h2" | "h3" | "quote"; text: string; color: string; bold: boolean; size: "sm" | "base" | "lg" | "xl" };
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("普通");
  const [date, setDate] = useState(todayKey());
  const [content, setContent] = useState("");
  const [image, setImage] = useState("");
  const [blocks, setBlocks] = useState<DiaryBlock[]>([{ id: `block-${Date.now()}`, kind: "p", text: "", color: "#f8fafc", bold: false, size: "base" }]);
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
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/\n/g, "<br />");
  }
  function blockClass(block: DiaryBlock) {
    const size = block.size === "sm" ? "font-size:.95rem;" : block.size === "lg" ? "font-size:1.18rem;" : block.size === "xl" ? "font-size:1.35rem;" : "";
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
        if (block.kind === "quote") return `<blockquote style="${style};border-left:4px solid rgba(255,255,255,.35);padding-left:1rem;opacity:.92">${text}</blockquote>`;
        return `<p style="${style}">${text}</p>`;
      })
      .join("\n");
  }
  function addBlock(afterIndex?: number) {
    const next: DiaryBlock = { id: `block-${Date.now()}-${Math.random().toString(16).slice(2)}`, kind: "p", text: "", color: "#f8fafc", bold: false, size: "base" };
    setBlocks((current) => {
      const copy = [...current];
      copy.splice(typeof afterIndex === "number" ? afterIndex + 1 : copy.length, 0, next);
      return copy;
    });
  }
  function updateBlock(id: string, patch: Partial<DiaryBlock>) {
    setBlocks((current) => current.map((block) => (block.id === id ? { ...block, ...patch } : block)));
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
    setBlocks((current) => current.length <= 1 ? current.map((b) => b.id === id ? { ...b, text: "" } : b) : current.filter((block) => block.id !== id));
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
    setBlocks([{ id: `block-${Date.now()}`, kind: "p", text: "", color: "#f8fafc", bold: false, size: "base" }]);
    setGuideDraft("Diaryを保存したよ。ブロックの並びも装飾も、ブログ記事みたいに残せるようにしたよ。");
    await refreshSnapshot();
  }

  const previewHtml = editorMode === "blocks" ? blocksToHtml() : content;

  if (readerTarget) {
    return (
      <div className="space-y-4">
        <GlassCard className="bg-black/35">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black text-white/45">{readerTarget.entry_date} / {readerTarget.mood}</p>
              <h2 className="mt-1 text-3xl font-black sm:text-4xl">{readerTarget.title || "Diary"}</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button onClick={() => setReaderTarget(null)} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">前のページへ戻る</button>
              <button onClick={() => { setReaderTarget(null); setPage("home"); }} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black">ホームへ戻る</button>
            </div>
          </div>
        </GlassCard>
        <article className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-slate-950/70 p-5 shadow-2xl sm:p-8">
          {readerTarget.image_url && !diaryHasImageInContent(readerTarget) && (
            <img src={readerTarget.image_url} alt="Diary image" className="mb-6 w-full rounded-[2rem] object-cover shadow-2xl" />
          )}
          <div className="diary-content text-base leading-8 text-white/88 sm:text-lg" dangerouslySetInnerHTML={{ __html: readerTarget.content }} />
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">Diary</h2>
        <p className="mt-2 text-sm text-white/60">今のブログ風プレビューに、前のブロック移動・色変更・太字・H1/H2/H3を復活させたよ。文章の塊を上下に動かして、記事みたいに組み立てられる。</p>
      </GlassCard>
      <div className="grid gap-3">
        <Field placeholder="タイトル" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid gap-3 sm:grid-cols-3">
          <DateField label="Diary日付" value={date} onChange={(e) => setDate(e.target.value)} />
          <select value={mood} onChange={(e) => setMood(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
            <option>最高</option><option>良い</option><option>普通</option><option>疲れた</option><option>しんどい</option>
          </select>
          <select value={editorMode} onChange={(e) => setEditorMode(e.target.value as "blocks" | "html")} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">
            <option value="blocks">ブロック編集</option>
            <option value="html">HTML直接編集</option>
          </select>
        </div>
        <div className="space-y-2 rounded-3xl border border-white/10 bg-black/20 p-3"><Field placeholder="写真URL（任意・URLでもOK）" value={image} onChange={(e) => setImage(e.target.value)} /><label className="block rounded-2xl border border-dashed border-white/25 bg-white/10 p-4 text-sm font-bold text-white/80"><span>写真ライブラリから選ぶ（Mac/iPhone対応）</span><input type="file" accept="image/*" className="mt-3 block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:font-black file:text-black" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { const dataUrl = await fileToDataUrl(file); setImage(dataUrl); setGuideDraft("Diary用の写真を読み込んだよ。保存すると日記に添付されるよ。"); } catch { alert("写真の読み込みに失敗したよ。別の写真で試してね。"); } }} /></label>{image && <img src={image} alt="Diary preview" className="max-h-72 w-full rounded-3xl object-cover" />}</div>
        {editorMode === "blocks" ? (
          <div className="space-y-3">
            {blocks.map((block, index) => (
              <div key={block.id} className="rounded-3xl border border-white/10 bg-black/25 p-3">
                <div className="grid gap-2 md:grid-cols-[92px_1fr_86px_92px_130px]">
                  <select value={block.kind} onChange={(e) => updateBlock(block.id, { kind: e.target.value as DiaryBlock["kind"] })} className="rounded-2xl border border-white/20 bg-slate-950/90 p-3 text-sm text-white">
                    <option value="p">本文</option><option value="h1">H1</option><option value="h2">H2</option><option value="h3">H3</option><option value="quote">引用</option>
                  </select>
                  <TextArea className="min-h-24" placeholder="文章ブロックを書く" value={block.text} onChange={(e) => updateBlock(block.id, { text: e.target.value })} />
                  <input type="color" value={block.color} onChange={(e) => updateBlock(block.id, { color: e.target.value })} className="h-full min-h-12 w-full rounded-2xl border border-white/20 bg-slate-950/90 p-2" />
                  <select value={block.size} onChange={(e) => updateBlock(block.id, { size: e.target.value as DiaryBlock["size"] })} className="rounded-2xl border border-white/20 bg-slate-950/90 p-3 text-sm text-white">
                    <option value="sm">小</option><option value="base">標準</option><option value="lg">大</option><option value="xl">特大</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => updateBlock(block.id, { bold: !block.bold })} className={`rounded-2xl px-3 py-2 text-sm font-black ${block.bold ? "bg-white text-black" : "bg-white/10"}`}>太字</button>
                    <button onClick={() => addBlock(index)} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">追加</button>
                    <button onClick={() => moveBlock(index, -1)} disabled={index === 0} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black disabled:opacity-35">↑</button>
                    <button onClick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black disabled:opacity-35">↓</button>
                  </div>
                </div>
                <button onClick={() => deleteBlock(block.id)} className="mt-2 rounded-2xl bg-red-500/80 px-3 py-2 text-xs font-black">このブロックを削除</button>
              </div>
            ))}
            <button onClick={() => addBlock()} className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 font-black">＋ ブロックを追加</button>
          </div>
        ) : (
          <TextArea className="h-48" placeholder="本文。<h1>見出し</h1> や <b>太字</b> も使えるよ。" value={content} onChange={(e) => setContent(e.target.value)} />
        )}
        <GlassCard className="bg-slate-950/60"><p className="mb-3 text-xs font-black text-white/45">ブログ風プレビュー</p><div className="diary-content text-base leading-8 text-white/88" dangerouslySetInnerHTML={{ __html: previewHtml || "<p style='opacity:.55'>ここにプレビューが出るよ。</p>" }} /></GlassCard>
        <PrimaryButton onClick={add}>Diary保存</PrimaryButton>
      </div>
      <div className="grid gap-3">
        {diaries.map((d) => (
          <div key={d.id} onPointerDown={() => startDiaryLongPress(d)} onPointerUp={cancelDiaryLongPress} onPointerCancel={cancelDiaryLongPress} onPointerLeave={cancelDiaryLongPress} onContextMenu={(e) => e.preventDefault()} className="rounded-[1.6rem] border border-white/10 bg-white/[0.075] p-4 shadow-xl transition active:scale-[0.99]">
            <p className="text-xs text-white/45">{d.entry_date} / {d.mood}</p>
            <h3 className="mt-1 text-xl font-black">{d.title || "Diary"}</h3>
            {d.image_url && !diaryHasImageInContent(d) && <img src={d.image_url} alt="Diary image" className="mt-3 max-h-56 w-full rounded-3xl object-cover" />}
            <div className="diary-content mt-3 line-clamp-5 text-sm leading-7 text-white/80" dangerouslySetInnerHTML={{ __html: d.content }} />
            <p className="mt-3 text-xs text-white/35">長押し：日記を読む</p>
          </div>
        ))}
      </div>
      {readMenuTarget && (<Modal title="Diaryメニュー" onClose={() => setReadMenuTarget(null)}><div className="space-y-3"><p className="text-sm text-white/60">{readMenuTarget.entry_date} / {readMenuTarget.title || "Diary"}</p><button onClick={() => { setReaderTarget(readMenuTarget); setReadMenuTarget(null); }} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">日記を読む</button><button onClick={() => setReadMenuTarget(null)} className="w-full rounded-2xl bg-white/10 px-4 py-3 font-bold">閉じる</button></div></Modal>)}
    </div>
  );
}
function CoffeePanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [name, setName] = useState("コーヒー");
  const [cups, setCups] = useState(1);
  const [mg, setMg] = useState(80);
  const [note, setNote] = useState("");
  const [targetMg, setTargetMg] = useState(400);
  const [drinkTime, setDrinkTime] = useState(() => new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }));
  const logs = snapshot?.coffee || [];
  const todayLogs = logs.filter((l) => l.drink_date === todayKey());
  const todayMg = todayLogs.reduce((s, l) => s + Number(l.caffeine_mg || 0), 0);
  const left = Math.max(0, Number(targetMg || 400) - todayMg);
  const cupsLeft = mg ? Math.floor(left / mg) : 0;
  const last7 = Array.from({ length: 7 }).map((_, idx) => {
    const key = dateMinus(todayKey(), idx);
    const total = logs.filter((l) => l.drink_date === key).reduce((s, l) => s + Number(l.caffeine_mg || 0), 0);
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
  const timingHint = hour >= 17 ? "夕方以降だから、睡眠を守るならデカフェ寄りが安心。" : hour >= 14 ? "午後帯。ここからは量を少し抑えると夜に残りにくいよ。" : "午前〜昼は集中の燃料にしやすい時間帯。";
  async function add() {
    const totalMg = Number(cups) * Number(mg);
    const timeMemo = drinkTime ? `飲用時刻:${drinkTime}${note ? ` / ${note}` : ""}` : note;
    const { error } = await supabase.from("coffee_logs").insert({ drink_date: todayKey(), coffee_name: name, cups, caffeine_mg: totalMg, note: timeMemo });
    if (error) return alert(error.message);
    setNote("");
    setGuideDraft(`コーヒー記録を追加したよ。今日は合計約${todayMg + totalMg}mg、目安${targetMg}mgまであと約${Math.max(0, targetMg - todayMg - totalMg)}mgだよ。`);
    await refreshSnapshot();
  }
  async function del(id: string) {
    if (!confirm("このコーヒー記録を削除していい？")) return;
    const { error } = await supabase.from("coffee_logs").delete().eq("id", id);
    if (error) return alert("削除失敗: " + error.message);
    await refreshSnapshot();
  }
  const status = todayMg >= targetMg ? "今日は上限に近いから、ここからはデカフェや水分補給寄りが安心。" : todayMg >= targetMg * 0.7 ? "少し多め。夕方以降は睡眠への影響を見ながらで良さそう。" : "まだ余裕あり。集中用の一杯を計画しやすい状態。";
  return <div className="space-y-4">
    <GlassCard className="bg-gradient-to-br from-amber-500/15 to-orange-500/10"><h2 className="text-2xl font-black">Coffee Lab</h2><p className="mt-2 text-sm text-white/60">今日のカフェイン: <b>{todayMg}mg</b> / 目安{targetMg}mg。今の設定ならあと約 <b>{cupsLeft}杯</b>。</p><div className="mt-3 grid gap-2 sm:grid-cols-3"><p className="rounded-2xl bg-black/25 p-3 text-sm text-white/75">{status}</p><p className="rounded-2xl bg-black/25 p-3 text-sm text-white/75">{timingHint}</p><p className="rounded-2xl bg-black/25 p-3 text-sm text-white/75">水分補給メモ: コーヒー1杯ごとに水を少し足すと安定しやすい。</p></div></GlassCard>
    <GlassCard><h3 className="text-xl font-black">クイック記録</h3><div className="mt-3 grid gap-2 sm:grid-cols-6">{presets.map((p) => <button key={p.name} onClick={() => { setName(p.name); setMg(p.mg); }} className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black hover:bg-white/15">{p.name}<br /><span className="text-xs text-white/50">{p.mg}mg / {p.hint}</span></button>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-6"><Field value={name} onChange={(e) => setName(e.target.value)} /><Field type="number" value={cups} onChange={(e) => setCups(Number(e.target.value))} /><Field type="number" value={mg} onChange={(e) => setMg(Number(e.target.value))} /><Field type="number" value={targetMg} onChange={(e) => setTargetMg(Number(e.target.value))} placeholder="目安mg" /><TimeField label="飲んだ時間" value={drinkTime} onChange={(e) => setDrinkTime(e.target.value)} /><Field placeholder="メモ" value={note} onChange={(e) => setNote(e.target.value)} /></div><div className="mt-3"><PrimaryButton onClick={add}>コーヒー記録</PrimaryButton></div></GlassCard>
    <GlassCard><h3 className="text-xl font-black">7日間カフェイン</h3><div className="mt-3 grid gap-2 sm:grid-cols-7">{last7.map((d) => <div key={d.key} className="rounded-2xl bg-black/25 p-3"><p className="text-[11px] text-white/45">{d.key.slice(5)}</p><p className="mt-1 text-lg font-black">{d.total}mg</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-300" style={{ width: `${Math.min(100, (d.total / Math.max(1, targetMg)) * 100)}%` }} /></div></div>)}</div></GlassCard>
    <div className="grid gap-3">{logs.map((l) => <GlassCard key={l.id}><div className="flex items-start justify-between gap-3"><div><p className="font-black">{l.coffee_name} / {l.cups}杯 / {l.caffeine_mg}mg</p><p className="mt-1 text-xs text-white/45">{l.drink_date}</p>{l.note && <p className="mt-2 text-sm text-white/65">{l.note}</p>}</div><button onClick={() => del(l.id)} className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-black">削除</button></div></GlassCard>)}</div>
  </div>;
}

function BudgetPanel({ snapshot, refreshSnapshot, themeKey }: PanelProps & { themeKey: ThemeKey }) {
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
  const [deleteLogTarget, setDeleteLogTarget] = useState<BudgetLog | null>(null);
  const [templateTitle, setTemplateTitle] = useState("ジム代");
  const [templateCategory, setTemplateCategory] = useState("サブスク");
  const [templateAmount, setTemplateAmount] = useState(0);
  const [templateWallet, setTemplateWallet] = useState("銀行");
  const [templateDay, setTemplateDay] = useState(1);
  const [actualBalance, setActualBalance] = useState<Record<string, string>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptMessage, setReceiptMessage] = useState("");
  const [budgetAiMessage, setBudgetAiMessage] = useState("");
  const [budgetAiLoading, setBudgetAiLoading] = useState(false);
  const logs = snapshot?.budget || [];
  const accounts = snapshot?.budgetAccounts || [];
  const templates = snapshot?.budgetFixedTemplates || [];
  const incomeSources = ["アルバイト", "給与", "副業", "臨時収入", "仕送り", "返金", "貯金移動", "その他"];
  const expenseCats = ["食費", "カフェ", "交通", "日用品", "娯楽", "医療", "服", "学習", "サブスク", "家賃", "水道光熱", "通信", "貯金", "その他"];
  const incomeCats = ["給与", "アルバイト", "副業", "臨時収入", "返金", "その他"];
  const defaultWallets = ["財布", "銀行", "Suica", "PayPay", "クレカ", "楽天", "貯金", "その他"];
  const wallets = Array.from(new Set([...defaultWallets, ...accounts.map((a) => a.name), ...templates.map((t) => t.wallet || "").filter(Boolean)]));
  const accountKinds = ["財布", "銀行", "Suica", "PayPay", "貯金", "電子マネー", "クレカ", "その他"];
  const totalAssets = accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const expense = logs.filter((l) => l.type === "expense").reduce((s, l) => s + Number(l.amount), 0);
  const income = logs.filter((l) => l.type === "income").reduce((s, l) => s + Number(l.amount), 0);
  const thisMonthLogs = logs.filter((l) => isSameMonth(l.spend_date));
  const monthIncome = thisMonthLogs.filter((l) => l.type === "income").reduce((s, l) => s + Number(l.amount), 0);
  const monthExpense = thisMonthLogs.filter((l) => l.type === "expense").reduce((s, l) => s + Number(l.amount), 0);
  const fixedMonthly = templates.filter((t) => t.active !== false).reduce((s, t) => s + Number(t.amount || 0), 0);
  const remainingMonth = Math.max(0, monthIncome - monthExpense - fixedMonthly);
  const dailyBudget = Math.floor(remainingMonth / daysLeftInMonth());
  const currentCat = thisMonthLogs.filter((l) => l.type === "expense").reduce((acc: Record<string, number>, l) => { acc[l.category] = (acc[l.category] || 0) + Number(l.amount); return acc; }, {});
  const previousCat = logs.filter((l) => {
    const d = new Date(todayKey() + "T00:00:00"); d.setMonth(d.getMonth() - 1);
    return String(l.spend_date || "").slice(0, 7) === monthKey(toDateKey(d)) && l.type === "expense";
  }).reduce((acc: Record<string, number>, l) => { acc[l.category] = (acc[l.category] || 0) + Number(l.amount); return acc; }, {} as Record<string, number>);
  const categoryWarnings = Object.entries(currentCat).map(([name, value]) => ({ name, value, previous: previousCat[name] || 0, diff: value - (previousCat[name] || 0) })).filter((x) => x.diff > 0).sort((a, b) => b.diff - a.diff).slice(0, 4);
  const topCategory = Object.entries(currentCat).sort((a, b) => b[1] - a[1])[0];
  const topSource = Object.entries(logs.filter((l) => l.type === "income").reduce((acc: Record<string, number>, l) => { const k = l.source || "未設定"; acc[k] = (acc[k] || 0) + Number(l.amount); return acc; }, {})).sort((a, b) => b[1] - a[1])[0];
  const grouped = accountKinds.map((kind) => ({ kind, items: accounts.filter((a) => a.kind === kind) })).filter((g) => g.items.length);
  const pressTimer = useRef<number | null>(null);

  function linkedAccountName(log: Pick<BudgetLog, "wallet" | "payment_method">) { return String(log.wallet || log.payment_method || "").trim(); }
  function accountDelta(typeValue: "income" | "expense" | "charge", amountValue: number) { if (typeValue === "income") return Math.abs(Number(amountValue || 0)); if (typeValue === "charge") return 0; return -Math.abs(Number(amountValue || 0)); }
  async function applyBalanceChange(accountLabel: string, delta: number) {
    const target = accounts.find((a) => a.name.trim() === accountLabel.trim());
    if (!target) return { ok: false, message: `「${accountLabel}」というお金コーナーがないため、収支ログだけ保存したよ。残高連動したい場合は同じ名前のコーナーを作ってね。` };
    const nextBalance = Number(target.balance || 0) + delta;
    const { error } = await supabase.from("budget_accounts").update({ balance: nextBalance }).eq("id", target.id);
    if (error) return { ok: false, message: `残高更新に失敗: ${error.message}` };
    return { ok: true, message: `「${target.name}」の残高を${delta >= 0 ? "+" : ""}${yen(delta)}反映したよ。現在残高は${yen(nextBalance)}。` };
  }
  async function transferBalance(fromLabel: string, toLabel: string, amountValue: number) {
    const cleanFrom = fromLabel.trim();
    const cleanTo = toLabel.trim();
    const value = Math.abs(Number(amountValue || 0));
    if (!cleanFrom || !cleanTo || !value) return { ok: false, message: "チャージ元・チャージ先・金額を確認してね。" };
    if (cleanFrom === cleanTo) return { ok: false, message: "同じコーナー同士ではチャージできないよ。" };
    const from = accounts.find((a) => a.name.trim() === cleanFrom);
    const to = accounts.find((a) => a.name.trim() === cleanTo);
    if (!from || !to) return { ok: false, message: "チャージ元かチャージ先のお金コーナーが見つからなかったよ。" };
    const fromNext = Number(from.balance || 0) - value;
    const toNext = Number(to.balance || 0) + value;
    const first = await supabase.from("budget_accounts").update({ balance: fromNext }).eq("id", from.id);
    if (first.error) return { ok: false, message: "チャージ元の残高更新に失敗: " + first.error.message };
    const second = await supabase.from("budget_accounts").update({ balance: toNext }).eq("id", to.id);
    if (second.error) return { ok: false, message: "チャージ先の残高更新に失敗: " + second.error.message };
    return { ok: true, message: `${cleanFrom}から${cleanTo}へ${yen(value)}チャージしたよ。` };
  }
  async function addCharge() {
    if (!amount || Number(amount) <= 0) return alert("チャージ金額を入れてね");
    const result = await transferBalance(chargeFrom, chargeTo, amount);
    if (!result.ok) return alert(result.message);
    const payload = { spend_date: todayKey(), type: "charge", category: "チャージ", amount, wallet: chargeTo, source: chargeFrom, payment_method: chargeTo, memo: memo || `${chargeFrom} → ${chargeTo}` } as any;
    const { error } = await supabase.from("budget_logs").insert(payload);
    if (error) return alert("チャージ記録の保存に失敗: " + error.message + "\nSQLを実行して type=charge を許可してね。");
    setAmount(0); setMemo(""); setGuideDraft(result.message); await refreshSnapshot();
  }
  function startLogLongPress(log: BudgetLog) { if (pressTimer.current) window.clearTimeout(pressTimer.current); pressTimer.current = window.setTimeout(() => setDeleteLogTarget(log), 650); }
  function cancelLogLongPress() { if (pressTimer.current) { window.clearTimeout(pressTimer.current); pressTimer.current = null; } }

  async function add() {
    if (!amount || Number(amount) <= 0) return alert("金額を入れてね");
    const accountLabel = wallet.trim();
    const payload = { spend_date: todayKey(), type, category, amount, wallet: accountLabel, source: type === "income" ? source : null, payment_method: accountLabel, memo: memo || null };
    const { error } = await supabase.from("budget_logs").insert(payload);
    if (error) return alert("家計簿保存失敗: " + error.message);
    const result = await applyBalanceChange(accountLabel, accountDelta(type, amount));
    setAmount(0); setMemo(""); setGuideDraft(result.message || `${type === "income" ? "収入" : "支出"}を記録したよ。`); await refreshSnapshot();
  }
  async function addFromReceipt() {
    const imageDataUrl = await imageFileToDataUrl(receiptFile);
    if (!imageDataUrl) return setReceiptMessage("レシート画像を選んでね。");
    setReceiptMessage("レシートを読み取り中...");
    try {
      const res = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "receiptToBudgetAI", imageDataUrl }) });
      const json = await res.json().catch(() => ({}));
      const item = json.budget || {};
      const nextAmount = Number(item.amount || 0);
      if (!nextAmount) return setReceiptMessage(json.result || "金額を読み取れなかったよ。金額が大きく写っている写真で試してね。");
      const nextCategory = String(item.category || "その他");
      const nextMemo = String(item.memo || item.store || "レシート");
      const nextWallet = String(item.wallet || wallet || "財布");
      const { error } = await supabase.from("budget_logs").insert({ spend_date: todayKey(), type: "expense", category: nextCategory, amount: nextAmount, wallet: nextWallet, payment_method: nextWallet, memo: nextMemo, image_url: imageDataUrl });
      if (error) {
        const fallback = await supabase.from("budget_logs").insert({ spend_date: todayKey(), type: "expense", category: nextCategory, amount: nextAmount, wallet: nextWallet, payment_method: nextWallet, memo: nextMemo });
        if (fallback.error) return setReceiptMessage("レシート支出の保存に失敗: " + fallback.error.message);
      }
      await applyBalanceChange(nextWallet, -Math.abs(nextAmount));
      setReceiptFile(null); setReceiptMessage(`${nextCategory} / ${yen(nextAmount)} を支出登録したよ。`); await refreshSnapshot();
    } catch (error) { console.error(error); setReceiptMessage("レシートAIに失敗したよ。/apiログとOPENAI_API_KEYを確認してね。"); }
  }
  async function deleteLog() {
    if (!deleteLogTarget) return;
    const accountLabel = linkedAccountName(deleteLogTarget);
    const { error } = await supabase.from("budget_logs").delete().eq("id", deleteLogTarget.id);
    if (error) return alert("家計簿削除失敗: " + error.message);
    let result: { ok: boolean; message: string } = { ok: true, message: "収支ログを削除したよ。" };
    if (deleteLogTarget.type === "charge") {
      result = await transferBalance(String(deleteLogTarget.wallet || deleteLogTarget.payment_method || ""), String(deleteLogTarget.source || ""), Number(deleteLogTarget.amount || 0));
    } else {
      const reverseDelta = -accountDelta(deleteLogTarget.type, Number(deleteLogTarget.amount || 0));
      result = accountLabel ? await applyBalanceChange(accountLabel, reverseDelta) : { ok: false, message: "収支ログを削除したよ。紐づくコーナー名がなかったため残高は変更してないよ。" };
    }
    setDeleteLogTarget(null); setGuideDraft(result.message || "収支ログを削除して、残高も戻したよ。"); await refreshSnapshot();
  }
  async function addAccount() {
    if (!accountName.trim()) return alert("コーナー名を入れてね");
    const exists = accounts.some((a) => a.name.trim() === accountName.trim());
    if (exists) return alert("同じ名前のお金コーナーがあるよ。収支連動は名前で行うから、別名にするか既存コーナーを変更してね。");
    const { error } = await supabase.from("budget_accounts").insert({ name: accountName.trim(), kind: accountKind, balance: accountBalance || 0, note: accountNote || null });
    if (error) return alert("コーナー作成失敗: " + error.message + "\n統合SQLを実行しているか確認してね。");
    setAccountName(""); setAccountBalance(0); setAccountNote(""); setGuideDraft(`家計簿に「${accountName}」コーナーを作ったよ。収支で同じ名前を選ぶと残高が自動で増減するよ。`); await refreshSnapshot();
  }
  async function saveAccount() {
    if (!editAccount) return;
    const duplicate = accounts.some((a) => a.id !== editAccount.id && a.name.trim() === editAccount.name.trim());
    if (duplicate) return alert("同じ名前のお金コーナーがあるよ。収支連動のため、名前は重複しない形が安全だよ。");
    const { error } = await supabase.from("budget_accounts").update({ name: editAccount.name.trim(), kind: editAccount.kind, balance: editAccount.balance, note: editAccount.note }).eq("id", editAccount.id);
    if (error) return alert("コーナー更新失敗: " + error.message);
    setEditAccount(null); await refreshSnapshot();
  }
  async function deleteAccount(id: string) { if (!confirm("このお金コーナーを削除していい？残高カードだけ消えるよ。家計簿ログは残るよ。")) return; const { error } = await supabase.from("budget_accounts").delete().eq("id", id); if (error) return alert("コーナー削除失敗: " + error.message); await refreshSnapshot(); }
  async function addTemplate() {
    if (!templateTitle.trim() || !templateAmount) return alert("固定費名と金額を入れてね");
    const { error } = await supabase.from("budget_fixed_templates").insert({ title: templateTitle.trim(), category: templateCategory, amount: Math.abs(Number(templateAmount || 0)), wallet: templateWallet, due_day: templateDay || 1, active: true, memo: null });
    if (error) return alert("固定費テンプレ作成失敗: " + error.message + "\n統合SQLを実行してね。");
    setTemplateAmount(0); setGuideDraft(`固定費テンプレ「${templateTitle}」を作ったよ。毎月の支出をワンタップ登録できるね。`); await refreshSnapshot();
  }
  async function useTemplate(t: BudgetFixedTemplate) {
    const accountLabel = String(t.wallet || wallet || "財布");
    const { error } = await supabase.from("budget_logs").insert({ spend_date: todayKey(), type: "expense", category: t.category, amount: Number(t.amount || 0), wallet: accountLabel, payment_method: accountLabel, memo: `固定費:${t.title}` });
    if (error) return alert("固定費登録失敗: " + error.message);
    await applyBalanceChange(accountLabel, -Math.abs(Number(t.amount || 0))); await refreshSnapshot();
  }
  async function deleteTemplate(id: string) { const { error } = await supabase.from("budget_fixed_templates").delete().eq("id", id); if (error) return alert("固定費削除失敗: " + error.message); await refreshSnapshot(); }
  async function adjustAccountToActual(a: BudgetAccount) {
    const actual = Number(actualBalance[a.id] || 0);
    if (!Number.isFinite(actual)) return;
    const diff = actual - Number(a.balance || 0);
    const { error } = await supabase.from("budget_accounts").update({ balance: actual }).eq("id", a.id);
    if (error) return alert("残高調整に失敗: " + error.message);
    setGuideDraft(`「${a.name}」の残高を実残高に合わせたよ。差額は${diff >= 0 ? "+" : ""}${yen(diff)}。`); await refreshSnapshot();
  }
  async function runBudgetAi() {
    setBudgetAiLoading(true);
    try {
      const data = { logs: thisMonthLogs, accounts, templates, categoryWarnings, monthIncome, monthExpense, fixedMonthly, dailyBudget };
      const res = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "budgetAI", data }) });
      const json = await res.json();
      setBudgetAiMessage(json.result || "家計簿AIの分析に失敗したみたい。");
    } catch { setBudgetAiMessage("家計簿AIに失敗したよ。APIキーや通信状態を確認してね。"); } finally { setBudgetAiLoading(false); }
  }

  return <div className="space-y-4">
    <GlassCard className="bg-gradient-to-br from-emerald-500/15 to-cyan-500/10"><h2 className="text-2xl font-black">家計簿</h2><p className="mt-2 text-sm text-white/60">今月 収入 {yen(monthIncome)} / 支出 {yen(monthExpense)} / 固定費予定 {yen(fixedMonthly)}</p><p className="mt-4 text-4xl font-black">総資産 {yen(totalAssets)}</p><p className="mt-1 text-xs text-white/50">今月あと使える目安 {yen(remainingMonth)} / 1日あたり {yen(dailyBudget)}。収支を追加/削除すると、同じ名前のコーナー残高が自動で増減するよ。</p></GlassCard>
    <div className="grid gap-3 lg:grid-cols-3"><GlassCard><p className="text-xs text-white/45">今月あと使える</p><p className="mt-2 text-3xl font-black text-cyan-100">{yen(remainingMonth)}</p><p className="mt-1 text-xs text-white/50">今日から月末まで1日 {yen(dailyBudget)} 目安</p></GlassCard><GlassCard><p className="text-xs text-white/45">固定費テンプレ合計</p><p className="mt-2 text-3xl font-black text-orange-100">{yen(fixedMonthly)}</p><p className="mt-1 text-xs text-white/50">家賃・サブスク・ジム代など</p></GlassCard><GlassCard><p className="text-xs text-white/45">カテゴリ警告</p><p className="mt-2 text-3xl font-black text-rose-100">{categoryWarnings.length}件</p><p className="mt-1 text-xs text-white/50">先月より増えた支出カテゴリ</p></GlassCard></div>
    <GlassCard><h3 className="text-xl font-black">固定費テンプレ</h3><p className="mt-1 text-sm text-white/55">家賃・サブスク・ジム代を作っておくと、毎月ワンタップで支出登録できる。</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><Field placeholder="例: ジム代" value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)} /><select value={templateCategory} onChange={(e) => setTemplateCategory(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">{expenseCats.map((c) => <option key={c}>{c}</option>)}</select><Field type="number" placeholder="金額" value={templateAmount} onChange={(e) => setTemplateAmount(Number(e.target.value))} /><select value={templateWallet} onChange={(e) => setTemplateWallet(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">{wallets.map((w) => <option key={w}>{w}</option>)}</select><Field type="number" placeholder="毎月何日" value={templateDay} onChange={(e) => setTemplateDay(Number(e.target.value))} /><PrimaryButton onClick={addTemplate}>作成</PrimaryButton></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{templates.map((t) => <div key={t.id} className="rounded-2xl bg-black/25 p-3"><p className="font-black">{t.title} / {yen(t.amount)}</p><p className="text-xs text-white/45">{t.category} / {t.wallet || "未設定"} / 毎月{t.due_day || 1}日</p><div className="mt-2 grid grid-cols-2 gap-2"><button onClick={() => useTemplate(t)} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-black">今月登録</button><button onClick={() => deleteTemplate(t.id)} className="rounded-xl bg-red-500 px-3 py-2 text-xs font-bold">削除</button></div></div>)}</div></GlassCard>
    <GlassCard><h3 className="text-xl font-black">レシート写真 → 支出登録</h3><p className="mt-1 text-sm text-white/55">金額・店名・カテゴリをAIで読んで、支出と残高に反映する。</p><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]"><input type="file" accept="image/*" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-white/70" /><button onClick={addFromReceipt} className="rounded-2xl bg-cyan-300 px-4 py-3 font-black text-black">読み取って登録</button></div>{receiptMessage && <p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm text-white/75">{receiptMessage}</p>}</GlassCard>
    <GlassCard><h3 className="text-xl font-black">お金のコーナー</h3><p className="mt-1 text-sm text-white/55">実残高を入れると、記録上の残高との差額が見える。</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Field placeholder="例: メイン財布 / ゆうちょ / Suica" value={accountName} onChange={(e) => setAccountName(e.target.value)} /><select value={accountKind} onChange={(e) => setAccountKind(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">{accountKinds.map((k) => <option key={k}>{k}</option>)}</select><Field type="number" placeholder="現在の金額" value={accountBalance} onChange={(e) => setAccountBalance(Number(e.target.value))} /><Field placeholder="メモ 任意" value={accountNote} onChange={(e) => setAccountNote(e.target.value)} /><PrimaryButton onClick={addAccount}>コーナー作成</PrimaryButton></div></GlassCard>
    {accounts.length ? <div className="space-y-4">{grouped.map((group) => { const groupTotal = group.items.reduce((sum, a) => sum + Number(a.balance || 0), 0); return <GlassCard key={group.kind}><div className="flex items-end justify-between gap-3"><h3 className="text-xl font-black">{group.kind}コーナー</h3><p className="text-2xl font-black text-emerald-100">{yen(groupTotal)}</p></div><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{group.items.map((a) => { const actual = actualBalance[a.id] === undefined ? NaN : Number(actualBalance[a.id]); const diff = Number.isFinite(actual) ? actual - Number(a.balance || 0) : 0; return <div key={a.id} className="rounded-3xl border border-white/10 bg-black/25 p-4"><p className={`inline-flex rounded-full bg-gradient-to-r ${theme.accent} px-3 py-1 text-xs font-black text-black`}>{a.kind}</p><h4 className="mt-3 text-xl font-black">{a.name}</h4><p className="mt-2 text-3xl font-black">{yen(Number(a.balance || 0))}</p><p className="mt-1 text-xs text-white/45">記録上の残高</p><div className="mt-3 grid gap-2"><Field type="number" placeholder="実際の残高を入力" value={actualBalance[a.id] || ""} onChange={(e) => setActualBalance((cur) => ({ ...cur, [a.id]: e.target.value }))} />{actualBalance[a.id] && <p className={`rounded-2xl px-3 py-2 text-xs font-black ${diff === 0 ? "bg-emerald-400/15 text-emerald-100" : "bg-amber-400/15 text-amber-100"}`}>ズレ {diff >= 0 ? "+" : ""}{yen(diff)}</p>}<button onClick={() => adjustAccountToActual(a)} className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-black">実残高に合わせる</button></div>{a.note && <p className="mt-2 text-sm text-white/65">{a.note}</p>}<div className="mt-3 grid grid-cols-2 gap-2"><button onClick={() => setEditAccount(a)} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold">変更</button><button onClick={() => deleteAccount(a.id)} className="rounded-2xl bg-red-500 px-3 py-2 text-sm font-bold">削除</button></div></div>; })}</div></GlassCard>; })}</div> : <Empty text="まだお金のコーナーがないよ。財布・銀行・Suica・貯金などを作ると、どこにいくらあるか見えるよ。" />}
    <GlassCard><h3 className="text-xl font-black">チャージ</h3><p className="mt-1 text-xs text-white/50">財布からSuica/PayPayなどへ移す時は支出・収入にせず、残高移動として扱うよ。</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><select value={chargeFrom} onChange={(e) => setChargeFrom(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">{wallets.map((w) => <option key={w}>{w}</option>)}</select><select value={chargeTo} onChange={(e) => setChargeTo(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">{wallets.map((w) => <option key={w}>{w}</option>)}</select><Field type="number" placeholder="チャージ金額" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><Field placeholder="メモ 任意" value={memo} onChange={(e) => setMemo(e.target.value)} /><PrimaryButton onClick={addCharge}>チャージする</PrimaryButton></div></GlassCard>
    <GlassCard><h3 className="text-xl font-black">収支を追加</h3><p className="mt-1 text-xs text-white/50">選んだコーナー名と同じお金コーナーがあれば、残高も自動で増減するよ。</p><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6"><select value={type} onChange={(e) => { const next = e.target.value as "income" | "expense"; setType(next); setCategory(next === "income" ? "給与" : "食費"); }} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"><option value="expense">支出</option><option value="income">収入</option></select><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">{(type === "income" ? incomeCats : expenseCats).map((c) => <option key={c}>{c}</option>)}</select><Field type="number" placeholder="金額" value={amount} onChange={(e) => setAmount(Number(e.target.value))} /><select value={wallet} onChange={(e) => setWallet(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">{wallets.map((w) => <option key={w}>{w}</option>)}</select>{type === "income" ? <select value={source} onChange={(e) => setSource(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">{incomeSources.map((s) => <option key={s}>{s}</option>)}</select> : <Field placeholder="メモ 任意" value={memo} onChange={(e) => setMemo(e.target.value)} />}<PrimaryButton onClick={add}>追加</PrimaryButton></div></GlassCard>
    <GlassCard><h3 className="text-xl font-black">使いすぎ警告</h3>{!categoryWarnings.length && <p className="mt-2 text-sm text-white/55">先月より増えたカテゴリはまだ目立ってないよ。</p>}<div className="mt-3 grid gap-2 sm:grid-cols-2">{categoryWarnings.map((w) => <div key={w.name} className="rounded-2xl bg-rose-500/10 p-3"><p className="font-black">{w.name} +{yen(w.diff)}</p><p className="text-xs text-white/50">今月 {yen(w.value)} / 先月 {yen(w.previous)}</p></div>)}</div><button onClick={runBudgetAi} disabled={budgetAiLoading} className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50">AIで家計簿を読む</button>{budgetAiMessage && <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-black/25 p-4 text-sm leading-7 text-white/75">{budgetAiMessage}</p>}</GlassCard>
    <GuideAiCard themeKey={themeKey} message={`家計簿を見たよ。総資産は${yen(totalAssets)}。今月は収入${yen(monthIncome)}、支出${yen(monthExpense)}。${topCategory ? `支出で多いのは「${topCategory[0]}」の${yen(topCategory[1])}。` : "支出データはこれから育つよ。"}${topSource ? ` 収入源では「${topSource[0]}」が目立ってるね。` : ""}`} />
    <GlassCard><h3 className="text-xl font-black">入力済みの収支</h3><p className="mt-1 text-xs text-white/50">長押しすると削除確認が出るよ。削除した場合、紐づく残高も逆方向に戻すよ。</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{logs.map((l) => <div key={l.id} onPointerDown={() => startLogLongPress(l)} onPointerUp={cancelLogLongPress} onPointerCancel={cancelLogLongPress} onPointerLeave={cancelLogLongPress} onContextMenu={(e) => e.preventDefault()} className="rounded-[1.6rem] border border-white/10 bg-white/[0.075] p-4 shadow-xl"><p className={`inline-flex rounded-full bg-gradient-to-r ${theme.accent} px-3 py-1 text-xs font-black text-black`}>{l.type === "income" ? "収入" : l.type === "charge" ? "チャージ" : "支出"}</p><p className="mt-2 font-black">{l.category} / {yen(l.amount)}</p><p className="text-xs text-white/45">{l.type === "income" ? `収入源:${l.source || "未設定"}` : l.type === "charge" ? `移動:${l.source || "?"} → ${l.wallet || l.payment_method || "?"}` : `コーナー:${l.wallet || l.payment_method || "未設定"}`} / {l.spend_date}</p>{l.memo && <p className="mt-2 text-sm text-white/65">{l.memo}</p>}<ImagePreview src={l.image_url} /><p className="mt-3 text-[11px] text-white/35">長押し：削除確認</p></div>)}</div></GlassCard>
    {deleteLogTarget && <Modal title="この収支を削除する？" onClose={() => setDeleteLogTarget(null)}><p className="text-sm text-white/65">{deleteLogTarget.category} / {yen(deleteLogTarget.amount)} / {deleteLogTarget.spend_date}</p><p className="mt-2 text-xs text-white/50">削除すると、{linkedAccountName(deleteLogTarget) || "未設定コーナー"} の残高も逆方向に戻すよ。</p><button onClick={deleteLog} className="mt-4 w-full rounded-2xl bg-red-500 px-4 py-3 font-black text-white">完全に削除する</button><button onClick={() => setDeleteLogTarget(null)} className="mt-2 w-full rounded-2xl bg-white/10 px-4 py-3 font-bold">キャンセル</button></Modal>}
    {editAccount && <Modal title="コーナー変更" onClose={() => setEditAccount(null)}><div className="space-y-3"><Field value={editAccount.name} onChange={(e) => setEditAccount({ ...editAccount, name: e.target.value })} /><select value={editAccount.kind} onChange={(e) => setEditAccount({ ...editAccount, kind: e.target.value })} className="w-full rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white">{accountKinds.map((k) => <option key={k}>{k}</option>)}</select><Field type="number" value={editAccount.balance} onChange={(e) => setEditAccount({ ...editAccount, balance: Number(e.target.value) })} /><Field placeholder="メモ" value={editAccount.note || ""} onChange={(e) => setEditAccount({ ...editAccount, note: e.target.value })} /><button onClick={saveAccount} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">保存</button></div></Modal>}
  </div>;
}

type ShoppingItem = { id: string; name: string; category: string; checked: boolean; memo: string; created_at: string };
function ShoppingPanel() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("食料品");
  const [memo, setMemo] = useState("");
  const [filter, setFilter] = useState("すべて");
  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem("lifeShoppingItems") || "[]")); } catch { setItems([]); }
  }, []);
  function save(next: ShoppingItem[]) {
    setItems(next);
    localStorage.setItem("lifeShoppingItems", JSON.stringify(next));
  }
  function add() {
    const clean = name.trim();
    if (!clean) return;
    const inferred = /薬|包帯|湿布|サプリ/.test(clean) ? "医薬品" : /充電|電池|ケーブル|家電/.test(clean) ? "家電" : /服|ズボン|靴下|衣類/.test(clean) ? "衣類" : category;
    save([{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, name: clean, category: inferred, checked: false, memo, created_at: new Date().toISOString() }, ...items]);
    setName(""); setMemo("");
  }
  const cats = ["すべて", ...Array.from(new Set(["食料品", "日用品", "衣類", "家電", "医薬品", "趣味", "その他", ...items.map((i) => i.category)]))];
  const shown = filter === "すべて" ? items : items.filter((i) => i.category === filter);
  return <div className="space-y-4">
    <GlassCard><h2 className="text-2xl font-black">買い物リスト</h2><p className="mt-2 text-sm text-white/60">買うものをカテゴリ別に管理。今はローカル保存なので、DBを増やさず軽く動く形にしたよ。</p></GlassCard>
    <GlassCard><div className="grid gap-3 sm:grid-cols-[1fr_150px_1fr_120px]"><Field placeholder="買うもの" value={name} onChange={(e) => setName(e.target.value)} /><select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white"><option>食料品</option><option>日用品</option><option>衣類</option><option>家電</option><option>医薬品</option><option>趣味</option><option>その他</option></select><Field placeholder="メモ 任意" value={memo} onChange={(e) => setMemo(e.target.value)} /><PrimaryButton onClick={add}>追加</PrimaryButton></div></GlassCard>
    <div className="flex gap-2 overflow-x-auto pb-1">{cats.map((c) => <button key={c} onClick={() => setFilter(c)} className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${filter === c ? "bg-white text-black" : "bg-white/10"}`}>{c}</button>)}</div>
    <div className="grid gap-3 sm:grid-cols-2">{shown.map((item) => <GlassCard key={item.id}><div className="flex items-start gap-3"><button onClick={() => save(items.map((x) => x.id === item.id ? { ...x, checked: !x.checked } : x))} className={`mt-1 flex h-9 w-9 items-center justify-center rounded-xl border font-black ${item.checked ? "bg-emerald-300 text-black" : "bg-black/20 text-white/40"}`}>{item.checked ? "✓" : ""}</button><div className="min-w-0 flex-1"><p className={`font-black ${item.checked ? "text-white/35 line-through" : ""}`}>{item.name}</p><p className="mt-1 text-xs text-white/45">{item.category}</p>{item.memo && <p className="mt-2 text-sm text-white/65">{item.memo}</p>}</div><button onClick={() => save(items.filter((x) => x.id !== item.id))} className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-black">削除</button></div></GlassCard>)}</div>
  </div>;
}

function BelongingsPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [newItem, setNewItem] = useState<Record<string, string>>({});
  const [itemImageFile, setItemImageFile] = useState<Record<string, File | null>>({});
  const [belongingAiText, setBelongingAiText] = useState("");
  const [belongingAiLoading, setBelongingAiLoading] = useState(false);
  const [autoClassify, setAutoClassify] = useState(true);
  const cards = snapshot?.belongingCards || [];
  const items = snapshot?.belongingItems || [];
  async function addCard() {
    if (!title.trim()) return alert("カード名を入れてね");
    const { error } = await supabase.from("belonging_cards").insert({ title: title.trim(), note: note || null });
    if (error) return alert("持ち物カード作成失敗: " + error.message + "\n統合SQLを実行しているか確認してね。");
    setTitle(""); setNote(""); setGuideDraft(`持ち物カード「${title}」を作ったよ。忘れ物チェックに使えるね。`); await refreshSnapshot();
  }
  async function deleteCard(card: BelongingCard) {
    if (!confirm(`「${card.title}」カードを削除していい？中の持ち物も一緒に消えるよ。`)) return;
    const { error } = await supabase.from("belonging_cards").delete().eq("id", card.id);
    if (error) return alert("カード削除失敗: " + error.message);
    await refreshSnapshot();
  }
  async function addItem(cardId: string) {
    const name = (newItem[cardId] || "").trim();
    if (!name) return;
    const imageUrl = await imageFileToDataUrl(itemImageFile[cardId] || null);
    const result = await supabase.from("belonging_items").insert({ card_id: cardId, name, checked: false, image_url: imageUrl });
    if (result.error) {
      if (hasImageColumnError(result.error)) {
        const fallback = await supabase.from("belonging_items").insert({ card_id: cardId, name, checked: false });
        if (fallback.error) return alert("持ち物追加失敗: " + fallback.error.message);
      } else {
        return alert("持ち物追加失敗: " + result.error.message);
      }
    }
    setNewItem((cur) => ({ ...cur, [cardId]: "" }));
    setItemImageFile((cur) => ({ ...cur, [cardId]: null }));
    await refreshSnapshot();
  }
  async function toggleItem(item: BelongingItem) {
    const { error } = await supabase.from("belonging_items").update({ checked: !item.checked }).eq("id", item.id);
    if (error) return alert("チェック更新失敗: " + error.message);
    await refreshSnapshot();
  }
  async function deleteItem(id: string) {
    const { error } = await supabase.from("belonging_items").delete().eq("id", id);
    if (error) return alert("持ち物削除失敗: " + error.message);
    await refreshSnapshot();
  }
  function classifyBelonging(name: string) {
    if (/服|ズボン|シャツ|靴下|下着|上着|帽子|衣類/.test(name)) return "衣類";
    if (/充電|ケーブル|スマホ|イヤホン|電池|PC|パソコン|家電|モバイルバッテリー/.test(name)) return "家電";
    if (/薬|包帯|湿布|絆創膏|サプリ|医薬|マスク/.test(name)) return "医薬品";
    if (/財布|鍵|カード|現金|身分証/.test(name)) return "貴重品";
    if (/タオル|歯ブラシ|シャンプー|洗面|化粧|日用品/.test(name)) return "日用品";
    return "その他";
  }

  async function belongingsAi() {
    const source = cards.map((card) => {
      const cardItems = items.filter((it) => it.card_id === card.id).map((it) => `${it.checked ? "済" : "未"}:${it.name}`).join(" / ");
      return `${card.title}: ${card.note || ""} ${cardItems}`;
    }).join("\n");
    if (!source.trim()) return setBelongingAiText("分析できる持ち物リストがまだないよ。");
    setBelongingAiLoading(true);
    try {
      const res = await fetch("/api", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "belongingsAI", text: source }) });
      const json = await res.json();
      setBelongingAiText(json.result || "持ち物リストを整理できなかったみたい。");
    } catch {
      setBelongingAiText("持ち物AIに失敗したよ。APIキーや通信状態を確認してね。");
    } finally {
      setBelongingAiLoading(false);
    }
  }

  return <div className="space-y-4">
    <GlassCard><h2 className="text-2xl font-black">持ち物</h2><p className="mt-2 text-sm text-white/60">ジム用・会社用・旅行用みたいにカードを作って、その中で持ち物をTodo式にチェックできるページ。写真も一緒に残せるよ。</p><div className="mt-4 grid gap-2 sm:grid-cols-2"><button onClick={belongingsAi} disabled={belongingAiLoading} className="rounded-2xl bg-white/10 px-4 py-3 font-black disabled:opacity-50">持ち物をAI整理</button><button onClick={() => setAutoClassify(!autoClassify)} className={`rounded-2xl px-4 py-3 font-black ${autoClassify ? "bg-emerald-300 text-black" : "bg-white/10"}`}>カード内AI分類 {autoClassify ? "ON" : "OFF"}</button></div>{belongingAiText && <p className="mt-3 whitespace-pre-wrap rounded-2xl bg-black/25 p-4 text-sm leading-7 text-white/75">{belongingAiText}</p>}</GlassCard>
    <GlassCard><h3 className="text-xl font-black">＋ 持ち物カードを作る</h3><div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_160px]"><Field placeholder="例: ジムの持ち物" value={title} onChange={(e) => setTitle(e.target.value)} /><Field placeholder="メモ 任意" value={note} onChange={(e) => setNote(e.target.value)} /><PrimaryButton onClick={addCard}>作成</PrimaryButton></div></GlassCard>
    {!cards.length && <Empty text="まだ持ち物カードがないよ。ジム用・会社用・サウナ用などを作るとここに表示されるよ。" />}
    <div className="grid gap-4 lg:grid-cols-2">
      {cards.map((card) => {
        const cardItems = items.filter((it) => it.card_id === card.id);
        const done = cardItems.filter((it) => it.checked).length;
        return <GlassCard key={card.id} className="bg-gradient-to-br from-white/[0.09] to-black/20"><div className="flex items-start justify-between gap-3"><div><h3 className="text-2xl font-black">{card.title}</h3>{card.note && <p className="mt-1 text-sm text-white/55">{card.note}</p>}<p className="mt-2 text-xs text-white/45">{done}/{cardItems.length} チェック済み</p></div><button onClick={() => deleteCard(card)} className="rounded-2xl bg-red-500 px-3 py-2 text-xs font-black">カード削除</button></div><div className="mt-4 grid gap-2 sm:grid-cols-[1fr_160px_100px]"><Field placeholder="例: 財布 / イヤフォン / タオル" value={newItem[card.id] || ""} onChange={(e) => setNewItem((cur) => ({ ...cur, [card.id]: e.target.value }))} /><input type="file" accept="image/*" onChange={(e) => setItemImageFile((cur) => ({ ...cur, [card.id]: e.target.files?.[0] || null }))} className="rounded-2xl border border-white/15 bg-white/10 p-3 text-xs text-white/70" /><button onClick={() => addItem(card.id)} className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black">追加</button></div><div className="mt-4 space-y-2">{cardItems.map((item) => <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-black/25 p-3"><button onClick={() => toggleItem(item)} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-black ${item.checked ? "border-emerald-200 bg-emerald-300 text-black" : "border-white/25 bg-white/10 text-white/50"}`}>{item.checked ? "✓" : ""}</button><div className="min-w-0 flex-1"><p className={`${item.checked ? "text-white/40 line-through" : "font-bold"}`}>{item.name}</p><ImagePreview src={item.image_url} /></div><button onClick={() => deleteItem(item.id)} className="rounded-xl bg-red-500 px-3 py-2 text-xs font-bold">削除</button></div>)}</div></GlassCard>;
      })}
    </div>
  </div>;
}

function RoutinesPanel({ snapshot, refreshSnapshot }: PanelProps) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [undoCheck, setUndoCheck] = useState<RoutineCheck | null>(null);
  const undoTimer = useRef<number | null>(null);
  const [localRoutineChecks, setLocalRoutineChecks] = useState<RoutineCheck[]>([]);
  const routines = snapshot?.routines || [];
  const checks = useMemo(() => { const base = snapshot?.routineChecks || []; const seen = new Set(base.map((c) => c.id)); return [...localRoutineChecks.filter((c) => !seen.has(c.id)), ...base]; }, [snapshot?.routineChecks, localRoutineChecks]);
  useEffect(() => { if (snapshot?.routineChecks?.length) setLocalRoutineChecks((current) => current.filter((c) => !snapshot.routineChecks.some((real) => real.routine_id === c.routine_id && real.check_date === c.check_date))); }, [snapshot?.routineChecks]);

  async function add() {
    if (!title.trim()) return;
    const { error } = await supabase.from("routines").insert({ title, routine_time: time || null, note: note || null, active: true });
    if (error) return alert("習慣追加失敗: " + error.message);
    setTitle("");
    setNote("");
    setGuideDraft(`習慣「${title}」を追加したよ。ここにカードで表示されるから、積み上げが見えるね。`);
    await refreshSnapshot();
  }

  async function check(r: Routine) {
    const exists = checks.some((c) => c.routine_id === r.id && c.check_date === todayKey());
    if (exists) {
      setGuideDraft(`今日は「${r.title}」チェック済みだよ。間違えて押した時は下の取り消しボタンを使えるよ。`);
      return;
    }
    const optimistic: RoutineCheck = { id: `local-${r.id}-${Date.now()}`, routine_id: r.id, check_date: todayKey(), created_at: new Date().toISOString() };
    setLocalRoutineChecks((current) => [optimistic, ...current]);
    setUndoCheck(optimistic);
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    undoTimer.current = window.setTimeout(() => setUndoCheck(null), 9000);
    setGuideDraft(`「${r.title}」を今日の達成にしたよ。間違えて押したなら、下の取り消しボタンで戻せるよ。`);
    const { data, error } = await supabase.from("routine_checks").insert({ routine_id: r.id, check_date: todayKey() }).select("*").single();
    if (error) { setLocalRoutineChecks((current) => current.filter((c) => c.id !== optimistic.id)); setUndoCheck(null); return alert("チェック失敗: " + error.message); }
    if (data) setUndoCheck(data as RoutineCheck);
    void refreshSnapshot("習慣チェック同期中...");
  }

  async function undoLastCheck() {
    if (!undoCheck) return;
    if (undoCheck.id.startsWith("local-")) {
      setLocalRoutineChecks((current) => current.filter((c) => c.id !== undoCheck.id));
    } else {
      const { error } = await supabase.from("routine_checks").delete().eq("id", undoCheck.id);
      if (error) return alert("取り消し失敗: " + error.message);
    }
    if (undoTimer.current) window.clearTimeout(undoTimer.current);
    setUndoCheck(null);
    setGuideDraft("直前の習慣チェックを取り消したよ。誤タップでも大丈夫。ちゃんと戻せるようにしたよ。");
    void refreshSnapshot("習慣チェック同期中...");
  }

  async function del(id: string) {
    if (!confirm("この習慣を削除していい？")) return;
    const { error } = await supabase.from("routines").delete().eq("id", id);
    if (error) return alert(error.message);
    await refreshSnapshot();
  }

  return <div className="space-y-4">
    <GlassCard><h2 className="text-2xl font-black">習慣・ルーティン</h2><p className="mt-2 text-sm text-white/60">追加した習慣はすぐ下にカード表示。連続日数は色付きカウントで見えるよ。誤タップ時は取り消しもできるよ。</p></GlassCard>
    <div className="grid gap-3 sm:grid-cols-[1fr_160px]"><Field placeholder="習慣名 例: 朝ラン" value={title} onChange={(e) => setTitle(e.target.value)} /><TimeField value={time} onChange={(e) => setTime(e.target.value)} /></div>
    <TextArea placeholder="メモ 任意" value={note} onChange={(e) => setNote(e.target.value)} />
    <PrimaryButton onClick={add}>習慣を追加</PrimaryButton>
    {undoCheck && <div className="sticky top-3 z-40 rounded-3xl border border-amber-200/30 bg-amber-400/20 p-4 shadow-2xl backdrop-blur-xl"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black text-amber-100">直前の習慣チェックを記録したよ</p><p className="text-sm text-white/65">間違えて押した場合は取り消せるよ。</p></div><button onClick={undoLastCheck} className="rounded-2xl bg-amber-300 px-4 py-3 font-black text-black">取り消す</button></div></div>}
    {!routines.length && <Empty text="まだ習慣がないよ。追加するとここにカードで表示されるよ。" />}
    <div className="grid gap-3 sm:grid-cols-2">{routines.map((r) => { const streak = calcStreak(r.id, checks); const doneToday = checks.some((c) => c.routine_id === r.id && c.check_date === todayKey()); return <GlassCard key={r.id} className="relative overflow-hidden"><div className={`absolute right-4 top-4 rounded-2xl px-4 py-2 text-2xl font-black text-black shadow-lg ${streak >= 30 ? "bg-fuchsia-300" : streak >= 14 ? "bg-cyan-300" : streak >= 7 ? "bg-emerald-300" : "bg-amber-300"}`}>{streak}日</div><h3 className="pr-24 text-xl font-black">{r.title}</h3><p className="mt-1 text-sm text-white/55">{r.routine_time ? `${r.routine_time}ごろ` : "時間なし"}</p>{r.note && <p className="mt-3 whitespace-pre-wrap text-sm text-white/70">{r.note}</p>}<div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => check(r)} className={`rounded-2xl px-4 py-3 font-black ${doneToday ? "bg-emerald-400 text-black" : "bg-white text-black"}`}>{doneToday ? "今日達成済み" : "今日できた"}</button><button onClick={() => del(r.id)} className="rounded-2xl bg-red-500 px-4 py-3 font-black">削除</button></div></GlassCard>; })}</div>
  </div>;
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
    setGuideDraft("ゴミの日を追加したよ。忘れやすい予定は、見える場所に置くだけでもかなり楽になるよ。");
    await refreshSnapshot("手動同期中...");
  }

  async function toggleRule(rule: TrashRule) {
    const { error } = await supabase.from("trash_rules").update({ active: !rule.active }).eq("id", rule.id);
    if (error) return alert("更新できませんでした: " + error.message);
    await refreshSnapshot("手動同期中...");
  }

  async function deleteRule() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("trash_rules").delete().eq("id", deleteTarget.id);
    if (error) return alert("削除できませんでした: " + error.message);
    setDeleteTarget(null);
    await refreshSnapshot("手動同期中...");
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">ゴミの日</h2>
        <p className="mt-2 text-sm text-white/60">曜日・時刻を登録して、捨て忘れを減らすページ。</p>
      </GlassCard>
      <div className="grid gap-3 lg:grid-cols-[1fr_150px_170px]">
        <Field placeholder="燃えるゴミ / 資源ゴミ / ダンボール..." value={trashType} onChange={(e) => setTrashType(e.target.value)} />
        <select value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white [color-scheme:dark]">
          {[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{weekdayLabel(d)}曜日</option>)}
        </select>
        <TimeField label="通知時刻選択" value={notifyTime} onChange={(e) => setNotifyTime(e.target.value)} />
      </div>
      <TextArea className="h-24" placeholder="場所・注意点など" value={note} onChange={(e) => setNote(e.target.value)} />
      <PrimaryButton onClick={addRule}>ゴミの日を追加</PrimaryButton>
      {!rules.length && <Empty text="まだゴミの日が登録されていないよ。" />}
      <div className="grid gap-3 sm:grid-cols-2">
        {rules.map((rule) => (
          <GlassCard key={rule.id} className={rule.active ? "" : "opacity-55"}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xl font-black">{rule.trash_type}</p>
                <p className="mt-1 text-sm text-white/60">{weekdayLabel(rule.weekday)}曜日{rule.notify_time ? ` / ${String(rule.notify_time).slice(0, 5)}` : ""}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${rule.active ? "bg-emerald-300 text-black" : "bg-white/10 text-white/60"}`}>{rule.active ? "通知ON" : "OFF"}</span>
            </div>
            {rule.note && <p className="mt-3 whitespace-pre-wrap text-sm text-white/65">{rule.note}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => toggleRule(rule)} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold">{rule.active ? "OFFにする" : "ONにする"}</button>
              <button type="button" onClick={() => setDeleteTarget(rule)} className="rounded-2xl bg-red-500/80 px-3 py-2 text-sm font-black">削除</button>
            </div>
          </GlassCard>
        ))}
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4">
          <GlassCard className="w-full max-w-md bg-slate-950">
            <h3 className="text-xl font-black">本当に削除する？</h3>
            <p className="mt-3 text-sm text-white/65">{deleteTarget.trash_type} のゴミの日設定を削除するよ。</p>
            <div className="mt-5 grid gap-3">
              <button type="button" onClick={deleteRule} className="rounded-2xl bg-red-500 px-4 py-3 font-black text-white">削除する</button>
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-2xl bg-white/10 px-4 py-3 font-bold">キャンセル</button>
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
    setGuideDraft("場所の記録を追加したよ。日記や写真と一緒に、思い出の地図が育っていく感じだね。");
    await refreshSnapshot("手動同期中...");
  }

  async function deletePlace() {
    if (!deleteTarget) return;
    const { error } = await supabase.from("place_logs").delete().eq("id", deleteTarget.id);
    if (error) return alert("削除できませんでした: " + error.message);
    setDeleteTarget(null);
    await refreshSnapshot("手動同期中...");
  }

  return (
    <div className="space-y-4">
      <GlassCard>
        <h2 className="text-2xl font-black">地図</h2>
        <p className="mt-2 text-sm text-white/60">カフェ・サウナ・散歩・思い出の場所を記録するシンプル地図ページ。</p>
      </GlassCard>
      <div className="grid gap-3 lg:grid-cols-[150px_1fr_160px]">
        <DateField label="日付選択" value={placeDate} onChange={(e) => setPlaceDate(e.target.value)} />
        <Field placeholder="場所名" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-2xl border border-white/20 bg-slate-950/90 p-4 text-white [color-scheme:dark]">
          <option>思い出</option><option>カフェ</option><option>サウナ</option><option>ランニング</option><option>買い物</option><option>仕事</option><option>その他</option>
        </select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field placeholder="住所・駅名・検索語" value={address} onChange={(e) => setAddress(e.target.value)} />
        <Field placeholder="Google Maps URL（任意）" value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} />
      </div>
      <TextArea className="h-24" placeholder="その場所のメモ" value={note} onChange={(e) => setNote(e.target.value)} />
      <PrimaryButton onClick={addPlace}>場所を追加</PrimaryButton>
      {!places.length && <Empty text="まだ場所の記録がないよ。" />}
      <div className="grid gap-3 sm:grid-cols-2">
        {places.map((place) => (
          <GlassCard key={place.id}>
            <p className="text-xs text-white/45">{place.place_date} / {place.category}</p>
            <h3 className="mt-1 text-xl font-black">{place.title}</h3>
            {place.address && <p className="mt-2 text-sm text-white/65">{place.address}</p>}
            {place.note && <p className="mt-2 whitespace-pre-wrap text-sm text-white/65">{place.note}</p>}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => place.map_url ? window.open(place.map_url, "_blank", "noopener,noreferrer") : openMap(place.address || place.title)} className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-black">地図で開く</button>
              <button type="button" onClick={() => setDeleteTarget(place)} className="rounded-2xl bg-red-500/80 px-3 py-2 text-sm font-black text-white">削除</button>
            </div>
          </GlassCard>
        ))}
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-4">
          <GlassCard className="w-full max-w-md bg-slate-950">
            <h3 className="text-xl font-black">本当に削除する？</h3>
            <p className="mt-3 text-sm text-white/65">{deleteTarget.title} の場所記録を削除するよ。</p>
            <div className="mt-5 grid gap-3">
              <button type="button" onClick={deletePlace} className="rounded-2xl bg-red-500 px-4 py-3 font-black text-white">削除する</button>
              <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-2xl bg-white/10 px-4 py-3 font-bold">キャンセル</button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

function HeatmapPanel({ snapshot }: { snapshot: Snapshot | null }) { const days = Array.from({ length: 30 }, (_, i) => dateMinus(todayKey(), 29 - i)); const count = (d: string) => (snapshot?.diaries.filter((x) => x.entry_date === d).length || 0) + (snapshot?.tweets.filter((x) => x.tweet_date === d).length || 0) + (snapshot?.todos.filter((x) => x.due_date === d).length || 0) + (snapshot?.coffee.filter((x) => x.drink_date === d).length || 0) + (snapshot?.budget.filter((x) => x.spend_date === d).length || 0); return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">人生ヒートマップ</h2><p className="mt-2 text-sm text-white/60">直近30日の記録量を色の濃さで表示。</p></GlassCard><div className="grid grid-cols-10 gap-2">{days.map((d) => { const c = count(d); return <div key={d} title={`${d}: ${c}件`} className={`aspect-square rounded-xl border border-white/10 ${c > 5 ? "bg-red-400" : c > 3 ? "bg-orange-400" : c > 1 ? "bg-emerald-400" : c > 0 ? "bg-sky-400" : "bg-white/10"}`}><span className="sr-only">{d}</span></div>; })}</div></div>; }

function SecondBrainSearch({ snapshot, setPage }: { snapshot: Snapshot | null; setPage: (p: PageKey) => void }) { const [q, setQ] = useState(""); const rows = useMemo(() => { const all = [...(snapshot?.memos || []).map((x) => ({ page: "memos" as PageKey, type: "メモ", date: getCreatedDateKey(x.created_at), text: x.content })), ...(snapshot?.diaries || []).map((x) => ({ page: "diary" as PageKey, type: "Diary", date: x.entry_date, text: `${x.title || ""} ${stripHtml(x.content)}` })), ...(snapshot?.tweets || []).map((x) => ({ page: "tweets" as PageKey, type: "つぶやき", date: x.tweet_date, text: x.content })), ...(snapshot?.places || []).map((x) => ({ page: "map" as PageKey, type: "地図", date: x.place_date, text: `${x.title} ${x.address || ""}` }))]; return q ? all.filter((r) => r.text.includes(q)) : all.slice(0, 30); }, [snapshot, q]); return <div className="space-y-4"><Field placeholder="第二の脳検索 例: 江ノ島 / 疲れた / コーヒー" value={q} onChange={(e) => setQ(e.target.value)} /><div className="space-y-3">{rows.map((r, i) => <button key={i} onClick={() => setPage(r.page)} className="w-full rounded-3xl border border-white/10 bg-black/25 p-4 text-left"><p className="text-xs text-white/45">{r.type} / {r.date}</p><p className="mt-2 line-clamp-3">{r.text}</p></button>)}</div></div>; }
function AutoTagsPanel({ snapshot }: { snapshot: Snapshot | null }) { const rows = [...(snapshot?.diaries || []).map((d) => ({ date: d.entry_date, text: `${d.title || ""} ${stripHtml(d.content)}` })), ...(snapshot?.tweets || []).map((t) => ({ date: t.tweet_date, text: t.content })), ...(snapshot?.memos || []).map((m) => ({ date: getCreatedDateKey(m.created_at), text: m.content }))].slice(0, 60); return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">自動人生タグ</h2><p className="mt-2 text-sm text-white/60">Diary・つぶやき・メモの内容からタグを自動推定。</p></GlassCard>{rows.map((r, i) => <GlassCard key={i}><p className="text-xs text-white/45">{r.date}</p><p className="mt-2 line-clamp-2">{r.text}</p><div className="mt-3 flex flex-wrap gap-2">{tagWords(r.text).map((tag) => <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">{tag}</span>)}</div></GlassCard>)}</div>; }
function ChronologyPanel({ snapshot }: { snapshot: Snapshot | null }) { const years = useMemo(() => { const map = new Map<string, string[]>(); [...(snapshot?.diaries || []).map((d) => `${d.entry_date} Diary: ${d.title || stripHtml(d.content).slice(0, 40)}`), ...(snapshot?.places || []).map((p) => `${p.place_date} 場所: ${p.title}`), ...(snapshot?.tweets || []).map((t) => `${t.tweet_date} つぶやき: ${t.content.slice(0, 40)}`)].forEach((s) => { const y = s.slice(0, 4); map.set(y, [...(map.get(y) || []), s]); }); return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0])); }, [snapshot]); return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">自分年表</h2></GlassCard>{years.map(([year, items]) => <GlassCard key={year}><h3 className="text-3xl font-black">{year}</h3><div className="mt-3 space-y-2">{items.map((it) => <p key={it} className="rounded-2xl bg-black/25 p-3 text-sm">{it}</p>)}</div></GlassCard>)}</div>; }
function AnniversaryPanel({ snapshot }: { snapshot: Snapshot | null }) { const md = todayKey().slice(5); const rows = [...(snapshot?.diaries || []).filter((d) => d.entry_date.slice(5) === md), ...(snapshot?.tweets || []).filter((t) => t.tweet_date.slice(5) === md), ...(snapshot?.places || []).filter((p) => p.place_date.slice(5) === md)]; return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">過去の今日</h2><p className="mt-2 text-sm text-white/60">同じ月日の記録を表示。</p></GlassCard>{!rows.length && <Empty text="過去の同じ日の記録はまだ見つからないよ。" />}{rows.map((r: any) => <GlassCard key={r.id}><p className="text-xs text-white/45">{r.entry_date || r.tweet_date || r.place_date}</p><p className="mt-2">{r.title || r.content || r.trash_type}</p></GlassCard>)}</div>; }
function ConditionPanel({ snapshot }: { snapshot: Snapshot | null }) { const today = todayKey(); const caffeine = snapshot?.coffee.filter((c) => c.drink_date === today).reduce((s, c) => s + Number(c.caffeine_mg), 0) || 0; const undone = snapshot?.todos.filter((t) => t.due_date === today && !t.done).length || 0; const sleep = snapshot?.sleep.find((s) => s.sleep_date === today); const score = Math.max(20, Math.min(95, 85 - Math.floor(caffeine / 80) * 3 - undone * 6 + (sleep?.quality === "良い" ? 10 : 0))); return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">AIコンディション予測</h2><p className="mt-4 text-6xl font-black">{score}</p><p className="mt-2 text-sm text-white/60">カフェイン・TODO・睡眠から簡易予測。今日は{score >= 75 ? "集中しやすそう" : score >= 55 ? "通常運転" : "少し回復優先が良さそう"}。</p></GlassCard></div>; }
function CafeAtlasPanel({ snapshot, setPage }: { snapshot: Snapshot | null; setPage: (p: PageKey) => void }) { const names = [...new Set((snapshot?.coffee || []).map((c) => c.coffee_name))]; return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">カフェ図鑑</h2><p className="mt-2 text-sm text-white/60">飲んだコーヒー名を図鑑化。</p></GlassCard>{!names.length && <Empty text="コーヒーページで記録すると図鑑が育つよ。" />}<div className="grid gap-3 sm:grid-cols-2">{names.map((n) => { const logs = (snapshot?.coffee || []).filter((c) => c.coffee_name === n); return <button key={n} onClick={() => setPage("coffee")} className="rounded-3xl border border-white/10 bg-black/25 p-4 text-left"><div className="text-3xl">☕</div><h3 className="mt-2 text-xl font-black">{n}</h3><p className="mt-1 text-sm text-white/55">{logs.length}回 / 合計{logs.reduce((s, c) => s + Number(c.cups), 0)}杯</p></button>; })}</div></div>; }
function GoalsPanel({ snapshot }: { snapshot: Snapshot | null }) { const goals = [{ title: "Body Sculptural Beauty", target: "2028/08/12", value: "体脂肪率10%以下" }, { title: "10km 47分", target: "長期", value: "Wind Hunt強化" }, { title: "VO2MAX 56", target: "長期", value: "心肺能力" }, { title: "Diary資産", target: "継続", value: `${snapshot?.diaries.length || 0}件` }]; return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">未来目標ボード</h2></GlassCard><div className="grid gap-3 sm:grid-cols-2">{goals.map((g) => <GlassCard key={g.title}><h3 className="text-xl font-black">{g.title}</h3><p className="mt-1 text-sm text-white/55">{g.target}</p><p className="mt-3 rounded-2xl bg-white/10 p-3 text-sm">{g.value}</p></GlassCard>)}</div></div>; }
function IdealsPanel({ snapshot, refreshSnapshot }: { snapshot: Snapshot | null; refreshSnapshot: () => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [edit, setEdit] = useState<IdealItem | null>(null);
  const ideals = snapshot?.ideals || [];
  async function add() {
    if (!title.trim() && !description.trim() && !image) return alert("理想像のタイトル・文章・画像のどれかを入れてね");
    const { error } = await supabase.from("ideal_items").insert({ title: title || "理想像", description: description || null, image_url: image || null });
    if (error) return alert("理想ページ保存失敗: " + error.message + "\n統合SQLを実行しているか確認してね。");
    setTitle(""); setDescription(""); setImage("");
    setGuideDraft("理想像を保存したよ。未来の自分の方向が少し見えやすくなったね。");
    await refreshSnapshot();
  }
  async function saveEdit() {
    if (!edit) return;
    const { error } = await supabase.from("ideal_items").update({ title: edit.title, description: edit.description, image_url: edit.image_url }).eq("id", edit.id);
    if (error) return alert("理想像の更新失敗: " + error.message);
    setEdit(null); await refreshSnapshot();
  }
  async function del(id: string) {
    if (!confirm("この理想を削除していい？")) return;
    const { error } = await supabase.from("ideal_items").delete().eq("id", id);
    if (error) return alert("削除失敗: " + error.message);
    await refreshSnapshot();
  }
  return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">理想</h2><p className="mt-2 text-sm text-white/60">理想の画像と文章を保存する場所。写真ライブラリから画像を貼れて、あとから変更・削除もできるよ。</p></GlassCard><GlassCard><div className="grid gap-3"><Field placeholder="理想像のタイトル 例: 戦える細マッチョ" value={title} onChange={(e) => setTitle(e.target.value)} /><TextArea className="h-32" placeholder="理想像を文章で語る。身体・生活・雰囲気・未来の自分など。" value={description} onChange={(e) => setDescription(e.target.value)} /><label className="block rounded-2xl border border-dashed border-white/25 bg-white/10 p-4 text-sm font-bold text-white/80"><span>理想画像を選ぶ（Mac/iPhone写真ライブラリ対応）</span><input type="file" accept="image/*" className="mt-3 block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:font-black file:text-black" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { setImage(await fileToDataUrl(file)); } catch { alert("画像の読み込みに失敗したよ。別の画像で試してね。"); } }} /></label>{image && <img src={image} alt="ideal preview" className="max-h-80 w-full rounded-3xl object-cover" />}<PrimaryButton onClick={add}>理想像を保存</PrimaryButton></div></GlassCard>{!ideals.length && <Empty text="まだ理想像がないよ。画像や文章を保存するとここに並ぶよ。" />}<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ideals.map((item) => <GlassCard key={item.id} className="overflow-hidden p-0"><div className="p-4">{item.image_url ? <img src={item.image_url} alt={item.title} className="h-56 w-full rounded-3xl object-cover" /> : <div className="flex h-56 items-center justify-center rounded-3xl bg-white/10 text-5xl">🌌</div>}<h3 className="mt-4 text-xl font-black">{item.title}</h3>{item.description && <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/70">{item.description}</p>}<div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => setEdit(item)} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold">変更</button><button onClick={() => del(item.id)} className="rounded-2xl bg-red-500 px-3 py-2 text-sm font-bold">削除</button></div></div></GlassCard>)}</div>{edit && <Modal title="理想像を変更" onClose={() => setEdit(null)}><div className="space-y-3"><Field value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /><TextArea className="h-32" value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /><Field placeholder="画像URL / data URL" value={edit.image_url || ""} onChange={(e) => setEdit({ ...edit, image_url: e.target.value })} /><label className="block rounded-2xl border border-dashed border-white/25 bg-white/10 p-4 text-sm font-bold text-white/80"><span>新しい画像を選ぶ</span><input type="file" accept="image/*" className="mt-3 block w-full text-sm text-white/70 file:mr-3 file:rounded-xl file:border-0 file:bg-white file:px-3 file:py-2 file:font-black file:text-black" onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { setEdit({ ...edit, image_url: await fileToDataUrl(file) }); } catch { alert("画像の読み込みに失敗したよ。"); } }} /></label>{edit.image_url && <img src={edit.image_url} alt="edit preview" className="max-h-72 w-full rounded-3xl object-cover" />}<button onClick={saveEdit} className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black">保存</button></div></Modal>}</div>;
}




function BrainDumpPanel({ refreshSnapshot, setPage }: { refreshSnapshot: (reason?: string) => Promise<void>; setPage: (p: PageKey) => void }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<{ todos: TodoInsertCandidate[]; memos: string[]; later: string[] } | null>(null);
  const [saving, setSaving] = useState(false);
  const voice = useVoiceInput((spoken) => setText((current) => `${current}${current ? "\n" : ""}${spoken}`));
  const preview = useMemo(() => classifyBrainDump(text), [text]);
  async function saveAll() {
    const classified = classifyBrainDump(text);
    if (!text.trim()) return;
    setSaving(true);
    let memoCount = 0;
    let tweetCount = 0;
    const todoResult = await insertTodoCandidates(classified.todos, todayKey());
    for (const memo of classified.memos) {
      const { error } = await supabase.from("memos").insert({ content: memo });
      if (!error) memoCount += 1;
    }
    for (const later of classified.later) {
      const { error } = await supabase.from("tweets").insert({ tweet_date: todayKey(), content: `あとで: ${later}`, mood: "普通" });
      if (!error) tweetCount += 1;
    }
    setResult(classified);
    setGuideDraft(`脳ダンプを整理したよ。TODO ${todoResult.inserted}件、メモ ${memoCount}件、後でBOX ${tweetCount}件に分けたよ。`);
    setText("");
    await refreshSnapshot("手動同期中...");
    setSaving(false);
  }
  return <div className="space-y-4"><GlassCard><p className="text-xs font-black text-fuchsia-100/70">外部脳</p><h2 className="mt-1 text-3xl font-black">脳ダンプ</h2><p className="mt-2 text-sm leading-7 text-white/60">思いついたことを雑に全部入れる場所。TODO・メモ・後でBOXに自動で分けて、ワーキングメモリを軽くする。</p></GlassCard><div className="grid gap-4 lg:grid-cols-[1fr_.9fr]"><GlassCard><TextArea className="min-h-56" placeholder="例: 牛乳買う。あとで靴を調べる。明日ジムの準備。部屋を片付けたい。" value={text} onChange={(e) => setText(e.target.value)} /><div className="mt-3 grid gap-2 sm:grid-cols-3"><button onClick={voice.start} className={`rounded-2xl px-4 py-3 font-black ${voice.listening ? "bg-rose-300 text-black" : "bg-white/10"}`}>{voice.listening ? "聞いてる..." : "音声入力"}</button><button onClick={() => setResult(preview)} className="rounded-2xl bg-white/10 px-4 py-3 font-black">分類プレビュー</button><button onClick={saveAll} disabled={saving || !text.trim()} className="rounded-2xl bg-white px-4 py-3 font-black text-black disabled:opacity-50">{saving ? "保存中..." : "自動仕分け保存"}</button></div></GlassCard><GlassCard><h3 className="text-xl font-black">仕分け予測</h3><div className="mt-3 space-y-3"><div className="rounded-2xl bg-black/25 p-3"><p className="text-xs font-black text-emerald-100">TODO候補</p>{preview.todos.length ? preview.todos.map((t, i) => <p key={i} className="mt-1 text-sm text-white/75">・{String(t.title)}</p>) : <p className="mt-1 text-sm text-white/45">なし</p>}</div><div className="rounded-2xl bg-black/25 p-3"><p className="text-xs font-black text-sky-100">メモ候補</p>{preview.memos.length ? preview.memos.map((m, i) => <p key={i} className="mt-1 text-sm text-white/75">・{m}</p>) : <p className="mt-1 text-sm text-white/45">なし</p>}</div><div className="rounded-2xl bg-black/25 p-3"><p className="text-xs font-black text-fuchsia-100">後でBOX候補</p>{preview.later.length ? preview.later.map((m, i) => <p key={i} className="mt-1 text-sm text-white/75">・{m}</p>) : <p className="mt-1 text-sm text-white/45">なし</p>}</div></div>{result && <button onClick={() => setPage("todos")} className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-black text-black">TODOを確認</button>}</GlassCard></div></div>;
}

type GlobalSearchResult = { page: PageKey; title: string; body: string; id: string; kind?: "page" | "record" };
function classifyBrainDump(text: string) {
  const lines = String(text || "").split(/\r?\n|[。！？!?]+/).map((line) => line.trim()).filter(Boolean);
  const todoWords = /(する|やる|買う|行く|予約|確認|連絡|提出|支払|送る|作る|準備|掃除|洗濯|電話|メール|返す|調べる|必要|忘れ)/;
  const eventWords = /(予定|集合|予約|面談|病院|歯医者|美容院|イベント|ライブ|会う)/;
  const buyWords = /(買う|購入|欲しい|必要|スーパー|コンビニ|Amazon|アマゾン)/;
  const todos: TodoInsertCandidate[] = [];
  const memos: string[] = [];
  const later: string[] = [];
  for (const line of lines) {
    if (todoWords.test(line)) todos.push({ title: line.slice(0, 120), priority: /今日|急ぎ|至急|重要|必ず/.test(line) ? "high" : "normal", due_date: /今日/.test(line) ? todayKey() : null });
    else if (eventWords.test(line)) memos.push(`予定候補: ${line}`);
    else if (buyWords.test(line)) todos.push({ title: line.slice(0, 120), priority: "normal", due_date: null });
    else if (/あとで|後で|読む|調べ/.test(line)) later.push(line);
    else memos.push(line);
  }
  if (!todos.length && !memos.length && !later.length && String(text || "").trim()) memos.push(String(text).trim());
  return { todos: todos.slice(0, 12), memos: memos.slice(0, 12), later: later.slice(0, 12) };
}
function useVoiceInput(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  function start() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("このブラウザは音声入力に未対応みたい。スマホのキーボード音声入力でも代用できるよ。"); return; }
    const rec = new SpeechRecognition();
    rec.lang = "ja-JP";
    rec.interimResults = false;
    rec.continuous = false;
    setListening(true);
    rec.onresult = (event: any) => { const text = Array.from(event.results).map((r: any) => r[0]?.transcript || "").join(" ").trim(); if (text) onText(text); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }
  return { listening, start };
}

function collectGlobalSearchResults(snapshot: Snapshot | null, query: string): GlobalSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hit = (text: string) => text.toLowerCase().includes(q);
  const rows: GlobalSearchResult[] = [];
  navItems.forEach((item) => {
    if (hit(`${item.label} ${item.icon} ${item.key}`)) rows.push({ page: item.key, title: `${item.icon} ${item.label}`, body: `${item.label}ページへ移動`, id: `page-${item.key}`, kind: "page" });
  });
  (snapshot?.memos || []).forEach((m) => { if (hit(m.content)) rows.push({ page: "memos", title: "メモ", body: m.content, id: `memo-${m.id}`, kind: "record" }); });
  (snapshot?.tweets || []).forEach((t) => { if (hit(t.content)) rows.push({ page: "tweets", title: `つぶやき ${t.tweet_date}`, body: t.content, id: `tweet-${t.id}`, kind: "record" }); });
  (snapshot?.todos || []).forEach((t) => { if (hit(`${t.title} ${t.location_name || ""}`)) rows.push({ page: "todos", title: "TODO", body: t.title, id: `todo-${t.id}`, kind: "record" }); });
  (snapshot?.diaries || []).forEach((d) => { if (hit(`${d.title || ""} ${d.content}`)) rows.push({ page: "diary", title: `Diary ${d.entry_date}`, body: `${d.title || ""} ${d.content}`, id: `diary-${d.id}`, kind: "record" }); });
  (snapshot?.budget || []).forEach((b) => { if (hit(`${b.category} ${b.memo || ""} ${b.wallet || ""}`)) rows.push({ page: "budget", title: `家計簿 ${yen(b.amount)}`, body: `${b.type === "income" ? "収入" : "支出"} ${b.category} ${b.memo || ""}`, id: `budget-${b.id}`, kind: "record" }); });
  (snapshot?.coffee || []).forEach((c) => { if (hit(`${c.coffee_name} ${c.note || ""}`)) rows.push({ page: "coffee", title: `コーヒー ${c.drink_date}`, body: `${c.coffee_name} ${c.cups}杯 ${c.note || ""}`, id: `coffee-${c.id}`, kind: "record" }); });
  (snapshot?.events || []).forEach((e) => { if (hit(`${e.title} ${e.note || ""}`)) rows.push({ page: "calendar", title: `予定 ${e.event_date}`, body: `${e.title} ${e.note || ""}`, id: `event-${e.id}`, kind: "record" }); });
  (snapshot?.places || []).forEach((p) => { if (hit(`${p.title} ${p.address || ""} ${p.note || ""}`)) rows.push({ page: "map", title: `場所 ${p.place_date}`, body: `${p.title} ${p.address || ""}`, id: `place-${p.id}`, kind: "record" }); });
  (snapshot?.belongingCards || []).forEach((c) => { if (hit(`${c.title} ${c.note || ""}`)) rows.push({ page: "belongings", title: "持ち物カード", body: `${c.title} ${c.note || ""}`, id: `belonging-card-${c.id}`, kind: "record" }); });
  (snapshot?.belongingItems || []).forEach((i) => { if (hit(i.name)) rows.push({ page: "belongings", title: "持ち物", body: i.name, id: `belonging-item-${i.id}`, kind: "record" }); });
  return rows.slice(0, 60);
}

function GlobalSearchModal({ snapshot, setPage, onClose }: { snapshot: Snapshot | null; setPage: (p: PageKey) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => collectGlobalSearchResults(snapshot, query), [snapshot, query]);
  function jump(page: PageKey, id: string) {
    setPage(page);
    onClose();
    setTimeout(() => {
      if (id.startsWith("page-")) return;
      const el = document.getElementById(id) || document.querySelector(`[data-search-id="${id}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLElement) {
        el.style.outline = "3px solid rgba(255,255,255,.85)";
        window.setTimeout(() => { el.style.outline = ""; }, 1800);
      }
    }, 250);
  }
  return <Modal title="全ページ検索" onClose={onClose}><div className="space-y-3"><Field autoFocus placeholder="探したい文字を入力..." value={query} onChange={(e) => setQuery(e.target.value)} />{!query.trim() && <p className="text-sm text-white/55">ページ名と記録内容をまとめて探すよ。ページが増えてもここから一瞬で移動できる。</p>}<div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">{results.map((r) => <button key={r.id} onClick={() => jump(r.page, r.id)} className="w-full rounded-2xl border border-white/10 bg-white/10 p-3 text-left"><p className="text-xs font-black text-cyan-100">{r.kind === "page" ? "ページ移動" : "記録"} / {r.title}</p><p className="mt-1 line-clamp-2 text-sm text-white/75">{r.body}</p></button>)}{query.trim() && !results.length && <Empty text="該当する記録が見つからなかったよ。" />}</div></div></Modal>;
}

function FocusTimerPanel({ snapshot, setPage }: { snapshot: Snapshot | null; setPage: (p: PageKey) => void }) {
  const initialTimer = useMemo(() => readFocusTimerState(), []);
  const [mode, setMode] = useState<"stopwatch" | "countdown">(initialTimer.mode);
  const [running, setRunning] = useState(initialTimer.running);
  const [seconds, setSeconds] = useState(initialTimer.seconds);
  const [preset, setPreset] = useState(initialTimer.preset);
  const [startedAt, setStartedAt] = useState<number | null>(initialTimer.startedAt);
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
      setSeconds((s) => mode === "countdown" ? Math.max(0, s - 1) : s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, mode]);

  useEffect(() => {
    if (mode === "countdown" && running && seconds === 0) {
      setRunning(false);
      saveFocusTimerState({ mode, running: false, seconds: 0, preset, startedAt });
      playSoftNotice();
      setGuideDraft("集中タイマーが終わったよ。小さく区切れたのえらい。休憩しても大丈夫。");
    }
  }, [seconds, mode, running, preset, startedAt]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const focusTodos = (snapshot?.todos || []).filter((t) => !t.done).slice(0, 3);
  const elapsedMinutes = startedAt ? Math.floor((Date.now() - startedAt) / 60000) : 0;

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

  return <div className="space-y-4">{launchFlash && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 text-center"><div className="rounded-[2rem] border border-white/15 bg-white p-8 text-black shadow-2xl"><p className="text-5xl font-black">START</p><p className="mt-2 text-sm font-black">最初の一歩だけでOK</p></div></div>}<GlassCard><p className="text-xs font-black text-cyan-100/70">集中タイマー</p><h2 className="mt-2 text-3xl font-black">ストップウォッチ / カウントダウン</h2><p className="mt-2 text-sm text-white/60">ページを移動しても時間を保存するように直したよ。戻ってきても続きから見られる。</p></GlassCard><div className="grid gap-4 lg:grid-cols-[1fr_.8fr]"><GlassCard className="text-center"><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => switchMode("countdown")} className={`rounded-2xl px-4 py-3 font-black ${mode === "countdown" ? "bg-white text-black" : "bg-white/10"}`}>カウントダウン</button><button type="button" onClick={() => switchMode("stopwatch")} className={`rounded-2xl px-4 py-3 font-black ${mode === "stopwatch" ? "bg-white text-black" : "bg-white/10"}`}>ストップウォッチ</button></div><p className="mt-8 text-7xl font-black tracking-tight sm:text-8xl">{mm}:{ss}</p>{mode === "countdown" && <div className="mt-5 grid grid-cols-4 gap-2">{[5,10,25,50].map((m) => <button key={m} type="button" onClick={() => { setPreset(m); setSeconds(m * 60); setRunning(false); setStartedAt(null); }} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-bold">{m}分</button>)}</div>}<div className="mt-6 grid grid-cols-3 gap-2"><button type="button" onClick={startTimer} className="rounded-2xl bg-emerald-300 px-4 py-3 font-black text-black">開始</button><button type="button" onClick={() => setRunning(false)} className="rounded-2xl bg-white/10 px-4 py-3 font-black">停止</button><button type="button" onClick={resetTimer} className="rounded-2xl bg-white/10 px-4 py-3 font-black">リセット</button></div></GlassCard><GlassCard><h3 className="text-xl font-black">集中中に扱う3つ</h3><div className="mt-3 space-y-2">{focusTodos.length ? focusTodos.map((t) => <div key={t.id} className="rounded-2xl bg-black/25 p-3"><p className="font-bold">{t.title}</p><p className="mt-1 text-xs text-white/45">5分版: {makeFiveMinuteTodo(t.title)}</p></div>) : <p className="text-sm text-white/55">未完了TODOが少なめ。自由作業にも使えるよ。</p>}</div><button type="button" onClick={() => setPage("todos")} className="mt-4 w-full rounded-2xl bg-white px-4 py-3 font-black text-black">TODOへ移動</button>{running && elapsedMinutes >= 90 && <div className="mt-3 rounded-2xl border border-amber-200/30 bg-amber-300/10 p-3 text-sm text-amber-50">Hyperfocus保護: 90分以上続いてるよ。水分・トイレ・肩の力だけ確認できると安心。</div>}</GlassCard></div></div>;
}

function LifeHubPanel({ snapshot, setPage }: { snapshot: Snapshot | null; setPage: (p: PageKey) => void }) {
  const allText = [...(snapshot?.memos || []), ...(snapshot?.tweets || []), ...(snapshot?.diaries || [])].map((x: any) => `${x.title || ""} ${x.content || ""}`).join(" ");
  const todos = snapshot?.todos || [];
  const undone = todos.filter((t) => !t.done);
  const recent = [...(snapshot?.diaries || []), ...(snapshot?.tweets || []), ...(snapshot?.places || [])].slice(0, 8);
  const assets = snapshot?.budgetAccounts.reduce((s, a) => s + Number(a.balance || 0), 0) || 0;
  const monthLogs = (snapshot?.budget || []).filter((b) => isSameMonth(b.spend_date));
  const monthExpense = monthLogs.filter((b) => b.type === "expense").reduce((s, b) => s + Number(b.amount || 0), 0);
  const stressSpend = monthLogs.filter((b) => /疲|不安|ストレス|しんど|深夜|衝動/.test(`${b.memo || ""} ${allText}`)).reduce((s, b) => s + Number(b.amount || 0), 0);
  const goodSpend = monthLogs.filter((b) => /サウナ|カフェ|ラン|ジム|本|学習|音楽|江ノ島/.test(`${b.category} ${b.memo || ""}`)).reduce((s, b) => s + Number(b.amount || 0), 0);
  const keywords = ["サウナ", "青春ラン", "Wind Hunt", "江ノ島", "カフェ", "ストグリ", "ジム", "睡眠", "家計簿"].filter((w) => allText.includes(w));
  const exp = (snapshot?.diaries.length || 0) * 8 + (snapshot?.todos.filter((t) => t.done).length || 0) * 10 + (snapshot?.routineChecks.length || 0) * 6 + (snapshot?.places.length || 0) * 15;
  const systems = [
    { title: "思考マップ", body: keywords.length ? keywords.map((w) => `#${w}`).join(" → ") : "記録が増えるほど、言葉同士のつながりが見えるよ。", action: "検索へ", page: "search" as PageKey },
    { title: "AI人生アーカイブ", body: recent.length ? recent.map((r: any) => r.entry_date || r.tweet_date || r.place_date).slice(0, 4).join(" / ") : "写真・Diary・地図・支出の月次振り返りの土台。", action: "年表へ", page: "chronology" as PageKey },
    { title: "忘れてること検出", body: undone.length > 0 ? `未完了TODOが${undone.length}件。まず1つだけ見ればOK。` : "TODOは軽め。記録の止まりを見守る場所。", action: "TODOへ", page: "todos" as PageKey },
    { title: "今どこまでやった？", body: undone[0] ? `途中候補: ${undone[0].title}` : "途中の候補は少なめ。", action: "集中へ", page: "focus" as PageKey },
    { title: "切り替えブリッジ", body: "ページ移動前に、次の場所の意味を短く確認するための導線。", action: "脳ダンプへ", page: "braindump" as PageKey },
    { title: "逆算ナビ", body: "出発時刻から、準備・持ち物・移動を逆算する土台。", action: "持ち物へ", page: "belongings" as PageKey },
    { title: "未来の自分AI", body: undone[0] ? `後回しにすると残りやすい候補: ${undone[0].title}` : "未来負担は軽め。", action: "TODOへ", page: "todos" as PageKey },
    { title: "お金の体力ゲージ", body: `総資産 ${yen(assets)} / 今月支出 ${yen(monthExpense)}`, action: "家計簿へ", page: "budget" as PageKey },
    { title: "ストレス支出検出", body: `候補 ${yen(stressSpend)}。疲れている日の支出を見える化。`, action: "家計簿へ", page: "budget" as PageKey },
    { title: "使ってよかった支出", body: `幸福投資候補 ${yen(goodSpend)}。サウナ・カフェ・運動系を拾うよ。`, action: "家計簿へ", page: "budget" as PageKey },
    { title: "脳覚醒ヒートマップ", body: "コーヒー記録から覚醒しやすい時間帯を見やすくする土台。", action: "コーヒーへ", page: "coffee" as PageKey },
    { title: "やる順AI", body: undone.slice(0, 3).map((t) => t.title).join(" → ") || "今は順番候補が少なめ。", action: "TODOへ", page: "todos" as PageKey },
    { title: "NFC/QR探し物支援", body: "財布・鍵・イヤホンの最後の記録場所を持ち物と連動する土台。", action: "持ち物へ", page: "belongings" as PageKey },
    { title: "人生RPG化", body: `Life EXP ${exp} / Lv.${Math.floor(exp / 100) + 1}`, action: "EXPへ", page: "exp" as PageKey },
  ];
  return <div className="space-y-4"><GlassCard><p className="text-xs font-black text-fuchsia-100/70">第二の脳 拡張室</p><h2 className="mt-1 text-3xl font-black">生活OSラボ</h2><p className="mt-2 text-sm leading-7 text-white/60">思考マップ、逆算ナビ、お金の体力ゲージ、人生RPG化まで、既存データを壊さずに横断表示する場所。</p></GlassCard><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{systems.map((x) => <GlassCard key={x.title}><h3 className="text-xl font-black">{x.title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-white/65">{x.body}</p><button onClick={() => setPage(x.page)} className="mt-4 w-full rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">{x.action}</button></GlassCard>)}</div></div>;
}

function ExpPanel({ snapshot, setPage }: { snapshot: Snapshot | null; setPage: (p: PageKey) => void }) { const exp = (snapshot?.diaries.length || 0) * 8 + (snapshot?.todos.filter((t) => t.done).length || 0) * 10 + (snapshot?.routineChecks.length || 0) * 6 + (snapshot?.places.length || 0) * 15 + (snapshot?.coffee.length || 0) * 4; const level = Math.floor(exp / 100) + 1; const next = exp % 100; const cards = [{ p: "diary" as PageKey, title: "Diary", exp: "+8" }, { p: "todos" as PageKey, title: "TODO達成", exp: "+10" }, { p: "routines" as PageKey, title: "習慣チェック", exp: "+6" }, { p: "map" as PageKey, title: "場所記録", exp: "+15" }]; return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">Life EXP</h2><p className="mt-4 text-6xl font-black">Lv.{level}</p><div className="mt-4 h-3 rounded-full bg-white/10"><div className="h-3 rounded-full bg-emerald-400" style={{ width: `${next}%` }} /></div><p className="mt-2 text-sm text-white/55">総EXP {exp} / 次のレベルまで {100 - next}</p></GlassCard><div className="grid gap-3 sm:grid-cols-2">{cards.map((c) => <button key={c.title} onClick={() => setPage(c.p)} className="rounded-3xl border border-white/10 bg-black/25 p-4 text-left"><p className="text-xl font-black">{c.title}</p><p className="mt-1 text-sm text-emerald-200">{c.exp} EXP</p></button>)}</div></div>; }
function NightModePanel({ setPage }: { setPage: (p: PageKey) => void }) { return <div className="space-y-4"><GlassCard className="bg-indigo-950/50"><h2 className="text-3xl font-black">静かな夜モード</h2><p className="mt-3 text-sm leading-7 text-white/70">夜は情報量を減らして、Diary・つぶやき・睡眠だけに絞るモード。焦らず一日の終わりを残すための場所。</p></GlassCard><div className="grid gap-3 sm:grid-cols-3"><button onClick={() => setPage("diary")} className="rounded-3xl bg-white/10 p-5 text-left font-black">📖 Diary</button><button onClick={() => setPage("tweets")} className="rounded-3xl bg-white/10 p-5 text-left font-black">💬 つぶやき</button><button onClick={() => setPage("home")} className="rounded-3xl bg-white/10 p-5 text-left font-black">🏠 ホーム</button></div></div>; }
function SettingsPanel({ themeKey, onChangeTheme }: { themeKey: ThemeKey; onChangeTheme: (theme: ThemeKey) => void }) {
  const [notify, setNotify] = useState<NotifySettings>(() => getNotifySettings());
  function updateNotify(next: NotifySettings) { setNotify(next); saveNotifySettings(next); }
  async function askPermission() {
    if (!("Notification" in window)) return alert("このブラウザは通知に対応していないみたい。");
    const result = await Notification.requestPermission();
    if (result === "granted") requestLocalNotification("通知テスト", "Life Command OSからのやさしい通知だよ", `test-notice-${Date.now()}`);
    else alert("ブラウザ側で通知が許可されなかったよ。設定から許可してね。");
  }
  return <div className="space-y-4"><GlassCard><h2 className="text-2xl font-black">通知設定</h2><p className="mt-2 text-sm leading-7 text-white/60">Todo・習慣・ゴミの日の時刻通知を、アプリを開いている間に確認するよ。音は小さめ、バイブは短め。端末が消音/通知拒否の場合は端末設定を優先するよ。</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><button onClick={() => updateNotify({ ...notify, enabled: !notify.enabled })} className={`rounded-2xl px-4 py-3 font-black ${notify.enabled ? "bg-emerald-400 text-black" : "bg-white/10 text-white"}`}>通知 {notify.enabled ? "ON" : "OFF"}</button><button onClick={() => updateNotify({ ...notify, sound: !notify.sound })} className={`rounded-2xl px-4 py-3 font-black ${notify.sound ? "bg-sky-300 text-black" : "bg-white/10 text-white"}`}>小さい音 {notify.sound ? "ON" : "OFF"}</button><button onClick={() => updateNotify({ ...notify, vibrate: !notify.vibrate })} className={`rounded-2xl px-4 py-3 font-black ${notify.vibrate ? "bg-violet-300 text-black" : "bg-white/10 text-white"}`}>短いバイブ {notify.vibrate ? "ON" : "OFF"}</button></div><button onClick={askPermission} className="mt-3 w-full rounded-2xl bg-white px-4 py-3 font-black text-black">通知テスト / 許可する</button></GlassCard><div className="grid gap-3 sm:grid-cols-2">{Object.entries(themes).map(([key, theme]) => <button key={key} onClick={() => onChangeTheme(key as ThemeKey)} className={`rounded-3xl border ${theme.card} p-5 text-left shadow-2xl transition hover:scale-[1.01] ${themeKey === key ? "ring-2 ring-white/70" : ""}`}><div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r ${theme.accent} text-3xl`}>{theme.emoji}</div><h2 className="mt-4 text-xl font-black">{theme.name}</h2><p className="mt-1 text-sm text-white/55">このテーマに切り替える</p></button>)}</div></div>;
}
function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) { return <div className="fixed inset-0 z-[80] flex items-end bg-black/75 p-4 sm:items-center sm:justify-center"><div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950 p-5 shadow-2xl"><div className="flex items-center justify-between gap-3"><h2 className="text-xl font-black">{title}</h2><button onClick={onClose} className="rounded-xl bg-white/10 px-3 py-2 text-sm font-bold">閉じる</button></div><div className="mt-4">{children}</div></div></div>; }
