"use client";

import { useEffect, useMemo, useState } from "react";

type MoneyRecord = {
  amount: number;
  date: string | null;
  category: string;
  label: string;
  sourceKey: string;
};

type LocalBundle = {
  money: MoneyRecord[];
  memos: Array<Record<string, unknown>>;
  todos: Array<Record<string, unknown>>;
  events: Array<Record<string, unknown>>;
  rawKeys: string[];
};

type SearchResult = {
  ok: boolean;
  mode: string;
  intent: string;
  summary: string;
  details?: string[];
  suggestions?: string[];
  actions?: string[];
};

function yen(amount: number) {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function parseDateValue(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function flattenRecords(value: unknown, sourceKey: string, out: Array<Record<string, unknown>> = []) {
  if (!value || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    value.forEach((item) => flattenRecords(item, sourceKey, out));
    return out;
  }
  const obj = value as Record<string, unknown>;
  out.push({ ...obj, __sourceKey: sourceKey });
  Object.values(obj).forEach((nested) => {
    if (nested && typeof nested === "object") flattenRecords(nested, sourceKey, out);
  });
  return out;
}

function collectLocalBundle(): LocalBundle {
  const bundle: LocalBundle = { money: [], memos: [], todos: [], events: [], rawKeys: [] };
  if (typeof window === "undefined") return bundle;

  const records: Array<Record<string, unknown>> = [];
  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    bundle.rawKeys.push(key);
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      flattenRecords(parsed, key, records);
    } catch {
      // JSON以外は検索対象外
    }
  }

  for (const obj of records) {
    const sourceKey = String(obj.__sourceKey ?? "");
    const text = JSON.stringify(obj).toLowerCase();

    const amountCandidate =
      obj.amount ?? obj.value ?? obj.price ?? obj.cost ?? obj.total ?? obj.money ?? obj.amountValue;

    const amount = typeof amountCandidate === "number"
      ? amountCandidate
      : typeof amountCandidate === "string"
        ? Number(amountCandidate.replace(/[^\d.-]/g, ""))
        : NaN;

    const date =
      parseDateValue(obj.date) ??
      parseDateValue(obj.createdAt) ??
      parseDateValue(obj.updatedAt) ??
      parseDateValue(obj.paidAt) ??
      parseDateValue(obj.datetime);

    const title = String(obj.title ?? obj.label ?? obj.name ?? obj.memo ?? obj.description ?? obj.body ?? obj.text ?? "");
    const category = String(obj.category ?? obj.type ?? obj.genre ?? "未分類");

    const looksMoney = Number.isFinite(amount) && amount !== 0 && (
      /budget|money|expense|income|家計|支出|収入|payment|zaim/i.test(sourceKey) ||
      /円|支出|収入|交通|カフェ|コンビニ|スーパー|食費|家計|expense|income|amount/.test(text)
    );

    if (looksMoney) {
      bundle.money.push({ amount: Math.abs(amount), date, category, label: title || category, sourceKey });
    }

    if (/memo|note|diary|メモ|日記/i.test(sourceKey) || /memo|note|diary|メモ|日記/.test(text)) {
      bundle.memos.push(obj);
    }

    if (/todo|task|タスク|やること/i.test(sourceKey) || /todo|task|未完了|完了|タスク/.test(text)) {
      bundle.todos.push(obj);
    }

    if (/calendar|event|予定|schedule/i.test(sourceKey) || /予定|カレンダー|event|schedule/.test(text)) {
      bundle.events.push(obj);
    }
  }

  return bundle;
}

function previousWeekRange() {
  const now = new Date();
  const day = now.getDay() || 7;
  const thisMonday = new Date(now);
  thisMonday.setHours(0, 0, 0, 0);
  thisMonday.setDate(now.getDate() - day + 1);

  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - 7);
  const end = new Date(thisMonday);
  end.setDate(thisMonday.getDate() - 1);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

function thisMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function inRange(dateStr: string | null, start: Date, end: Date) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
}

function localAnalyze(query: string, bundle: LocalBundle): SearchResult {
  const isMoney = /支出|家計|円|使った|出費|収入/.test(query);
  const isLastWeek = /先週/.test(query);
  const isThisMonth = /今月/.test(query);

  if (isMoney) {
    const range = isLastWeek ? previousWeekRange() : isThisMonth ? thisMonthRange() : null;
    const target = range ? bundle.money.filter((m) => inRange(m.date, range.start, range.end)) : bundle.money;
    const total = target.reduce((sum, item) => sum + item.amount, 0);
    const byCategory = new Map<string, number>();
    target.forEach((item) => byCategory.set(item.category || "未分類", (byCategory.get(item.category || "未分類") ?? 0) + item.amount));
    const details = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, amount]) => `${cat}: ${yen(amount)}`);
    const label = isLastWeek ? "先週" : isThisMonth ? "今月" : "全期間の候補";

    return {
      ok: true,
      mode: "client-local",
      intent: "money",
      summary: target.length
        ? `${label}の支出候補は ${target.length}件、合計 ${yen(total)} です。`
        : `${label}の支出候補は見つかりませんでした。家計簿データの保存形式が違う可能性があります。`,
      details,
      suggestions: ["家計簿ページの保存キーを統一すると精度が上がります", "日付と金額があるデータを優先して集計しています"],
      actions: ["家計簿ページへ", "支出メモに保存", "カテゴリ別に見る"],
    };
  }

  if (/TODO|タスク|未完了/.test(query)) {
    return {
      ok: true,
      mode: "client-local",
      intent: "todo",
      summary: `TODO候補を ${bundle.todos.length}件見つけました。`,
      details: bundle.todos.slice(0, 5).map((t) => String(t.title ?? t.text ?? t.body ?? "無題TODO")),
      suggestions: ["未完了だけに絞る", "今日やるものだけ表示する"],
      actions: ["TODOページへ", "今日のTODOへ追加"],
    };
  }

  if (/予定|カレンダー|明日|今日/.test(query)) {
    return {
      ok: true,
      mode: "client-local",
      intent: "calendar",
      summary: `予定候補を ${bundle.events.length}件見つけました。`,
      details: bundle.events.slice(0, 5).map((e) => String(e.title ?? e.name ?? e.text ?? "無題予定")),
      suggestions: ["今日/明日で絞る", "通知つきで追加する"],
      actions: ["カレンダーへ", "TODOにも送る"],
    };
  }

  return {
    ok: true,
    mode: "client-local",
    intent: "general",
    summary: `ローカルデータを横断しました。メモ ${bundle.memos.length}件、TODO候補 ${bundle.todos.length}件、予定候補 ${bundle.events.length}件、家計候補 ${bundle.money.length}件を確認できます。`,
    details: bundle.memos.slice(0, 5).map((m) => String(m.title ?? m.body ?? m.text ?? "無題メモ")),
    suggestions: ["先週の支出を教えて", "未完了TODOを教えて", "明日の予定を教えて"],
    actions: ["メモへ", "TODOへ", "家計簿へ"],
  };
}

export default function LifeTopSearchBoostV54({ setPage }: { setPage?: (p: any) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const bundle = useMemo(() => (open ? collectLocalBundle() : null), [open]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.closest("#life-top-search-boost-v54")) return;
      const candidate = target.closest("button, div, span, input, a") as HTMLElement | null;
      if (!candidate) return;

      const text = `${candidate.getAttribute("aria-label") ?? ""} ${candidate.getAttribute("placeholder") ?? ""} ${candidate.textContent ?? ""}`;
      const isSearch = text.includes("検索") || candidate.className.toString().includes("search");
      const nearTop = candidate.getBoundingClientRect().top < 260;
      if (isSearch && nearTop) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  const run = async (nextQuery = query) => {
    const q = nextQuery.trim();
    if (!q) return;
    const currentBundle = collectLocalBundle();
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/life-ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, clientData: currentBundle }),
      });
      const data = await response.json();
      if (data?.ok) setResult(data);
      else setResult(localAnalyze(q, currentBundle));
    } catch {
      setResult(localAnalyze(q, currentBundle));
    } finally {
      setLoading(false);
    }
  };

  const sample = (text: string) => {
    setQuery(text);
    run(text);
  };

  if (!open) return null;

  return (
    <div id="life-top-search-boost-v54" className="life-v54-search-overlay" role="dialog" aria-modal="true">
      <div className="life-v54-search-modal">
        <div className="life-v54-search-head">
          <div>
            <p>AI SEARCH BOOST</p>
            <h2>上部AI検索</h2>
            <small>家計簿・メモ・TODO・予定・習慣を横断して探すよ。</small>
          </div>
          <button type="button" onClick={() => setOpen(false)}>×</button>
        </div>

        <div className="life-v54-search-input">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") run(); }}
            autoFocus
            placeholder="例）先週の支出を教えて"
          />
          <button type="button" onClick={() => run()} disabled={loading}>{loading ? "検索中" : "検索"}</button>
        </div>

        <div className="life-v54-search-chips">
          {["先週の支出を教えて", "今月の支出を教えて", "未完了TODOを教えて", "明日の予定を教えて"].map((item) => (
            <button key={item} type="button" onClick={() => sample(item)}>{item}</button>
          ))}
        </div>

        <div className="life-v54-search-dataset">
          <span>家計 {bundle?.money.length ?? 0}</span>
          <span>メモ {bundle?.memos.length ?? 0}</span>
          <span>TODO {bundle?.todos.length ?? 0}</span>
          <span>予定 {bundle?.events.length ?? 0}</span>
        </div>

        {result && (
          <div className="life-v54-search-result">
            <span>{result.intent}</span>
            <h3>{result.summary}</h3>
            {!!result.details?.length && (
              <ul>{result.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
            )}
            <div>
              {result.actions?.map((action) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    if (action.includes("家計")) setPage?.("budget");
                    else if (action.includes("TODO")) setPage?.("todos");
                    else if (action.includes("カレンダー") || action.includes("予定")) setPage?.("calendar");
                    else if (action.includes("メモ")) setPage?.("memos");
                  }}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
