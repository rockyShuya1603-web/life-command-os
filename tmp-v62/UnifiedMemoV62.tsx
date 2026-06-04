"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AssistMode = "整理" | "注釈" | "分類" | "補助" | "TODO化";

type Attachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: "image" | "file";
  dataUrl?: string;
  text?: string;
  createdAt: string;
};

type MemoRecord = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  category: string;
  attachments: Attachment[];
  createdAt: string;
  updatedAt?: string;
  key: string;
  sig: string;
};

type AssistResult = {
  ok: boolean;
  title?: string;
  body?: string;
  tags?: string[];
  category?: string;
  todos?: string[];
  note?: string;
};

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<unknown> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const PRIMARY_KEY = "life-command-os-v62-unified-memos";

const MEMO_KEYS = [
  PRIMARY_KEY,
  "life-command-os-v61-rich-memos",
  "life-command-os-v60-rich-memos",
  "life-command-os-v59-memos",
  "life-command-os-v58-memos",
  "life-command-os-v57-memos",
  "life-command-os-v53-memos",
  "memos",
  "lifeMemos",
  "life-command-memos",
  "memoEntries",
  "mind-capture-memos",
  "mindCaptureMemos",
  "diaryEntries",
];

const TODO_KEYS = [
  "life-command-os-v59-todos",
  "todos",
  "lifeTodos",
  "life-command-todos",
  "todoEntries",
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 既存データ形式や容量の問題でアプリ全体を落とさない
  }
}

function sigOf(title: string, body: string) {
  return `${title.trim()}::${body.trim()}`.replace(/\s+/g, " ").slice(0, 260);
}

function normalizeMemo(raw: Record<string, unknown>, key: string): MemoRecord | null {
  const title = String(raw.title ?? raw.name ?? raw.label ?? "").trim();
  const body = String(raw.body ?? raw.content ?? raw.text ?? raw.memo ?? raw.note ?? "").trim();
  const attachments = Array.isArray(raw.attachments) ? (raw.attachments as Attachment[]) : [];
  if (!title && !body && !attachments.length) return null;

  const realTitle = title || body.slice(0, 28) || attachments[0]?.name || "無題メモ";
  const realBody = body;
  return {
    id: String(raw.id ?? uid("memo")),
    title: realTitle,
    body: realBody,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    category: String(raw.category ?? raw.type ?? "メモ"),
    attachments,
    createdAt: String(raw.createdAt ?? raw.date ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? new Date().toISOString()),
    key,
    sig: sigOf(realTitle, realBody),
  };
}

function collectMemoKeys() {
  const keys = new Set(MEMO_KEYS);
  if (typeof window === "undefined") return Array.from(keys);

  for (let i = 0; i < window.localStorage.length; i += 1) {
    const key = window.localStorage.key(i);
    if (!key) continue;
    if (/memo|note|diary|mind|capture/i.test(key)) keys.add(key);
  }
  return Array.from(keys);
}

function collectMemos() {
  const seen = new Set<string>();
  const out: MemoRecord[] = [];

  for (const key of collectMemoKeys()) {
    for (const raw of readArray<Record<string, unknown>>(key)) {
      const memo = normalizeMemo(raw, key);
      if (!memo) continue;
      const sig = memo.sig || memo.id;
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push(memo);
    }
  }

  return out.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

function removeMemoEverywhere(target: MemoRecord) {
  for (const key of collectMemoKeys()) {
    const current = readArray<Record<string, unknown>>(key);
    if (!current.length) continue;

    const next = current.filter((item) => {
      const memo = normalizeMemo(item, key);
      if (!memo) return true;
      if (memo.id === target.id) return false;
      if (memo.sig === target.sig) return false;
      return true;
    });

    if (next.length !== current.length) writeArray(key, next);
  }
}

function isMemoPage(page?: unknown) {
  const text = String(page ?? "").toLowerCase();
  if (["memo", "memos", "notes", "note"].includes(text)) return true;
  if (text.includes("memo") || text.includes("メモ")) return true;

  if (typeof window === "undefined") return false;
  const locationText = `${window.location.pathname} ${window.location.hash} ${window.location.search}`.toLowerCase();
  return locationText.includes("memo") || locationText.includes("note") || locationText.includes("メモ");
}

function visible(el: Element) {
  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);
  return rect.height > 0 && rect.width > 0 && style.display !== "none" && style.visibility !== "hidden";
}

function directChildOfMain(el: Element, main: Element) {
  let node: Element = el;
  while (node.parentElement && node.parentElement !== main) node = node.parentElement;
  return node;
}

function hideLegacyMemoBlocks() {
  const main = document.querySelector("main");
  if (!main) return;

  const nodes = Array.from(main.querySelectorAll<HTMLElement>("section, article, div"));
  const targets = nodes
    .filter((node) => visible(node))
    .filter((node) => {
      if (node.id.includes("v62") || node.closest("#life-v62-memo-anchor")) return false;
      const text = (node.textContent || "").replace(/\s+/g, " ");
      const memoish =
        text.includes("メモ常駐AI") ||
        text.includes("探せるメモ") ||
        text.includes("メモを書く…") ||
        text.includes("メモを書く...") ||
        (text.includes("削除") && text.includes("メモ")) ||
        (text.includes("アーカイブ") && text.includes("メモ"));
      if (!memoish) return false;
      const rect = node.getBoundingClientRect();
      return rect.height > 70;
    });

  const hiddenRoots = new Set<Element>();
  for (const target of targets) {
    const root = directChildOfMain(target, main);
    hiddenRoots.add(root);
  }

  hiddenRoots.forEach((root) => root.classList.add("life-v62-legacy-memo-hidden"));
}

function findMemoAnchor() {
  const existing = document.getElementById("life-v62-memo-anchor");
  if (existing) return existing;

  const main = document.querySelector("main");
  if (!main) return null;

  const anchor = document.createElement("div");
  anchor.id = "life-v62-memo-anchor";
  anchor.className = "life-v62-memo-anchor";

  const memoTargets = Array.from(main.querySelectorAll<HTMLElement>("section, article, div"))
    .filter((node) => visible(node))
    .filter((node) => {
      const text = (node.textContent || "").replace(/\s+/g, " ");
      return text.includes("メモ常駐AI") || text.includes("探せるメモ") || text.includes("メモを書く…") || (text.includes("削除") && text.includes("メモ"));
    })
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);

  if (memoTargets[0]) {
    const root = directChildOfMain(memoTargets[0], main);
    root.insertAdjacentElement("beforebegin", anchor);
    return anchor;
  }

  const header = Array.from(main.querySelectorAll<HTMLElement>("header, section, div"))
    .filter((node) => visible(node))
    .find((node) => {
      const text = (node.textContent || "").replace(/\s+/g, " ");
      return text.includes("Life Command OS") && text.includes("検索");
    });

  if (header) {
    directChildOfMain(header, main).insertAdjacentElement("afterend", anchor);
    return anchor;
  }

  main.prepend(anchor);
  return anchor;
}

function titleFromBody(body: string, attachments: Attachment[]) {
  return body
    .split(/\n|。|！|!/)
    .map((line) => line.trim())
    .filter(Boolean)[0]?.slice(0, 28) || attachments[0]?.name || "無題メモ";
}

function addLifeXp(amount: number, label: string) {
  if (typeof window === "undefined") return;
  const helper = (window as unknown as { lifeV52AddExp?: (amount: number, label?: string) => void }).lifeV52AddExp;
  if (typeof helper === "function") helper(amount, label);
}

function localAssist(body: string, mode: AssistMode, attachments: Attachment[]): AssistResult {
  const lines = body.split(/\n|。|！|!/).map((line) => line.trim()).filter(Boolean);
  const title = titleFromBody(body, attachments);
  const category =
    /筋トレ|ジム|ラン|運動|体|プロテイン/.test(body) ? "体づくり" :
    /支出|円|買った|家計|交通費|食費/.test(body) ? "家計" :
    /予定|明日|今日|午前|午後|カレンダー/.test(body) ? "予定" :
    /不安|気分|しんどい|嬉しい|日記/.test(body) ? "Diary" :
    /UI|アプリ|コード|バグ|実装|修正|改造/.test(body) ? "開発" :
    "メモ";

  const tags = Array.from(new Set([category, ...(attachments.length ? ["添付あり"] : []), ...(/TODO|やる|直す|追加|作る|確認/.test(body) ? ["TODO候補"] : [])]));
  const todos = lines.filter((line) => /する|やる|作る|直す|追加|確認|保存|移動|改善|修正|改造/.test(line)).slice(0, 8);

  if (mode === "TODO化") return { ok: true, title, body, tags, category, todos: todos.length ? todos : [`${title}を確認する`], note: "TODO候補を作りました。" };
  if (mode === "分類") return { ok: true, title, body, tags, category, todos, note: `分類候補は「${category}」です。` };
  if (mode === "注釈") return { ok: true, title, body: `${body}\n\n注釈:\n- 後で見返す要点\n- 必要ならTODO化`, tags, category, todos, note: "注釈を追加しました。" };
  if (mode === "補助") return { ok: true, title, body: `${body}\n\n補助メモ:\n- 「${category}」系として扱える\n- 次の行動は1つだけTODOへ`, tags, category, todos, note: "補助文を追加しました。" };
  return { ok: true, title, body: lines.length ? lines.map((line) => `・${line}`).join("\n") : body, tags, category, todos, note: "メモを整理しました。" };
}

function readTextFile(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    if (!/^text\/|json|markdown|csv/.test(file.type) && !/\.(txt|md|json|csv)$/i.test(file.name)) {
      resolve(undefined);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? "").slice(0, 12000));
    reader.onerror = () => resolve(undefined);
    reader.readAsText(file);
  });
}

function resizeImage(file: File): Promise<Attachment> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const max = 1100;
        const scale = Math.min(1, max / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(image, 0, 0, width, height);
        const dataUrl = ctx ? canvas.toDataURL("image/jpeg", 0.76) : String(reader.result ?? "");
        resolve({ id: uid("att"), name: file.name, type: "image/jpeg", size: Math.round(dataUrl.length * 0.75), kind: "image", dataUrl, createdAt: new Date().toISOString() });
      };
      image.onerror = () => resolve({ id: uid("att"), name: file.name, type: file.type, size: file.size, kind: "image", dataUrl: String(reader.result ?? ""), createdAt: new Date().toISOString() });
      image.src = String(reader.result ?? "");
    };
    reader.onerror = () => resolve({ id: uid("att"), name: file.name, type: file.type, size: file.size, kind: "image", createdAt: new Date().toISOString() });
    reader.readAsDataURL(file);
  });
}

async function fileToAttachment(file: File): Promise<Attachment> {
  if (file.type.startsWith("image/")) return resizeImage(file);
  return { id: uid("att"), name: file.name, type: file.type || "application/octet-stream", size: file.size, kind: "file", text: await readTextFile(file), createdAt: new Date().toISOString() };
}

export default function UnifiedMemoV62({ page }: { page?: unknown }) {
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [memos, setMemos] = useState<MemoRecord[]>([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [category, setCategory] = useState("メモ");
  const [assistMode, setAssistMode] = useState<AssistMode>("注釈");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [todos, setTodos] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => setMounted(true), []);

  const shouldShow = useMemo(() => mounted && isMemoPage(page), [mounted, page]);

  const reload = () => {
    setMemos(collectMemos());
    hideLegacyMemoBlocks();
  };

  useEffect(() => {
    if (!shouldShow) return;
    const place = () => {
      setAnchor(findMemoAnchor());
      reload();
    };
    place();
    const timer = window.setInterval(place, 900);
    window.addEventListener("storage", reload);
    window.addEventListener("life-command-data-updated", reload as EventListener);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("storage", reload);
      window.removeEventListener("life-command-data-updated", reload as EventListener);
    };
  }, [shouldShow]);

  if (!shouldShow || !anchor) return null;

  const tags = tagsText.split(/[,\s、]+/).map((tag) => tag.trim()).filter(Boolean);

  const filtered = memos.filter((memo) => {
    const hay = `${memo.title} ${memo.body} ${memo.tags.join(" ")} ${memo.category}`.toLowerCase();
    return hay.includes(query.toLowerCase());
  });

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1700);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const next = await Promise.all(Array.from(files).slice(0, 6).map(fileToAttachment));
      setAttachments((prev) => [...next, ...prev].slice(0, 10));
      showToast(`${next.length}件添付しました`);
    } finally {
      setBusy(false);
    }
  };

  const runAssist = async () => {
    if (!body.trim() && !attachments.length) {
      showToast("本文か添付を入れてね");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/memo/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: assistMode, title, body, tags, category, attachments: attachments.map((file) => ({ name: file.name, type: file.type, kind: file.kind, text: file.text })) }),
      });
      const data = await res.json() as AssistResult;
      const result = data?.ok ? data : localAssist(body, assistMode, attachments);
      if (result.title && !title.trim()) setTitle(result.title);
      if (result.body) setBody(result.body);
      if (result.category) setCategory(result.category);
      if (result.tags?.length) setTagsText(Array.from(new Set([...tags, ...result.tags])).join(" "));
      if (result.todos?.length) setTodos(result.todos);
      showToast(result.note || "AI補助を反映しました");
    } catch {
      const result = localAssist(body, assistMode, attachments);
      if (result.title && !title.trim()) setTitle(result.title);
      if (result.body) setBody(result.body);
      if (result.category) setCategory(result.category);
      if (result.tags?.length) setTagsText(Array.from(new Set([...tags, ...result.tags])).join(" "));
      if (result.todos?.length) setTodos(result.todos);
      showToast(result.note || "ローカル補助を反映しました");
    } finally {
      setBusy(false);
    }
  };

  const saveMemo = () => {
    const now = new Date().toISOString();
    const titleText = title.trim() || titleFromBody(body.trim(), attachments);
    const memo = {
      id: uid("memo"),
      title: titleText,
      body: body.trim(),
      content: body.trim(),
      text: body.trim(),
      tags,
      category,
      attachments,
      hasAttachment: attachments.length > 0,
      attachmentCount: attachments.length,
      createdAt: now,
      updatedAt: now,
      source: "v62-unified-memo",
    };

    const current = readArray<Record<string, unknown>>(PRIMARY_KEY);
    writeArray(PRIMARY_KEY, [memo, ...current].slice(0, 500));

    // 既存キーにも「一度だけ」橋渡し。統一リスト側では重複排除する。
    for (const key of MEMO_KEYS.filter((key) => key !== PRIMARY_KEY)) {
      const arr = readArray<Record<string, unknown>>(key);
      if (arr.length || ["memos", "memoEntries"].includes(key)) {
        const exists = arr.some((item) => {
          const normalized = normalizeMemo(item, key);
          return normalized?.sig === sigOf(memo.title, memo.body);
        });
        if (!exists) writeArray(key, [memo, ...arr].slice(0, 500));
      }
    }

    setTitle("");
    setBody("");
    setTagsText("");
    setCategory("メモ");
    setAttachments([]);
    setTodos([]);
    addLifeXp(10, "メモ作成");
    reload();
    window.dispatchEvent(new CustomEvent("life-command-data-updated", { detail: { type: "memo" } }));
    showToast("メモを保存しました");
  };

  const saveTodos = () => {
    let nextTodos = todos;
    if (!nextTodos.length) {
      nextTodos = localAssist(body, "TODO化", attachments).todos ?? [];
      setTodos(nextTodos);
    }
    if (!nextTodos.length) {
      showToast("TODO候補がないよ");
      return;
    }
    const items = nextTodos.map((todo) => ({ id: uid("todo"), title: todo, text: todo, done: false, completed: false, createdAt: new Date().toISOString(), source: "memo-v62" }));
    for (const key of TODO_KEYS) writeArray(key, [...items, ...readArray<Record<string, unknown>>(key)].slice(0, 500));
    setTodos([]);
    addLifeXp(8, "メモからTODO作成");
    window.dispatchEvent(new CustomEvent("life-command-data-updated", { detail: { type: "todo" } }));
    showToast(`${items.length}件のTODOを保存しました`);
  };

  const deleteMemo = (memo: MemoRecord) => {
    removeMemoEverywhere(memo);
    reload();
    window.dispatchEvent(new CustomEvent("life-command-data-updated", { detail: { type: "memo-delete" } }));
    showToast("メモを削除しました");
  };

  const startVoice = () => {
    const speechWindow = window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Impl = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Impl) {
      showToast("このブラウザでは音声入力が使えないみたい");
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }
    const recognition = new Impl();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => (result as { 0?: { transcript?: string } })[0]?.transcript ?? "").join("");
      setBody((prev) => `${prev}${prev ? "\n" : ""}${transcript}`);
    };
    recognition.onend = () => { recognitionRef.current = null; setListening(false); };
    recognition.onerror = () => { recognitionRef.current = null; setListening(false); showToast("音声入力でエラーが出たよ"); };
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  return createPortal(
    <section id="unified-memo-v62" className="unified-memo-v62">
      <div className="unified-memo-v62-card">
        <div className="unified-memo-v62-head">
          <div>
            <p>UNIFIED MEMO</p>
            <h2>メモを書く</h2>
            <small>作成・検索・削除をここに統一。既存メモより上に固定して、下までスクロールしなくていい形にしたよ。</small>
          </div>
          <span>AI ON</span>
        </div>

        <div className="unified-memo-v62-ai">
          <select value={assistMode} onChange={(event) => setAssistMode(event.target.value as AssistMode)}>
            <option value="注釈">注釈</option>
            <option value="補助">補助</option>
            <option value="分類">分類</option>
            <option value="整理">整理</option>
            <option value="TODO化">TODO化</option>
          </select>
          <button type="button" onClick={runAssist} disabled={busy}>{busy ? "処理中..." : "今のメモをAI補助"}</button>
        </div>

        <div className="unified-memo-v62-form">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="タイトル任意" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="メモを書く…画像も添付できるよ" rows={6} />
          <div className="unified-memo-v62-subgrid">
            <input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="タグ：開発 UI 体づくり など" />
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="分類：メモ" />
          </div>
          <label className="unified-memo-v62-file">
            <input type="file" multiple accept="image/*,.txt,.md,.json,.csv,.pdf" onChange={(event) => handleFiles(event.target.files)} />
            <span>ファイルを選択</span>
            <em>{attachments.length ? `${attachments.length}件選択中` : "選択されていません"}</em>
          </label>

          {attachments.length > 0 && (
            <div className="unified-memo-v62-attachments">
              {attachments.map((file) => (
                <article key={file.id}>
                  {file.kind === "image" && file.dataUrl ? <img src={file.dataUrl} alt={file.name} /> : <div>📎</div>}
                  <p><b>{file.name}</b><small>{Math.round(file.size / 1024)}KB</small></p>
                  <button type="button" onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== file.id))}>×</button>
                </article>
              ))}
            </div>
          )}

          {todos.length > 0 && (
            <div className="unified-memo-v62-todos">
              <b>TODO候補</b>
              {todos.map((todo, index) => (
                <label key={`${todo}-${index}`}><span>✅</span><input value={todo} onChange={(event) => setTodos((prev) => prev.map((item, i) => i === index ? event.target.value : item))} /></label>
              ))}
            </div>
          )}

          <div className="unified-memo-v62-actions">
            <button type="button" onClick={saveMemo}>メモを保存</button>
            <button type="button" onClick={startVoice}>{listening ? "音声停止" : "音声入力"}</button>
            <button type="button" onClick={runAssist}>AIで整理</button>
            <button type="button" onClick={saveTodos}>メモからTODO作成</button>
          </div>
        </div>

        <div className="unified-memo-v62-list">
          <div className="unified-memo-v62-search">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="メモを検索" />
            <span>{filtered.length}件</span>
          </div>
          {filtered.slice(0, 12).map((memo) => (
            <article key={`${memo.key}-${memo.id}-${memo.sig}`}>
              <div>
                <b>{memo.title}</b>
                <p>{memo.body || "添付のみのメモ"}</p>
                <small>{memo.category} / 添付{memo.attachments?.length ?? 0} / {new Date(memo.createdAt).toLocaleString("ja-JP")}</small>
              </div>
              <button type="button" onClick={() => deleteMemo(memo)}>削除</button>
            </article>
          ))}
          {!filtered.length && <p className="unified-memo-v62-empty">メモはまだないよ。</p>}
        </div>

        {toast && <p className="unified-memo-v62-toast">{toast}</p>}
      </div>
    </section>,
    anchor,
  );
}
