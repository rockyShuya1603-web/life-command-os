"use client";

import { useEffect, useState } from "react";

type MemoItem = { id: string; title: string; body: string; tags: string[]; createdAt: string };
type CheckItem = { id: string; title: string; emoji: string; points: number; doneDates: string[]; steps?: string[] };
type SearchResult = { ok: boolean; mode: string; intent: string; summary: string; suggestions: string[]; actions: string[] };

const MEMO_KEY = "life-command-os-v53-memos";
const HABIT_KEY = "life-command-os-v53-habits";
const ROUTINE_KEY = "life-command-os-v53-routines";

const todayKey = () => new Date().toISOString().slice(0, 10);
const recentDays = () => Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return d.toISOString().slice(0, 10);
});

const defaultHabits: CheckItem[] = [
  { id: "wake", title: "起床", emoji: "🌅", points: 8, doneDates: [] },
  { id: "water", title: "水を飲む", emoji: "💧", points: 6, doneDates: [] },
  { id: "reading", title: "音読", emoji: "📖", points: 10, doneDates: [] },
  { id: "training", title: "体づくり", emoji: "💪", points: 12, doneDates: [] },
  { id: "diary", title: "Diary", emoji: "📝", points: 10, doneDates: [] },
];

const defaultRoutines: CheckItem[] = [
  { id: "morning", title: "朝ルーティン", emoji: "🌤️", points: 16, doneDates: [], steps: ["起きる", "水を飲む", "予定を見る", "身支度"] },
  { id: "work", title: "作業開始", emoji: "🧠", points: 14, doneDates: [], steps: ["机を整える", "今日の1つを選ぶ", "25分だけ始める"] },
  { id: "training-routine", title: "運動前", emoji: "🔥", points: 18, doneDates: [], steps: ["着替える", "水分準備", "軽く動く", "メニュー確認"] },
  { id: "night", title: "夜ルーティン", emoji: "🌙", points: 14, doneDates: [], steps: ["片付ける", "明日の準備", "睡眠準備"] },
];

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

function addXp(points: number, label: string) {
  if (typeof window === "undefined") return;
  const fn = (window as any).lifeV52AddExp;
  if (typeof fn === "function") fn(points, label);
}

function fallbackSearch(query: string, memos: MemoItem[]): SearchResult {
  const intent =
    /支出|家計|円|交通費|カフェ|買った|使った/.test(query) ? "money" :
    /予定|明日|今日|来週|カレンダー|何時/.test(query) ? "calendar" :
    /TODO|タスク|やること|未完了|完了/.test(query) ? "todo" :
    /習慣|ルーティン|音読|継続/.test(query) ? "habit-routine" :
    /メール|Gmail|返信|受信/.test(query) ? "mail" :
    /メモ|記録|日記|Diary/.test(query) ? "memo" : "general";

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const related = memos.filter((m) => words.some((w) => `${m.title} ${m.body} ${m.tags.join(" ")}`.toLowerCase().includes(w))).slice(0, 3);
  return {
    ok: true,
    mode: "local-fallback",
    intent,
    summary: `「${query}」を ${intent} 系として検索しました。${related.length ? `関連メモ: ${related.map((m) => `「${m.title}」`).join("、")}` : "関連メモはまだ少ないです。"}`,
    suggestions: ["関連カードを表示", "TODO/予定/家計簿へ変換", "次の行動を1つに絞る"],
    actions: intent === "habit-routine" ? ["習慣ページへ", "ルーティンページへ", "音読ポイント確認"] : ["メモに保存", "TODO化", "関連ページへ移動"],
  };
}

export default function LifeCommandV53Enhancements({ page, setPage }: { page?: any; setPage?: (p: any) => void }) {
  const pageKey = String(page ?? "home");
  const [memos, setMemos] = useState<MemoItem[]>([]);
  const [habits, setHabits] = useState<CheckItem[]>(defaultHabits);
  const [routines, setRoutines] = useState<CheckItem[]>(defaultRoutines);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [toast, setToast] = useState("");
  const [openRoutine, setOpenRoutine] = useState("morning");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    setMemos(load(MEMO_KEY, []));
    setHabits(load(HABIT_KEY, defaultHabits));
    setRoutines(load(ROUTINE_KEY, defaultRoutines));
  }, []);

  useEffect(() => save(MEMO_KEY, memos), [memos]);
  useEffect(() => save(HABIT_KEY, habits), [habits]);
  useEffect(() => save(ROUTINE_KEY, routines), [routines]);

  const isMemo = ["memo", "memos", "notes"].includes(pageKey);
  const isHabit = ["habit", "habits", "習慣"].includes(pageKey);
  const isRoutine = ["routine", "routines", "ルーティン"].includes(pageKey);
  const showSearch = ["home", "search", "ai-search", "memo", "memos"].includes(pageKey);
  const days = recentDays();

  const saveMemo = () => {
    if (!title.trim() && !body.trim()) {
      setToast("メモ内容を入力してね");
      setTimeout(() => setToast(""), 1400);
      return;
    }
    const memo: MemoItem = {
      id: `memo-${Date.now()}`,
      title: title.trim() || body.trim().slice(0, 24) || "無題メモ",
      body: body.trim(),
      tags: tags.split(/[,\s、]+/).map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    setMemos((prev) => [memo, ...prev].slice(0, 100));
    addXp(8, "メモ作成");
    window.dispatchEvent(new CustomEvent("life-command-memo-created", { detail: memo }));
    setTitle(""); setBody(""); setTags("");
    setToast("メモに保存しました");
    setTimeout(() => setToast(""), 1600);
  };

  const toggleHabit = (id: string) => {
    const today = todayKey();
    setHabits((prev) => prev.map((h) => {
      if (h.id !== id) return h;
      const done = new Set(h.doneDates);
      if (done.has(today)) done.delete(today);
      else { done.add(today); addXp(h.points, `習慣：${h.title}`); }
      return { ...h, doneDates: Array.from(done).slice(-60) };
    }));
  };

  const completeRoutine = (id: string) => {
    const today = todayKey();
    setRoutines((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const done = new Set(r.doneDates);
      if (!done.has(today)) { done.add(today); addXp(r.points, `ルーティン：${r.title}`); }
      return { ...r, doneDates: Array.from(done).slice(-60) };
    }));
  };

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await fetch("/api/life-ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, clientMemos: memos.slice(0, 20) }),
      });
      setResult(await res.json());
    } catch {
      setResult(fallbackSearch(q, memos));
    } finally {
      setSearching(false);
    }
  };

  if (!isMemo && !isHabit && !isRoutine && !showSearch) return null;

  return (
    <section className="life-v53-shell" data-life-v53>
      {isMemo && (
        <div className="life-v53-card">
          <div className="life-v53-head">
            <div>
              <p className="life-v53-kicker">MEMO QUICK WRITE</p>
              <h2>メモをすぐ書く</h2>
              <p>過去メモを見るだけじゃなく、このページから新しいメモを書けるようにしたよ。</p>
            </div>
            <span>{memos.length}件</span>
          </div>
          <div className="life-v53-form">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル任意：例）UI改善メモ" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="ここにメモを書く。短文でもOK。" rows={5} />
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="タグ任意：例）UI 開発 アイデア" />
            <div className="life-v53-actions">
              <button type="button" onClick={saveMemo}>メモに保存</button>
              <button type="button" onClick={() => { setTitle(""); setBody(""); setTags(""); }}>クリア</button>
            </div>
            {toast && <p className="life-v53-toast">{toast}</p>}
          </div>
          <div className="life-v53-mini-list">
            <h3>直近の新規メモ</h3>
            {memos.length === 0 ? <p>まだ新規メモはないよ。</p> : memos.slice(0, 4).map((m) => (
              <article key={m.id}><b>{m.title}</b><small>{new Date(m.createdAt).toLocaleString("ja-JP")}</small><p>{m.body}</p></article>
            ))}
          </div>
        </div>
      )}

      {(isHabit || isRoutine) && (
        <div className="life-v53-card">
          <div className="life-v53-head">
            <div>
              <p className="life-v53-kicker">SEPARATE</p>
              <h2>習慣ページ / ルーティンページ</h2>
              <p>習慣は単発チェック、ルーティンは手順つきブロックとして分離。</p>
            </div>
          </div>
          <div className="life-v53-switch">
            <button type="button" className={isHabit ? "active" : ""} onClick={() => setPage?.("habits")}>習慣ページ</button>
            <button type="button" className={isRoutine ? "active" : ""} onClick={() => setPage?.("routines")}>ルーティンページ</button>
          </div>

          {isHabit && (
            <div className="life-v53-habit-grid">
              {habits.map((h) => {
                const done = new Set(h.doneDates);
                const todayDone = done.has(todayKey());
                return (
                  <article key={h.id} className={`life-v53-check ${todayDone ? "done" : ""}`}>
                    <div><span>{h.emoji}</span><b>{h.title}</b><small>+{h.points}XP</small></div>
                    <div className="life-v53-week">{days.map((d) => <em key={d} className={done.has(d) ? "on" : ""}>{new Date(d).getDate()}</em>)}</div>
                    <button type="button" onClick={() => toggleHabit(h.id)}>{todayDone ? "今日済み" : "今日できた"}</button>
                  </article>
                );
              })}
            </div>
          )}

          {isRoutine && (
            <div className="life-v53-routine-list">
              {routines.map((r) => {
                const done = new Set(r.doneDates);
                const todayDone = done.has(todayKey());
                const open = openRoutine === r.id;
                return (
                  <article key={r.id} className="life-v53-routine">
                    <button type="button" className="life-v53-routine-main" onClick={() => setOpenRoutine(open ? "" : r.id)}>
                      <span>{r.emoji}</span><b>{r.title}</b><small>{todayDone ? "今日は完了" : `+${r.points}XP`}</small>
                    </button>
                    {open && <div className="life-v53-routine-detail">
                      <ol>{r.steps?.map((s) => <li key={s}>{s}</li>)}</ol>
                      <div className="life-v53-week">{days.map((d) => <em key={d} className={done.has(d) ? "on" : ""}>{new Date(d).getDate()}</em>)}</div>
                      <button type="button" onClick={() => completeRoutine(r.id)}>{todayDone ? "今日は達成済み" : "このルーティンを完了"}</button>
                    </div>}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showSearch && (
        <div className="life-v53-card">
          <div className="life-v53-head">
            <div>
              <p className="life-v53-kicker">AI SEARCH BOOST</p>
              <h2>AI検索強化</h2>
              <p>メモ・予定・TODO・家計簿・習慣・ルーティンを横断する検索入口。</p>
            </div>
          </div>
          <div className="life-v53-ai-input">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }} placeholder="例）先週の支出 / 明日の予定 / 未完了TODO / 音読の記録" />
            <button type="button" onClick={runSearch} disabled={searching}>{searching ? "検索中" : "AI検索"}</button>
          </div>
          <div className="life-v53-chips">
            {["先週の支出", "明日の予定", "未完了TODO", "音読の記録", "最近の開発メモ"].map((s) => <button key={s} type="button" onClick={() => setQuery(s)}>{s}</button>)}
          </div>
          {result && <div className="life-v53-result">
            <span>{result.intent}</span>
            <h3>{result.summary}</h3>
            <div>{result.actions?.map((a) => <button key={a} type="button">{a}</button>)}</div>
            <ul>{result.suggestions?.map((s) => <li key={s}>{s}</li>)}</ul>
          </div>}
        </div>
      )}
    </section>
  );
}
