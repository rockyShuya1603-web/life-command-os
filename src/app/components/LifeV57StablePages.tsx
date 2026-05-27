"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  emoji: string;
  points: number;
  doneDates: string[];
  steps?: string[];
};

const todayKey = () => new Date().toISOString().slice(0, 10);

function recentDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

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

const defaultHabits: Item[] = [
  { id: "wake", title: "起床", emoji: "🌅", points: 8, doneDates: [] },
  { id: "water", title: "水を飲む", emoji: "💧", points: 6, doneDates: [] },
  { id: "reading", title: "音読", emoji: "📖", points: 10, doneDates: [] },
  { id: "training", title: "体づくり", emoji: "💪", points: 12, doneDates: [] },
  { id: "diary", title: "Diary", emoji: "📝", points: 10, doneDates: [] },
];

const defaultRoutines: Item[] = [
  { id: "morning", title: "朝ルーティン", emoji: "🌤️", points: 16, doneDates: [], steps: ["起きる", "水を飲む", "今日の予定を見る", "身支度"] },
  { id: "work", title: "作業開始", emoji: "🧠", points: 14, doneDates: [], steps: ["机を整える", "今日のTODOを1つ選ぶ", "25分だけ始める"] },
  { id: "training-routine", title: "運動前", emoji: "🔥", points: 18, doneDates: [], steps: ["着替える", "水分準備", "軽く動く", "メニュー確認"] },
  { id: "night", title: "夜ルーティン", emoji: "🌙", points: 14, doneDates: [], steps: ["片付ける", "明日の準備", "睡眠へ"] },
];

function SharedNav() {
  return (
    <nav className="life-v57-nav">
      <Link href="/">ホームへ戻る</Link>
      <Link href="/habits">習慣ページ</Link>
      <Link href="/routines">ルーティンページ</Link>
      <Link href="/memo-write">メモを書く</Link>
      <Link href="/ai-search">AI検索</Link>
    </nav>
  );
}

export function HabitsView({ mode }: { mode: "habits" | "routines" }) {
  const [habits, setHabits] = useState<Item[]>(defaultHabits);
  const [routines, setRoutines] = useState<Item[]>(defaultRoutines);
  const [open, setOpen] = useState("morning");

  useEffect(() => {
    setHabits(load("life-command-os-v57-habits", defaultHabits));
    setRoutines(load("life-command-os-v57-routines", defaultRoutines));
  }, []);

  useEffect(() => save("life-command-os-v57-habits", habits), [habits]);
  useEffect(() => save("life-command-os-v57-routines", routines), [routines]);

  const days = recentDays();

  const toggleHabit = (id: string) => {
    const today = todayKey();
    setHabits((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const done = new Set(item.doneDates);
      if (done.has(today)) done.delete(today);
      else {
        done.add(today);
        addXp(item.points, `習慣：${item.title}`);
      }
      return { ...item, doneDates: Array.from(done).slice(-60) };
    }));
  };

  const completeRoutine = (id: string) => {
    const today = todayKey();
    setRoutines((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const done = new Set(item.doneDates);
      if (!done.has(today)) {
        done.add(today);
        addXp(item.points, `ルーティン：${item.title}`);
      }
      return { ...item, doneDates: Array.from(done).slice(-60) };
    }));
  };

  return (
    <main className="life-v57-page">
      <div className="life-v57-wrap">
        <div className="life-v57-card">
          <SharedNav />
        </div>

        <section className="life-v57-card">
          <div className="life-v57-head">
            <div>
              <p>LIFE ROUTINE</p>
              <h1>{mode === "habits" ? "習慣ページ" : "ルーティンページ"}</h1>
              <small>{mode === "habits" ? "単発チェック型の継続ページ。" : "手順つきブロック型の行動ページ。"}</small>
            </div>
          </div>
        </section>

        {mode === "habits" ? (
          <section className="life-v57-grid">
            {habits.map((item) => {
              const done = new Set(item.doneDates);
              const todayDone = done.has(todayKey());
              return (
                <article key={item.id} className="life-v57-check">
                  <div className="life-v57-check-title">
                    <span>{item.emoji}</span>
                    <div>
                      <b>{item.title}</b>
                      <small>+{item.points}XP</small>
                    </div>
                  </div>
                  <div className="life-v57-week">
                    {days.map((day) => <em key={day} className={done.has(day) ? "on" : ""}>{new Date(day).getDate()}</em>)}
                  </div>
                  <button type="button" onClick={() => toggleHabit(item.id)}>{todayDone ? "今日済み" : "今日できた"}</button>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="life-v57-routines">
            {routines.map((item) => {
              const done = new Set(item.doneDates);
              const todayDone = done.has(todayKey());
              const isOpen = open === item.id;
              return (
                <article key={item.id} className="life-v57-routine">
                  <button type="button" className="life-v57-routine-title" onClick={() => setOpen(isOpen ? "" : item.id)}>
                    <span>{item.emoji}</span>
                    <div>
                      <b>{item.title}</b>
                      <small>{todayDone ? "今日は完了" : `+${item.points}XP`}</small>
                    </div>
                    <strong>{isOpen ? "閉じる" : "開く"}</strong>
                  </button>
                  {isOpen && (
                    <>
                      <ol>{item.steps?.map((step) => <li key={step}>{step}</li>)}</ol>
                      <div className="life-v57-week">
                        {days.map((day) => <em key={day} className={done.has(day) ? "on" : ""}>{new Date(day).getDate()}</em>)}
                      </div>
                      <button type="button" onClick={() => completeRoutine(item.id)}>{todayDone ? "今日は達成済み" : "このルーティンを完了"}</button>
                    </>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}

export function MemoWriteView() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [toast, setToast] = useState("");

  const saveMemo = () => {
    if (!title.trim() && !body.trim()) {
      setToast("メモ内容を入力してね");
      setTimeout(() => setToast(""), 1400);
      return;
    }
    const memo = {
      id: `memo-v57-${Date.now()}`,
      title: title.trim() || body.trim().slice(0, 24) || "無題メモ",
      body: body.trim(),
      tags: tags.split(/[,\\s、]+/).map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    const prev = load<any[]>("life-command-os-v57-memos", []);
    save("life-command-os-v57-memos", [memo, ...prev].slice(0, 100));
    addXp(8, "メモ作成");
    setTitle("");
    setBody("");
    setTags("");
    setToast("メモに保存しました");
    setTimeout(() => setToast(""), 1600);
  };

  return (
    <main className="life-v57-page">
      <div className="life-v57-wrap">
        <div className="life-v57-card"><SharedNav /></div>
        <section className="life-v57-card">
          <div className="life-v57-head">
            <div>
              <p>MEMO QUICK WRITE</p>
              <h1>メモを書く</h1>
              <small>既存メモページを壊さない独立メモ入力ページ。</small>
            </div>
          </div>
          <div className="life-v57-form">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タイトル任意" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="ここにメモを書く" />
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="タグ任意：UI 開発 アイデア" />
            <button type="button" onClick={saveMemo}>メモに保存</button>
            {toast && <p className="life-v57-toast">{toast}</p>}
          </div>
        </section>
      </div>
    </main>
  );
}

function collectMoney() {
  if (typeof window === "undefined") return [];
  const out: any[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const text = JSON.stringify(parsed);
      if (/家計|支出|出費|円|budget|money|expense|amount/i.test(`${key} ${text}`)) out.push({ key, parsed });
    } catch {}
  }
  return out;
}

export function AISearchView() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");

  const run = (q = query) => {
    const text = q.trim();
    if (!text) return;
    const money = collectMoney();
    if (/支出|家計|円|出費|使った/.test(text)) {
      setResult(`家計簿候補を${money.length}個の保存領域から探しました。保存形式が統一されると「先週の支出」をより正確に集計できます。`);
      return;
    }
    setResult(`「${text}」でローカルデータを検索しました。`);
  };

  return (
    <main className="life-v57-page">
      <div className="life-v57-wrap">
        <div className="life-v57-card"><SharedNav /></div>
        <section className="life-v57-card">
          <div className="life-v57-head">
            <div>
              <p>AI SEARCH SAFE</p>
              <h1>AI検索</h1>
              <small>悪化した上部AI検索はいったん無効化し、独立ページで安全に検索する形に戻しました。</small>
            </div>
          </div>
          <div className="life-v57-search">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="先週の支出を教えて" />
            <button type="button" className="primary" onClick={() => run()}>検索</button>
          </div>
          <div className="life-v57-chips">
            {["先週の支出を教えて", "今月の支出を教えて", "未完了TODOを教えて"].map((s) => (
              <button key={s} type="button" onClick={() => { setQuery(s); run(s); }}>{s}</button>
            ))}
          </div>
          {result && <article className="life-v57-result"><h3>{result}</h3></article>}
        </section>
      </div>
    </main>
  );
}
