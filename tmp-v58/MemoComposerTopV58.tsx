"use client";

import { useEffect, useMemo, useState } from "react";

type MemoItemV58 = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  source: "v58-memo-top";
};

const PRIMARY_KEY = "life-command-os-v58-memos";
const BRIDGE_KEYS = [
  "life-command-os-v57-memos",
  "life-command-os-v53-memos",
  "memos",
  "lifeMemos",
  "life-command-memos",
  "memoEntries",
];

function safeReadArray(key: string): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteArray(key: string, value: unknown[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage容量や形式違いでは落とさない
  }
}

function isMemoPage(page?: unknown) {
  const pageText = String(page ?? "").toLowerCase();
  if (["memo", "memos", "notes", "note"].includes(pageText)) return true;
  if (pageText.includes("memo") || pageText.includes("メモ")) return true;

  if (typeof window === "undefined") return false;
  const locationText = `${window.location.pathname} ${window.location.hash} ${window.location.search}`.toLowerCase();
  return locationText.includes("memo") || locationText.includes("note") || locationText.includes("メモ");
}

function addLifeXp(amount: number, label: string) {
  if (typeof window === "undefined") return;
  const helper = (window as unknown as { lifeV52AddExp?: (amount: number, label?: string) => void }).lifeV52AddExp;
  if (typeof helper === "function") helper(amount, label);
}

export default function MemoComposerTopV58({ page }: { page?: unknown }) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [toast, setToast] = useState("");
  const [recent, setRecent] = useState<MemoItemV58[]>([]);

  useEffect(() => {
    setMounted(true);
    setRecent(safeReadArray(PRIMARY_KEY).filter(Boolean).slice(0, 5) as MemoItemV58[]);
  }, []);

  const shouldShow = useMemo(() => mounted && isMemoPage(page), [mounted, page]);

  if (!shouldShow) return null;

  const saveMemo = () => {
    const titleText = title.trim();
    const bodyText = body.trim();
    const tagList = tags
      .split(/[,\s、]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);

    if (!titleText && !bodyText) {
      setToast("メモ内容を入力してね");
      window.setTimeout(() => setToast(""), 1400);
      return;
    }

    const now = new Date().toISOString();
    const memo: MemoItemV58 = {
      id: `memo-v58-${Date.now()}`,
      title: titleText || bodyText.slice(0, 26) || "無題メモ",
      body: bodyText,
      tags: tagList,
      createdAt: now,
      updatedAt: now,
      source: "v58-memo-top",
    };

    const nextPrimary = [memo, ...safeReadArray(PRIMARY_KEY)].slice(0, 200);
    safeWriteArray(PRIMARY_KEY, nextPrimary);

    // 既存メモ保存形式へ安全に橋渡し。形式が違っても壊さない。
    for (const key of BRIDGE_KEYS) {
      const current = safeReadArray(key);
      const bridged = {
        ...memo,
        content: memo.body,
        text: memo.body,
        page: "memos",
      };
      safeWriteArray(key, [bridged, ...current].slice(0, 300));
    }

    window.dispatchEvent(new CustomEvent("life-command-memo-created", { detail: memo }));
    window.dispatchEvent(new StorageEvent("storage", { key: PRIMARY_KEY }));

    addLifeXp(8, "メモ作成");

    setRecent(nextPrimary.slice(0, 5) as MemoItemV58[]);
    setTitle("");
    setBody("");
    setTags("");
    setToast("メモに保存しました");
    window.setTimeout(() => setToast(""), 1600);
  };

  return (
    <section id="memo-composer-top-v58" className="memo-v58-top" data-memo-top-v58>
      <div className="memo-v58-card">
        <div className="memo-v58-head">
          <div>
            <p>MEMO QUICK WRITE</p>
            <h2>メモをすぐ書く</h2>
            <small>メモページの一番上から、そのまま新しいメモを書けるようにしたよ。</small>
          </div>
          <span>TOP</span>
        </div>

        <div className="memo-v58-form">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="タイトル任意：例）UI改善メモ"
            aria-label="メモタイトル"
          />
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="ここにメモを書く。短文でもOK。"
            rows={5}
            aria-label="メモ本文"
          />
          <input
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            placeholder="タグ任意：例）UI 開発 アイデア"
            aria-label="メモタグ"
          />
          <div className="memo-v58-actions">
            <button type="button" onClick={saveMemo}>メモに保存</button>
            <button type="button" onClick={() => { setTitle(""); setBody(""); setTags(""); }}>クリア</button>
          </div>
          {toast && <p className="memo-v58-toast">{toast}</p>}
        </div>

        {recent.length > 0 && (
          <div className="memo-v58-recent">
            <b>直近保存</b>
            {recent.slice(0, 3).map((memo) => (
              <article key={memo.id}>
                <span>{memo.title}</span>
                <small>{new Date(memo.createdAt).toLocaleString("ja-JP")}</small>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
