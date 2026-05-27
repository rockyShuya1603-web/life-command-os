"use client";

import { useEffect, useMemo, useState } from "react";

type Mode =
  | "home"
  | "quick"
  | "memo-todo"
  | "templates"
  | "titles"
  | "gacha"
  | "money"
  | "weekly";

type AnyRecord = Record<string, unknown>;

type ParsedQuickAdd = {
  type: "calendar" | "todo" | "money" | "memo" | "diary";
  title: string;
  body: string;
  amount?: number;
  date?: string;
  time?: string;
  category?: string;
  confidence: "high" | "middle" | "low";
};

type TodoItem = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  dueDate?: string;
  source?: string;
};

type MemoItem = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  source?: string;
};

type MoneyItem = {
  id: string;
  amount: number;
  category: string;
  label: string;
  date: string;
  createdAt: string;
};

type EventItem = {
  id: string;
  title: string;
  date: string;
  time?: string;
  createdAt: string;
};

type HabitItem = {
  id: string;
  title: string;
  emoji: string;
  doneDates: string[];
};

type RoutineItem = {
  id: string;
  title: string;
  emoji: string;
  steps: string[];
  doneDates: string[];
};

type Prize = {
  id: string;
  title: string;
  body: string;
  rarity: "N" | "R" | "SR" | "SSR";
  type: "quote" | "badge" | "trophy" | "miss" | "title";
  createdAt: string;
};

const KEYS = {
  todos: "life-command-os-v59-todos",
  memos: "life-command-os-v59-memos",
  money: "life-command-os-v59-money",
  events: "life-command-os-v59-events",
  habits: "life-command-os-v59-habits",
  routines: "life-command-os-v59-routines",
  prizes: "life-command-os-v59-prizes",
  tickets: "life-command-os-v59-gacha-tickets",
  selectedTitle: "life-command-os-v59-selected-title",
};

const bridgeMemoKeys = [
  "life-command-os-v58-memos",
  "life-command-os-v57-memos",
  "life-command-os-v53-memos",
  "memos",
  "lifeMemos",
  "life-command-memos",
  "memoEntries",
];

const bridgeTodoKeys = [
  "todos",
  "lifeTodos",
  "life-command-todos",
  "todoEntries",
];

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dateLabel(dateString?: string) {
  if (!dateString) return "日付なし";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
}

function yen(amount: number) {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readArray<T>(key: string, fallback: T[] = []): T[] {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

function writeArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Never break existing app if localStorage is full or format is unexpected.
  }
}

function readNumber(key: string, fallback = 0) {
  if (typeof window === "undefined") return fallback;
  const raw = window.localStorage.getItem(key);
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function writeNumber(key: string, value: number) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, String(value));
}

function addLifeXp(amount: number, label: string) {
  if (typeof window === "undefined") return;
  const helper = (window as unknown as { lifeV52AddExp?: (amount: number, label?: string) => void }).lifeV52AddExp;
  if (typeof helper === "function") helper(amount, label);
}

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayKey(d);
}

function startOfWeek(offsetWeeks = 0) {
  const now = new Date();
  const day = now.getDay() || 7;
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - day + 1 + offsetWeeks * 7);
  return monday;
}

function inRange(dateString: string | undefined, start: Date, end: Date) {
  if (!dateString) return false;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return false;
  return d >= start && d <= end;
}

function parseDateFromText(text: string) {
  if (text.includes("明日")) return tomorrow();
  if (text.includes("今日")) return todayKey();
  if (text.includes("来週")) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return todayKey(d);
  }
  const md = text.match(/(\d{1,2})[\/月](\d{1,2})日?/);
  if (md) {
    const y = new Date().getFullYear();
    const m = String(Number(md[1])).padStart(2, "0");
    const d = String(Number(md[2])).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return undefined;
}

function parseTimeFromText(text: string) {
  const match = text.match(/(午前|午後)?\s*(\d{1,2})[:：時](\d{2})?/);
  if (!match) return undefined;
  let hour = Number(match[2]);
  const minute = match[3] ? Number(match[3]) : 0;
  if (match[1] === "午後" && hour < 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseQuickAdd(input: string): ParsedQuickAdd {
  const text = input.trim();
  const amountMatch = text.match(/([0-9０-９,，]+)\s*円/);
  const normalizedAmount = amountMatch
    ? Number(amountMatch[1].replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0)).replace(/[，,]/g, ""))
    : undefined;

  const date = parseDateFromText(text);
  const time = parseTimeFromText(text);

  if (normalizedAmount && Number.isFinite(normalizedAmount)) {
    const category =
      /電車|バス|交通|タクシー/.test(text) ? "交通費" :
      /カフェ|コーヒー|外食|ランチ|ご飯|食/.test(text) ? "食費" :
      /本|書籍|学習/.test(text) ? "学習" :
      /ジム|筋トレ|運動|プロテイン/.test(text) ? "体づくり" :
      "未分類";

    return {
      type: "money",
      title: text.replace(amountMatch?.[0] ?? "", "").trim() || category,
      body: text,
      amount: normalizedAmount,
      category,
      date: date ?? todayKey(),
      confidence: "high",
    };
  }

  if (date || time || /予定|行く|会う|予約|面談|ジム|病院|美容院/.test(text)) {
    return {
      type: "calendar",
      title: text.replace(/今日|明日|来週|午前|午後|\d{1,2}[:：時]\d{0,2}/g, "").trim() || text,
      body: text,
      date: date ?? todayKey(),
      time,
      confidence: date || time ? "high" : "middle",
    };
  }

  if (/やる|する|買う|送る|確認|TODO|タスク|直す|作る|追加/.test(text)) {
    return { type: "todo", title: text, body: text, date, confidence: "middle" };
  }

  if (/不安|気分|日記|Diary|diary|今日は|感じた|思った/.test(text)) {
    return { type: "diary", title: text.slice(0, 24), body: text, date: todayKey(), confidence: "middle" };
  }

  return { type: "memo", title: text.slice(0, 24) || "無題メモ", body: text, date: todayKey(), confidence: "low" };
}

function collectLegacyMemos(): MemoItem[] {
  const combined: MemoItem[] = [];
  for (const key of bridgeMemoKeys) {
    const items = readArray<AnyRecord>(key);
    for (const item of items) {
      const title = String(item.title ?? item.name ?? "");
      const body = String(item.body ?? item.content ?? item.text ?? item.memo ?? "");
      if (!title && !body) continue;
      combined.push({
        id: String(item.id ?? uid("legacy-memo")),
        title: title || body.slice(0, 26) || "無題メモ",
        body,
        tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
        createdAt: String(item.createdAt ?? item.date ?? new Date().toISOString()),
        source: key,
      });
    }
  }
  return combined;
}

function collectAllMemos() {
  const v59 = readArray<MemoItem>(KEYS.memos);
  const legacy = collectLegacyMemos();
  const seen = new Set<string>();
  return [...v59, ...legacy].filter((memo) => {
    const sig = `${memo.title}:${memo.body}`.slice(0, 180);
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

function collectMoneyFromLocalStorage(): MoneyItem[] {
  const v59 = readArray<MoneyItem>(KEYS.money);
  const extra: MoneyItem[] = [];

  if (typeof window === "undefined") return v59;

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key || key === KEYS.money) continue;

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const stack: unknown[] = Array.isArray(parsed) ? [...parsed] : [parsed];

      while (stack.length) {
        const current = stack.pop();
        if (!current || typeof current !== "object") continue;
        if (Array.isArray(current)) {
          stack.push(...current);
          continue;
        }

        const obj = current as AnyRecord;
        Object.values(obj).forEach((value) => {
          if (value && typeof value === "object") stack.push(value);
        });

        const amountRaw = obj.amount ?? obj.price ?? obj.cost ?? obj.total ?? obj.value ?? obj.amountValue;
        const amount = typeof amountRaw === "number"
          ? amountRaw
          : typeof amountRaw === "string"
            ? Number(amountRaw.replace(/[^\d.-]/g, ""))
            : NaN;

        const text = `${key} ${JSON.stringify(obj)}`;
        if (!Number.isFinite(amount) || amount === 0) continue;
        if (!/家計|支出|出費|円|budget|money|expense|amount|payment|食費|交通/i.test(text)) continue;

        extra.push({
          id: String(obj.id ?? uid("legacy-money")),
          amount: Math.abs(amount),
          category: String(obj.category ?? obj.type ?? "未分類"),
          label: String(obj.title ?? obj.label ?? obj.memo ?? obj.name ?? "支出候補"),
          date: String(obj.date ?? obj.createdAt ?? todayKey()),
          createdAt: String(obj.createdAt ?? new Date().toISOString()),
        });
      }
    } catch {
      // ignore non-json / old format.
    }
  }

  const seen = new Set<string>();
  return [...v59, ...extra].filter((item) => {
    const sig = `${item.date}:${item.amount}:${item.label}`;
    if (seen.has(sig)) return false;
    seen.add(sig);
    return true;
  });
}

function saveQuickAdd(parsed: ParsedQuickAdd) {
  const now = new Date().toISOString();

  if (parsed.type === "money") {
    const item: MoneyItem = {
      id: uid("money"),
      amount: parsed.amount ?? 0,
      category: parsed.category ?? "未分類",
      label: parsed.title,
      date: parsed.date ?? todayKey(),
      createdAt: now,
    };
    writeArray(KEYS.money, [item, ...readArray<MoneyItem>(KEYS.money)].slice(0, 500));
    addLifeXp(6, "家計簿記録");
    return "家計簿候補に保存しました";
  }

  if (parsed.type === "calendar") {
    const item: EventItem = {
      id: uid("event"),
      title: parsed.title,
      date: parsed.date ?? todayKey(),
      time: parsed.time,
      createdAt: now,
    };
    writeArray(KEYS.events, [item, ...readArray<EventItem>(KEYS.events)].slice(0, 300));
    addLifeXp(6, "予定追加");
    return "予定候補に保存しました";
  }

  if (parsed.type === "todo") {
    const item: TodoItem = {
      id: uid("todo"),
      title: parsed.title,
      done: false,
      createdAt: now,
      dueDate: parsed.date,
      source: "quick-add",
    };
    writeArray(KEYS.todos, [item, ...readArray<TodoItem>(KEYS.todos)].slice(0, 500));
    for (const key of bridgeTodoKeys) {
      const current = readArray<unknown>(key);
      writeArray(key, [{ ...item, text: item.title }, ...current].slice(0, 500));
    }
    addLifeXp(5, "TODO追加");
    return "TODO候補に保存しました";
  }

  const memo: MemoItem = {
    id: uid("memo"),
    title: parsed.title,
    body: parsed.body,
    tags: parsed.type === "diary" ? ["diary"] : [],
    createdAt: now,
    source: parsed.type,
  };
  writeArray(KEYS.memos, [memo, ...readArray<MemoItem>(KEYS.memos)].slice(0, 300));
  for (const key of bridgeMemoKeys) {
    const current = readArray<unknown>(key);
    writeArray(key, [{ ...memo, content: memo.body, text: memo.body }, ...current].slice(0, 300));
  }
  addLifeXp(parsed.type === "diary" ? 8 : 5, parsed.type === "diary" ? "Diary記録" : "メモ作成");
  return parsed.type === "diary" ? "Diary候補に保存しました" : "メモに保存しました";
}

function gachaPrize(): Prize {
  const roll = Math.random();
  if (roll < 0.36) {
    const quotes = [
      "小さな行動は、未来の自分への投票。",
      "戻ってこれる人は、何度でも強くなる。",
      "今日の一歩は、見えないところで効いている。",
    ];
    return { id: uid("prize"), title: "名言カード", body: quotes[Math.floor(Math.random() * quotes.length)], rarity: "N", type: "quote", createdAt: new Date().toISOString() };
  }
  if (roll < 0.66) return { id: uid("prize"), title: "バッジ：継続の芽", body: "今日も積み上げた証。", rarity: "R", type: "badge", createdAt: new Date().toISOString() };
  if (roll < 0.86) return { id: uid("prize"), title: "トロフィー：生活の錬金術師", body: "行動を経験値に変えた証。", rarity: "SR", type: "trophy", createdAt: new Date().toISOString() };
  if (roll < 0.95) return { id: uid("prize"), title: "称号：未来港の管理者", body: "Life Hubを動かす者。", rarity: "SSR", type: "title", createdAt: new Date().toISOString() };
  return { id: uid("prize"), title: "ハズレ：空箱", body: "次の一回に運が残っている。", rarity: "N", type: "miss", createdAt: new Date().toISOString() };
}

const templates = {
  habits: [
    { id: "reading", title: "音読10分", emoji: "📖" },
    { id: "walk", title: "散歩・軽い運動", emoji: "👟" },
    { id: "money-check", title: "家計簿を確認", emoji: "💰" },
    { id: "memo", title: "1行メモ", emoji: "📝" },
  ],
  routines: [
    { id: "morning", title: "朝ルーティン", emoji: "🌅", steps: ["水を飲む", "予定を見る", "今日の1つを決める"] },
    { id: "training", title: "筋トレ前ルーティン", emoji: "🔥", steps: ["着替える", "水分準備", "メニュー確認", "軽く動く"] },
    { id: "night", title: "夜ルーティン", emoji: "🌙", steps: ["片付ける", "明日の準備", "スマホを離す"] },
  ],
};

const titleTable = [
  { level: 1, title: "はじまりの記録者" },
  { level: 5, title: "習慣の芽" },
  { level: 10, title: "青春ランナー" },
  { level: 20, title: "生活の錬金術師" },
  { level: 30, title: "未来港の管理者" },
  { level: 50, title: "Life Commander" },
];

function currentLifeLevel() {
  if (typeof window === "undefined") return 1;
  try {
    const raw = window.localStorage.getItem("life-command-os-v52-life-level");
    if (!raw) return 1;
    const parsed = JSON.parse(raw) as { level?: number };
    return Number(parsed.level ?? 1);
  } catch {
    return 1;
  }
}

function Card({ title, kicker, children }: { title: string; kicker?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.35rem] border border-sky-200/20 bg-slate-950/55 p-4 text-white shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
      <div className="mb-3">
        {kicker && <p className="mb-1 text-[11px] font-black uppercase tracking-[.2em] text-sky-100/70">{kicker}</p>}
        <h2 className="text-xl font-black tracking-[-.03em]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Nav() {
  const links = [
    ["/life-hub", "司令塔"],
    ["/quick-add", "Quick Add"],
    ["/memo-to-todo", "メモ→TODO"],
    ["/routine-templates", "テンプレ"],
    ["/titles", "称号"],
    ["/gacha-collection", "ガチャ"],
    ["/money-insights", "家計AI"],
    ["/weekly-review", "週レビュー"],
  ];

  return (
    <nav className="flex flex-wrap gap-2">
      {links.map(([href, label]) => (
        <a key={href} href={href} className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white/85 no-underline">
          {label}
        </a>
      ))}
    </nav>
  );
}

export default function LifeV59FeatureHub({ mode = "home" }: { mode?: Mode }) {
  const [refresh, setRefresh] = useState(0);
  const [quickText, setQuickText] = useState("");
  const [parsed, setParsed] = useState<ParsedQuickAdd | null>(null);
  const [toast, setToast] = useState("");
  const [selectedMemoId, setSelectedMemoId] = useState("");
  const [memoTodos, setMemoTodos] = useState<string[]>([]);
  const [gachaOpen, setGachaOpen] = useState(false);
  const [gachaResult, setGachaResult] = useState<Prize | null>(null);

  const todos = useMemo(() => readArray<TodoItem>(KEYS.todos), [refresh]);
  const memos = useMemo(() => collectAllMemos(), [refresh]);
  const money = useMemo(() => collectMoneyFromLocalStorage(), [refresh]);
  const events = useMemo(() => readArray<EventItem>(KEYS.events), [refresh]);
  const habits = useMemo(() => readArray<HabitItem>(KEYS.habits), [refresh]);
  const routines = useMemo(() => readArray<RoutineItem>(KEYS.routines), [refresh]);
  const prizes = useMemo(() => readArray<Prize>(KEYS.prizes), [refresh]);
  const tickets = useMemo(() => readNumber(KEYS.tickets), [refresh]);
  const level = useMemo(() => currentLifeLevel(), [refresh]);

  const today = todayKey();
  const todayTodos = todos.filter((todo) => !todo.done && (!todo.dueDate || todo.dueDate === today)).slice(0, 6);
  const todayEvents = events.filter((event) => event.date === today).slice(0, 6);
  const todayMoney = money.filter((item) => item.date === today);
  const todayMoneyTotal = todayMoney.reduce((sum, item) => sum + item.amount, 0);

  const runQuickParse = () => setParsed(parseQuickAdd(quickText));

  const confirmQuickAdd = () => {
    if (!parsed) return;
    const message = saveQuickAdd(parsed);
    setToast(message);
    setQuickText("");
    setParsed(null);
    setRefresh((v) => v + 1);
    window.setTimeout(() => setToast(""), 1600);
  };

  const selectedMemo = memos.find((memo) => memo.id === selectedMemoId) ?? memos[0];

  const createTodoCandidates = () => {
    if (!selectedMemo) return;
    const raw = selectedMemo.body || selectedMemo.title;
    const lines = raw
      .split(/\n|。|！|!/)
      .map((line) => line.trim())
      .filter(Boolean);

    const candidates = lines.length
      ? lines.slice(0, 6)
      : [selectedMemo.title];

    setMemoTodos(candidates.map((line) => {
      if (/する|やる|作る|直す|確認|追加|移動|保存/.test(line)) return line;
      return `${line} を確認する`;
    }));
  };

  const saveMemoTodos = () => {
    const now = new Date().toISOString();
    const newTodos = memoTodos.map<TodoItem>((title) => ({ id: uid("todo"), title, done: false, createdAt: now, source: "memo-to-todo" }));
    writeArray(KEYS.todos, [...newTodos, ...todos].slice(0, 500));
    for (const key of bridgeTodoKeys) {
      const current = readArray<unknown>(key);
      writeArray(key, [...newTodos.map((todo) => ({ ...todo, text: todo.title })), ...current].slice(0, 500));
    }
    addLifeXp(6, "メモからTODO化");
    setToast("TODOに追加しました");
    setMemoTodos([]);
    setRefresh((v) => v + 1);
    window.setTimeout(() => setToast(""), 1600);
  };

  const addTemplateHabit = (template: { id: string; title: string; emoji: string }) => {
    const item: HabitItem = { id: uid(template.id), title: template.title, emoji: template.emoji, doneDates: [] };
    writeArray(KEYS.habits, [item, ...habits].slice(0, 100));
    setToast("習慣テンプレートを追加しました");
    setRefresh((v) => v + 1);
  };

  const addTemplateRoutine = (template: { id: string; title: string; emoji: string; steps: string[] }) => {
    const item: RoutineItem = { id: uid(template.id), title: template.title, emoji: template.emoji, steps: template.steps, doneDates: [] };
    writeArray(KEYS.routines, [item, ...routines].slice(0, 100));
    setToast("ルーティンテンプレートを追加しました");
    setRefresh((v) => v + 1);
  };

  const drawGacha = () => {
    const currentTickets = readNumber(KEYS.tickets);
    const hasReadingPoint = (() => {
      try {
        const raw = window.localStorage.getItem("life-command-os-v52-life-level");
        const parsedLife = raw ? JSON.parse(raw) as { readingGachaPoints?: number } : {};
        return Number(parsedLife.readingGachaPoints ?? 0) > 0;
      } catch {
        return false;
      }
    })();

    if (currentTickets <= 0 && !hasReadingPoint) {
      setToast("ガチャ券がないよ。音読やLifeレベルで増やそう。");
      window.setTimeout(() => setToast(""), 1600);
      return;
    }

    if (currentTickets > 0) writeNumber(KEYS.tickets, currentTickets - 1);

    setGachaOpen(true);
    setGachaResult(null);
    window.setTimeout(() => {
      const prize = gachaPrize();
      writeArray(KEYS.prizes, [prize, ...readArray<Prize>(KEYS.prizes)].slice(0, 100));
      setGachaResult(prize);
      setRefresh((v) => v + 1);
    }, 1800);
  };

  const weekStart = startOfWeek(0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const weekMoney = money.filter((item) => inRange(item.date, weekStart, weekEnd));
  const weekMoneyTotal = weekMoney.reduce((sum, item) => sum + item.amount, 0);
  const weekTodosDone = todos.filter((todo) => todo.done && inRange(todo.createdAt, weekStart, weekEnd)).length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 px-4 py-5 text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-4 pb-24">
        <Card title="Life Command OS v59" kicker="Additive Feature Hub">
          <div className="grid gap-3">
            <p className="text-sm font-bold leading-7 text-white/70">
              既存ページを直接壊さないため、追加機能は独立ページとして安全に追加しています。まずここで動作確認して、安定したものだけ既存ページに統合できます。
            </p>
            <Nav />
          </div>
        </Card>

        {mode === "home" && (
          <>
            <Card title="今日の司令塔" kicker="Today Command Center">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl bg-white/10 p-4"><b className="text-2xl">{todayTodos.length}</b><p className="text-sm text-white/65">今日のTODO</p></div>
                <div className="rounded-2xl bg-white/10 p-4"><b className="text-2xl">{todayEvents.length}</b><p className="text-sm text-white/65">今日の予定</p></div>
                <div className="rounded-2xl bg-white/10 p-4"><b className="text-2xl">{yen(todayMoneyTotal)}</b><p className="text-sm text-white/65">今日の支出候補</p></div>
                <div className="rounded-2xl bg-white/10 p-4"><b className="text-2xl">Lv.{level}</b><p className="text-sm text-white/65">Lifeレベル</p></div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-black/20 p-4">
                  <h3 className="font-black">今日やること</h3>
                  {todayTodos.length ? todayTodos.map((todo) => <p key={todo.id} className="mt-2 text-sm text-white/75">✅ {todo.title}</p>) : <p className="mt-2 text-sm text-white/55">今日のTODO候補はまだないよ。</p>}
                </div>
                <div className="rounded-2xl bg-black/20 p-4">
                  <h3 className="font-black">今日の予定</h3>
                  {todayEvents.length ? todayEvents.map((event) => <p key={event.id} className="mt-2 text-sm text-white/75">📅 {event.time ? `${event.time} ` : ""}{event.title}</p>) : <p className="mt-2 text-sm text-white/55">今日の予定候補はまだないよ。</p>}
                </div>
              </div>
            </Card>
          </>
        )}

        {mode === "quick" && (
          <Card title="1行Quick Add強化" kicker="Natural Input">
            <div className="grid gap-3">
              <textarea value={quickText} onChange={(e) => setQuickText(e.target.value)} placeholder="例）明日8:30 ジム / プロテイン 2980円 / 腕立て20回やる / 今日は少し不安だった" className="min-h-28 rounded-2xl border border-sky-200/20 bg-black/30 p-4 font-bold text-white outline-none" />
              <div className="grid gap-2 sm:grid-cols-2">
                <button onClick={runQuickParse} className="rounded-2xl bg-sky-200 px-4 py-3 font-black text-slate-950">AI候補を作る</button>
                <button onClick={() => { setQuickText(""); setParsed(null); }} className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 font-black text-white">クリア</button>
              </div>
              {parsed && (
                <div className="rounded-2xl border border-sky-200/20 bg-black/25 p-4">
                  <p className="text-sm font-black text-sky-100">保存候補: {parsed.type} / confidence: {parsed.confidence}</p>
                  <h3 className="mt-2 text-lg font-black">{parsed.title}</h3>
                  <p className="mt-1 text-sm text-white/65">{parsed.body}</p>
                  {parsed.amount && <p className="mt-2 text-sm text-white/80">金額: {yen(parsed.amount)} / {parsed.category}</p>}
                  {parsed.date && <p className="mt-2 text-sm text-white/80">日付: {dateLabel(parsed.date)} {parsed.time ?? ""}</p>}
                  <button onClick={confirmQuickAdd} className="mt-4 rounded-2xl bg-emerald-200 px-4 py-3 font-black text-slate-950">この内容で保存</button>
                </div>
              )}
            </div>
          </Card>
        )}

        {mode === "memo-todo" && (
          <Card title="メモからTODO化" kicker="Memo To Action">
            <div className="grid gap-3">
              <select value={selectedMemoId} onChange={(e) => setSelectedMemoId(e.target.value)} className="rounded-2xl border border-sky-200/20 bg-slate-950 p-3 font-bold text-white">
                {memos.slice(0, 50).map((memo) => <option key={memo.id} value={memo.id}>{memo.title}</option>)}
              </select>
              <div className="rounded-2xl bg-black/25 p-4 text-sm text-white/70">{selectedMemo?.body || "メモがまだないよ。"}</div>
              <button onClick={createTodoCandidates} className="rounded-2xl bg-sky-200 px-4 py-3 font-black text-slate-950">TODO候補を作る</button>
              {memoTodos.length > 0 && (
                <div className="rounded-2xl bg-black/25 p-4">
                  {memoTodos.map((todo, index) => <p key={`${todo}-${index}`} className="py-1 text-sm">✅ {todo}</p>)}
                  <button onClick={saveMemoTodos} className="mt-3 rounded-2xl bg-emerald-200 px-4 py-3 font-black text-slate-950">TODOに追加</button>
                </div>
              )}
            </div>
          </Card>
        )}

        {mode === "templates" && (
          <Card title="習慣・ルーティンテンプレート" kicker="Templates">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-black/20 p-4">
                <h3 className="font-black">習慣テンプレート</h3>
                {templates.habits.map((template) => <button key={template.id} onClick={() => addTemplateHabit(template)} className="mt-2 block w-full rounded-2xl bg-white/10 px-4 py-3 text-left font-black">{template.emoji} {template.title}</button>)}
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <h3 className="font-black">ルーティンテンプレート</h3>
                {templates.routines.map((template) => <button key={template.id} onClick={() => addTemplateRoutine(template)} className="mt-2 block w-full rounded-2xl bg-white/10 px-4 py-3 text-left font-black">{template.emoji} {template.title}</button>)}
              </div>
            </div>
          </Card>
        )}

        {mode === "titles" && (
          <Card title="Life称号システム" kicker="Title System">
            <div className="grid gap-3">
              <p className="font-bold text-white/70">現在のLifeレベル: Lv.{level}</p>
              <div className="grid gap-2 md:grid-cols-2">
                {titleTable.map((item) => {
                  const unlocked = level >= item.level;
                  return (
                    <div key={item.title} className={`rounded-2xl border p-4 ${unlocked ? "border-emerald-200/30 bg-emerald-300/10" : "border-white/10 bg-white/5 opacity-60"}`}>
                      <b>{unlocked ? item.title : "？？？"}</b>
                      <p className="mt-1 text-sm text-white/65">Lv.{item.level}で解放</p>
                      {unlocked && <button onClick={() => { window.localStorage.setItem(KEYS.selectedTitle, item.title); setToast("称号を設定しました"); }} className="mt-3 rounded-xl bg-white/10 px-3 py-2 text-sm font-black">この称号にする</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}

        {mode === "gacha" && (
          <Card title="音読ガチャ / 景品図鑑" kicker="Gacha Collection">
            <div className="grid gap-3">
              <p className="font-bold text-white/70">v59ガチャ券: {tickets} / 景品: {prizes.length}</p>
              <button onClick={drawGacha} className="rounded-2xl bg-fuchsia-200 px-4 py-3 font-black text-slate-950">ガチャを引く</button>
              <div className="grid gap-2 md:grid-cols-3">
                {prizes.length ? prizes.map((prize) => (
                  <article key={prize.id} className="rounded-2xl bg-black/25 p-4">
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-black">{prize.rarity}</span>
                    <h3 className="mt-2 font-black">{prize.title}</h3>
                    <p className="mt-1 text-sm text-white/65">{prize.body}</p>
                  </article>
                )) : <p className="text-white/60">まだ景品はないよ。</p>}
              </div>
            </div>
          </Card>
        )}

        {mode === "money" && (
          <Card title="支出のAIふりかえり" kicker="Money Insight">
            <div className="grid gap-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <b className="text-2xl">{yen(weekMoneyTotal)}</b>
                <p className="text-sm text-white/65">今週の支出候補 / {weekMoney.length}件</p>
              </div>
              <div className="rounded-2xl bg-black/20 p-4">
                <h3 className="font-black">やさしい分析</h3>
                <p className="mt-2 text-sm leading-7 text-white/70">
                  今週の支出候補は {weekMoney.length}件、合計 {yen(weekMoneyTotal)} です。まずは大きいカテゴリを1つだけ見ると、負担少なく改善できます。
                </p>
                {weekMoney.slice(0, 8).map((item) => <p key={item.id} className="mt-2 text-sm text-white/75">💰 {dateLabel(item.date)} {item.category} {yen(item.amount)} {item.label}</p>)}
              </div>
            </div>
          </Card>
        )}

        {mode === "weekly" && (
          <Card title="週間レビュー" kicker="Weekly Review">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4"><b className="text-2xl">{weekTodosDone}</b><p className="text-sm text-white/65">完了TODO候補</p></div>
              <div className="rounded-2xl bg-white/10 p-4"><b className="text-2xl">{yen(weekMoneyTotal)}</b><p className="text-sm text-white/65">今週の支出候補</p></div>
              <div className="rounded-2xl bg-white/10 p-4"><b className="text-2xl">{habits.length + routines.length}</b><p className="text-sm text-white/65">習慣/ルーティン候補</p></div>
            </div>
            <div className="mt-4 rounded-2xl bg-black/20 p-4">
              <h3 className="font-black">来週のおすすめ</h3>
              <ul className="mt-2 list-disc pl-5 text-sm leading-7 text-white/70">
                <li>Quick Addを使って、予定・TODO・支出を1行で入れる</li>
                <li>音読10分を1回だけ入れて、ガチャポイントを作る</li>
                <li>支出はカテゴリを1つだけ見直す</li>
              </ul>
            </div>
          </Card>
        )}

        {toast && <div className="fixed bottom-5 left-1/2 z-[9999] -translate-x-1/2 rounded-full bg-emerald-200 px-4 py-3 text-sm font-black text-slate-950 shadow-2xl">{toast}</div>}

        {gachaOpen && (
          <div className="fixed inset-0 z-[9998] grid place-items-center bg-slate-950/75 p-4 backdrop-blur">
            <button onClick={() => { if (gachaResult) setGachaOpen(false); }} className="min-h-80 w-full max-w-md rounded-[2rem] border border-sky-200/25 bg-slate-900 p-6 text-center text-white shadow-2xl">
              {!gachaResult ? (
                <div className="grid place-items-center gap-4">
                  <div className="animate-spin text-7xl">🎰</div>
                  <h2 className="text-2xl font-black">ガチャ演出中...</h2>
                </div>
              ) : (
                <div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-black">{gachaResult.rarity}</span>
                  <h2 className="mt-4 text-2xl font-black">{gachaResult.title}</h2>
                  <p className="mt-3 leading-7 text-white/70">{gachaResult.body}</p>
                  <small className="mt-5 block text-sky-100">タップして戻る</small>
                </div>
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
