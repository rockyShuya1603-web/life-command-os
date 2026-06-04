"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type CalEvent = {
  id: string;
  title: string;
  date: string;
  time?: string;
  allDay?: boolean;
  color?: "cyan" | "purple" | "amber" | "emerald" | "rose";
  source: string;
  createdAt: string;
};

const EVENT_KEY = "life-command-os-v62-calendar-events";
const BRIDGE_EVENT_KEYS = ["life-command-os-v61-calendar-events", "life-command-os-v59-events", "events", "calendarEvents", "life-command-events", "lifeCalendarEvents", "scheduleEvents"];
const TODO_KEYS = ["life-command-os-v59-todos", "todos", "lifeTodos", "life-command-todos", "todoEntries"];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function dateFromISO(dateString: string) {
  const d = new Date(`${dateString}T00:00:00`);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function addDays(dateString: string, amount: number) {
  const d = dateFromISO(dateString);
  d.setDate(d.getDate() + amount);
  return todayKey(d);
}

function weekDays(centerDate: string) {
  const center = dateFromISO(centerDate);
  const day = center.getDay();
  const sunday = new Date(center);
  sunday.setDate(center.getDate() - day);
  return Array.from({ length: 7 }, (_, index) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + index);
    return todayKey(d);
  });
}

function readArray<T>(key: string): T[] {
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

function writeArray<T>(key: string, value: T[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function parseDate(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  return todayKey(d);
}

function parseJapaneseDate(text: string) {
  if (text.includes("明日")) return addDays(todayKey(), 1);
  if (text.includes("今日")) return todayKey();
  const md = text.match(/(\d{1,2})[\/月](\d{1,2})日?/);
  if (md) {
    const year = new Date().getFullYear();
    return `${year}-${String(Number(md[1])).padStart(2, "0")}-${String(Number(md[2])).padStart(2, "0")}`;
  }
  return undefined;
}

function parseTime(text: string) {
  const match = text.match(/(午前|午後)?\s*(\d{1,2})[:：時](\d{2})?/);
  if (!match) return undefined;
  let hour = Number(match[2]);
  const minute = match[3] ? Number(match[3]) : 0;
  if (match[1] === "午後" && hour < 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function normalizeEvent(raw: Record<string, unknown>, source: string, loose = false): CalEvent | null {
  const text = `${raw.title ?? ""} ${raw.name ?? ""} ${raw.label ?? ""} ${raw.text ?? ""} ${raw.memo ?? ""} ${raw.body ?? ""}`.trim();
  const title = String(raw.title ?? raw.name ?? raw.label ?? raw.text ?? raw.memo ?? raw.body ?? "").trim();
  if (!title) return null;

  const date =
    String(raw.date ?? raw.day ?? raw.dueDate ?? raw.startDate ?? raw.scheduledDate ?? "") ||
    parseDate(raw.start) ||
    parseDate(raw.startAt) ||
    parseDate(raw.scheduledAt) ||
    parseDate(raw.createdAt) ||
    parseJapaneseDate(text) ||
    (loose ? todayKey() : "");

  if (!date) return null;

  const time =
    String(raw.time ?? raw.startTime ?? "").slice(0, 5) ||
    parseTime(text) ||
    undefined;

  return {
    id: String(raw.id ?? uid("event")),
    title,
    date,
    time,
    allDay: Boolean(raw.allDay) || !time,
    color: (raw.color as CalEvent["color"]) ?? "cyan",
    source,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
  };
}

function collectEvents() {
  const out: CalEvent[] = [];
  const seen = new Set<string>();

  const push = (event: CalEvent | null) => {
    if (!event) return;
    const sig = `${event.date}:${event.time ?? ""}:${event.title}`;
    if (seen.has(sig)) return;
    seen.add(sig);
    out.push(event);
  };

  for (const key of BRIDGE_EVENT_KEYS) {
    for (const raw of readArray<Record<string, unknown>>(key)) push(normalizeEvent(raw, key, key === EVENT_KEY));
  }

  if (typeof window !== "undefined") {
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key || BRIDGE_EVENT_KEYS.includes(key)) continue;
      if (!/event|calendar|schedule|plan|todo|予定|カレンダー/i.test(key)) continue;
      for (const raw of readArray<Record<string, unknown>>(key)) push(normalizeEvent(raw, key, /todo/i.test(key)));
    }
  }

  return out.sort((a, b) => `${a.date}${a.time ?? "00:00"}`.localeCompare(`${b.date}${b.time ?? "00:00"}`));
}

function collectTodoEvents() {
  const out: CalEvent[] = [];
  const seen = new Set<string>();
  for (const key of TODO_KEYS) {
    for (const raw of readArray<Record<string, unknown>>(key)) {
      const event = normalizeEvent(raw, key, false);
      if (!event) continue;
      const sig = `${event.date}:${event.title}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      out.push({ ...event, color: "emerald", source: "todo" });
    }
  }
  return out;
}

function isCalendarPage(page?: unknown) {
  const text = String(page ?? "").toLowerCase();
  if (["calendar", "cal", "schedule", "予定", "カレンダー"].includes(text)) return true;
  if (text.includes("calendar") || text.includes("schedule") || text.includes("カレンダー") || text.includes("予定")) return true;

  if (typeof window === "undefined") return false;
  const locationText = `${window.location.pathname} ${window.location.hash} ${window.location.search}`.toLowerCase();
  return locationText.includes("calendar") || locationText.includes("schedule") || locationText.includes("timeline") || locationText.includes("カレンダー");
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

function findCalendarAnchor() {
  const existing = document.getElementById("life-v62-calendar-anchor");
  if (existing) return existing;

  const main = document.querySelector("main");
  if (!main) return null;

  const anchor = document.createElement("div");
  anchor.id = "life-v62-calendar-anchor";
  anchor.className = "life-v62-calendar-anchor";

  const easyAddTarget = Array.from(main.querySelectorAll<HTMLElement>("section, article, div"))
    .filter((node) => visible(node))
    .filter((node) => (node.textContent || "").replace(/\s+/g, " ").includes("手軽に予定追加"))
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];

  if (easyAddTarget) {
    directChildOfMain(easyAddTarget, main).insertAdjacentElement("afterend", anchor);
    return anchor;
  }

  const header = Array.from(main.querySelectorAll<HTMLElement>("header, section, div"))
    .filter((node) => visible(node))
    .find((node) => {
      const text = (node.textContent || "").replace(/\s+/g, " ");
      return text.includes("Life Command OS") && text.includes("検索");
    });

  if (header) directChildOfMain(header, main).insertAdjacentElement("afterend", anchor);
  else main.prepend(anchor);

  return anchor;
}

function weather(index: number) {
  const icons = ["☀️", "🌦️", "🌧️", "🌧️", "⛅", "☀️", "🌧️"];
  const temps = [33, 25, 20, 23, 23, 32, 21];
  return { icon: icons[index % icons.length], temp: temps[index % temps.length] };
}

function timeToMinutes(time?: string) {
  if (!time) return 0;
  const [h, m] = time.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function colorClass(color?: CalEvent["color"]) {
  return `life-cal-v62-${color ?? "cyan"}`;
}

function Panel({ standalone = false }: { standalone?: boolean }) {
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [view, setView] = useState<"day" | "timeline">("day");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [toast, setToast] = useState("");

  const reload = () => setEvents([...collectEvents(), ...collectTodoEvents()]);

  useEffect(() => {
    reload();
    const onUpdate = () => reload();
    window.addEventListener("storage", onUpdate);
    window.addEventListener("life-command-data-updated", onUpdate as EventListener);
    return () => {
      window.removeEventListener("storage", onUpdate);
      window.removeEventListener("life-command-data-updated", onUpdate as EventListener);
    };
  }, []);

  const days = useMemo(() => weekDays(selectedDate), [selectedDate]);
  const dayEvents = events.filter((event) => event.date === selectedDate);
  const allDayEvents = dayEvents.filter((event) => event.allDay);
  const timedEvents = dayEvents.filter((event) => !event.allDay).sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  const nowPct = useMemo(() => {
    if (selectedDate !== todayKey()) return null;
    const now = new Date();
    const start = 8 * 60;
    const end = 22 * 60;
    const value = now.getHours() * 60 + now.getMinutes();
    return Math.max(0, Math.min(100, ((value - start) / (end - start)) * 100));
  }, [selectedDate]);

  const addEvent = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setToast("予定名を入力してね");
      window.setTimeout(() => setToast(""), 1500);
      return;
    }
    const event: CalEvent = { id: uid("event"), title: cleanTitle, date: selectedDate, time: time || parseTime(cleanTitle), allDay: !(time || parseTime(cleanTitle)), color: "cyan", source: "calendar-v62", createdAt: new Date().toISOString() };
    for (const key of [EVENT_KEY, ...BRIDGE_EVENT_KEYS]) {
      const current = readArray<Record<string, unknown>>(key);
      writeArray(key, [event, ...current].slice(0, 500));
    }
    setTitle("");
    setTime("");
    reload();
    window.dispatchEvent(new CustomEvent("life-command-data-updated", { detail: { type: "calendar" } }));
    setToast("予定を追加しました");
    window.setTimeout(() => setToast(""), 1500);
  };

  return (
    <section id="life-calendar-timeline-v62" className={`life-cal-v62 ${standalone ? "life-cal-v62-standalone" : ""}`}>
      <div className="life-cal-v62-shell">
        <div className="life-cal-v62-head">
          <div>
            <p>CALENDAR + TIMELINE</p>
            <h2>タイムライン付きカレンダー</h2>
            <small>手軽に予定追加の真下に配置。既存予定も拾ってここに統合表示するよ。</small>
          </div>
          <div className="life-cal-v62-actions">
            <button onClick={() => setSelectedDate(addDays(selectedDate, -1))}>‹</button>
            <button onClick={() => setSelectedDate(todayKey())}>今日</button>
            <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}>›</button>
          </div>
        </div>

        <div className="life-cal-v62-tabs">
          <button className={view === "day" ? "active" : ""} onClick={() => setView("day")}>日</button>
          <button className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")}>タイムライン</button>
        </div>

        <div className="life-cal-v62-week">
          <div className="life-cal-v62-month">{dateFromISO(selectedDate).getMonth() + 1}月</div>
          {days.map((day, index) => {
            const d = dateFromISO(day);
            const w = weather(index);
            return (
              <button key={day} className={day === selectedDate ? "active" : ""} onClick={() => setSelectedDate(day)}>
                <span>{["日", "月", "火", "水", "木", "金", "土"][d.getDay()]}</span>
                <b>{d.getDate()}</b>
                <em>{w.temp}</em>
                <i>{w.icon}</i>
              </button>
            );
          })}
        </div>

        <div className="life-cal-v62-add">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="予定を追加：例）投資画面を確認する" />
          <input value={time} onChange={(event) => setTime(event.target.value)} placeholder="時刻 任意 11:14" />
          <button onClick={addEvent}>追加</button>
        </div>

        <div className="life-cal-v62-datebar">
          <b>{dateFromISO(selectedDate).toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}</b>
          <span>{dayEvents.length}件の予定</span>
        </div>

        {view === "day" ? (
          <div className="life-cal-v62-day">
            <div className="life-cal-v62-all-day">
              <span>終日</span>
              <div>
                {allDayEvents.length ? allDayEvents.map((event) => <article key={event.id} className={colorClass(event.color)}>{event.title}</article>) : <article className="life-cal-v62-muted">終日の予定はまだないよ</article>}
              </div>
            </div>
            <div className="life-cal-v62-hours">
              {nowPct !== null && <div className="life-cal-v62-now" style={{ top: `${nowPct}%` }}><span>{new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span></div>}
              {Array.from({ length: 15 }, (_, i) => i + 8).map((hour) => (
                <div key={hour} className="life-cal-v62-hour">
                  <time>{String(hour).padStart(2, "0")}:00</time>
                  <div>
                    {timedEvents.filter((event) => Number(event.time?.slice(0, 2)) === hour).map((event) => (
                      <article key={event.id} className={colorClass(event.color)}><b>{event.time}</b><span>{event.title}</span></article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="life-cal-v62-timeline">
            <div className="life-cal-v62-line" />
            {dayEvents.map((event, index) => (
              <article key={`${event.source}-${event.id}`} className={`life-cal-v62-node ${index % 2 ? "right" : "left"}`}>
                <span>{event.time ?? "終日"}</span>
                <b>{event.title}</b>
                <small>{event.source}</small>
              </article>
            ))}
            {!dayEvents.length && <article className="life-cal-v62-node center"><span>EMPTY</span><b>この日の予定はまだ空だよ</b><small>上の入力欄から追加できる</small></article>}
          </div>
        )}

        {toast && <p className="life-cal-v62-toast">{toast}</p>}
      </div>
    </section>
  );
}

export default function CalendarTimelineV62({ page, forced = false, standalone = false }: { page?: unknown; forced?: boolean; standalone?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => setMounted(true), []);

  const shouldShow = forced || (mounted && isCalendarPage(page));

  useEffect(() => {
    if (!shouldShow || standalone) return;
    const place = () => setAnchor(findCalendarAnchor());
    place();
    const timer = window.setInterval(place, 900);
    return () => window.clearInterval(timer);
  }, [shouldShow, standalone]);

  if (!shouldShow) return null;
  if (standalone) return <Panel standalone />;
  if (!anchor) return null;

  return createPortal(<Panel />, anchor);
}
