"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AnySnapshot = {
  memos?: Array<{ id: string; content?: string; created_at: string; image_url?: string | null }>;
  todos?: Array<{ id: string; title: string; done: boolean; priority?: string | null; due_date?: string | null; due_time?: string | null; created_at: string }>;
  events?: Array<{ id: string; title: string; event_date: string; start_time?: string | null; note?: string | null; created_at?: string }>;
  diaries?: Array<{ id: string; entry_date: string; mood?: string | null; title?: string | null; content?: string; created_at: string }>;
  budget?: Array<{ id: string; spend_date: string; type: "income" | "expense" | "charge"; category: string; amount: number; memo?: string | null; created_at: string }>;
  routines?: Array<{ id: string; title: string; routine_time?: string | null; active?: boolean | null; created_at: string }>;
  routineChecks?: Array<{ id: string; routine_id: string; check_date: string; created_at: string }>;
  coffee?: Array<{ id: string; drink_date: string; coffee_name?: string; caffeine_mg?: number; created_at: string }>;
};

type Props = {
  snapshot: AnySnapshot | null;
  setPage?: (page: any) => void;
  refreshSnapshot?: (reason?: string) => Promise<void> | void;
};

type RouteKind = "calendar" | "todo" | "budget" | "diary" | "memo" | "fitness" | "inbox";

type RouteDraft = {
  kind: RouteKind;
  title: string;
  date: string;
  time: string;
  amount: number;
  category: string;
  note: string;
  confidence: "high" | "middle" | "low";
  reason: string;
};

type InboxItem = RouteDraft & {
  id: string;
  raw: string;
  createdAt: string;
};

type LifeState = {
  level: number;
  exp: number;
  totalExp: number;
  gachaTickets: number;
  readingMinutes: number;
  readingGachaPoints: number;
  stats: Record<string, number>;
  prizes: Array<{ id: string; label: string; type: string; createdAt: string }>;
  logs: string[];
};

const XP_KEY = "life-command-xp-v65";
const INBOX_KEY = "life-unprocessed-inbox-v67";
const HISTORY_KEY = "life-action-history-v69";
const SOFT_TRASH_KEY = "life-soft-trash-v69";
const FITNESS_KEY = "life-fitness-lite-v67";

function PanelCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[1.6rem] border border-white/10 bg-black/28 p-4 shadow-xl backdrop-blur-xl ${className}`}>
      {children}
    </section>
  );
}

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(base: string, days: number) {
  const d = new Date(`${base}T00:00:00`);
  d.setDate(d.getDate() + days);
  return todayKey(d);
}

function weekStart(date = todayKey()) {
  const d = new Date(`${date}T00:00:00`);
  d.setDate(d.getDate() - d.getDay());
  return todayKey(d);
}

function yen(value: number) {
  return new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(value || 0);
}

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function defaultLifeState(): LifeState {
  return {
    level: 1,
    exp: 0,
    totalExp: 0,
    gachaTickets: 0,
    readingMinutes: 0,
    readingGachaPoints: 0,
    stats: { action: 0, continuity: 0, organize: 0, money: 0, learning: 0, body: 0 },
    prizes: [],
    logs: [],
  };
}

function nextLevelExp(level: number) {
  return 80 + Math.max(0, level - 1) * 28;
}

function getLifeState() {
  const current = readLocal<LifeState>(XP_KEY, defaultLifeState());
  return { ...defaultLifeState(), ...current, stats: { ...defaultLifeState().stats, ...(current.stats || {}) } };
}

function saveLifeState(state: LifeState) {
  writeLocal(XP_KEY, { ...state, logs: state.logs.slice(0, 80), prizes: state.prizes.slice(0, 80) });
}

function writeHistory(type: string, title: string, payload?: unknown) {
  const list = readLocal<Array<{ id: string; type: string; title: string; payload?: unknown; createdAt: string }>>(HISTORY_KEY, []);
  writeLocal(HISTORY_KEY, [{ id: uid("hist"), type, title, payload, createdAt: new Date().toISOString() }, ...list].slice(0, 300));
}

function addXp(amount: number, label: string, stat = "action") {
  const state = getLifeState();
  let exp = state.exp + amount;
  let level = state.level;
  let tickets = state.gachaTickets;
  let leveled = 0;

  while (exp >= nextLevelExp(level)) {
    exp -= nextLevelExp(level);
    level += 1;
    tickets += 1;
    leveled += 1;
  }

  const next = {
    ...state,
    level,
    exp,
    totalExp: state.totalExp + amount,
    gachaTickets: tickets,
    stats: { ...state.stats, [stat]: Number(state.stats[stat] || 0) + amount },
    logs: [`+${amount}XP ${label}${leveled ? ` / Lv.${level}へ上昇 / ガチャ券+${leveled}` : ""}`, ...state.logs],
  };
  saveLifeState(next);
  window.dispatchEvent(new CustomEvent("life-command-xp-updated", { detail: next }));
  writeHistory("xp", label, { amount, stat });
  return next;
}

function parseDateText(text: string) {
  const now = todayKey();
  if (/明日/.test(text)) return addDays(now, 1);
  if (/明後日|あさって/.test(text)) return addDays(now, 2);
  if (/昨日/.test(text)) return addDays(now, -1);
  if (/今日|本日/.test(text)) return now;
  const md = text.match(/(\d{1,2})[\/月](\d{1,2})日?/);
  if (md) {
    const year = new Date().getFullYear();
    return `${year}-${String(Number(md[1])).padStart(2, "0")}-${String(Number(md[2])).padStart(2, "0")}`;
  }
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const w = text.match(/(来週)?([日月火水木金土])曜?/);
  if (w) {
    const target = weekdays.indexOf(w[2]);
    const today = new Date();
    let diff = target - today.getDay();
    if (diff <= 0) diff += 7;
    if (w[1]) diff += 7;
    return addDays(now, diff);
  }
  return now;
}

function parseTimeText(text: string) {
  const colon = text.match(/(\d{1,2})[:：](\d{2})/);
  if (colon) return `${String(Number(colon[1])).padStart(2, "0")}:${String(Number(colon[2])).padStart(2, "0")}`;
  const jp = text.match(/(午前|午後)?\s*(\d{1,2})\s*時\s*(\d{1,2})?\s*分?/);
  if (jp) {
    let hour = Number(jp[2]);
    const minute = jp[3] ? Number(jp[3]) : 0;
    if (jp[1] === "午後" && hour < 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }
  if (/朝|起床|午前/.test(text)) return "08:00";
  if (/昼|ランチ|昼食|昼ごはん/.test(text)) return "12:00";
  if (/夕方|退勤/.test(text)) return "17:30";
  if (/夜|夕食|晩ごはん/.test(text)) return "19:00";
  if (/寝る|就寝/.test(text)) return "23:00";
  return "";
}

function parseAmount(text: string) {
  const match = text.match(/([0-9０-９,，]+)\s*円?/);
  if (!match) return 0;
  const half = match[1].replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  return Number(half.replace(/[,，]/g, "")) || 0;
}

function detectKind(text: string): RouteKind {
  if (/円|支出|収入|買った|払った|使った|家計|チャージ/.test(text)) return "budget";
  if (/ジム|筋トレ|ラン|運動|プロテイン|体重|体脂肪|睡眠|疲労|膝|痛み/.test(text)) return "fitness";
  if (/予定|行く|会議|面談|予約|通院|出勤|午前|午後|\d{1,2}[:：]\d{2}|\d{1,2}時/.test(text)) return "calendar";
  if (/TODO|タスク|やる|買う|確認|修正|作る|提出|返信|連絡/.test(text)) return "todo";
  if (/気分|不安|嬉しい|しんどい|日記|振り返り|眠い|ストレス/.test(text)) return "diary";
  if (text.length < 4) return "inbox";
  return "memo";
}

function routeText(text: string): RouteDraft {
  const clean = text.trim();
  const kind = detectKind(clean);
  const amount = parseAmount(clean);
  const date = parseDateText(clean);
  const time = parseTimeText(clean);
  const title = clean.replace(/^(今日|明日|明後日|あさって|昨日)/, "").replace(/\s+/g, " ").slice(0, 90) || "無題";
  const category =
    kind === "budget" ? (/プロテイン|ジム|筋トレ|健康/.test(clean) ? "筋トレ/健康" : /交通|電車|バス/.test(clean) ? "交通費" : /本|学習/.test(clean) ? "本/学習" : /カフェ|コーヒー/.test(clean) ? "カフェ" : "その他") :
    kind === "fitness" ? "体づくり" :
    kind === "diary" ? "Diary" :
    kind === "calendar" ? "予定" :
    kind === "todo" ? "TODO" :
    "メモ";
  const confidence: RouteDraft["confidence"] = kind === "inbox" ? "low" : (kind === "budget" && !amount) ? "middle" : "high";
  return { kind, title, date, time, amount, category, note: clean, confidence, reason: `${category}として判定` };
}

async function routeWithAiFallback(text: string): Promise<RouteDraft> {
  const fallback = routeText(text);
  try {
    const res = await fetch("/api/life/route-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, fallback, today: todayKey() }),
    });
    const json = await res.json().catch(() => null);
    if (json?.ok && json?.draft?.kind) return { ...fallback, ...json.draft };
  } catch {
    // fallback
  }
  return fallback;
}

async function executeDraft(draft: RouteDraft, refreshSnapshot?: Props["refreshSnapshot"]) {
  if (draft.kind === "calendar") {
    const { error } = await supabase.from("events").insert({ title: draft.title, event_date: draft.date || todayKey(), start_time: draft.time || null, note: draft.note || null });
    if (error) throw error;
    addXp(8, "予定追加", "action");
    writeHistory("calendar", draft.title, draft);
  } else if (draft.kind === "todo") {
    const { error } = await supabase.from("todos").insert({ title: draft.title, done: false, priority: "normal", due_date: draft.date || todayKey(), due_time: draft.time || null });
    if (error) throw error;
    addXp(5, "TODO追加", "organize");
    writeHistory("todo", draft.title, draft);
  } else if (draft.kind === "budget") {
    if (!draft.amount) throw new Error("金額が読み取れなかったので未処理Inboxに送ってね。");
    const { error } = await supabase.from("budget_logs").insert({ spend_date: draft.date || todayKey(), type: /収入|入金|給料|給与/.test(draft.note) ? "income" : "expense", category: draft.category || "その他", amount: draft.amount, wallet: "財布", payment_method: "財布", memo: draft.note });
    if (error) throw error;
    addXp(5, "家計簿記録", "money");
    writeHistory("budget", `${draft.category} ${yen(draft.amount)}`, draft);
  } else if (draft.kind === "diary") {
    const { error } = await supabase.from("diaries").insert({ entry_date: draft.date || todayKey(), mood: /不安|しんどい|ストレス|疲/.test(draft.note) ? "low" : "neutral", title: draft.title.slice(0, 30), content: draft.note });
    if (error) throw error;
    addXp(8, "Diary記録", "learning");
    writeHistory("diary", draft.title, draft);
  } else if (draft.kind === "memo") {
    const { error } = await supabase.from("memos").insert({ content: draft.note });
    if (error) throw error;
    addXp(3, "メモ作成", "organize");
    writeHistory("memo", draft.title, draft);
  } else if (draft.kind === "fitness") {
    const list = readLocal<Array<RouteDraft & { id: string; createdAt: string }>>(FITNESS_KEY, []);
    writeLocal(FITNESS_KEY, [{ ...draft, id: uid("fit"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
    addXp(8, "体づくりログ", "body");
    writeHistory("fitness", draft.title, draft);
  } else {
    const list = readLocal<InboxItem[]>(INBOX_KEY, []);
    writeLocal(INBOX_KEY, [{ ...draft, id: uid("inbox"), raw: draft.note, createdAt: new Date().toISOString() }, ...list].slice(0, 200));
    writeHistory("inbox", draft.title, draft);
  }
  await Promise.resolve(refreshSnapshot?.("v65-69更新"));
}

function buildDaily(snapshot: AnySnapshot | null) {
  const today = todayKey();
  const todos = snapshot?.todos || [];
  const events = snapshot?.events || [];
  const memos = snapshot?.memos || [];
  const budget = snapshot?.budget || [];
  const todayEvents = events.filter((e) => e.event_date === today).sort((a, b) => String(a.start_time || "99:99").localeCompare(String(b.start_time || "99:99")));
  const todayTodos = todos.filter((t) => !t.done && (t.due_date || today) === today);
  const overdueTodos = todos.filter((t) => !t.done && t.due_date && t.due_date < today);
  const todayBudget = budget.filter((b) => b.spend_date === today);
  const todayExpense = todayBudget.filter((b) => b.type === "expense").reduce((s, b) => s + Number(b.amount || 0), 0);
  const todayMemos = memos.filter((m) => String(m.created_at || "").slice(0, 10) === today);
  const priorities = [
    ...overdueTodos.slice(0, 2).map((t) => ({ label: `期限切れTODO: ${t.title}`, page: "todos" })),
    ...todayEvents.slice(0, 3).map((e) => ({ label: `${e.start_time || "終日"} ${e.title}`, page: "calendar" })),
    ...todayTodos.slice(0, 3).map((t) => ({ label: `${t.due_time || "いつでも"} ${t.title}`, page: "todos" })),
  ].slice(0, 6);
  return { todayEvents, todayTodos, overdueTodos, todayExpense, todayMemos, priorities };
}

export default function LifeCommandExpansionV65_69({ snapshot, setPage, refreshSnapshot }: Props) {
  const [input, setInput] = useState("");
  const [draft, setDraft] = useState<RouteDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tick, setTick] = useState(0);
  const daily = useMemo(() => buildDaily(snapshot), [snapshot, tick]);

  const secretary = daily.overdueTodos.length
    ? `期限切れTODOが${daily.overdueTodos.length}件あるよ。今日は1件だけでも倒せたら十分。`
    : daily.todayEvents.length
      ? `今日は予定が${daily.todayEvents.length}件。最初の予定は「${daily.todayEvents[0].title}」。`
      : daily.todayTodos.length
        ? `今日はTODOが${daily.todayTodos.length}件。軽いものから始めると流れに乗れそう。`
        : "今日は比較的空いてる。メモ整理か体づくりログを入れるとLife XPを伸ばせるよ。";

  const analyze = async () => {
    if (!input.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const next = await routeWithAiFallback(input.trim());
      setDraft(next);
      setMessage(`「${next.kind}」として振り分け候補を作ったよ。`);
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      await executeDraft(draft, refreshSnapshot);
      setInput("");
      setDraft(null);
      setMessage("保存したよ。必要なページにも反映されるはず。");
      setTick((v) => v + 1);
    } catch (error) {
      const list = readLocal<InboxItem[]>(INBOX_KEY, []);
      writeLocal(INBOX_KEY, [{ ...draft, id: uid("inbox"), raw: input, createdAt: new Date().toISOString() }, ...list].slice(0, 200));
      setMessage(error instanceof Error ? `保存に失敗したから未処理Inboxに送ったよ: ${error.message}` : "保存に失敗したから未処理Inboxに送ったよ。");
    } finally {
      setBusy(false);
    }
  };

  const addUnreadInbox = () => {
    const next = routeText(input || "未処理メモ");
    const list = readLocal<InboxItem[]>(INBOX_KEY, []);
    writeLocal(INBOX_KEY, [{ ...next, id: uid("inbox"), raw: input, createdAt: new Date().toISOString() }, ...list].slice(0, 200));
    setInput("");
    setMessage("未処理Inboxに入れたよ。あとで確認できる。");
    setTick((v) => v + 1);
  };

  return (
    <div className="life-command-expansion-v65 space-y-4">
      <PanelCard className="border-cyan-200/20 bg-gradient-to-br from-cyan-400/15 via-indigo-400/10 to-fuchsia-400/15">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.28em] text-cyan-100/65">DAILY COMMAND</p>
            <h2 className="mt-1 text-3xl font-black text-white">今日の司令室</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">カレンダー・TODO・メモ・家計簿から、今日の行動だけをまとめるホーム司令室。</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{daily.todayEvents.length}</p><p className="text-xs text-white/50">今日予定</p></div>
            <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{daily.todayTodos.length}</p><p className="text-xs text-white/50">今日TODO</p></div>
            <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{daily.todayMemos.length}</p><p className="text-xs text-white/50">今日メモ</p></div>
            <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{yen(daily.todayExpense)}</p><p className="text-xs text-white/50">今日支出</p></div>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-3xl bg-black/20 p-4">
            <h3 className="text-lg font-black">今日の優先順位</h3>
            <div className="mt-3 grid gap-2">
              {daily.priorities.length ? daily.priorities.map((item, index) => (
                <button key={`${item.label}-${index}`} onClick={() => setPage?.(item.page)} className="rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-black text-white transition hover:bg-white/15">{index + 1}. {item.label}</button>
              )) : <p className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/60">今日の優先タスクはまだ少なめ。Quick Addで1つだけ入れられるよ。</p>}
            </div>
          </div>
          <div className="rounded-3xl bg-sky-300/10 p-4">
            <h3 className="text-lg font-black">案内係AI</h3>
            <p className="mt-3 rounded-2xl bg-black/25 p-4 text-sm leading-7 text-white/75">{secretary}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setPage?.("calendar")} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">カレンダーへ</button>
              <button onClick={() => setPage?.("todos")} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">TODOへ</button>
              <button onClick={() => setPage?.("lifescore")} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">Life Lv</button>
            </div>
          </div>
        </div>
      </PanelCard>

      <PanelCard>
        <p className="text-xs font-black tracking-[0.25em] text-emerald-100/60">AUTO ROUTER</p>
        <h3 className="mt-1 text-2xl font-black">一言で自動振り分け</h3>
        <p className="mt-1 text-sm text-white/55">例：明日8:30ジム / 昼に650円使った / このバグ直す / 今日コーヒー飲みすぎて不安</p>
        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto_auto]">
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="ここに一言・二言で入力" className="min-h-24 rounded-3xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-white/35" />
          <button onClick={analyze} disabled={busy || !input.trim()} className="rounded-3xl bg-cyan-300/20 px-5 py-4 font-black text-white disabled:opacity-50">AI分類</button>
          <button onClick={addUnreadInbox} disabled={!input.trim()} className="rounded-3xl bg-white/10 px-5 py-4 font-black text-white disabled:opacity-50">未処理へ</button>
        </div>
        {draft && (
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <label className="grid gap-1 text-xs font-black text-white/55">分類<select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as RouteKind })} className="rounded-2xl bg-slate-950 p-3 text-white"><option value="calendar">カレンダー</option><option value="todo">TODO</option><option value="budget">家計簿</option><option value="diary">Diary</option><option value="memo">メモ</option><option value="fitness">体づくり</option><option value="inbox">未処理</option></select></label>
              <label className="grid gap-1 text-xs font-black text-white/55">日付<input value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
              <label className="grid gap-1 text-xs font-black text-white/55">時刻<input value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
              <label className="grid gap-1 text-xs font-black text-white/55">金額<input value={draft.amount || ""} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value || 0) })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
              <label className="grid gap-1 text-xs font-black text-white/55">カテゴリ<input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
            </div>
            <label className="mt-3 grid gap-1 text-xs font-black text-white/55">タイトル<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
            <p className="mt-2 text-sm text-white/55">判定：{draft.reason} / 信頼度 {draft.confidence}</p>
            <button onClick={saveDraft} disabled={busy} className="mt-3 rounded-2xl bg-emerald-300/20 px-4 py-3 font-black text-emerald-50 disabled:opacity-50">この内容で保存</button>
          </div>
        )}
        {message && <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white/70">{message}</p>}
      </PanelCard>

      <div className="grid gap-4 xl:grid-cols-2">
        <LifeLevelProV66 snapshot={snapshot} compact onRefresh={() => setTick((v) => v + 1)} />
        <FitnessLiteV67 />
      </div>
    </div>
  );
}

export function LifeLevelProV66({ snapshot, compact = false, onRefresh }: { snapshot?: AnySnapshot | null; compact?: boolean; onRefresh?: () => void; setPage?: (page: any) => void; refreshSnapshot?: (reason?: string) => Promise<void> | void }) {
  const [state, setState] = useState<LifeState>(() => getLifeState());
  const [minutes, setMinutes] = useState(10);
  const [gachaOpen, setGachaOpen] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [prize, setPrize] = useState<{ label: string; type: string } | null>(null);
  const ratio = Math.round((state.exp / nextLevelExp(state.level)) * 100);

  const refresh = () => {
    const next = getLifeState();
    setState(next);
    onRefresh?.();
  };

  const addReading = () => {
    const ticketGain = Math.floor((state.readingMinutes + minutes) / 10) - Math.floor(state.readingMinutes / 10);
    const next = { ...state, readingMinutes: state.readingMinutes + minutes, readingGachaPoints: state.readingGachaPoints + ticketGain, logs: [`音読 ${minutes}分 / 音読ガチャP +${ticketGain}`, ...state.logs] };
    saveLifeState(next);
    addXp(Math.max(3, Math.floor(minutes / 2)), "音読", "learning");
    refresh();
  };

  const draw = () => {
    const available = state.gachaTickets + state.readingGachaPoints;
    if (!available) return;
    setGachaOpen(true);
    setRolling(true);
    setPrize(null);
    window.setTimeout(() => {
      const pool = [
        { type: "名言", label: "自己を変革できない者に、世界を覆すことなど出来ない！" },
        { type: "名言", label: "未来を信じて、今日を全力で生きる。" },
        { type: "バッジ", label: "朝の一歩バッジ" },
        { type: "バッジ", label: "記録の剣士バッジ" },
        { type: "トロフィー", label: "生活OSトロフィー" },
        { type: "ハズレ", label: "今日は準備運動。次で当てよう。" },
      ];
      const picked = pool[Math.floor(Math.random() * pool.length)];
      const next: LifeState = {
        ...state,
        gachaTickets: state.gachaTickets > 0 ? state.gachaTickets - 1 : state.gachaTickets,
        readingGachaPoints: state.gachaTickets > 0 ? state.readingGachaPoints : Math.max(0, state.readingGachaPoints - 1),
        prizes: [{ id: uid("prize"), ...picked, createdAt: new Date().toISOString() }, ...state.prizes],
        logs: [`ガチャ: ${picked.type}「${picked.label}」`, ...state.logs],
      };
      saveLifeState(next);
      setState(next);
      setPrize(picked);
      setRolling(false);
    }, 1800);
  };

  return (
    <PanelCard className="bg-gradient-to-br from-purple-400/10 via-sky-400/10 to-emerald-400/10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-purple-100/60">LIFE LEVEL</p>
          <h2 className="mt-1 text-2xl font-black">Life Lv.{state.level}</h2>
          <p className="mt-1 text-sm text-white/55">TODO・Diary・習慣・音読・家計簿・予定達成で育つ生活RPG。</p>
        </div>
        <button onClick={refresh} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">更新</button>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-purple-300 to-emerald-300" style={{ width: `${Math.min(100, ratio)}%` }} /></div>
      <p className="mt-2 text-sm text-white/55">{state.exp}/{nextLevelExp(state.level)} XP / Total {state.totalExp}XP</p>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {Object.entries(state.stats).map(([key, value]) => <div key={key} className="rounded-2xl bg-black/25 p-3"><p className="text-lg font-black">{value}</p><p className="text-[11px] text-white/45">{key}</p></div>)}
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value || 10))} className="rounded-2xl bg-black/30 p-3 text-white" />
        <button onClick={addReading} className="rounded-2xl bg-white/10 px-4 py-3 font-black">音読を記録</button>
        <button onClick={draw} className="rounded-2xl bg-fuchsia-300/20 px-4 py-3 font-black text-fuchsia-50">ガチャ券 {state.gachaTickets + state.readingGachaPoints}</button>
      </div>
      {!compact && <div className="mt-4 grid gap-2"><p className="text-sm font-black text-white/60">最近のログ</p>{state.logs.slice(0, 8).map((log, i) => <p key={`${log}-${i}`} className="rounded-2xl bg-white/8 px-3 py-2 text-sm text-white/65">{log}</p>)}</div>}
      {gachaOpen && <div className="fixed inset-0 z-[99999] grid place-items-center bg-black/70 p-4 backdrop-blur-md" onClick={() => !rolling && setGachaOpen(false)}><div className="w-full max-w-md rounded-[2rem] border border-white/15 bg-slate-950 p-6 text-center shadow-2xl">{rolling ? <div className="py-10"><div className="mx-auto h-24 w-24 animate-spin rounded-full border-8 border-cyan-300 border-t-fuchsia-300" /><p className="mt-6 text-xl font-black">ガチャ演出中...</p></div> : <div className="py-8"><p className="text-sm font-black tracking-[0.25em] text-cyan-100/60">{prize?.type}</p><h3 className="mt-4 text-2xl font-black">{prize?.label}</h3><p className="mt-4 text-sm text-white/55">タップでホームへ戻る</p></div>}</div></div>}
    </PanelCard>
  );
}

export function SmartQuestionSearchV68({ snapshot }: Props) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const ask = () => {
    const q = question.trim();
    const today = todayKey();
    const start = weekStart(today);
    const lastWeekStart = addDays(start, -7);
    const lastWeekEnd = addDays(start, -1);
    const budget = snapshot?.budget || [];
    const todos = snapshot?.todos || [];
    const memos = snapshot?.memos || [];
    const events = snapshot?.events || [];
    const diaries = snapshot?.diaries || [];
    if (/先週.*支出|支出.*先週/.test(q)) {
      const rows = budget.filter((b) => b.type === "expense" && b.spend_date >= lastWeekStart && b.spend_date <= lastWeekEnd);
      const sum = rows.reduce((s, b) => s + Number(b.amount || 0), 0);
      setAnswer(`先週の支出は ${yen(sum)}。件数は${rows.length}件。多いカテゴリは ${topText(rows.map((b) => b.category))}。`);
    } else if (/今月.*(いくら|支出|使)/.test(q)) {
      const month = today.slice(0, 7);
      const rows = budget.filter((b) => b.type === "expense" && b.spend_date.startsWith(month));
      const sum = rows.reduce((s, b) => s + Number(b.amount || 0), 0);
      setAnswer(`今月の支出は ${yen(sum)}。件数は${rows.length}件。今日までの記録ベースだよ。`);
    } else if (/ジム|筋トレ|運動/.test(q)) {
      const hay = [...events.map((e) => `${e.event_date} ${e.title}`), ...todos.map((t) => `${t.due_date || ""} ${t.title}`), ...memos.map((m) => `${m.created_at.slice(0,10)} ${m.content || ""}`)];
      const hits = hay.filter((x) => /ジム|筋トレ|運動|ラン/.test(x));
      setAnswer(`最近の体づくり関連は${hits.length}件見つかったよ。\n${hits.slice(0, 8).map((x) => `・${x}`).join("\n") || "該当なし"}`);
    } else if (/バグ|修正|不具合/.test(q)) {
      const hits = memos.filter((m) => /バグ|修正|不具合|エラー|直/.test(m.content || ""));
      setAnswer(`バグ/修正系メモは${hits.length}件。\n${hits.slice(0, 8).map((m) => `・${m.created_at.slice(0,10)} ${String(m.content || "").slice(0, 80)}`).join("\n") || "該当なし"}`);
    } else if (/未完了|重要/.test(q)) {
      const hits = todos.filter((t) => !t.done).sort((a, b) => String(b.priority || "").localeCompare(String(a.priority || "")));
      setAnswer(`未完了TODOは${hits.length}件。\n${hits.slice(0, 10).map((t) => `・${t.due_date || "日付なし"} ${t.due_time || ""} ${t.title}`).join("\n")}`);
    } else if (/気分|落ち|不安|しんど/.test(q)) {
      const hits = diaries.filter((d) => /low|不安|しんど|疲|ストレス|落ち/.test(`${d.mood || ""} ${d.title || ""} ${d.content || ""}`));
      setAnswer(`気分が落ちた可能性のあるDiaryは${hits.length}件。\n${hits.slice(0, 6).map((d) => `・${d.entry_date} ${d.title || String(d.content || "").slice(0, 50)}`).join("\n") || "該当なし"}`);
    } else {
      setAnswer(`検索ヒント：\n・先週の支出を教えて\n・今月いくら使った？\n・最近ジムに何回行った？\n・先週メモしたバグ一覧を出して\n・未完了TODOで重要そうなのは？\n・最近気分が落ちた日の共通点は？`);
    }
    writeHistory("ai-search", q);
  };
  return <PanelCard className="border-sky-200/20 bg-gradient-to-br from-sky-400/10 to-indigo-400/10"><p className="text-xs font-black tracking-[0.25em] text-sky-100/60">QUESTION SEARCH</p><h2 className="mt-1 text-2xl font-black">質問回答型AI検索</h2><div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto]"><input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="例：先週の支出を教えて" className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-white/35" /><button onClick={ask} className="rounded-2xl bg-white/10 px-5 py-4 font-black">答える</button></div>{answer && <pre className="mt-4 whitespace-pre-wrap rounded-3xl bg-black/25 p-4 text-sm leading-7 text-white/75">{answer}</pre>}</PanelCard>;
}

function topText(items: string[]) {
  const counts = items.reduce((acc: Record<string, number>, x) => ({ ...acc, [x || "未分類"]: (acc[x || "未分類"] || 0) + 1 }), {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k}${v}件`).join("、") || "なし";
}

export function WeeklyReviewV69({ snapshot }: Props) {
  const today = todayKey();
  const start = weekStart(today);
  const budget = (snapshot?.budget || []).filter((b) => b.spend_date >= start && b.spend_date <= today);
  const todos = (snapshot?.todos || []).filter((t) => String(t.created_at || "").slice(0, 10) >= start || (t.due_date || "") >= start);
  const done = todos.filter((t) => t.done).length;
  const memos = (snapshot?.memos || []).filter((m) => String(m.created_at || "").slice(0, 10) >= start);
  const events = (snapshot?.events || []).filter((e) => e.event_date >= start && e.event_date <= today);
  const expense = budget.filter((b) => b.type === "expense").reduce((s, b) => s + Number(b.amount || 0), 0);
  const themes = topText(memos.flatMap((m) => String(m.content || "").match(/筋トレ|UI|バグ|睡眠|家計|カレンダー|TODO|メモ|ジム/g) || []));
  const report = `今週のしゅうやくん\nTODO完了：${done}/${todos.length}件\nメモ：${memos.length}件\n予定：${events.length}件\n支出：${yen(expense)}\nよく出たテーマ：${themes}\n来週の注意：予定とTODOを朝に1回だけ確認すると安定しそう。`;
  const save = () => {
    const list = readLocal<Array<{ id: string; report: string; createdAt: string }>>("life-weekly-reports-v69", []);
    writeLocal("life-weekly-reports-v69", [{ id: uid("report"), report, createdAt: new Date().toISOString() }, ...list].slice(0, 80));
    addXp(10, "週次レポート保存", "learning");
  };
  return <PanelCard className="bg-gradient-to-br from-emerald-400/10 to-cyan-400/10"><p className="text-xs font-black tracking-[0.25em] text-emerald-100/60">WEEKLY REVIEW</p><h2 className="mt-1 text-2xl font-black">振り返りレポート</h2><pre className="mt-4 whitespace-pre-wrap rounded-3xl bg-black/25 p-4 text-sm leading-7 text-white/75">{report}</pre><button onClick={save} className="mt-3 rounded-2xl bg-white/10 px-4 py-3 font-black">このレポートを保存</button></PanelCard>;
}

export function TrashHistoryV69() {
  const [trash, setTrash] = useState(() => readLocal<Array<any>>(SOFT_TRASH_KEY, []));
  const [history, setHistory] = useState(() => readLocal<Array<any>>(HISTORY_KEY, []));
  const markRestored = (id: string) => {
    const next = trash.map((item) => item.id === id ? { ...item, restored: true } : item);
    writeLocal(SOFT_TRASH_KEY, next);
    setTrash(next);
    writeHistory("restore-mark", id);
  };
  const clearHistory = () => {
    writeLocal(HISTORY_KEY, []);
    setHistory([]);
  };
  return <div className="space-y-4"><PanelCard><p className="text-xs font-black tracking-[0.25em] text-rose-100/60">UNDO / HISTORY</p><h2 className="mt-1 text-2xl font-black">操作履歴・ゴミ箱</h2><p className="mt-1 text-sm text-white/55">v65以降の追加・分類・XP・保存操作を記録。削除前に退避したものもここに残せるよ。</p></PanelCard><div className="grid gap-4 lg:grid-cols-2"><PanelCard><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-black">操作履歴</h3><button onClick={clearHistory} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">履歴クリア</button></div><div className="mt-3 grid gap-2">{history.slice(0, 30).map((item) => <p key={item.id} className="rounded-2xl bg-white/8 px-3 py-2 text-sm text-white/65">{String(item.createdAt).slice(0, 16)} / {item.type} / {item.title}</p>)}{!history.length && <p className="text-sm text-white/50">履歴はまだないよ。</p>}</div></PanelCard><PanelCard><h3 className="text-xl font-black">ソフトゴミ箱</h3><div className="mt-3 grid gap-2">{trash.slice(0, 30).map((item) => <div key={item.id} className="rounded-2xl bg-white/8 p-3 text-sm text-white/65"><p className="font-black">{item.type} / {item.title}</p><p className="mt-1 text-xs text-white/40">{String(item.createdAt).slice(0, 16)}</p><button onClick={() => markRestored(item.id)} className="mt-2 rounded-xl bg-emerald-300/15 px-3 py-2 text-xs font-black text-emerald-50">{item.restored ? "復元済みマーク" : "復元済みにする"}</button></div>)}{!trash.length && <p className="text-sm text-white/50">ゴミ箱はまだ空だよ。</p>}</div></PanelCard></div></div>;
}

function FitnessLiteV67() {
  const [items, setItems] = useState(() => readLocal<Array<RouteDraft & { id: string; createdAt: string }>>(FITNESS_KEY, []));
  const [text, setText] = useState("");
  const save = () => {
    if (!text.trim()) return;
    const draft = routeText(text);
    const next = [{ ...draft, kind: "fitness" as RouteKind, id: uid("fit"), createdAt: new Date().toISOString() }, ...items].slice(0, 120);
    writeLocal(FITNESS_KEY, next);
    setItems(next);
    setText("");
    addXp(8, "体づくりログ", "body");
  };
  return <PanelCard className="bg-gradient-to-br from-orange-400/10 to-emerald-400/10"><p className="text-xs font-black tracking-[0.25em] text-orange-100/60">BODY LINK</p><h2 className="mt-1 text-2xl font-black">体づくり連携</h2><p className="mt-1 text-sm text-white/55">ジム・筋トレ・睡眠・疲労・膝の痛みをLife OS側にも軽く記録。</p><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="例：膝の痛み少し / ジム胸トレ / 睡眠6時間" className="rounded-2xl bg-black/30 p-3 text-white outline-none placeholder:text-white/35" /><button onClick={save} className="rounded-2xl bg-white/10 px-4 py-3 font-black">記録</button></div><div className="mt-3 grid gap-2">{items.slice(0, 5).map((item) => <p key={item.id} className="rounded-2xl bg-white/8 px-3 py-2 text-sm text-white/65">{String(item.createdAt).slice(0, 10)} / {item.title}</p>)}</div></PanelCard>;
}
