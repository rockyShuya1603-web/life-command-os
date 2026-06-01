"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type EventItem = { id: string; title: string; date: string; time?: string; allDay?: boolean; color?: "cyan" | "purple" | "amber" | "emerald" | "rose"; source?: string; createdAt: string };
type TodoItem = { id: string; title: string; done?: boolean; completed?: boolean; dueDate?: string; date?: string; createdAt?: string };
type ViewMode = "day" | "timeline";

const EVENT_KEY = "life-command-os-v61-calendar-events";
const EVENT_KEYS = [EVENT_KEY, "life-command-os-v59-events", "events", "calendarEvents", "life-command-events", "lifeCalendarEvents", "scheduleEvents"];
const TODO_KEYS = ["life-command-os-v59-todos", "todos", "lifeTodos", "life-command-todos", "todoEntries"];

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);

function fromISO(s: string) {
  const d = new Date(`${s}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}
function addDays(s: string, n: number) {
  const d = fromISO(s);
  d.setDate(d.getDate() + n);
  return todayKey(d);
}
function weekDays(s: string) {
  const c = fromISO(s);
  const sun = new Date(c);
  sun.setDate(c.getDate() - c.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun);
    d.setDate(sun.getDate() + i);
    return todayKey(d);
  });
}
function label(s: string) {
  return fromISO(s).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
}
function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch { return []; }
}
function writeArray<T>(key: string, value: T[]) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function parseDate(v: unknown) {
  if (typeof v !== "string" && typeof v !== "number") return undefined;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? undefined : todayKey(d);
}
function normalizeEvent(raw: Record<string, unknown>, source: string): EventItem | null {
  const title = String(raw.title ?? raw.name ?? raw.label ?? raw.text ?? raw.memo ?? "").trim();
  if (!title) return null;
  const date = String(raw.date ?? raw.day ?? parseDate(raw.start) ?? parseDate(raw.createdAt) ?? todayKey());
  const time = String(raw.time ?? raw.startTime ?? "").slice(0, 5) || undefined;
  return { id: String(raw.id ?? uid("event")), title, date, time, allDay: Boolean(raw.allDay) || !time, color: (raw.color as EventItem["color"]) ?? "cyan", source, createdAt: String(raw.createdAt ?? new Date().toISOString()) };
}
function collectEvents() {
  const out: EventItem[] = [];
  const seen = new Set<string>();
  for (const key of EVENT_KEYS) for (const raw of readArray<Record<string, unknown>>(key)) {
    const e = normalizeEvent(raw, key);
    if (!e) continue;
    const sig = `${e.date}:${e.time ?? ""}:${e.title}`;
    if (seen.has(sig)) continue;
    seen.add(sig); out.push(e);
  }
  return out.sort((a,b) => `${a.date}${a.time ?? "00:00"}`.localeCompare(`${b.date}${b.time ?? "00:00"}`));
}
function collectTodos() {
  const out: TodoItem[] = [];
  const seen = new Set<string>();
  for (const key of TODO_KEYS) for (const raw of readArray<Record<string, unknown>>(key)) {
    const title = String(raw.title ?? raw.text ?? raw.body ?? "").trim();
    if (!title) continue;
    const item = { id: String(raw.id ?? uid("todo")), title, done: Boolean(raw.done), completed: Boolean(raw.completed), dueDate: String(raw.dueDate ?? raw.date ?? "") || undefined, date: String(raw.date ?? "") || undefined, createdAt: String(raw.createdAt ?? "") };
    const sig = `${item.title}:${item.dueDate ?? ""}`;
    if (seen.has(sig)) continue;
    seen.add(sig); out.push(item);
  }
  return out;
}
function isCalendarPage(page?: unknown) {
  const p = String(page ?? "").toLowerCase();
  if (["calendar","cal","schedule","予定","カレンダー"].includes(p) || p.includes("calendar") || p.includes("schedule") || p.includes("カレンダー") || p.includes("予定")) return true;
  if (typeof window === "undefined") return false;
  const loc = `${location.pathname} ${location.hash} ${location.search}`.toLowerCase();
  return loc.includes("calendar") || loc.includes("schedule") || loc.includes("timeline") || loc.includes("カレンダー");
}
function getAnchor() {
  const old = document.getElementById("life-v61-calendar-anchor");
  if (old) return old;
  const main = document.querySelector("main");
  if (!main) return null;
  const children = Array.from(main.children);
  let target: Element | null = null;
  for (const el of children) {
    const text = (el.textContent || "").replace(/\s+/g, " ");
    const rect = el.getBoundingClientRect();
    if (rect.height > 0 && text.includes("Life Command OS") && (text.includes("検索") || rect.top < 280)) { target = el; break; }
  }
  if (!target) target = children.find(el => el.getBoundingClientRect().height > 0) || null;
  const anchor = document.createElement("div");
  anchor.id = "life-v61-calendar-anchor";
  anchor.className = "life-v61-calendar-anchor";
  if (target?.parentElement) target.insertAdjacentElement("afterend", anchor);
  else main.prepend(anchor);
  return anchor;
}
const minutes = (time?: string) => {
  if (!time) return 0;
  const [h,m] = time.split(":").map(Number);
  return (Number.isFinite(h)?h:0)*60 + (Number.isFinite(m)?m:0);
};
const colorClass = (c?: EventItem["color"]) => `life-cal-v61-${c ?? "cyan"}`;
const weather = (i: number) => ({ icon: ["☀️","🌦️","🌧️","🌧️","⛅","☀️","🌧️"][i%7], temp: [33,25,20,23,23,32,21][i%7] });

function Panel({ standalone=false }: { standalone?: boolean }) {
  const [selected, setSelected] = useState(todayKey());
  const [view, setView] = useState<ViewMode>("day");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [toast, setToast] = useState("");

  const reload = () => { setEvents(collectEvents()); setTodos(collectTodos()); };
  useEffect(() => {
    reload();
    const f = () => reload();
    addEventListener("storage", f);
    addEventListener("life-command-data-updated", f as EventListener);
    return () => { removeEventListener("storage", f); removeEventListener("life-command-data-updated", f as EventListener); };
  }, []);

  const days = useMemo(() => weekDays(selected), [selected]);
  const dayEvents = events.filter(e => e.date === selected);
  const allDay = dayEvents.filter(e => e.allDay);
  const timed = dayEvents.filter(e => !e.allDay).sort((a,b) => minutes(a.time) - minutes(b.time));
  const dayTodos = todos.filter(t => !t.done && !t.completed && (t.dueDate === selected || t.date === selected));
  const currentPct = selected === todayKey() ? Math.max(0, Math.min(100, (((new Date().getHours()*60+new Date().getMinutes()) - 8*60) / (14*60))*100)) : null;

  const saveEvent = () => {
    const t = title.trim();
    if (!t) { setToast("予定名を入力してね"); setTimeout(() => setToast(""), 1500); return; }
    const event: EventItem = { id: uid("event"), title: t, date: selected, time: time || undefined, allDay: !time, color: "cyan", source: "calendar-v61", createdAt: new Date().toISOString() };
    writeArray(EVENT_KEY, [event, ...readArray<EventItem>(EVENT_KEY)].slice(0,400));
    writeArray("life-command-os-v59-events", [event, ...readArray<EventItem>("life-command-os-v59-events")].slice(0,400));
    setTitle(""); setTime(""); setToast("予定を追加しました"); reload();
    dispatchEvent(new CustomEvent("life-command-data-updated", { detail: { type: "calendar", event } }));
    setTimeout(() => setToast(""), 1500);
  };

  return (
    <section id="life-calendar-timeline-v61" className={`life-cal-v61 ${standalone ? "life-cal-v61-standalone" : ""}`}>
      <div className="life-cal-v61-shell">
        <div className="life-cal-v61-head">
          <div><p>CALENDAR + TIMELINE</p><h2>カレンダー</h2><small>今の青いテーマに合わせた、天気つき週間ビューとタイムライン。</small></div>
          <div className="life-cal-v61-actions"><button onClick={() => setSelected(addDays(selected,-1))}>‹</button><button onClick={() => setSelected(todayKey())}>今日</button><button onClick={() => setSelected(addDays(selected,1))}>›</button></div>
        </div>
        <div className="life-cal-v61-tabs"><button className={view==="day" ? "active" : ""} onClick={() => setView("day")}>日</button><button className={view==="timeline" ? "active" : ""} onClick={() => setView("timeline")}>タイムライン</button></div>
        <div className="life-cal-v61-week">
          <div className="life-cal-v61-month">{fromISO(selected).getMonth()+1}月</div>
          {days.map((d,i) => { const dt = fromISO(d), w = weather(i); return <button key={d} className={d===selected ? "active" : ""} onClick={() => setSelected(d)}><span>{["日","月","火","水","木","金","土"][dt.getDay()]}</span><b>{dt.getDate()}</b><em>{w.temp}</em><i>{w.icon}</i></button>; })}
        </div>
        <div className="life-cal-v61-add"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="予定を追加：例）投資画面を確認する" /><input value={time} onChange={e => setTime(e.target.value)} placeholder="時刻 任意 11:14" /><button onClick={saveEvent}>追加</button></div>
        <div className="life-cal-v61-datebar"><b>{label(selected)}</b><span>{dayEvents.length}件の予定 / TODO {dayTodos.length}件</span></div>
        {view === "day" ? (
          <div className="life-cal-v61-day">
            <div className="life-cal-v61-all-day"><span>終日</span><div>{allDay.length ? allDay.map(e => <article key={e.id} className={colorClass(e.color)}>{e.title}</article>) : <article className="life-cal-v61-muted">終日の予定はまだないよ</article>}</div></div>
            <div className="life-cal-v61-hours">
              {currentPct !== null && <div className="life-cal-v61-now" style={{ top: `${currentPct}%` }}><span>{new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span></div>}
              {Array.from({length:15},(_,i)=>i+8).map(h => <div key={h} className="life-cal-v61-hour"><time>{String(h).padStart(2,"0")}:00</time><div>{timed.filter(e => Number(e.time?.slice(0,2))===h).map(e => <article key={e.id} className={colorClass(e.color)}><b>{e.time}</b><span>{e.title}</span></article>)}</div></div>)}
            </div>
          </div>
        ) : (
          <div className="life-cal-v61-timeline"><div className="life-cal-v61-line" />{[...timed,...allDay].map((e,i) => <article key={e.id} className={`life-cal-v61-node ${i%2 ? "right":"left"}`}><span>{e.time ?? "終日"}</span><b>{e.title}</b><small>{e.source ?? "calendar"}</small></article>)}{dayTodos.map((t,i) => <article key={t.id} className={`life-cal-v61-node todo ${i%2 ? "left":"right"}`}><span>TODO</span><b>{t.title}</b><small>今日の行動候補</small></article>)}{!timed.length && !allDay.length && !dayTodos.length && <article className="life-cal-v61-node center"><span>EMPTY</span><b>この日のタイムラインはまだ空だよ</b><small>上の入力欄から予定を追加できる</small></article>}</div>
        )}
        {toast && <p className="life-cal-v61-toast">{toast}</p>}
      </div>
    </section>
  );
}

export default function CalendarTimelineV61({ page, forced=false, standalone=false }: { page?: unknown; forced?: boolean; standalone?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => setMounted(true), []);
  const show = forced || (mounted && isCalendarPage(page));
  useEffect(() => {
    if (!show || standalone) return;
    const place = () => setAnchor(getAnchor());
    place();
    const t = setInterval(place, 900);
    return () => clearInterval(t);
  }, [show, standalone]);
  if (!show) return null;
  if (standalone) return <Panel standalone />;
  return anchor ? createPortal(<Panel />, anchor) : null;
}
