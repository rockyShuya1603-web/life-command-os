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

type Kind = "memo" | "todo" | "calendar" | "diary" | "budget" | "body" | "belief" | "future" | "idea" | "inbox";

type Draft = {
  kind: Kind;
  title: string;
  date: string;
  time: string;
  amount: number;
  category: string;
  note: string;
  confidence: "high" | "middle" | "low";
  reasons: string[];
};

type Props = {
  snapshot: SnapshotLike | null;
  refreshSnapshot?: (reason?: string) => Promise<void> | void;
  setPage?: (page: any) => void;
  variant?: "home" | "memo";
};

const INBOX_KEY = "life-v70-unprocessed-memo-inbox";
const BODY_KEY = "life-v70-windhunt-body-logs";
const MEMORY_KEY = "life-v70-memory-cards";
const FUTURE_KEY = "life-v70-future-self-memos";
const HISTORY_KEY = "life-v70-organize-history";

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

  const md = text.match(/(\d{1,2})[\/月](\d{1,2})日?/);
  if (md) {
    const y = new Date().getFullYear();
    return `${y}-${String(Number(md[1])).padStart(2, "0")}-${String(Number(md[2])).padStart(2, "0")}`;
  }

  const ymd = text.match(/(20\d{2})[-\/年](\d{1,2})[-\/月](\d{1,2})日?/);
  if (ymd) return `${ymd[1]}-${String(Number(ymd[2])).padStart(2, "0")}-${String(Number(ymd[3])).padStart(2, "0")}`;

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

function detectKind(text: string): Kind {
  if (/未来の自分|自分へ|8月31日|誕生日|クリスマス|半年後|来年/.test(text)) return "future";
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

function draftFromText(text: string): Draft {
  const clean = text.trim();
  const kind = detectKind(clean);
  const amount = parseAmount(clean);
  const title = clean.replace(/^(今日|明日|明後日|あさって|昨日)/, "").replace(/\s+/g, " ").slice(0, 90) || "無題";
  const reasons: string[] = [];

  if (kind === "body") reasons.push("筋トレ・体調ワードを検出");
  if (kind === "budget") reasons.push("金額/支払いワードを検出");
  if (kind === "calendar") reasons.push("日時/予定ワードを検出");
  if (kind === "todo") reasons.push("行動ワードを検出");
  if (kind === "belief") reasons.push("名言/信念ワードを検出");
  if (kind === "future") reasons.push("未来メモワードを検出");
  if (!reasons.length) reasons.push("通常メモとして保存候補");

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
    reasons,
  };
}

async function aiDraft(text: string) {
  const fallback = draftFromText(text);
  try {
    const res = await fetch("/api/life/memo-organize-v70", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, today: todayKey(), fallback }),
    });
    const json = await res.json().catch(() => null);
    if (json?.ok && json?.draft?.kind) return { ...fallback, ...json.draft } as Draft;
  } catch {
    // local fallback
  }
  return fallback;
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.6rem] border border-white/10 bg-black/28 p-4 shadow-xl backdrop-blur-xl ${className}`}>{children}</section>;
}

function addLocalHistory(title: string, payload: unknown) {
  const list = readLocal<Array<{ id: string; title: string; payload: unknown; createdAt: string }>>(HISTORY_KEY, []);
  writeLocal(HISTORY_KEY, [{ id: uid("hist"), title, payload, createdAt: new Date().toISOString() }, ...list].slice(0, 200));
}

async function saveDraft(draft: Draft, refreshSnapshot?: Props["refreshSnapshot"]) {
  if (draft.kind === "todo") {
    const { error } = await supabase.from("todos").insert({ title: draft.title, done: false, priority: "normal", due_date: draft.date || todayKey(), due_time: draft.time || null });
    if (error) throw error;
  } else if (draft.kind === "calendar") {
    const { error } = await supabase.from("events").insert({ title: draft.title, event_date: draft.date || todayKey(), start_time: draft.time || null, note: draft.note || null });
    if (error) throw error;
  } else if (draft.kind === "budget") {
    if (!draft.amount) throw new Error("金額が読み取れないため、未処理メモに送るのが安全です。");
    const { error } = await supabase.from("budget_logs").insert({
      spend_date: draft.date || todayKey(),
      type: /収入|給料|給与|入金|返金/.test(draft.note) ? "income" : "expense",
      category: draft.category || "その他",
      amount: draft.amount,
      wallet: "財布",
      payment_method: "財布",
      memo: draft.note,
    });
    if (error) throw error;
  } else if (draft.kind === "diary") {
    const { error } = await supabase.from("diaries").insert({
      entry_date: draft.date || todayKey(),
      mood: /不安|しんど|ストレス|疲|落ち/.test(draft.note) ? "low" : "neutral",
      title: draft.title.slice(0, 40),
      content: draft.note,
    });
    if (error) throw error;
  } else if (draft.kind === "memo" || draft.kind === "idea") {
    const { error } = await supabase.from("memos").insert({ content: draft.kind === "idea" ? `💡 ${draft.note}` : draft.note });
    if (error) throw error;
  } else if (draft.kind === "body") {
    const list = readLocal<Array<Draft & { id: string; createdAt: string }>>(BODY_KEY, []);
    writeLocal(BODY_KEY, [{ ...draft, id: uid("body"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
  } else if (draft.kind === "belief") {
    const list = readLocal<Array<Draft & { id: string; createdAt: string }>>(MEMORY_KEY, []);
    writeLocal(MEMORY_KEY, [{ ...draft, id: uid("card"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
  } else if (draft.kind === "future") {
    const list = readLocal<Array<Draft & { id: string; createdAt: string; delivered?: boolean }>>(FUTURE_KEY, []);
    writeLocal(FUTURE_KEY, [{ ...draft, id: uid("future"), createdAt: new Date().toISOString(), delivered: false }, ...list].slice(0, 200));
  } else {
    const list = readLocal<Array<Draft & { id: string; createdAt: string }>>(INBOX_KEY, []);
    writeLocal(INBOX_KEY, [{ ...draft, id: uid("inbox"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
  }

  addLocalHistory(`${draft.kind}: ${draft.title}`, draft);
  await Promise.resolve(refreshSnapshot?.("v70整理保存"));
}

function dailySummary(snapshot: SnapshotLike | null) {
  const today = todayKey();
  const todos = snapshot?.todos || [];
  const events = snapshot?.events || [];
  const budget = snapshot?.budget || [];
  const memos = snapshot?.memos || [];
  const todayTodos = todos.filter((t) => !t.done && (t.due_date || today) === today);
  const todayEvents = events.filter((e) => e.event_date === today);
  const todayExpense = budget.filter((b) => b.spend_date === today && b.type === "expense").reduce((s, b) => s + Number(b.amount || 0), 0);
  const todayMemos = memos.filter((m) => String(m.created_at || "").slice(0, 10) === today);
  const future = readLocal<Array<Draft & { id: string; delivered?: boolean }>>(FUTURE_KEY, []);
  const dueFuture = future.filter((f) => !f.delivered && f.date <= today);
  return { todayTodos, todayEvents, todayExpense, todayMemos, dueFuture };
}

function rescueCandidates(snapshot: SnapshotLike | null) {
  const memos = snapshot?.memos || [];
  const border = addDays(todayKey(), -2);
  return memos
    .filter((m) => String(m.created_at || "").slice(0, 10) <= border)
    .filter((m) => /TODO|やる|予定|払う|支払い|求人|応募|修正|確認|買う|ジム|筋トレ/.test(String(m.content || "")))
    .slice(0, 8);
}

function emotionAnalysis(snapshot: SnapshotLike | null) {
  const texts = [
    ...(snapshot?.memos || []).slice(0, 80).map((m) => m.content || ""),
    ...(snapshot?.diaries || []).slice(0, 80).map((d) => `${d.title || ""} ${d.content || ""} ${d.mood || ""}`),
  ].join("\n");

  const stress = (texts.match(/不安|しんど|ストレス|疲れ|暇|眠い|落ち/g) || []).length;
  const coffee = (texts.match(/コーヒー|カフェイン/g) || []).length;
  const movement = (texts.match(/ランニング|筋トレ|ジム|散歩|運動/g) || []).length;
  const anime = (texts.match(/アニメ|漫画|ラノベ|ストグリ|ウィストリア/g) || []).length;

  const notes = [
    stress ? `ストレス/疲れ系ワード ${stress}回` : "強いストレスワードは少なめ",
    coffee ? `コーヒー/カフェイン ${coffee}回` : "カフェイン記録は少なめ",
    movement ? `運動系ワード ${movement}回` : "運動ワードは少なめ",
    anime ? `アニメ/読書系ワード ${anime}回` : "気分転換ワードは少なめ",
  ];

  const advice = stress && coffee ? "コーヒー多めの日は、予定を詰めすぎず軽い散歩か短い読書に逃がすと安定しやすそう。" :
    stress && movement ? "疲れと運動が同時に出てるから、追い込みより回復ログも残すと判断しやすくなる。" :
    stress ? "しんどさが見えた日は、予定を1個だけに絞ると回復しやすいかも。" :
    "今のところ強い落ち込み傾向は薄め。ログ継続で見え方が良くなるよ。";

  return { notes, advice };
}

export default function MemoLifeOSExpansionV70({ snapshot, refreshSnapshot, setPage, variant = "home" }: Props) {
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [tick, setTick] = useState(0);
  const [futureDate, setFutureDate] = useState(todayKey());
  const daily = useMemo(() => dailySummary(snapshot), [snapshot, tick]);
  const rescue = useMemo(() => rescueCandidates(snapshot), [snapshot, tick]);
  const emotion = useMemo(() => emotionAnalysis(snapshot), [snapshot, tick]);
  const memoryCards = readLocal<Array<Draft & { id: string; createdAt: string }>>(MEMORY_KEY, []);
  const bodyLogs = readLocal<Array<Draft & { id: string; createdAt: string }>>(BODY_KEY, []);
  const inbox = readLocal<Array<Draft & { id: string; createdAt: string }>>(INBOX_KEY, []);
  const randomCard = memoryCards.length ? memoryCards[Math.floor((Date.now() / 60000) % memoryCards.length)] : null;

  const analyze = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const next = await aiDraft(text.trim());
      setDraft(next);
      setMessage(`「${next.category}」として整理候補を作ったよ。`);
    } finally {
      setBusy(false);
    }
  };

  const save = async (forced?: Kind) => {
    const source = draft || draftFromText(text);
    const next = { ...source, kind: forced || source.kind, date: forced === "future" ? futureDate : source.date };
    setBusy(true);
    try {
      await saveDraft(next, refreshSnapshot);
      setText("");
      setDraft(null);
      setMessage(`${next.category}として保存したよ。`);
      setTick((v) => v + 1);
    } catch (error) {
      const list = readLocal<Array<Draft & { id: string; createdAt: string }>>(INBOX_KEY, []);
      writeLocal(INBOX_KEY, [{ ...next, id: uid("inbox"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
      setMessage(error instanceof Error ? `保存に失敗したので未処理へ送ったよ: ${error.message}` : "保存に失敗したので未処理へ送ったよ。");
      setTick((v) => v + 1);
    } finally {
      setBusy(false);
    }
  };

  const rescueMemo = async (memo: { content?: string }) => {
    const next = await aiDraft(memo.content || "");
    const list = readLocal<Array<Draft & { id: string; createdAt: string }>>(INBOX_KEY, []);
    writeLocal(INBOX_KEY, [{ ...next, id: uid("rescue"), createdAt: new Date().toISOString() }, ...list].slice(0, 200));
    setMessage("古いメモを未処理Inboxに救出したよ。");
    setTick((v) => v + 1);
  };

  const windHuntJson = JSON.stringify(bodyLogs.slice(0, 20).map((log) => ({
    date: log.date,
    title: log.title,
    bodyPart: /腹筋/.test(log.note) ? "腹筋" : /胸|ベンチ/.test(log.note) ? "胸" : /脚|膝/.test(log.note) ? "脚/膝" : "全身/体調",
    condition: log.note,
    source: "Life Command OS v70",
  })), null, 2);

  return (
    <div className={`memo-life-os-v70 space-y-4 ${variant === "memo" ? "memo-mode" : "home-mode"}`}>
      <Card className="border-cyan-200/20 bg-gradient-to-br from-cyan-400/15 via-indigo-400/10 to-fuchsia-400/15">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.28em] text-cyan-100/65">LIFE AUTO ORGANIZER v70</p>
            <h2 className="mt-1 text-3xl font-black text-white">AI自動整理ボックス</h2>
            <p className="mt-2 text-sm leading-6 text-white/65">
              書く → AIが分類 → 予定/TODO/日記/お金/体づくり/信念カード/未来メモへ送る。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-4">
            <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{daily.todayEvents.length}</p><p className="text-xs text-white/50">今日予定</p></div>
            <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{daily.todayTodos.length}</p><p className="text-xs text-white/50">今日TODO</p></div>
            <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{inbox.length}</p><p className="text-xs text-white/50">未処理</p></div>
            <div className="rounded-2xl bg-black/25 p-3"><p className="text-2xl font-black">{yen(daily.todayExpense)}</p><p className="text-xs text-white/50">今日支出</p></div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 lg:grid-cols-[1fr_auto_auto]">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例：今日は筋トレ疲れた。明日ベンチプレス。あと家賃払う"
            className="min-h-28 rounded-3xl border border-white/10 bg-black/30 p-4 text-white outline-none placeholder:text-white/35"
          />
          <button onClick={analyze} disabled={busy || !text.trim()} className="rounded-3xl bg-cyan-300/20 px-5 py-4 font-black text-white disabled:opacity-50">AI整理</button>
          <button onClick={() => save()} disabled={busy || (!draft && !text.trim())} className="rounded-3xl bg-emerald-300/20 px-5 py-4 font-black text-emerald-50 disabled:opacity-50">保存</button>
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {[
            ["memo", "そのまま保存"],
            ["todo", "TODO化"],
            ["calendar", "予定化"],
            ["diary", "日記化"],
            ["body", "筋トレログ化"],
            ["budget", "お金メモ化"],
            ["belief", "記憶カード化"],
            ["idea", "アイデア化"],
          ].map(([kind, label]) => (
            <button key={kind} onClick={() => save(kind as Kind)} disabled={busy || (!draft && !text.trim())} className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white disabled:opacity-45">
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
          <label className="grid gap-1 text-xs font-black text-white/55">
            未来の自分へ表示する日
            <input type="date" value={futureDate} onChange={(e) => setFutureDate(e.target.value)} className="rounded-2xl border border-white/10 bg-slate-950 p-3 text-white" />
          </label>
          <button onClick={() => save("future")} disabled={busy || (!draft && !text.trim())} className="rounded-2xl bg-fuchsia-300/20 px-4 py-3 font-black text-fuchsia-50 disabled:opacity-50">未来メモ化</button>
        </div>

        {draft && (
          <div className="mt-4 rounded-3xl border border-white/10 bg-black/25 p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <label className="grid gap-1 text-xs font-black text-white/55">分類
                <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Kind })} className="rounded-2xl bg-slate-950 p-3 text-white">
                  <option value="memo">メモ</option><option value="todo">TODO</option><option value="calendar">カレンダー</option><option value="diary">Diary</option><option value="budget">家計簿</option><option value="body">筋トレ/体調</option><option value="belief">記憶カード</option><option value="future">未来メモ</option><option value="idea">アイデア</option><option value="inbox">未処理</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-black text-white/55">日付<input value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
              <label className="grid gap-1 text-xs font-black text-white/55">時刻<input value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
              <label className="grid gap-1 text-xs font-black text-white/55">金額<input value={draft.amount || ""} onChange={(e) => setDraft({ ...draft, amount: Number(e.target.value || 0) })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
              <label className="grid gap-1 text-xs font-black text-white/55">カテゴリ<input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
            </div>
            <label className="mt-3 grid gap-1 text-xs font-black text-white/55">タイトル<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="rounded-2xl bg-slate-950 p-3 text-white" /></label>
            <p className="mt-3 text-sm text-white/60">理由：{draft.reasons?.join(" / ")} / 信頼度 {draft.confidence}</p>
          </div>
        )}
        {message && <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white/75">{message}</p>}
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <p className="text-xs font-black tracking-[0.25em] text-sky-100/60">DAILY COMMAND</p>
          <h3 className="mt-1 text-2xl font-black">今日の司令室</h3>
          <div className="mt-3 grid gap-2">
            {daily.dueFuture.length ? daily.dueFuture.slice(0, 3).map((f) => (
              <p key={f.id} className="rounded-2xl bg-fuchsia-300/15 px-3 py-2 text-sm text-fuchsia-50">未来の自分から：{f.note}</p>
            )) : null}
            <p className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/70">今日の予定 {daily.todayEvents.length}件 / TODO {daily.todayTodos.length}件 / メモ {daily.todayMemos.length}件</p>
            <button onClick={() => setPage?.("calendar")} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">カレンダーを見る</button>
          </div>
        </Card>

        <Card>
          <p className="text-xs font-black tracking-[0.25em] text-rose-100/60">EMOTION ANALYSIS</p>
          <h3 className="mt-1 text-2xl font-black">感情ログ → 原因分析</h3>
          <div className="mt-3 grid gap-2">
            {emotion.notes.map((note) => <p key={note} className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/70">{note}</p>)}
          </div>
          <p className="mt-3 rounded-2xl bg-rose-300/10 px-3 py-2 text-sm leading-7 text-rose-50">{emotion.advice}</p>
        </Card>

        <Card>
          <p className="text-xs font-black tracking-[0.25em] text-amber-100/60">MEMO RESCUE</p>
          <h3 className="mt-1 text-2xl font-black">未処理メモ救出</h3>
          <div className="mt-3 grid gap-2">
            {rescue.length ? rescue.map((m) => (
              <button key={m.id} onClick={() => rescueMemo(m)} className="rounded-2xl bg-white/10 px-3 py-2 text-left text-sm text-white/70">
                {String(m.content || "").slice(0, 90)}
              </button>
            )) : <p className="text-sm text-white/50">救出候補は今のところ少なめ。</p>}
          </div>
        </Card>

        <Card>
          <p className="text-xs font-black tracking-[0.25em] text-emerald-100/60">WIND-HUNT LINK</p>
          <h3 className="mt-1 text-2xl font-black">筋トレ・体調メモ連携</h3>
          <p className="mt-2 text-sm text-white/55">筋トレ/体調ログはここに保存。Wind-Hunt OSへ渡しやすいJSONも作るよ。</p>
          <div className="mt-3 grid gap-2">
            {bodyLogs.slice(0, 4).map((log) => <p key={log.id} className="rounded-2xl bg-emerald-300/10 px-3 py-2 text-sm text-emerald-50">{log.date} / {log.title}</p>)}
          </div>
          <textarea readOnly value={windHuntJson} className="mt-3 h-28 w-full rounded-2xl bg-black/30 p-3 text-xs text-white/60 outline-none" />
        </Card>

        <Card>
          <p className="text-xs font-black tracking-[0.25em] text-purple-100/60">MEMORY CARD</p>
          <h3 className="mt-1 text-2xl font-black">AI記憶カード</h3>
          {randomCard ? (
            <div className="mt-3 rounded-3xl bg-purple-300/10 p-4">
              <p className="text-sm text-white/50">{randomCard.category}</p>
              <p className="mt-2 text-lg font-black leading-8 text-white">{randomCard.note}</p>
            </div>
          ) : <p className="mt-3 text-sm text-white/50">名言や信念を書いて「記憶カード化」するとここに出るよ。</p>}
        </Card>

        <Card>
          <p className="text-xs font-black tracking-[0.25em] text-fuchsia-100/60">FUTURE SELF</p>
          <h3 className="mt-1 text-2xl font-black">未来の自分へのメモ</h3>
          <div className="mt-3 grid gap-2">
            {readLocal<Array<Draft & { id: string; delivered?: boolean }>>(FUTURE_KEY, []).slice(0, 5).map((f) => (
              <p key={f.id} className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/70">{f.date} に表示：{f.note}</p>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
