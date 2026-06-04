"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type SnapshotLike = {
  memos?: Array<{ id: string; content?: string; created_at: string; image_url?: string | null }>;
  todos?: Array<{ id: string; title: string; done: boolean; priority?: string | null; due_date?: string | null; due_time?: string | null; created_at: string }>;
  events?: Array<{ id: string; title: string; event_date: string; start_time?: string | null; note?: string | null; created_at?: string }>;
  diaries?: Array<{ id: string; entry_date: string; mood?: string | null; title?: string | null; content?: string; created_at: string }>;
  budget?: Array<{ id: string; spend_date: string; type: "income" | "expense" | "charge"; category: string; amount: number; memo?: string | null; created_at: string }>;
};

type Props = {
  snapshot: SnapshotLike | null;
  setPage?: (page: any) => void;
  refreshSnapshot?: (reason?: string) => Promise<void> | void;
};

type RouteKind = "calendar" | "todo" | "budget" | "diary" | "memo" | "body" | "belief" | "future" | "idea" | "inbox";

type RouteDraft = {
  kind: RouteKind;
  title: string;
  date: string;
  time: string;
  amount: number;
  category: string;
  note: string;
  confidence: "high" | "middle" | "low";
};

const INBOX_KEYS = ["life-v70-unprocessed-memo-inbox", "life-unprocessed-inbox-v67"];
const FUTURE_KEY = "life-v70-future-self-memos";
const MEMORY_KEY = "life-v70-memory-cards";
const BODY_KEY = "life-v70-windhunt-body-logs";

function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(dateKey: string, days: number) {
  const d = new Date(`${dateKey}T00:00:00`);
  d.setDate(d.getDate() + days);
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

function parseDate(text: string) {
  const now = todayKey();
  if (/明後日|あさって/.test(text)) return addDays(now, 2);
  if (/明日/.test(text)) return addDays(now, 1);
  if (/昨日/.test(text)) return addDays(now, -1);
  if (/今日|本日/.test(text)) return now;

  const ymd = text.match(/(20\d{2})[-\/年](\d{1,2})[-\/月](\d{1,2})日?/);
  if (ymd) return `${ymd[1]}-${String(Number(ymd[2])).padStart(2, "0")}-${String(Number(ymd[3])).padStart(2, "0")}`;

  const md = text.match(/(\d{1,2})[\/月](\d{1,2})日?/);
  if (md) {
    const y = new Date().getFullYear();
    return `${y}-${String(Number(md[1])).padStart(2, "0")}-${String(Number(md[2])).padStart(2, "0")}`;
  }

  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const w = text.match(/(来週)?([日月火水木金土])曜?/);
  if (w) {
    const target = weekdays.indexOf(w[2]);
    const d = new Date();
    let diff = target - d.getDay();
    if (diff <= 0) diff += 7;
    if (w[1]) diff += 7;
    return addDays(now, diff);
  }

  return now;
}

function parseTime(text: string) {
  const colon = text.match(/(\d{1,2})[:：](\d{2})/);
  if (colon) return `${String(Number(colon[1])).padStart(2, "0")}:${String(Number(colon[2])).padStart(2, "0")}`;

  const jp = text.match(/(午前|午後)?\s*(\d{1,2})\s*時\s*(\d{1,2})?\s*分?/);
  if (jp) {
    let h = Number(jp[2]);
    const m = jp[3] ? Number(jp[3]) : 0;
    if (jp[1] === "午後" && h < 12) h += 12;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  if (/朝|起床|午前/.test(text)) return "08:00";
  if (/昼|ランチ|昼食|昼ごはん/.test(text)) return "12:00";
  if (/夕方|退勤/.test(text)) return "17:30";
  if (/夜|夕食|晩ごはん/.test(text)) return "19:00";
  if (/寝る|就寝/.test(text)) return "23:00";
  return "";
}

function parseAmount(text: string) {
  const m = text.match(/([0-9０-９,，]+)\s*円?/);
  if (!m) return 0;
  const half = m[1].replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0));
  return Number(half.replace(/[,，]/g, "")) || 0;
}

function detectKind(text: string): RouteKind {
  if (/未来の自分|自分へ|誕生日|クリスマス|半年後|来年|8月31日/.test(text)) return "future";
  if (/名言|信念|方針|座右の銘|自己を変革|覚悟|人生/.test(text) || /「.+」/.test(text)) return "belief";
  if (/円|支出|収入|払う|支払い|家賃|使った|買った|レシート|家計/.test(text)) return "budget";
  if (/ジム|筋トレ|ランニング|ラン|ベンチ|スクワット|腹筋|筋肉痛|プロテイン|体重|体脂肪|膝|睡眠|疲労/.test(text)) return "body";
  if (/予定|予約|行く|会議|面談|通院|出勤|午前|午後|\d{1,2}[:：]\d{2}|\d{1,2}時/.test(text)) return "calendar";
  if (/TODO|タスク|やる|確認|修正|返信|連絡|提出|作る|買う/.test(text)) return "todo";
  if (/不安|しんど|嬉しい|気分|ストレス|眠い|日記|疲れた|落ち/.test(text)) return "diary";
  if (/アイデア|機能|企画|案|作りたい/.test(text)) return "idea";
  if (text.trim().length < 4) return "inbox";
  return "memo";
}

function draftFromText(text: string): RouteDraft {
  const clean = text.trim();
  const kind = detectKind(clean);
  const amount = parseAmount(clean);
  const title = clean.replace(/^(今日|明日|明後日|あさって|昨日)/, "").replace(/\s+/g, " ").slice(0, 80) || "無題";
  const category =
    kind === "budget" ? (/家賃/.test(clean) ? "家賃" : /ジム|プロテイン|筋トレ/.test(clean) ? "筋トレ/健康" : /交通|電車|バス/.test(clean) ? "交通費" : /カフェ|コーヒー/.test(clean) ? "カフェ" : "その他") :
    kind === "body" ? "体づくり" :
    kind === "belief" ? "信念カード" :
    kind === "future" ? "未来メモ" :
    kind === "idea" ? "アイデア" :
    kind === "diary" ? "Diary" :
    kind === "calendar" ? "予定" :
    kind === "todo" ? "TODO" :
    "メモ";

  return {
    kind,
    title,
    date: parseDate(clean),
    time: parseTime(clean),
    amount,
    category,
    note: clean,
    confidence: kind === "inbox" ? "low" : kind === "budget" && !amount ? "middle" : "high",
  };
}

function countInbox() {
  return INBOX_KEYS.reduce((sum, key) => sum + readLocal<Array<unknown>>(key, []).length, 0);
}

function cleanDaily(snapshot: SnapshotLike | null) {
  const today = todayKey();
  const todos = snapshot?.todos || [];
  const events = snapshot?.events || [];
  const memos = snapshot?.memos || [];
  const budget = snapshot?.budget || [];
  const diaries = snapshot?.diaries || [];

  const todayEvents = events.filter((e) => e.event_date === today).sort((a, b) => String(a.start_time || "99:99").localeCompare(String(b.start_time || "99:99")));
  const todayTodos = todos.filter((t) => !t.done && (t.due_date || today) === today);
  const overdueTodos = todos.filter((t) => !t.done && t.due_date && t.due_date < today);
  const todayMemos = memos.filter((m) => String(m.created_at || "").slice(0, 10) === today);
  const todayExpense = budget.filter((b) => b.spend_date === today && b.type === "expense").reduce((s, b) => s + Number(b.amount || 0), 0);
  const lastDiary = diaries[0];
  const future = readLocal<Array<RouteDraft & { id: string; delivered?: boolean }>>(FUTURE_KEY, []);
  const dueFuture = future.filter((f) => !f.delivered && f.date <= today);

  const priority = [
    ...overdueTodos.slice(0, 2).map((t) => ({ label: `期限切れTODO：${t.title}`, page: "todos", tone: "rose" })),
    ...todayEvents.slice(0, 3).map((e) => ({ label: `${e.start_time || "終日"} ${e.title}`, page: "calendar", tone: "sky" })),
    ...todayTodos.slice(0, 3).map((t) => ({ label: `${t.due_time || "いつでも"} ${t.title}`, page: "todos", tone: "emerald" })),
  ].slice(0, 6);

  return { todayEvents, todayTodos, overdueTodos, todayMemos, todayExpense, priority, dueFuture, lastDiary };
}

function rescueCandidates(snapshot: SnapshotLike | null) {
  const border = addDays(todayKey(), -2);
  return (snapshot?.memos || [])
    .filter((m) => String(m.created_at || "").slice(0, 10) <= border)
    .filter((m) => /TODO|やる|予定|払う|支払い|求人|応募|修正|確認|買う|ジム|筋トレ/.test(String(m.content || "")))
    .slice(0, 5);
}

function emotionMini(snapshot: SnapshotLike | null) {
  const texts = [
    ...(snapshot?.memos || []).slice(0, 60).map((m) => m.content || ""),
    ...(snapshot?.diaries || []).slice(0, 60).map((d) => `${d.title || ""} ${d.content || ""} ${d.mood || ""}`),
  ].join("\n");
  const stress = (texts.match(/不安|しんど|ストレス|疲れ|暇|眠い|落ち/g) || []).length;
  const coffee = (texts.match(/コーヒー|カフェイン/g) || []).length;
  const movement = (texts.match(/ランニング|筋トレ|ジム|散歩|運動/g) || []).length;
  if (stress && coffee) return "ストレス系とコーヒーが同時に出てる。今日は予定を詰めすぎない方が安定しそう。";
  if (stress && movement) return "疲れと運動が同時に出てる。追い込みより回復ログが役立ちそう。";
  if (movement) return "運動ログが見えてる。体づくりの流れは続いてるよ。";
  return "感情ログはまだ薄め。メモかDiaryを少し足すと傾向が見えやすいよ。";
}

async function saveDraft(draft: RouteDraft, refreshSnapshot?: Props["refreshSnapshot"]) {
  if (draft.kind === "calendar") {
    const { error } = await supabase.from("events").insert({ title: draft.title, event_date: draft.date || todayKey(), start_time: draft.time || null, note: draft.note || null });
    if (error) throw error;
  } else if (draft.kind === "todo") {
    const { error } = await supabase.from("todos").insert({ title: draft.title, done: false, priority: "normal", due_date: draft.date || todayKey(), due_time: draft.time || null });
    if (error) throw error;
  } else if (draft.kind === "budget") {
    if (!draft.amount) throw new Error("金額が読み取れません。");
    const { error } = await supabase.from("budget_logs").insert({ spend_date: draft.date || todayKey(), type: /収入|給料|給与|入金|返金/.test(draft.note) ? "income" : "expense", category: draft.category || "その他", amount: draft.amount, wallet: "財布", payment_method: "財布", memo: draft.note });
    if (error) throw error;
  } else if (draft.kind === "diary") {
    const { error } = await supabase.from("diaries").insert({ entry_date: draft.date || todayKey(), mood: /不安|しんど|ストレス|疲|落ち/.test(draft.note) ? "low" : "neutral", title: draft.title.slice(0, 40), content: draft.note });
    if (error) throw error;
  } else if (draft.kind === "memo" || draft.kind === "idea") {
    const { error } = await supabase.from("memos").insert({ content: draft.kind === "idea" ? `💡 ${draft.note}` : draft.note });
    if (error) throw error;
  } else if (draft.kind === "body") {
    const list = readLocal<Array<RouteDraft & { id: string; createdAt: string }>>(BODY_KEY, []);
    writeLocal(BODY_KEY, [{ ...draft, id: uid("body"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
  } else if (draft.kind === "belief") {
    const list = readLocal<Array<RouteDraft & { id: string; createdAt: string }>>(MEMORY_KEY, []);
    writeLocal(MEMORY_KEY, [{ ...draft, id: uid("card"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
  } else if (draft.kind === "future") {
    const list = readLocal<Array<RouteDraft & { id: string; createdAt: string; delivered?: boolean }>>(FUTURE_KEY, []);
    writeLocal(FUTURE_KEY, [{ ...draft, id: uid("future"), createdAt: new Date().toISOString(), delivered: false }, ...list].slice(0, 200));
  } else {
    const list = readLocal<Array<RouteDraft & { id: string; createdAt: string }>>(INBOX_KEYS[0], []);
    writeLocal(INBOX_KEYS[0], [{ ...draft, id: uid("inbox"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
  }
  await Promise.resolve(refreshSnapshot?.("v71ホーム整理"));
}

function ToneBadge({ children, tone = "sky" }: { children: React.ReactNode; tone?: string }) {
  const cls =
    tone === "rose" ? "bg-rose-300/15 text-rose-50 border-rose-200/15" :
    tone === "emerald" ? "bg-emerald-300/15 text-emerald-50 border-emerald-200/15" :
    "bg-sky-300/15 text-sky-50 border-sky-200/15";
  return <span className={`rounded-2xl border px-3 py-2 text-sm font-black ${cls}`}>{children}</span>;
}

function HomeCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.55rem] border border-white/10 bg-black/25 p-4 shadow-xl backdrop-blur-xl ${className}`}>{children}</section>;
}

export default function HomeOrganizerV71({ snapshot, setPage, refreshSnapshot }: Props) {
  const [quick, setQuick] = useState("");
  const [draft, setDraft] = useState<RouteDraft | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [compactMode, setCompactMode] = useState(true);
  const daily = useMemo(() => cleanDaily(snapshot), [snapshot]);
  const rescue = useMemo(() => rescueCandidates(snapshot), [snapshot]);
  const emotion = useMemo(() => emotionMini(snapshot), [snapshot]);
  const memoryCards = readLocal<Array<RouteDraft & { id: string; createdAt: string }>>(MEMORY_KEY, []);
  const randomCard = memoryCards.length ? memoryCards[Math.floor((Date.now() / 60000) % memoryCards.length)] : null;

  const analyze = () => {
    if (!quick.trim()) return;
    const next = draftFromText(quick);
    setDraft(next);
    setMessage(`${next.category}として整理候補を作ったよ。`);
  };

  const save = async (kind?: RouteKind) => {
    const source = draft || draftFromText(quick);
    const next = { ...source, kind: kind || source.kind };
    setBusy(true);
    setMessage("");
    try {
      await saveDraft(next, refreshSnapshot);
      setQuick("");
      setDraft(null);
      setMessage(`${next.category}として保存したよ。`);
    } catch (error) {
      const list = readLocal<Array<RouteDraft & { id: string; createdAt: string }>>(INBOX_KEYS[0], []);
      writeLocal(INBOX_KEYS[0], [{ ...next, id: uid("inbox"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
      setMessage(error instanceof Error ? `保存できなかったので未処理へ送ったよ：${error.message}` : "保存できなかったので未処理へ送ったよ。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="home-organizer-v71 space-y-4">
      <HomeCard className="overflow-hidden border-cyan-200/20 bg-gradient-to-br from-sky-400/15 via-indigo-400/10 to-fuchsia-400/15">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.28em] text-cyan-100/65">CLEAN HOME v71</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.04em] text-white sm:text-4xl">
              今日だけ見ればいいホーム
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/65">
              ごちゃついた機能を「司令室・入力・確認・保管」に整理。細かいパネルは下の詳細に畳んだよ。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCompactMode((v) => !v)}
            className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white transition hover:bg-white/15"
          >
            {compactMode ? "詳細も表示" : "すっきり表示"}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button onClick={() => setPage?.("calendar")} className="rounded-3xl bg-black/25 p-3 text-left transition hover:bg-white/10">
            <p className="text-2xl font-black text-white">{daily.todayEvents.length}</p>
            <p className="text-xs font-black text-white/50">今日予定</p>
          </button>
          <button onClick={() => setPage?.("todos")} className="rounded-3xl bg-black/25 p-3 text-left transition hover:bg-white/10">
            <p className="text-2xl font-black text-white">{daily.todayTodos.length}</p>
            <p className="text-xs font-black text-white/50">今日TODO</p>
          </button>
          <button onClick={() => setPage?.("memos")} className="rounded-3xl bg-black/25 p-3 text-left transition hover:bg-white/10">
            <p className="text-2xl font-black text-white">{daily.todayMemos.length}</p>
            <p className="text-xs font-black text-white/50">今日メモ</p>
          </button>
          <button onClick={() => setPage?.("budget")} className="rounded-3xl bg-black/25 p-3 text-left transition hover:bg-white/10">
            <p className="text-xl font-black text-white">{yen(daily.todayExpense)}</p>
            <p className="text-xs font-black text-white/50">今日支出</p>
          </button>
          <button onClick={() => setPage?.("archive")} className="rounded-3xl bg-black/25 p-3 text-left transition hover:bg-white/10">
            <p className="text-2xl font-black text-white">{countInbox()}</p>
            <p className="text-xs font-black text-white/50">未処理</p>
          </button>
        </div>
      </HomeCard>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
        <HomeCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black tracking-[0.25em] text-emerald-100/60">QUICK COMMAND</p>
              <h2 className="mt-1 text-2xl font-black text-white">一言で追加</h2>
              <p className="mt-1 text-sm text-white/55">予定・TODO・お金・Diary・筋トレログをここから振り分け。</p>
            </div>
            <button onClick={analyze} disabled={!quick.trim()} className="rounded-2xl bg-cyan-300/20 px-4 py-3 text-sm font-black text-white disabled:opacity-40">
              整理
            </button>
          </div>
          <textarea
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="例：明日8:30ジム / 昼に650円使った / このバグ直す"
            className="mt-3 min-h-24 w-full rounded-3xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-white/35"
          />

          {draft && (
            <div className="mt-3 rounded-3xl border border-white/10 bg-white/5 p-3">
              <div className="grid gap-2 sm:grid-cols-4">
                <label className="grid gap-1 text-xs font-black text-white/45">分類
                  <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as RouteKind })} className="rounded-2xl bg-slate-950 p-3 text-white">
                    <option value="calendar">予定</option>
                    <option value="todo">TODO</option>
                    <option value="budget">家計簿</option>
                    <option value="diary">Diary</option>
                    <option value="memo">メモ</option>
                    <option value="body">筋トレ/体調</option>
                    <option value="belief">記憶カード</option>
                    <option value="future">未来メモ</option>
                    <option value="idea">アイデア</option>
                    <option value="inbox">未処理</option>
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-black text-white/45">日付
                  <input value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" />
                </label>
                <label className="grid gap-1 text-xs font-black text-white/45">時刻
                  <input value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" />
                </label>
                <label className="grid gap-1 text-xs font-black text-white/45">金額
                  <input value={draft.amount || ""} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value || 0) })} className="rounded-2xl bg-slate-950 p-3 text-white" />
                </label>
              </div>
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-2 w-full rounded-2xl bg-slate-950 p-3 text-white" />
            </div>
          )}

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ["memo", "メモ"],
              ["todo", "TODO"],
              ["calendar", "予定"],
              ["diary", "Diary"],
              ["budget", "お金"],
              ["body", "体づくり"],
              ["belief", "記憶カード"],
              ["inbox", "未処理"],
            ].map(([kind, label]) => (
              <button key={kind} onClick={() => save(kind as RouteKind)} disabled={busy || (!draft && !quick.trim())} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-white disabled:opacity-40">
                {label}
              </button>
            ))}
          </div>
          {message && <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-white/70">{message}</p>}
        </HomeCard>

        <HomeCard>
          <p className="text-xs font-black tracking-[0.25em] text-sky-100/60">PRIORITY</p>
          <h2 className="mt-1 text-2xl font-black text-white">今日の優先順位</h2>
          <div className="mt-3 grid gap-2">
            {daily.priority.length ? daily.priority.map((item, index) => (
              <button key={`${item.label}-${index}`} onClick={() => setPage?.(item.page)} className="rounded-2xl bg-white/8 px-4 py-3 text-left text-sm font-black text-white transition hover:bg-white/12">
                <span className="mr-2 text-white/40">{index + 1}</span>{item.label}
              </button>
            )) : <p className="rounded-2xl bg-white/8 px-4 py-3 text-sm text-white/55">今日はまだ軽め。予定かTODOを1つだけ追加すると動きやすいよ。</p>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <ToneBadge tone={daily.overdueTodos.length ? "rose" : "sky"}>期限切れ {daily.overdueTodos.length}</ToneBadge>
            <ToneBadge tone="emerald">未来メモ {daily.dueFuture.length}</ToneBadge>
          </div>
        </HomeCard>
      </div>

      <div className={`grid gap-4 xl:grid-cols-3 ${compactMode ? "" : "xl:grid-cols-2"}`}>
        <HomeCard>
          <p className="text-xs font-black tracking-[0.25em] text-rose-100/60">AI SECRETARY</p>
          <h3 className="mt-1 text-xl font-black text-white">案内係AI</h3>
          <p className="mt-3 rounded-2xl bg-white/8 p-3 text-sm leading-7 text-white/70">{emotion}</p>
        </HomeCard>

        <HomeCard>
          <p className="text-xs font-black tracking-[0.25em] text-purple-100/60">MEMORY CARD</p>
          <h3 className="mt-1 text-xl font-black text-white">今日の記憶カード</h3>
          {randomCard ? (
            <p className="mt-3 rounded-2xl bg-purple-300/10 p-3 text-sm leading-7 text-purple-50">{randomCard.note}</p>
          ) : (
            <p className="mt-3 rounded-2xl bg-white/8 p-3 text-sm text-white/55">名言や信念を「記憶カード」として保存するとここに出るよ。</p>
          )}
        </HomeCard>

        <HomeCard>
          <p className="text-xs font-black tracking-[0.25em] text-amber-100/60">PAGE LAUNCHER</p>
          <h3 className="mt-1 text-xl font-black text-white">よく使うページ</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {[
              ["memos", "メモ"],
              ["todos", "TODO"],
              ["calendar", "カレンダー"],
              ["budget", "家計簿"],
              ["search", "AI検索"],
              ["lifescore", "Life Lv"],
            ].map(([page, label]) => (
              <button key={page} onClick={() => setPage?.(page)} className="rounded-2xl bg-white/10 px-3 py-3 text-sm font-black text-white transition hover:bg-white/15">
                {label}
              </button>
            ))}
          </div>
        </HomeCard>
      </div>

      {!compactMode && (
        <div className="grid gap-4 xl:grid-cols-2">
          <HomeCard>
            <p className="text-xs font-black tracking-[0.25em] text-orange-100/60">MEMO RESCUE</p>
            <h3 className="mt-1 text-xl font-black text-white">未処理メモ救出</h3>
            <div className="mt-3 grid gap-2">
              {rescue.length ? rescue.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    const d = draftFromText(m.content || "");
                    const list = readLocal<Array<RouteDraft & { id: string; createdAt: string }>>(INBOX_KEYS[0], []);
                    writeLocal(INBOX_KEYS[0], [{ ...d, id: uid("rescue"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
                    setMessage("古いメモを未処理Inboxへ送ったよ。");
                  }}
                  className="rounded-2xl bg-white/8 px-3 py-2 text-left text-sm text-white/65"
                >
                  {String(m.content || "").slice(0, 90)}
                </button>
              )) : <p className="text-sm text-white/50">救出候補は今のところ少なめ。</p>}
            </div>
          </HomeCard>

          <HomeCard>
            <p className="text-xs font-black tracking-[0.25em] text-fuchsia-100/60">FUTURE SELF</p>
            <h3 className="mt-1 text-xl font-black text-white">未来の自分へのメモ</h3>
            <div className="mt-3 grid gap-2">
              {daily.dueFuture.length ? daily.dueFuture.slice(0, 4).map((f) => (
                <p key={f.id} className="rounded-2xl bg-fuchsia-300/10 px-3 py-2 text-sm text-fuchsia-50">{f.date}：{f.note}</p>
              )) : <p className="text-sm text-white/50">今日表示する未来メモはまだないよ。</p>}
            </div>
          </HomeCard>
        </div>
      )}
    </div>
  );
}
