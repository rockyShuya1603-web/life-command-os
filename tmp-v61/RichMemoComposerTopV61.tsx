"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type AssistMode = "注釈" | "補助" | "分類" | "整理" | "TODO化";
type Attachment = { id: string; name: string; type: string; size: number; kind: "image" | "file"; dataUrl?: string; text?: string; createdAt: string };
type Memo = { id: string; title: string; body: string; tags: string[]; category: string; attachments: Attachment[]; createdAt: string; updatedAt: string; source: "v61-rich-memo" };

const MEMO_KEYS = [
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
];
const TODO_KEYS = ["life-command-os-v59-todos", "todos", "lifeTodos", "life-command-todos", "todoEntries"];

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch { return []; }
}

function writeArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function isMemoPage(page?: unknown) {
  const p = String(page ?? "").toLowerCase();
  if (["memo","memos","note","notes"].includes(p) || p.includes("memo") || p.includes("メモ")) return true;
  if (typeof window === "undefined") return false;
  const loc = `${location.pathname} ${location.hash} ${location.search}`.toLowerCase();
  return loc.includes("memo") || loc.includes("note") || loc.includes("メモ");
}

function titleFrom(body: string, files: Attachment[]) {
  return body.split(/\n|。|！|!/).map(s => s.trim()).filter(Boolean)[0]?.slice(0, 28) || files[0]?.name || "無題メモ";
}

function localAssist(body: string, mode: AssistMode, files: Attachment[]) {
  const lines = body.split(/\n|。|！|!/).map(s => s.trim()).filter(Boolean);
  const category =
    /筋トレ|ジム|ラン|運動|体|プロテイン/.test(body) ? "体づくり" :
    /支出|円|買った|家計|交通費|食費/.test(body) ? "家計" :
    /予定|明日|今日|午前|午後|カレンダー/.test(body) ? "予定" :
    /不安|気分|しんどい|嬉しい|日記/.test(body) ? "Diary" :
    /UI|アプリ|コード|バグ|実装|修正/.test(body) ? "開発" : "メモ";
  const tags = Array.from(new Set([category, ...(files.length ? ["添付あり"] : []), ...(/TODO|やる|直す|追加|作る/.test(body) ? ["TODO候補"] : [])]));
  const todos = lines.filter(l => /する|やる|作る|直す|追加|確認|保存|移動|改善|修正|改造/.test(l)).slice(0,8);
  const attach = files.length ? `\n\n添付: ${files.map(f => f.name).join(" / ")}` : "";
  if (mode === "TODO化") return { ok:true, title:titleFrom(body, files), body, tags, category, todos: todos.length ? todos : [`${titleFrom(body, files)}を確認する`], note:"TODO候補を作りました" };
  if (mode === "分類") return { ok:true, title:titleFrom(body, files), body, tags, category, todos, note:`分類候補は「${category}」です` };
  if (mode === "補助") return { ok:true, title:titleFrom(body, files), body:`${body}${attach}\n\n補助メモ:\n- 「${category}」系のメモとして扱えます\n- 次の行動を1つだけTODO化すると使いやすいです`, tags, category, todos, note:"補助文を追加しました" };
  if (mode === "注釈") return { ok:true, title:titleFrom(body, files), body:`${body}${attach}\n\n注釈:\n- 後で見返す要点\n- 次にやることはTODO化できる`, tags, category, todos, note:"注釈を追加しました" };
  return { ok:true, title:titleFrom(body, files), body: lines.length ? lines.map(l => `・${l}`).join("\n") + attach : body, tags, category, todos, note:"メモを整理しました" };
}

function getAnchor() {
  const old = document.getElementById("life-v61-memo-anchor");
  if (old) return old;
  const main = document.querySelector("main");
  if (!main) return null;
  const children = Array.from(main.children).filter(el => !["rich-memo-composer-top-v61","rich-memo-composer-top-v60","memo-composer-top-v58"].includes(el.id));
  let target: Element | null = null;
  for (const el of children) {
    const text = (el.textContent || "").replace(/\s+/g, " ");
    const rect = el.getBoundingClientRect();
    if (rect.height > 0 && text.includes("Life Command OS") && (text.includes("検索") || rect.top < 280)) { target = el; break; }
  }
  if (!target) target = children.find(el => el.getBoundingClientRect().height > 0) || null;
  const anchor = document.createElement("div");
  anchor.id = "life-v61-memo-anchor";
  anchor.className = "life-v61-memo-anchor";
  if (target?.parentElement) target.insertAdjacentElement("afterend", anchor);
  else main.prepend(anchor);
  return anchor;
}

function saveMemoEverywhere(memo: Memo) {
  const bridged = { ...memo, content: memo.body, text: memo.body, memo: memo.body, page: "memos", hasAttachment: memo.attachments.length > 0, attachmentCount: memo.attachments.length };
  const keys = new Set(MEMO_KEYS);
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && /memo|note|diary|mind|capture/i.test(k)) keys.add(k);
  }
  keys.forEach(k => {
    const cur = readArray<any>(k);
    if (cur.length || MEMO_KEYS.includes(k)) writeArray(k, [bridged, ...cur].slice(0, 400));
  });
  window.dispatchEvent(new CustomEvent("life-command-memo-created", { detail: memo }));
  window.dispatchEvent(new CustomEvent("life-command-data-updated", { detail: { type: "memo", memo } }));
  window.dispatchEvent(new StorageEvent("storage", { key: "life-command-os-v61-rich-memos" }));
}

function saveTodosEverywhere(todos: string[]) {
  const now = new Date().toISOString();
  const items = todos.map(t => t.trim()).filter(Boolean).map(t => ({ id: uid("todo"), title: t, text: t, done: false, completed: false, createdAt: now, source: "memo-ai-v61" }));
  TODO_KEYS.forEach(k => writeArray(k, [...items, ...readArray<any>(k)].slice(0,500)));
  window.dispatchEvent(new CustomEvent("life-command-data-updated", { detail: { type: "todo" } }));
  return items.length;
}

function fileToAttachment(file: File): Promise<Attachment> {
  if (!file.type.startsWith("image/")) {
    return new Promise(resolve => {
      if (/^text\/|json|markdown|csv/.test(file.type) || /\.(txt|md|json|csv)$/i.test(file.name)) {
        const r = new FileReader();
        r.onload = () => resolve({ id: uid("att"), name: file.name, type: file.type || "text/plain", size: file.size, kind: "file", text: String(r.result || "").slice(0,12000), createdAt: new Date().toISOString() });
        r.onerror = () => resolve({ id: uid("att"), name: file.name, type: file.type || "file", size: file.size, kind: "file", createdAt: new Date().toISOString() });
        r.readAsText(file);
      } else resolve({ id: uid("att"), name: file.name, type: file.type || "file", size: file.size, kind: "file", createdAt: new Date().toISOString() });
    });
  }
  return new Promise(resolve => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1100, scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve({ id: uid("att"), name: file.name, type: file.type, size: file.size, kind: "image", dataUrl: String(r.result || ""), createdAt: new Date().toISOString() });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", .76);
        resolve({ id: uid("att"), name: file.name, type: "image/jpeg", size: Math.round(dataUrl.length * .75), kind: "image", dataUrl, createdAt: new Date().toISOString() });
      };
      img.onerror = () => resolve({ id: uid("att"), name: file.name, type: file.type, size: file.size, kind: "image", dataUrl: String(r.result || ""), createdAt: new Date().toISOString() });
      img.src = String(r.result || "");
    };
    r.onerror = () => resolve({ id: uid("att"), name: file.name, type: file.type, size: file.size, kind: "image", createdAt: new Date().toISOString() });
    r.readAsDataURL(file);
  });
}

export default function RichMemoComposerTopV61({ page }: { page?: unknown }) {
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [category, setCategory] = useState("メモ");
  const [mode, setMode] = useState<AssistMode>("注釈");
  const [files, setFiles] = useState<Attachment[]>([]);
  const [todos, setTodos] = useState<string[]>([]);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => setMounted(true), []);
  const show = useMemo(() => mounted && isMemoPage(page), [mounted, page]);

  useEffect(() => {
    if (!show) return;
    const place = () => setAnchor(getAnchor());
    place();
    const t = window.setInterval(place, 900);
    return () => window.clearInterval(t);
  }, [show]);

  if (!show || !anchor) return null;

  const toastNow = (msg: string) => { setToast(msg); window.setTimeout(() => setToast(""), 1800); };
  const tags = tagsText.split(/[,\s、]+/).map(s => s.trim()).filter(Boolean);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setBusy(true);
    try {
      const next = await Promise.all(Array.from(list).slice(0,6).map(fileToAttachment));
      setFiles(prev => [...next, ...prev].slice(0,10));
      toastNow(`${next.length}件のファイルを添付しました`);
    } finally { setBusy(false); }
  };

  const assist = async () => {
    if (!body.trim() && files.length === 0) return toastNow("本文か添付を入れてね");
    setBusy(true);
    try {
      const res = await fetch("/api/memo/assist", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ mode, title, body, tags, category, attachments: files.map(f => ({ name:f.name, type:f.type, kind:f.kind, text:f.text })) }) });
      const data = await res.json();
      const result = data?.ok ? data : localAssist(body, mode, files);
      if (result.title && !title.trim()) setTitle(result.title);
      if (result.body) setBody(result.body);
      if (result.category) setCategory(result.category);
      if (result.tags?.length) setTagsText(Array.from(new Set([...tags, ...result.tags])).join(" "));
      if (result.todos?.length) setTodos(result.todos);
      toastNow(result.note || "AI補助を反映しました");
    } catch {
      const result = localAssist(body, mode, files);
      if (result.title && !title.trim()) setTitle(result.title);
      if (result.body) setBody(result.body);
      if (result.category) setCategory(result.category);
      if (result.tags?.length) setTagsText(Array.from(new Set([...tags, ...result.tags])).join(" "));
      if (result.todos?.length) setTodos(result.todos);
      toastNow(result.note || "ローカル補助を反映しました");
    } finally { setBusy(false); }
  };

  const voice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return toastNow("このブラウザでは音声入力が使えないみたい");
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; setListening(false); return; }
    const rec = new SR();
    rec.lang = "ja-JP"; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (e: any) => setBody(prev => `${prev}${prev ? "\n" : ""}${Array.from(e.results).map((r: any) => r[0]?.transcript ?? "").join("")}`);
    rec.onend = () => { recognitionRef.current = null; setListening(false); };
    rec.onerror = () => { recognitionRef.current = null; setListening(false); toastNow("音声入力でエラーが出たよ"); };
    recognitionRef.current = rec; setListening(true); rec.start();
  };

  const save = () => {
    const bodyText = body.trim();
    const titleText = title.trim();
    if (!titleText && !bodyText && files.length === 0) return toastNow("メモ内容か添付を入れてね");
    const now = new Date().toISOString();
    const memo: Memo = { id: uid("memo"), title: titleText || titleFrom(bodyText, files), body: bodyText, tags, category, attachments: files, createdAt: now, updatedAt: now, source: "v61-rich-memo" };
    saveMemoEverywhere(memo);
    try { const fn = (window as any).lifeV52AddExp; if (typeof fn === "function") fn(10, "画像/AI対応メモ作成"); } catch {}
    setTitle(""); setBody(""); setTagsText(""); setCategory("メモ"); setFiles([]); setTodos([]);
    toastNow("メモを保存しました");
  };

  const saveTodos = () => {
    let next = todos;
    if (!next.length) {
      const r = localAssist(body, "TODO化", files);
      next = r.todos ?? [];
      setTodos(next);
      if (!next.length) return toastNow("TODO候補が見つからなかったよ");
    }
    const n = saveTodosEverywhere(next);
    try { const fn = (window as any).lifeV52AddExp; if (typeof fn === "function") fn(8, "メモからTODO作成"); } catch {}
    setTodos([]);
    toastNow(`${n}件のTODOを保存しました`);
  };

  return createPortal(
    <section id="rich-memo-composer-top-v61" className="rich-memo-v61-top">
      <div className="rich-memo-v61-card">
        <div className="rich-memo-v61-head">
          <div><p>RICH MEMO WRITE</p><h2>メモを書く</h2><small>Life Command OSのタイトル下に自然に配置。画像添付・AI補助・分類・TODO化まで使えるよ。</small></div>
          <span>AI ON</span>
        </div>
        <div className="rich-memo-v61-ai">
          <select value={mode} onChange={e => setMode(e.target.value as AssistMode)}>
            <option value="注釈">注釈</option><option value="補助">補助</option><option value="分類">分類</option><option value="整理">整理</option><option value="TODO化">TODO化</option>
          </select>
          <button type="button" onClick={assist} disabled={busy}>{busy ? "処理中..." : "今のメモをAI補助"}</button>
        </div>
        <div className="rich-memo-v61-form">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="タイトル任意" />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="メモを書く…画像も添付できるよ" rows={6} />
          <div className="rich-memo-v61-subgrid">
            <input value={tagsText} onChange={e => setTagsText(e.target.value)} placeholder="タグ：開発 UI 体づくり など" />
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="分類：メモ" />
          </div>
          <label className="rich-memo-v61-file"><input type="file" multiple accept="image/*,.txt,.md,.json,.csv,.pdf" onChange={e => onFiles(e.target.files)} /><span>ファイルを選択</span><em>{files.length ? `${files.length}件選択中` : "選択されていません"}</em></label>
          {files.length > 0 && <div className="rich-memo-v61-attachments">{files.map(f => <article key={f.id}>{f.kind==="image" && f.dataUrl ? <img src={f.dataUrl} alt={f.name} /> : <div className="rich-memo-v61-fileicon">📎</div>}<div><b>{f.name}</b><small>{f.type || "file"} / {Math.round(f.size/1024)}KB</small></div><button type="button" onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}>×</button></article>)}</div>}
          {todos.length > 0 && <div className="rich-memo-v61-todos"><b>TODO候補</b>{todos.map((t,i) => <label key={`${t}-${i}`}><span>✅</span><input value={t} onChange={e => setTodos(prev => prev.map((x,j) => i===j ? e.target.value : x))} /></label>)}</div>}
          <div className="rich-memo-v61-actions"><button type="button" onClick={save}>メモを保存</button><button type="button" onClick={voice}>{listening ? "音声停止" : "音声入力"}</button><button type="button" onClick={assist} disabled={busy}>AIで整理</button><button type="button" onClick={saveTodos}>メモからTODO作成</button></div>
          {toast && <p className="rich-memo-v61-toast">{toast}</p>}
        </div>
      </div>
    </section>,
    anchor
  );
}
