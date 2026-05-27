"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AssistMode = "整理" | "注釈" | "分類" | "補助" | "TODO化";

type AttachmentV60 = {
  id: string;
  name: string;
  type: string;
  size: number;
  kind: "image" | "file";
  dataUrl?: string;
  text?: string;
  createdAt: string;
};

type MemoItemV60 = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  category: string;
  attachments: AttachmentV60[];
  createdAt: string;
  updatedAt: string;
  source: "v60-rich-memo-top";
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
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
 .onerror: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

const PRIMARY_KEY = "life-command-os-v60-rich-memos";
const V58_KEY = "life-command-os-v58-memos";
const V59_MEMO_KEY = "life-command-os-v59-memos";
const V59_TODO_KEY = "life-command-os-v59-todos";

const BRIDGE_MEMO_KEYS = [
  "life-command-os-v58-memos",
  "life-command-os-v57-memos",
  "life-command-os-v53-memos",
  "memos",
  "lifeMemos",
  "life-command-memos",
  "memoEntries",
];

const BRIDGE_TODO_KEYS = [
  "life-command-os-v59-todos",
  "todos",
  "lifeTodos",
  "life-command-todos",
  "todoEntries",
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function safeReadArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function safeWriteArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 容量不足や既存形式違いでアプリ本体を落とさない
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

function localAssist(body: string, mode: AssistMode, attachments: AttachmentV60[]): AssistResult {
  const lines = body
    .split(/\n|。|！|!/)
    .map((line) => line.trim())
    .filter(Boolean);

  const baseTitle = lines[0]?.slice(0, 28) || "無題メモ";
  const attachmentNote = attachments.length
    ? `\n\n添付: ${attachments.map((file) => file.name).join(" / ")}`
    : "";

  const category =
    /筋トレ|ジム|ラン|運動|体|プロテイン/.test(body) ? "体づくり" :
    /支出|円|買った|家計|交通費|食費/.test(body) ? "家計" :
    /予定|明日|今日|午前|午後|カレンダー/.test(body) ? "予定" :
    /不安|気分|しんどい|嬉しい|日記/.test(body) ? "Diary" :
    /UI|アプリ|コード|バグ|実装|修正/.test(body) ? "開発" :
    "メモ";

  const tags = Array.from(new Set([
    category,
    ...(/AI|検索|自動/.test(body) ? ["AI"] : []),
    ...(/UI|GUI|デザイン/.test(body) ? ["UI"] : []),
    ...(/TODO|やる|直す|追加|作る/.test(body) ? ["TODO候補"] : []),
    ...(attachments.length ? ["添付あり"] : []),
  ]));

  const todos = lines
    .filter((line) => /する|やる|作る|直す|追加|確認|保存|移動|改善|修正/.test(line))
    .slice(0, 6)
    .map((line) => line.length > 4 ? line : `${line}を確認する`);

  if (mode === "TODO化") {
    return {
      ok: true,
      title: baseTitle,
      body,
      tags,
      category,
      todos: todos.length ? todos : [`${baseTitle}を確認する`],
      note: "メモ本文からTODO候補を作りました。",
    };
  }

  if (mode === "注釈") {
    return {
      ok: true,
      title: baseTitle,
      body: `${body}${attachmentNote}\n\n注釈:\n- 重要そうな点を後で見返せるように残す\n- 次の行動がある場合はTODO化候補へ送れる`,
      tags,
      category,
      todos,
      note: "注釈を追加しました。",
    };
  }

  if (mode === "分類") {
    return {
      ok: true,
      title: baseTitle,
      body,
      tags,
      category,
      todos,
      note: `分類候補は「${category}」です。`,
    };
  }

  if (mode === "補助") {
    return {
      ok: true,
      title: baseTitle,
      body: `${body}${attachmentNote}\n\n補助メモ:\n- これは「${category}」系のメモとして扱えます\n- 次にやるなら「1つだけ行動に変換」が相性良いです`,
      tags,
      category,
      todos,
      note: "メモの補助文を追加しました。",
    };
  }

  return {
    ok: true,
    title: baseTitle,
    body: lines.length ? lines.map((line) => `・${line}`).join("\n") + attachmentNote : body,
    tags,
    category,
    todos,
    note: "メモを読みやすく整理しました。",
  };
}

function resizeImage(file: File): Promise<AttachmentV60> {
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
        if (!ctx) {
          resolve({
            id: uid("att"),
            name: file.name,
            type: file.type,
            size: file.size,
            kind: "image",
            dataUrl: String(reader.result ?? ""),
            createdAt: new Date().toISOString(),
          });
          return;
        }

        ctx.drawImage(image, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.76);

        resolve({
          id: uid("att"),
          name: file.name,
          type: "image/jpeg",
          size: Math.round(dataUrl.length * 0.75),
          kind: "image",
          dataUrl,
          createdAt: new Date().toISOString(),
        });
      };

      image.onerror = () => {
        resolve({
          id: uid("att"),
          name: file.name,
          type: file.type,
          size: file.size,
          kind: "image",
          dataUrl: String(reader.result ?? ""),
          createdAt: new Date().toISOString(),
        });
      };

      image.src = String(reader.result ?? "");
    };

    reader.onerror = () => {
      resolve({
        id: uid("att"),
        name: file.name,
        type: file.type,
        size: file.size,
        kind: "image",
        createdAt: new Date().toISOString(),
      });
    };

    reader.readAsDataURL(file);
  });
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

async function fileToAttachment(file: File): Promise<AttachmentV60> {
  if (file.type.startsWith("image/")) return resizeImage(file);

  return {
    id: uid("att"),
    name: file.name,
    type: file.type || "application/octet-stream",
    size: file.size,
    kind: "file",
    text: await readTextFile(file),
    createdAt: new Date().toISOString(),
  };
}

export default function RichMemoComposerTopV60({ page }: { page?: unknown }) {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [category, setCategory] = useState("メモ");
  const [assistMode, setAssistMode] = useState<AssistMode>("注釈");
  const [attachments, setAttachments] = useState<AttachmentV60[]>([]);
  const [todos, setTodos] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [recent, setRecent] = useState<MemoItemV60[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setMounted(true);
    setRecent(safeReadArray<MemoItemV60>(PRIMARY_KEY).slice(0, 5));
  }, []);

  const shouldShow = useMemo(() => mounted && isMemoPage(page), [mounted, page]);

  if (!shouldShow) return null;

  const tags = tagsText
    .split(/[,\s、]+/)
    .map((tag) => tag.trim())
    .filter(Boolean);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1700);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);

    try {
      const nextFiles = await Promise.all(Array.from(files).slice(0, 6).map(fileToAttachment));
      setAttachments((prev) => [...nextFiles, ...prev].slice(0, 10));
      showToast(`${nextFiles.length}件のファイルを添付しました`);
    } finally {
      setBusy(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((file) => file.id !== id));
  };

  const runAssist = async () => {
    if (!body.trim() && attachments.length === 0) {
      showToast("本文か添付を入れてからAI補助を使ってね");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/memo/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: assistMode,
          title,
          body,
          tags,
          category,
          attachments: attachments.map((file) => ({
            name: file.name,
            type: file.type,
            kind: file.kind,
            text: file.text,
          })),
        }),
      });

      const data = await response.json() as AssistResult;
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

  const startVoice = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionImpl =
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;

    if (!SpeechRecognitionImpl) {
      showToast("このブラウザでは音声入力が使えないみたい");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognitionImpl();
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setBody((prev) => `${prev}${prev ? "\n" : ""}${transcript}`);
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
      showToast("音声入力でエラーが出たよ");
    };

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

  const saveMemo = () => {
    const titleText = title.trim();
    const bodyText = body.trim();

    if (!titleText && !bodyText && attachments.length === 0) {
      showToast("メモ内容か添付を入れてね");
      return;
    }

    const now = new Date().toISOString();
    const memo: MemoItemV60 = {
      id: uid("memo"),
      title: titleText || bodyText.slice(0, 28) || attachments[0]?.name || "無題メモ",
      body: bodyText,
      tags,
      category,
      attachments,
      createdAt: now,
      updatedAt: now,
      source: "v60-rich-memo-top",
    };

    const nextPrimary = [memo, ...safeReadArray<MemoItemV60>(PRIMARY_KEY)].slice(0, 200);
    safeWriteArray(PRIMARY_KEY, nextPrimary);

    for (const key of BRIDGE_MEMO_KEYS) {
      const current = safeReadArray<Record<string, unknown>>(key);
      const bridged = {
        ...memo,
        content: memo.body,
        text: memo.body,
        page: "memos",
        hasAttachment: attachments.length > 0,
        attachmentCount: attachments.length,
      };
      safeWriteArray(key, [bridged, ...current].slice(0, 300));
    }

    // v58/v59専用にも明示保存
    safeWriteArray(V58_KEY, [{ ...memo, content: memo.body, text: memo.body }, ...safeReadArray<Record<string, unknown>>(V58_KEY)].slice(0, 300));
    safeWriteArray(V59_MEMO_KEY, [{ ...memo, content: memo.body, text: memo.body }, ...safeReadArray<Record<string, unknown>>(V59_MEMO_KEY)].slice(0, 300));

    window.dispatchEvent(new CustomEvent("life-command-memo-created", { detail: memo }));
    window.dispatchEvent(new StorageEvent("storage", { key: PRIMARY_KEY }));

    addLifeXp(10, "画像/AI対応メモ作成");

    setRecent(nextPrimary.slice(0, 5));
    setTitle("");
    setBody("");
    setTagsText("");
    setCategory("メモ");
    setAttachments([]);
    setTodos([]);
    showToast("メモを保存しました");
  };

  const saveTodos = () => {
    const now = new Date().toISOString();
    const todoItems = todos
      .map((todo) => todo.trim())
      .filter(Boolean)
      .map((todo) => ({
        id: uid("todo"),
        title: todo,
        text: todo,
        done: false,
        completed: false,
        createdAt: now,
        source: "memo-ai",
      }));

    if (!todoItems.length) {
      const result = localAssist(body, "TODO化", attachments);
      setTodos(result.todos ?? []);
      showToast("TODO候補を作りました");
      return;
    }

    for (const key of BRIDGE_TODO_KEYS) {
      const current = safeReadArray<Record<string, unknown>>(key);
      safeWriteArray(key, [...todoItems, ...current].slice(0, 500));
    }

    safeWriteArray(V59_TODO_KEY, [...todoItems, ...safeReadArray<Record<string, unknown>>(V59_TODO_KEY)].slice(0, 500));

    addLifeXp(8, "メモからTODO作成");
    setTodos([]);
    showToast("TODOに保存しました");
  };

  return (
    <section id="rich-memo-composer-top-v60" className="rich-memo-v60-top" data-rich-memo-v60>
      <div className="rich-memo-v60-card">
        <div className="rich-memo-v60-head">
          <div>
            <p>RICH MEMO WRITE</p>
            <h2>メモを書く</h2>
            <small>画像添付・AI補助・分類・TODO化まで、この一番上のコーナーでできるようにしたよ。</small>
          </div>
          <span>AI ON</span>
        </div>

        <div className="rich-memo-v60-ai">
          <select value={assistMode} onChange={(event) => setAssistMode(event.target.value as AssistMode)} aria-label="AI補助モード">
            <option value="注釈">注釈</option>
            <option value="付け足し">補助</option>
            <option value="分類">分類</option>
            <option value="整理">整理</option>
            <option value="TODO化">TODO化</option>
          </select>
          <button type="button" onClick={runAssist} disabled={busy}>
            {busy ? "処理中..." : "今のメモをAI補助"}
          </button>
        </div>

        <div className="rich-memo-v60-form">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="タイトル任意" aria-label="メモタイトル" />
          <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder="メモを書く…画像も添付できるよ" rows={6} aria-label="メモ本文" />
          <div className="rich-memo-v60-subgrid">
            <input value={tagsText} onChange={(event) => setTagsText(event.target.value)} placeholder="タグ：開発 UI 体づくり など" aria-label="タグ" />
            <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="分類：メモ" aria-label="分類" />
          </div>

          <label className="rich-memo-v60-file">
            <input type="file" multiple accept="image/*,.txt,.md,.json,.csv,.pdf" onChange={(event) => handleFiles(event.target.files)} />
            <span>ファイルを選択</span>
            <em>{attachments.length ? `${attachments.length}件選択中` : "選択されていません"}</em>
          </label>

          {attachments.length > 0 && (
            <div className="rich-memo-v60-attachments">
              {attachments.map((file) => (
                <article key={file.id}>
                  {file.kind === "image" && file.dataUrl ? <img src={file.dataUrl} alt={file.name} /> : <div className="rich-memo-v60-fileicon">📎</div>}
                  <div>
                    <b>{file.name}</b>
                    <small>{file.type || "file"} / {Math.round(file.size / 1024)}KB</small>
                  </div>
                  <button type="button" onClick={() => removeAttachment(file.id)}>×</button>
                </article>
              ))}
            </div>
          )}

          {todos.length > 0 && (
            <div className="rich-memo-v60-todos">
              <b>TODO候補</b>
              {todos.map((todo, index) => (
                <label key={`${todo}-${index}`}>
                  <span>✅</span>
                  <input value={todo} onChange={(event) => setTodos((prev) => prev.map((item, i) => i === index ? event.target.value : item))} />
                </label>
              ))}
            </div>
          )}

          <div className="rich-memo-v60-actions">
            <button type="button" onClick={saveMemo}>メモを保存</button>
            <button type="button" onClick={startVoice}>{listening ? "音声停止" : "音声入力"}</button>
            <button type="button" onClick={runAssist} disabled={busy}>AIで整理</button>
            <button type="button" onClick={saveTodos}>メモからTODO作成</button>
          </div>

          {toast && <p className="rich-memo-v60-toast">{toast}</p>}
        </div>

        {recent.length > 0 && (
          <div className="rich-memo-v60-recent">
            <b>最近保存したメモ</b>
            {recent.slice(0, 3).map((memo) => (
              <article key={memo.id}>
                <span>{memo.title}</span>
                <small>{memo.category} / 添付{memo.attachments?.length ?? 0}</small>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
