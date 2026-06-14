"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  events?: any[];
  todos?: any[];
  selected?: string;
  setSelected?: (date: string) => void;
  refreshSnapshot?: () => Promise<void> | void;
};

type Candidate = {
  title: string;
  date?: string | null;
  time?: string | null;
  note?: string;
  confidence?: number;
  sourceText?: string;
};

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

function normalizeDate(value?: string | null) {
  const raw = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})[T\s]/);
  return m ? m[1] : "";
}

function dateFromText(text: string) {
  const now = todayKey();
  if (/今日|本日/.test(text)) return now;
  if (/明日/.test(text)) return addDays(now, 1);
  if (/明後日|あさって/.test(text)) return addDays(now, 2);

  const ymd = text.match(/(20\d{2})[-\/年](\d{1,2})[-\/月](\d{1,2})日?/);
  if (ymd) return `${ymd[1]}-${String(Number(ymd[2])).padStart(2, "0")}-${String(Number(ymd[3])).padStart(2, "0")}`;

  const md = text.match(/(\d{1,2})[\/月](\d{1,2})日?/);
  if (md) {
    const y = new Date().getFullYear();
    return `${y}-${String(Number(md[1])).padStart(2, "0")}-${String(Number(md[2])).padStart(2, "0")}`;
  }

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
  return "";
}

function normalizeTime(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw || raw === "null") return "";
  const colon = raw.match(/(\d{1,2})[:：](\d{2})/);
  if (colon) return `${String(Number(colon[1])).padStart(2, "0")}:${String(Number(colon[2])).padStart(2, "0")}`;

  const jp = raw.match(/(午前|午後)?\s*(\d{1,2})\s*時\s*(\d{1,2})?\s*分?/);
  if (!jp) return "";
  let hour = Number(jp[2]);
  const minute = jp[3] ? Number(jp[3]) : 0;
  if (jp[1] === "午後" && hour < 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function inferTime(text: string) {
  const direct = normalizeTime(text);
  if (direct) return direct;
  if (/昼|昼分|ランチ|昼食|昼ごはん|昼ご飯/.test(text)) return "12:00";
  if (/朝|起床|午前/.test(text)) return "08:00";
  if (/午前中/.test(text)) return "10:00";
  if (/夕方|退勤/.test(text)) return "17:30";
  if (/夜|夕食|晩ごはん|晩ご飯/.test(text)) return "19:00";
  if (/寝る|就寝/.test(text)) return "23:00";
  return "";
}

function uniqueById<T extends { id?: string }>(items: T[]) {
  const map = new Map<string, T>();
  items.forEach((item, index) => {
    const key = String(item.id || `idx-${index}`);
    if (!map.has(key)) map.set(key, item);
  });
  return Array.from(map.values());
}

function todoDate(todo: any, selected: string) {
  const text = `${todo?.title || ""} ${todo?.note || ""} ${todo?.priority || ""}`;
  const fromField = normalizeDate(todo?.due_date || todo?.todo_date || todo?.target_date || todo?.date || todo?.scheduled_date || todo?.deadline || todo?.deadline_date);
  const fromText = dateFromText(text);
  const fromCreated = normalizeDate(todo?.created_at);
  if (fromField) return fromField;
  if (fromText) return fromText;
  // 日付未指定TODOは「今日」のいつでもTODOとしてだけ見せる。
  if (selected === todayKey()) return todayKey();
  return fromCreated || "";
}

function todoTime(todo: any) {
  return normalizeTime(todo?.due_time || todo?.todo_time || todo?.target_time || todo?.time || todo?.scheduled_time || todo?.deadline_time) || inferTime(`${todo?.title || ""} ${todo?.note || ""} ${todo?.priority || ""}`);
}

function eventDate(event: any) {
  return normalizeDate(event?.event_date || event?.date || event?.scheduled_date || event?.start_date || event?.created_at) || todayKey();
}

function eventTime(event: any) {
  return normalizeTime(event?.start_time || event?.time || event?.event_time || event?.scheduled_time) || inferTime(`${event?.title || ""} ${event?.note || ""}`);
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[1.6rem] border border-white/10 bg-black/25 p-4 shadow-xl backdrop-blur-xl ${className}`}>{children}</section>;
}

export function CalendarTodoTimelineV72({ events = [], todos = [], selected = todayKey(), setSelected, refreshSnapshot }: Props) {
  const [mode, setMode] = useState<"day" | "line">("day");
  const [autoSync, setAutoSync] = useState(true);
  const [liveTodos, setLiveTodos] = useState<any[]>([]);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [syncMessage, setSyncMessage] = useState("");

  const syncNow = useCallback(async () => {
    const [todoResult, eventResult] = await Promise.all([
      supabase.from("todos").select("*").order("created_at", { ascending: false }).limit(300),
      supabase.from("calendar_events").select("*").order("event_date", { ascending: false }).limit(300),
    ]);

    if (!todoResult.error && Array.isArray(todoResult.data)) setLiveTodos(todoResult.data);
    if (!eventResult.error && Array.isArray(eventResult.data)) setLiveEvents(eventResult.data);

    await Promise.resolve(refreshSnapshot?.()).catch(() => undefined);

    const parts = [];
    if (todoResult.error) parts.push(`TODO取得失敗: ${todoResult.error.message}`);
    if (eventResult.error) parts.push(`予定取得失敗: ${eventResult.error.message}`);
    setSyncMessage(parts.length ? parts.join(" / ") : "TODO・予定を同期しました。");
  }, [refreshSnapshot]);

  useEffect(() => {
    syncNow().catch(() => undefined);
  }, [syncNow]);

  useEffect(() => {
    if (!autoSync) return;
    const run = () => syncNow().catch(() => undefined);
    window.addEventListener("focus", run);
    const id = window.setInterval(run, 10000);
    return () => {
      window.removeEventListener("focus", run);
      window.clearInterval(id);
    };
  }, [autoSync, syncNow]);

  const mergedTodos = useMemo(() => uniqueById([...(liveTodos || []), ...(todos || [])]), [liveTodos, todos]);
  const mergedEvents = useMemo(() => uniqueById([...(liveEvents || []), ...(events || [])]), [liveEvents, events]);

  const week = useMemo(() => {
    const d = new Date(`${selected}T00:00:00`);
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const x = new Date(start);
      x.setDate(start.getDate() + i);
      return todayKey(x);
    });
  }, [selected]);

  const dayEvents = useMemo(
    () => mergedEvents.filter((e) => eventDate(e) === selected).sort((a, b) => (eventTime(a) || "99:99").localeCompare(eventTime(b) || "99:99")),
    [mergedEvents, selected],
  );

  const dayTodos = useMemo(
    () => mergedTodos.filter((t) => !t?.done && todoDate(t, selected) === selected).sort((a, b) => (todoTime(a) || "99:99").localeCompare(todoTime(b) || "99:99")),
    [mergedTodos, selected],
  );

  const allDayEvents = dayEvents.filter((e) => !eventTime(e));
  const floatingTodos = dayTodos.filter((t) => !todoTime(t));
  const timedItems = [
    ...dayEvents.filter((e) => eventTime(e)).map((e) => ({ id: `event-${e.id}`, time: eventTime(e), title: e.title, kind: "予定", note: e.start_time ? e.note || "予定" : "時刻推定" })),
    ...dayTodos.filter((t) => todoTime(t)).map((t) => ({ id: `todo-${t.id}`, time: todoTime(t), title: t.title, kind: "TODO", note: t.due_time ? t.priority || "TODO" : "時刻推定" })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const jumpTodo = (id: string) => document.getElementById(`todo-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <Card className="calendar-v73 border-cyan-200/20 bg-gradient-to-br from-sky-400/10 via-indigo-400/10 to-fuchsia-400/10 text-white">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-cyan-100/60">FORCE TODO CALENDAR SYNC v73</p>
          <h2 className="mt-1 text-2xl font-black">TODO連携カレンダー</h2>
          <p className="mt-1 text-sm text-white/60">
            snapshot待ちではなく、todos / calendar_events から直接再取得して反映する版。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelected?.(addDays(selected, -1))} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">前日</button>
          <button onClick={() => setSelected?.(todayKey())} className="rounded-2xl bg-white/15 px-3 py-2 text-sm font-black">今日</button>
          <button onClick={() => setSelected?.(addDays(selected, 1))} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">翌日</button>
          <button onClick={() => syncNow().catch(() => setSyncMessage("同期に失敗しました。"))} className="rounded-2xl bg-cyan-300/20 px-3 py-2 text-sm font-black">TODO同期</button>
          <button onClick={() => setAutoSync((v) => !v)} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black">自動同期 {autoSync ? "ON" : "OFF"}</button>
        </div>
      </div>
      {syncMessage && <p className="mt-3 rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-white/65">{syncMessage}</p>}

      <div className="mt-4 grid gap-2 sm:grid-cols-[76px_repeat(7,minmax(0,1fr))]">
        <div className="grid place-items-center rounded-3xl bg-white/10 p-3 text-2xl font-black">{Number(selected.slice(5, 7))}月</div>
        {week.map((date) => {
          const d = new Date(`${date}T00:00:00`);
          const active = date === selected;
          const count = mergedEvents.filter((e) => eventDate(e) === date).length + mergedTodos.filter((t) => !t?.done && todoDate(t, date) === date).length;
          return (
            <button key={date} onClick={() => setSelected?.(date)} className={`rounded-3xl border p-3 text-center transition ${active ? "border-cyan-200 bg-cyan-300/30" : "border-white/10 bg-black/25 hover:bg-white/10"}`}>
              <p className="text-xs font-black text-white/70">{["日", "月", "火", "水", "木", "金", "土"][d.getDay()]}</p>
              <p className="mt-1 text-2xl font-black">{d.getDate()}</p>
              {count > 0 && <p className="mt-2 rounded-full bg-white/10 px-2 py-1 text-[11px] font-black">{count}件</p>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => setMode("day")} className={`rounded-2xl px-4 py-2 text-sm font-black ${mode === "day" ? "bg-white/20" : "bg-white/10"}`}>日</button>
        <button onClick={() => setMode("line")} className={`rounded-2xl px-4 py-2 text-sm font-black ${mode === "line" ? "bg-white/20" : "bg-white/10"}`}>タイムライン</button>
      </div>

      {mode === "day" ? (
        <div className="mt-4 space-y-3 rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="grid gap-3 lg:grid-cols-[72px_1fr_1fr]">
            <p className="text-sm font-black text-white/55">終日</p>
            <div className="rounded-3xl bg-white/5 p-3">
              <p className="mb-2 text-xs font-black tracking-[0.18em] text-cyan-100/55">終日予定</p>
              <div className="flex flex-wrap gap-2">
                {allDayEvents.length ? allDayEvents.map((e) => <span key={e.id} className="rounded-2xl bg-cyan-300/20 px-3 py-2 text-sm font-black">{e.title}</span>) : <span className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/55">終日の予定なし</span>}
              </div>
            </div>
            <div className="rounded-3xl bg-emerald-300/10 p-3">
              <p className="mb-2 text-xs font-black tracking-[0.18em] text-emerald-100/70">いつでもTODO</p>
              <div className="flex flex-wrap gap-2">
                {floatingTodos.length ? floatingTodos.map((t) => <button key={t.id} onClick={() => jumpTodo(t.id)} className="rounded-2xl bg-emerald-300/15 px-3 py-2 text-left text-sm font-black">✅ {t.title}</button>) : <span className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/55">時間指定なしTODOなし</span>}
              </div>
            </div>
          </div>

          {Array.from({ length: 18 }, (_, i) => i + 6).map((hour) => {
            const hourText = String(hour).padStart(2, "0");
            const hits = timedItems.filter((item) => item.time.startsWith(hourText));
            return (
              <div key={hour} className="grid min-h-20 grid-cols-[72px_1fr] gap-3 border-t border-white/10 py-3">
                <time className="text-sm font-black text-white/55">{hourText}:00</time>
                <div className="space-y-2">
                  {hits.map((item) => (
                    <button key={item.id} onClick={() => item.id.startsWith("todo-") && jumpTodo(item.id.replace("todo-", ""))} className={`w-full rounded-2xl p-3 text-left text-sm ${item.kind === "TODO" ? "bg-emerald-300/15" : "bg-sky-300/15"}`}>
                      <b>{item.time}</b> {item.title}
                      <p className="mt-1 text-xs text-white/60">{item.kind} / {item.note}</p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="relative mt-5 grid gap-4 py-2">
          <div className="absolute bottom-0 left-1/2 top-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan-300 via-indigo-300 to-amber-300 opacity-70" />
          {[...allDayEvents.map((e) => ({ id: `event-${e.id}`, time: "終日", title: e.title, kind: "予定", note: e.note || "予定" })),
            ...floatingTodos.map((t) => ({ id: `todo-${t.id}`, time: "いつでも", title: t.title, kind: "TODO", note: t.priority || "時間指定なしTODO" })),
            ...timedItems].map((item, i) => (
            <article key={item.id} className={`relative w-[calc(50%-1rem)] rounded-3xl border border-white/10 bg-slate-950/55 p-4 shadow-xl ${i % 2 ? "justify-self-end" : "justify-self-start"}`}>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">{item.time}</span>
              <h3 className="mt-2 font-black">{item.title}</h3>
              <p className="mt-1 text-xs text-white/55">{item.kind} / {item.note}</p>
            </article>
          ))}
          {!dayEvents.length && !dayTodos.length && <div className="relative justify-self-center rounded-3xl border border-white/10 bg-white/10 p-4 text-center"><p className="font-black">この日はまだ空だよ</p></div>}
        </div>
      )}
    </Card>
  );
}

export function PhotoCalendarImportV72({ refreshSnapshot, setSelected }: Props) {
  const [preview, setPreview] = useState("");
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  const compressImage = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
    reader.onload = () => {
      const raw = String(reader.result || "");
      const img = new Image();
      img.onerror = () => resolve(raw);
      img.onload = () => {
        const maxSide = 1280;
        const ratio = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(raw);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });

  const fallback = (fileName: string, note: string): Candidate => ({
    title: fileName.replace(/\.[^.]+$/, "") || "写真から追加",
    date: todayKey(),
    time: "",
    note,
    confidence: 0,
    sourceText: fileName,
  });

  const handleFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setFilename(file.name);
    setMessage("");
    setCandidates([]);

    try {
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      const res = await fetch("/api/calendar/photo-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl, filename: file.name, today: todayKey(), selectedDate: todayKey() }),
      });
      const json = await res.json().catch(() => ({}));
      const next = Array.isArray(json.candidates) ? json.candidates : [];
      setCandidates(next.length ? next : [fallback(file.name, json.error || "読み取り候補なし。ここを編集して予定追加できます。")]);
      setMessage(next.length ? (json.ok ? `${next.length}件の予定候補を読み取りました。` : json.error || "AI読み取りは失敗したけど手動候補を作りました。") : json.error || "手動候補を作りました。");
    } catch (e) {
      setCandidates([fallback(file.name, e instanceof Error ? e.message : "写真読み取りに失敗しました。")]);
      setMessage("写真読み取りに失敗したので、手動で編集できる候補を作りました。");
    } finally {
      setBusy(false);
    }
  };

  const update = (index: number, patch: Partial<Candidate>) => setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));

  const addCandidate = async (c: Candidate) => {
    const title = String(c.title || "").trim();
    if (!title) return setMessage("予定名を入れてください。");
    const date = normalizeDate(c.date) || todayKey();
    const time = normalizeTime(c.time);
    setBusy(true);
    try {
      const note = [c.note ? `写真AIメモ: ${c.note}` : "", c.sourceText ? `読み取り根拠: ${c.sourceText}` : "", filename ? `画像: ${filename}` : ""].filter(Boolean).join("\n");
      const { error } = await supabase.from("calendar_events").insert({ title, event_date: date, start_time: time || null, note });
      if (error) throw error;
      setSelected?.(date);
      await Promise.resolve(refreshSnapshot?.());
      setMessage(time ? `${date} ${time} に予定を追加しました。` : `${date} の終日予定として追加しました。`);
    } catch (e) {
      setMessage(e instanceof Error ? `予定追加に失敗しました: ${e.message}` : "予定追加に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-cyan-200/20 bg-gradient-to-br from-cyan-400/10 via-indigo-400/10 to-fuchsia-400/10 text-white">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-cyan-100/60">PHOTO TO CALENDAR v73</p>
          <h2 className="mt-1 text-2xl font-black">写真から予定を読み取る</h2>
          <p className="mt-1 text-sm text-white/60">保存先を calendar_events に修正。AIが失敗しても手動候補から追加できるよ。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer rounded-2xl bg-white/15 px-4 py-3 text-sm font-black transition hover:bg-white/20">
            写真を選ぶ
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </label>
          <button onClick={() => setCandidates((p) => [fallback(filename || "manual", "手動入力"), ...p])} className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black">手動候補</button>
        </div>
      </div>

      {preview && <div className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr]"><img src={preview} alt="読み取り対象" className="h-40 w-full rounded-3xl object-cover ring-1 ring-white/10" /><div className="rounded-3xl border border-white/10 bg-black/20 p-4"><p className="text-sm font-black text-white/70">{filename}</p><p className="mt-2 text-sm text-white/55">{busy ? "AIが写真から予定を読み取り中..." : message}</p></div></div>}

      {!!candidates.length && <div className="mt-4 grid gap-3">
        {candidates.map((c, i) => (
          <article key={`${i}-${c.sourceText}`} className="rounded-3xl border border-white/10 bg-black/25 p-4">
            <div className="grid gap-2 sm:grid-cols-[1.4fr_140px_120px]">
              <input value={c.title || ""} onChange={(e) => update(i, { title: e.target.value })} placeholder="予定名" className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white outline-none placeholder:text-white/40" />
              <input value={c.date || ""} onChange={(e) => update(i, { date: e.target.value })} placeholder="YYYY-MM-DD" className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white outline-none placeholder:text-white/40" />
              <input value={c.time || ""} onChange={(e) => update(i, { time: e.target.value })} placeholder="HH:MM" className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white outline-none placeholder:text-white/40" />
            </div>
            <textarea value={c.note || ""} onChange={(e) => update(i, { note: e.target.value })} placeholder="補足メモ" className="mt-2 min-h-20 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40" />
            <div className="mt-3 flex justify-end"><button onClick={() => addCandidate(c)} disabled={busy} className="rounded-2xl bg-cyan-300/20 px-4 py-3 text-sm font-black disabled:opacity-50">この予定を追加</button></div>
          </article>
        ))}
      </div>}
      {message && !preview && <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white/70">{message}</p>}
    </Card>
  );
}
