"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type PrizeType = "quote" | "badge" | "trophy" | "miss";
type Prize = { id: string; type: PrizeType; title: string; body: string; rarity: "N" | "R" | "SR" | "SSR"; createdAt: string };
type RoutineKey = "morning" | "reading" | "training" | "diary" | "night";
type Routine = { key: RoutineKey; title: string; emoji: string; point: number; description: string };
type LifeState = {
  level: number;
  exp: number;
  totalExp: number;
  gachaTickets: number;
  readingMinutes: number;
  readingGachaPoints: number;
  doneDates: Record<RoutineKey, string[]>;
  prizes: Prize[];
  recentLogs: string[];
  updatedAt?: string;
};

const STORAGE_KEY = "life-command-os-v52-life-level";
const USER_KEY = "life-command-os-user-id";
const todayKey = () => new Date().toISOString().slice(0, 10);

const routines: Routine[] = [
  { key: "morning", title: "朝ルーティン", emoji: "🌅", point: 12, description: "起床・水・身支度・今日の準備" },
  { key: "reading", title: "音読", emoji: "📖", point: 10, description: "10分ごとに音読ガチャポイント" },
  { key: "training", title: "体づくり", emoji: "💪", point: 14, description: "筋トレ・ラン・ストレッチ" },
  { key: "diary", title: "Diary", emoji: "📝", point: 12, description: "今日の記録・気分・学び" },
  { key: "night", title: "夜ルーティン", emoji: "🌙", point: 10, description: "片付け・明日の準備・睡眠準備" },
];

const quotePool = [
  { title: "名言：一歩", body: "小さな一歩も、積み重なれば人生の地形を変える。", rarity: "N" as const },
  { title: "名言：継続", body: "才能よりも、戻ってくる力が未来を作る。", rarity: "R" as const },
  { title: "名言：青春", body: "今日の自分を少しだけ超えた瞬間、青春はまた始まる。", rarity: "SR" as const },
  { title: "名言：覇気", body: "静かな努力は、やがて目に見える自信になる。", rarity: "SR" as const },
];
const badgePool = [
  { title: "バッジ：朝の起動者", body: "朝ルーティンを積み上げる者に贈られるバッジ。", rarity: "R" as const },
  { title: "バッジ：音読の灯", body: "声で脳を起こす習慣の証。", rarity: "R" as const },
  { title: "バッジ：継続の剣", body: "逃げずに戻ってきた日の証。", rarity: "SR" as const },
];
const trophyPool = [
  { title: "トロフィー：Life Level Up", body: "人生OSの経験値が高まった証。", rarity: "SR" as const },
  { title: "トロフィー：未来港の挑戦者", body: "今日も未来に向けて進んだ証。", rarity: "SSR" as const },
];
const missPool = [
  { title: "ハズレ：休憩券", body: "今日は外れ。でも休むことも次に進む準備。", rarity: "N" as const },
  { title: "ハズレ：空箱", body: "中身は空。でも次の一回に運が残っている。", rarity: "N" as const },
];

function initialState(): LifeState {
  return {
    level: 1,
    exp: 0,
    totalExp: 0,
    gachaTickets: 0,
    readingMinutes: 0,
    readingGachaPoints: 0,
    doneDates: { morning: [], reading: [], training: [], diary: [], night: [] },
    prizes: [],
    recentLogs: [],
    updatedAt: new Date().toISOString(),
  };
}

function expRequired(level: number) { return 80 + (level - 1) * 35; }
function userId() {
  if (typeof window === "undefined") return "shuya";
  const existing = localStorage.getItem(USER_KEY);
  if (existing) return existing;
  localStorage.setItem(USER_KEY, "shuya");
  return "shuya";
}

function normalizeState(input: Partial<LifeState> | null | undefined): LifeState {
  const base = initialState();
  return {
    ...base,
    ...(input ?? {}),
    doneDates: { ...base.doneDates, ...(input?.doneDates ?? {}) },
    prizes: input?.prizes ?? [],
    recentLogs: input?.recentLogs ?? [],
    updatedAt: input?.updatedAt ?? new Date().toISOString(),
  };
}

function loadState(): LifeState {
  if (typeof window === "undefined") return initialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    return normalizeState(JSON.parse(raw));
  } catch { return initialState(); }
}

function saveLocal(state: LifeState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function makePrize(): Prize {
  const roll = Math.random();
  let pool: Array<Omit<Prize, "id" | "type" | "createdAt">>;
  let type: PrizeType;
  if (roll < 0.38) { type = "quote"; pool = quotePool; }
  else if (roll < 0.68) { type = "badge"; pool = badgePool; }
  else if (roll < 0.82) { type = "trophy"; pool = trophyPool; }
  else { type = "miss"; pool = missPool; }
  const picked = pool[Math.floor(Math.random() * pool.length)];
  return { id: `prize-${Date.now()}-${Math.random().toString(16).slice(2)}`, type, title: picked.title, body: picked.body, rarity: picked.rarity, createdAt: new Date().toISOString() };
}

function addLog(state: LifeState, log: string): LifeState {
  return { ...state, recentLogs: [`${new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} ${log}`, ...state.recentLogs].slice(0, 8), updatedAt: new Date().toISOString() };
}

function addExpToState(state: LifeState, amount: number, label: string): LifeState {
  let next = { ...state, exp: state.exp + amount, totalExp: state.totalExp + amount, updatedAt: new Date().toISOString() };
  let leveled = 0;
  while (next.exp >= expRequired(next.level)) {
    next.exp -= expRequired(next.level);
    next.level += 1;
    leveled += 1;
  }
  if (leveled > 0) {
    next.gachaTickets += leveled;
    next = addLog(next, `🎉 Life Lv.${next.level}へ上昇 / ガチャ券 +${leveled}`);
  }
  return addLog(next, `+${amount}XP ${label}`);
}

function recentSevenDays() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });
}

export default function LifeLevelGachaV52() {
  const [state, setState] = useState<LifeState>(() => initialState());
  const [syncStatus, setSyncStatus] = useState("local");
  const [expandedRoutine, setExpandedRoutine] = useState<RoutineKey | null>("morning");
  const [gachaOpen, setGachaOpen] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<Prize | null>(null);
  const [readingInput, setReadingInput] = useState(10);
  const hydrated = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const local = loadState();
    setState(local);
    hydrated.current = true;

    fetch(`/api/life/level?userId=${encodeURIComponent(userId())}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && data.state) {
          const cloud = normalizeState(data.state);
          const localTime = new Date(local.updatedAt ?? 0).getTime();
          const cloudTime = new Date(cloud.updatedAt ?? 0).getTime();
          const winner = cloudTime >= localTime || cloud.totalExp >= local.totalExp ? cloud : local;
          setState(winner);
          saveLocal(winner);
          setSyncStatus("cloud");
        } else {
          setSyncStatus("local");
        }
      })
      .catch(() => setSyncStatus("local"));
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    saveLocal(state);
    (window as unknown as { lifeV52AddExp?: (amount: number, label?: string) => void }).lifeV52AddExp = (amount, label = "外部アクション") => {
      setState((prev) => addExpToState(prev, amount, label));
    };

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      fetch("/api/life/level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId(), state }),
      })
        .then((res) => res.json())
        .then((data) => setSyncStatus(data?.ok ? "synced" : "local"))
        .catch(() => setSyncStatus("local"));
    }, 900);
  }, [state]);

  const required = expRequired(state.level);
  const progress = Math.min(100, Math.round((state.exp / required) * 100));
  const days = useMemo(() => recentSevenDays(), []);

  const completeRoutine = (routine: Routine) => {
    const today = todayKey();
    setState((prev) => {
      const done = new Set(prev.doneDates[routine.key] ?? []);
      const already = done.has(today);
      done.add(today);
      let next: LifeState = { ...prev, doneDates: { ...prev.doneDates, [routine.key]: Array.from(done).slice(-30) }, updatedAt: new Date().toISOString() };
      next = already ? addLog(next, `${routine.title}は今日は達成済み`) : addExpToState(next, routine.point, `${routine.title}達成`);
      return next;
    });
  };

  const addReading = () => {
    const minutes = Math.max(0, Number(readingInput) || 0);
    if (minutes <= 0) return;
    const gained = Math.floor(minutes / 10);
    setState((prev) => {
      let next: LifeState = { ...prev, readingMinutes: prev.readingMinutes + minutes, readingGachaPoints: prev.readingGachaPoints + gained, updatedAt: new Date().toISOString() };
      next = addExpToState(next, Math.max(5, gained * 10), `音読 ${minutes}分`);
      if (gained > 0) next = addLog(next, `📖 音読ガチャポイント +${gained}`);
      return next;
    });
  };

  const canGacha = state.gachaTickets > 0 || state.readingGachaPoints > 0;
  const startGacha = () => {
    if (!canGacha || rolling) return;
    setGachaOpen(true);
    setRolling(true);
    setResult(null);
    setState((prev) => prev.readingGachaPoints > 0 ? { ...prev, readingGachaPoints: prev.readingGachaPoints - 1, updatedAt: new Date().toISOString() } : { ...prev, gachaTickets: Math.max(0, prev.gachaTickets - 1), updatedAt: new Date().toISOString() });
    window.setTimeout(() => {
      const prize = makePrize();
      setResult(prize);
      setRolling(false);
      setState((prev) => ({ ...addLog(prev, `🎁 ${prize.title}を獲得`), prizes: [prize, ...prev.prizes].slice(0, 50), updatedAt: new Date().toISOString() }));
    }, 2200);
  };

  const closeGacha = () => {
    setGachaOpen(false);
    setResult(null);
    setRolling(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <section className="life-v52-shell" data-life-auto-xp>
      <div className="life-v52-card life-v52-level-card">
        <div className="life-v52-level-head">
          <div>
            <p className="life-v52-kicker">LIFE LEVEL</p>
            <h2>Life レベル {state.level}</h2>
            <p className="life-v52-muted">PC/スマホ同期: {syncStatus === "synced" || syncStatus === "cloud" ? "同期済み" : "ローカル保存中"}</p>
          </div>
          <div className="life-v52-level-orb"><span>Lv</span><b>{state.level}</b></div>
        </div>
        <div className="life-v52-progress"><div style={{ width: `${progress}%` }} /></div>
        <div className="life-v52-progress-meta"><span>{state.exp} / {required} XP</span><span>累計 {state.totalExp} XP</span></div>
        <div className="life-v52-mini-grid">
          <div><b>{state.gachaTickets}</b><span>Lifeガチャ券</span></div>
          <div><b>{state.readingGachaPoints}</b><span>音読ガチャP</span></div>
          <div><b>{state.prizes.length}</b><span>景品</span></div>
        </div>
        <button className="life-v52-primary" type="button" disabled={!canGacha || rolling} onClick={startGacha}>🎰 ガチャを引く</button>
      </div>

      <div className="life-v52-grid">
        <div className="life-v52-card">
          <div className="life-v52-section-head"><div><p className="life-v52-kicker">ROUTINE</p><h3>習慣・ルーティン</h3></div><span className="life-v52-chip">1週間履歴</span></div>
          <div className="life-v52-routines">
            {routines.map((routine) => {
              const done = new Set(state.doneDates[routine.key] ?? []);
              const todayDone = done.has(todayKey());
              const open = expandedRoutine === routine.key;
              return (
                <article key={routine.key} className={`life-v52-routine ${open ? "is-open" : ""}`}>
                  <button className="life-v52-routine-main" type="button" onClick={() => setExpandedRoutine(open ? null : routine.key)}>
                    <span className="life-v52-routine-emoji">{routine.emoji}</span><span><b>{routine.title}</b><small>{routine.description}</small></span><em>{todayDone ? "済" : `+${routine.point}`}</em>
                  </button>
                  {open && (
                    <div className="life-v52-routine-detail">
                      <div className="life-v52-week">{days.map((day) => <span key={day} className={done.has(day) ? "done" : ""}>{new Date(day).getDate()}</span>)}</div>
                      <button type="button" onClick={() => completeRoutine(routine)}>{todayDone ? "今日は達成済み" : "今日できた"}</button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>

        <div className="life-v52-card">
          <div className="life-v52-section-head"><div><p className="life-v52-kicker">READING</p><h3>音読ポイント</h3></div><span className="life-v52-chip">10分 = 1P</span></div>
          <div className="life-v52-reading-box"><div><b>{state.readingMinutes}</b><span>累計音読分</span></div><div><b>{state.readingGachaPoints}</b><span>音読ガチャP</span></div></div>
          <div className="life-v52-reading-form">
            <input type="number" min={0} step={5} value={readingInput} onChange={(event) => setReadingInput(Number(event.target.value))} aria-label="音読分数" />
            <button type="button" onClick={addReading}>音読を記録</button>
          </div>
          <p className="life-v52-muted">10分ごとに音読ガチャポイント。Life XPも同時に貯まるよ。</p>
        </div>
      </div>

      <div className="life-v52-card life-v52-prize-card">
        <div className="life-v52-section-head"><div><p className="life-v52-kicker">COLLECTION</p><h3>ガチャ景品</h3></div><span className="life-v52-chip">{state.prizes.length}個</span></div>
        {state.prizes.length === 0 ? <p className="life-v52-muted">まだ景品はないよ。音読やLifeレベルアップでガチャを引こう。</p> : (
          <div className="life-v52-prizes">{state.prizes.slice(0, 8).map((prize) => <article key={prize.id} className={`life-v52-prize type-${prize.type}`}><span>{prize.rarity}</span><b>{prize.title}</b><small>{prize.body}</small></article>)}</div>
        )}
      </div>

      <div className="life-v52-card life-v52-log-card">
        <div className="life-v52-section-head"><h3>最近の成長ログ</h3></div>
        {state.recentLogs.length === 0 ? <p className="life-v52-muted">TODO・Diary・ルーティン・音読をこなすとここに記録されるよ。</p> : <ul>{state.recentLogs.map((log, index) => <li key={`${log}-${index}`}>{log}</li>)}</ul>}
      </div>

      {gachaOpen && (
        <div className="life-v52-gacha-overlay" role="dialog" aria-modal="true">
          <div className={`life-v52-gacha-modal ${rolling ? "is-rolling" : "is-result"}`}>
            {rolling ? <><div className="life-v52-gacha-orb">🎰</div><h2>ガチャ演出中...</h2><p>未来港から景品を召喚しているよ</p></> : result ? (
              <button type="button" className="life-v52-gacha-result" onClick={closeGacha}><span>{result.rarity}</span><h2>{result.title}</h2><p>{result.body}</p><small>タップしてホームへ戻る</small></button>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
