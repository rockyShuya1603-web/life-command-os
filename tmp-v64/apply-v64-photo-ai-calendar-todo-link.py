#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

PHOTO_FUNCTION = r'''
type PhotoCalendarCandidateV64 = {
  title: string;
  date?: string | null;
  time?: string | null;
  note?: string;
  confidence?: number;
  sourceText?: string;
};

function PhotoCalendarImportV64({
  refreshSnapshot,
  setSelected,
}: {
  refreshSnapshot: () => Promise<void> | void;
  setSelected: (date: string) => void;
}) {
  const [preview, setPreview] = useState("");
  const [filename, setFilename] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [candidates, setCandidates] = useState<PhotoCalendarCandidateV64[]>([]);

  const normalizeDateV64 = (value?: string | null) => {
    const text = String(value || "").trim();
    return /^\\d{4}-\\d{2}-\\d{2}$/.test(text) ? text : todayKey();
  };

  const normalizeTimeV64 = (value?: string | null) => {
    const text = String(value || "").trim();
    if (!text) return "";
    const colon = text.match(/(\\d{1,2})[:：](\\d{2})/);
    if (colon) return `${String(Number(colon[1])).padStart(2, "0")}:${String(Number(colon[2])).padStart(2, "0")}`;
    const jp = text.match(/(午前|午後)?\\s*(\\d{1,2})\\s*時\\s*(\\d{1,2})?\\s*分?/);
    if (!jp) return "";
    let hour = Number(jp[2]);
    const minute = jp[3] ? Number(jp[3]) : 0;
    if (jp[1] === "午後" && hour < 12) hour += 12;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  };

  const fileToDataUrlV64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("画像の読み込みに失敗しました。"));
      reader.readAsDataURL(file);
    });

  const handlePhotoV64 = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setMessage("");
    setCandidates([]);
    setFilename(file.name);

    try {
      const dataUrl = await fileToDataUrlV64(file);
      setPreview(dataUrl);

      const response = await fetch("/api/calendar/photo-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: dataUrl, filename: file.name, today: todayKey(), selectedDate: todayKey() }),
      });

      const data = await response.json();
      const next = Array.isArray(data.candidates) ? data.candidates : [];
      setCandidates(next);
      setMessage(next.length ? `${next.length}件の予定候補を読み取りました。` : data.error || "予定候補は見つかりませんでした。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "写真読み取りに失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const updateCandidateV64 = (index: number, patch: Partial<PhotoCalendarCandidateV64>) => {
    setCandidates((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const addCandidateV64 = async (candidate: PhotoCalendarCandidateV64) => {
    const title = String(candidate.title || "").trim();
    if (!title) return;
    const eventDate = normalizeDateV64(candidate.date);
    const startTime = normalizeTimeV64(candidate.time);
    const note = [
      candidate.note ? `写真AIメモ: ${candidate.note}` : "",
      candidate.sourceText ? `読み取り根拠: ${candidate.sourceText}` : "",
      filename ? `画像: ${filename}` : "",
    ].filter(Boolean).join("\\n");

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase.from("events").insert({ title, event_date: eventDate, start_time: startTime || null, note });
      if (error) throw error;
      setSelected(eventDate);
      await refreshSnapshot();
      setMessage(startTime ? `${eventDate} ${startTime} に予定を追加しました。` : `${eventDate} の終日予定として追加しました。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "予定追加に失敗しました。");
    } finally {
      setBusy(false);
    }
  };

  const addAllCandidatesV64 = async () => {
    for (const candidate of candidates) {
      await addCandidateV64(candidate);
    }
  };

  return (
    <GlassCard className="border-cyan-200/20 bg-gradient-to-br from-cyan-400/10 via-indigo-400/10 to-fuchsia-400/10 text-white">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-cyan-100/60">PHOTO TO CALENDAR</p>
          <h2 className="mt-1 text-2xl font-black text-white">写真から予定を読み取る</h2>
          <p className="mt-1 text-sm text-white/60">スクショ・手書きメモ・予定表の写真をAIで読み取って、確認してからカレンダーへ追加できるよ。</p>
        </div>
        <label className="cursor-pointer rounded-2xl bg-white/15 px-4 py-3 text-sm font-black text-white transition hover:bg-white/20">
          写真を選ぶ
          <input type="file" accept="image/*" className="hidden" onChange={(event) => handlePhotoV64(event.target.files?.[0])} />
        </label>
      </div>

      {preview && (
        <div className="mt-4 grid gap-3 lg:grid-cols-[180px_1fr]">
          <img src={preview} alt="読み取り対象" className="h-40 w-full rounded-3xl object-cover ring-1 ring-white/10" />
          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-black text-white/70">{filename || "選択した写真"}</p>
            <p className="mt-2 text-sm text-white/55">{busy ? "AIが写真から予定を読み取り中..." : message || "読み取り結果をここに表示します。"}</p>
          </div>
        </div>
      )}

      {!!candidates.length && (
        <div className="mt-4 grid gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-black text-white">読み取り候補</h3>
            <button type="button" onClick={addAllCandidatesV64} disabled={busy} className="rounded-2xl bg-white/15 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
              候補を全部追加
            </button>
          </div>

          {candidates.map((candidate, index) => (
            <article key={`${candidate.title}-${index}`} className="rounded-3xl border border-white/10 bg-black/25 p-4">
              <div className="grid gap-2 sm:grid-cols-[1.4fr_140px_120px]">
                <input value={candidate.title || ""} onChange={(event) => updateCandidateV64(index, { title: event.target.value })} placeholder="予定名" className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white outline-none placeholder:text-white/40" />
                <input value={candidate.date || ""} onChange={(event) => updateCandidateV64(index, { date: event.target.value })} placeholder="YYYY-MM-DD" className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white outline-none placeholder:text-white/40" />
                <input value={candidate.time || ""} onChange={(event) => updateCandidateV64(index, { time: event.target.value })} placeholder="HH:MM" className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-black text-white outline-none placeholder:text-white/40" />
              </div>
              <textarea value={candidate.note || ""} onChange={(event) => updateCandidateV64(index, { note: event.target.value })} placeholder="補足メモ" className="mt-2 min-h-20 w-full rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40" />
              {candidate.sourceText && <p className="mt-2 rounded-2xl bg-white/5 px-3 py-2 text-xs text-white/55">読み取り根拠: {candidate.sourceText}</p>}
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => addCandidateV64(candidate)} disabled={busy} className="rounded-2xl bg-cyan-300/20 px-4 py-3 text-sm font-black text-white disabled:opacity-50">
                  この予定を追加
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {message && !preview && <p className="mt-3 rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white/70">{message}</p>}
    </GlassCard>
  );
}
'''

TIMELINE_FUNCTION = r'''
function CalendarTimelineInlineV64({
  events,
  todos,
  selected,
  setSelected,
}: {
  events: EventItem[];
  todos: Todo[];
  selected: string;
  setSelected: (date: string) => void;
}) {
  const [viewMode, setViewMode] = useState<"day" | "timeline">("day");

  const addDays = (date: string, amount: number) => {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + amount);
    return toDateKey(d);
  };

  const normalizeClock = (value?: string | null) => {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const colon = raw.match(/(\d{1,2})[:：](\d{2})/);
    if (colon) return `${String(Number(colon[1])).padStart(2, "0")}:${String(Number(colon[2])).padStart(2, "0")}`;
    const japanese = raw.match(/(午前|午後)?\s*(\d{1,2})\s*時\s*(\d{1,2})?\s*分?/);
    if (japanese) {
      let hour = Number(japanese[2]);
      const minute = japanese[3] ? Number(japanese[3]) : 0;
      if (japanese[1] === "午後" && hour < 12) hour += 12;
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }
    return "";
  };

  const inferTimeFromText = (text: string) => {
    const normalized = normalizeClock(text);
    if (normalized) return normalized;
    if (/昼|昼分|ランチ|昼食|昼ごはん|昼ご飯/.test(text)) return "12:00";
    if (/朝|起床|午前/.test(text)) return "08:00";
    if (/午前中/.test(text)) return "10:00";
    if (/夕方|退勤/.test(text)) return "17:30";
    if (/夜|夕食|晩ごはん|晩ご飯/.test(text)) return "19:00";
    if (/寝る|就寝/.test(text)) return "23:00";
    return "";
  };

  const eventTime = (event: EventItem) => normalizeClock(event.start_time) || inferTimeFromText(`${event.title || ""} ${event.note || ""}`);
  const todoTime = (todo: Todo) => normalizeClock(todo.due_time) || inferTimeFromText(`${todo.title || ""} ${todo.priority || ""}`);
  const todoDate = (todo: Todo) => todo.due_date || getCreatedDateKey(todo.created_at);

  const weekDays = useMemo(() => {
    const d = new Date(`${selected}T00:00:00`);
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return toDateKey(day);
    });
  }, [selected]);

  const dayEvents = useMemo(() => events.filter((event) => event.event_date === selected).sort((a, b) => (eventTime(a) || "99:99").localeCompare(eventTime(b) || "99:99")), [events, selected]);
  const dayTodos = useMemo(() => todos.filter((todo) => !todo.done && todoDate(todo) === selected).sort((a, b) => (todoTime(a) || "99:99").localeCompare(todoTime(b) || "99:99")), [todos, selected]);

  const allDayEvents = dayEvents.filter((event) => !eventTime(event));
  const floatingTodos = dayTodos.filter((todo) => !todoTime(todo));
  const timedTodos = dayTodos.filter((todo) => todoTime(todo));

  const timedItems = [
    ...dayEvents.filter((event) => eventTime(event)).map((event) => ({ id: `event-${event.id}`, time: eventTime(event) || "終日", title: event.title, note: event.start_time ? event.note || "予定" : "タイトルから時刻を推定", kind: "予定" })),
    ...timedTodos.map((todo) => ({ id: `todo-${todo.id}`, time: todoTime(todo) || "TODO", title: todo.title, note: todo.due_time ? todo.priority || "TODO" : "タイトルから時刻を推定", kind: "TODO" })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  const currentLine = (() => {
    if (selected !== todayKey()) return null;
    const now = new Date();
    const start = 8 * 60;
    const end = 22 * 60;
    const value = now.getHours() * 60 + now.getMinutes();
    return Math.max(0, Math.min(100, ((value - start) / (end - start)) * 100));
  })();

  const weatherFor = (index: number) => {
    const icons = ["☀️", "🌦️", "🌧️", "🌧️", "⛅", "☀️", "🌧️"];
    const temps = [33, 25, 20, 23, 23, 32, 21];
    return { icon: icons[index % icons.length], temp: temps[index % temps.length] };
  };

  const jumpTodo = (id: string) => {
    const node = document.getElementById(`todo-${id}`);
    node?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <GlassCard className="calendar-timeline-v64 bg-gradient-to-br from-sky-400/10 via-indigo-400/10 to-fuchsia-400/10 text-white">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-cyan-100/60">CALENDAR TODO LINK</p>
          <h2 className="mt-1 text-2xl font-black text-white">TODO連携カレンダー</h2>
          <p className="mt-1 text-sm text-white/60">時間指定ありTODOはその時間帯へ、時間指定なしTODOは「いつでもTODO」へ表示するよ。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setSelected(addDays(selected, -1))} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-white">前日</button>
          <button type="button" onClick={() => setSelected(todayKey())} className="rounded-2xl bg-white/15 px-3 py-2 text-sm font-black text-white">今日</button>
          <button type="button" onClick={() => setSelected(addDays(selected, 1))} className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-white">翌日</button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[80px_repeat(7,minmax(0,1fr))]">
        <div className="grid place-items-center rounded-3xl bg-white/10 p-3 text-2xl font-black text-white">{Number(selected.slice(5, 7))}月</div>
        {weekDays.map((date, index) => {
          const d = new Date(`${date}T00:00:00`);
          const active = date === selected;
          const w = weatherFor(index);
          const count = events.filter((event) => event.event_date === date).length + todos.filter((todo) => !todo.done && todoDate(todo) === date).length;
          return (
            <button key={date} type="button" onClick={() => setSelected(date)} className={`rounded-3xl border p-3 text-center text-white transition active:scale-[0.98] ${active ? "border-cyan-200 bg-cyan-300/30 shadow-lg shadow-cyan-500/20" : "border-white/10 bg-black/25 hover:bg-white/10"}`}>
              <p className="text-xs font-black text-white/75">{["日", "月", "火", "水", "木", "金", "土"][d.getDay()]}</p>
              <p className="mt-1 text-2xl font-black text-white">{d.getDate()}</p>
              <p className="mt-1 text-xs font-black text-white/75">{w.icon} {w.temp}</p>
              {count > 0 && <p className="mt-2 rounded-full bg-white/10 px-2 py-1 text-[11px] font-black text-white">{count}件</p>}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setViewMode("day")} className={`rounded-2xl px-4 py-2 text-sm font-black text-white ${viewMode === "day" ? "bg-white/20" : "bg-white/10"}`}>日</button>
        <button type="button" onClick={() => setViewMode("timeline")} className={`rounded-2xl px-4 py-2 text-sm font-black text-white ${viewMode === "timeline" ? "bg-white/20" : "bg-white/10"}`}>タイムライン</button>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">{selected} の予定</h3>
            <p className="mt-1 text-sm text-white/55">予定 {dayEvents.length}件 / TODO {dayTodos.length}件</p>
          </div>
        </div>

        {viewMode === "day" ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-3 lg:grid-cols-[72px_1fr_1fr] lg:items-start">
              <p className="text-sm font-black text-white/55">終日</p>
              <div className="rounded-3xl bg-white/5 p-3">
                <p className="mb-2 text-xs font-black tracking-[0.18em] text-cyan-100/55">終日予定</p>
                <div className="flex flex-wrap gap-2">
                  {allDayEvents.length ? allDayEvents.map((event) => <span key={event.id} className="rounded-2xl bg-cyan-300/20 px-3 py-2 text-sm font-black text-cyan-50">{event.title}</span>) : <span className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/55">終日の予定なし</span>}
                </div>
              </div>
              <div className="rounded-3xl bg-emerald-300/10 p-3">
                <p className="mb-2 text-xs font-black tracking-[0.18em] text-emerald-100/70">いつでもTODO</p>
                <div className="flex flex-wrap gap-2">
                  {floatingTodos.length ? floatingTodos.map((todo) => <button key={todo.id} type="button" onClick={() => jumpTodo(todo.id)} className="rounded-2xl bg-emerald-300/15 px-3 py-2 text-left text-sm font-black text-emerald-50">✅ {todo.title}</button>) : <span className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/55">時間指定なしTODOなし</span>}
                </div>
              </div>
            </div>

            <div className="relative grid gap-0">
              {currentLine !== null && <div className="pointer-events-none absolute left-20 right-0 z-10 h-0.5 bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,.7)]" style={{ top: `${currentLine}%` }}><span className="absolute -left-20 -top-3 text-xs font-black text-rose-200">{new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</span></div>}
              {Array.from({ length: 15 }, (_, index) => index + 8).map((hour) => {
                const hourText = String(hour).padStart(2, "0");
                const hits = timedItems.filter((item) => item.time.startsWith(hourText));
                return (
                  <div key={hour} className="grid min-h-20 grid-cols-[72px_1fr] gap-3 border-t border-white/10 py-3">
                    <time className="text-sm font-black text-white/55">{hourText}:00</time>
                    <div className="space-y-2">
                      {hits.map((item) => (
                        <button key={item.id} type="button" onClick={() => { if (item.id.startsWith("todo-")) jumpTodo(item.id.replace("todo-", "")); }} className={`w-full rounded-2xl p-3 text-left text-sm text-white ${item.kind === "TODO" ? "bg-emerald-300/15" : "bg-sky-300/15"}`}>
                          <b>{item.time}</b> {item.title}
                          <p className="mt-1 text-xs text-white/60">{item.kind} / {item.note}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="relative mt-5 grid gap-4 py-2">
            <div className="absolute bottom-0 left-1/2 top-0 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-cyan-300 via-indigo-300 to-amber-300 opacity-70" />
            {[...allDayEvents.map((event) => ({ id: `event-${event.id}`, time: "終日", title: event.title, note: event.note || "予定", kind: "予定" })), ...floatingTodos.map((todo) => ({ id: `todo-${todo.id}`, time: "いつでも", title: todo.title, note: todo.priority || "時間指定なしTODO", kind: "TODO" })), ...timedItems].map((item, index) => (
              <article key={item.id} className={`relative w-[calc(50%-1rem)] rounded-3xl border border-white/10 bg-slate-950/55 p-4 text-white shadow-xl ${index % 2 ? "justify-self-end" : "justify-self-start"}`}>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">{item.time}</span>
                <h3 className="mt-2 font-black text-white">{item.title}</h3>
                <p className="mt-1 text-xs text-white/55">{item.kind} / {item.note}</p>
              </article>
            ))}
            {!dayEvents.length && !dayTodos.length && <div className="relative justify-self-center rounded-3xl border border-white/10 bg-white/10 p-4 text-center text-white"><p className="font-black">この日はまだ空だよ</p><p className="mt-1 text-sm text-white/55">上の予定追加や写真AIから入れるとここに出るよ。</p></div>}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
'''

CSS_FIX = r'''
/* ===== v64 photo calendar + todo link ===== */
.calendar-timeline-v64,
.calendar-timeline-v64 * {
  color: rgba(255,255,255,.96);
}

.calendar-timeline-v64 input,
.calendar-timeline-v64 textarea,
.calendar-timeline-v64 button {
  color: rgba(255,255,255,.96) !important;
}

.calendar-timeline-v64 input::placeholder,
.calendar-timeline-v64 textarea::placeholder {
  color: rgba(255,255,255,.45) !important;
}
'''

def backup(path: Path) -> None:
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    out = path.with_suffix(path.suffix + f".backup-v64-{stamp}")
    shutil.copyfile(path, out)
    print("backup", out)

def remove_function(text: str, name: str, next_markers: list[str]) -> str:
    start = text.find(f"function {name}(")
    if start == -1:
        return text
    candidates = [text.find(marker, start + 1) for marker in next_markers]
    candidates = [i for i in candidates if i != -1]
    if not candidates:
        raise RuntimeError(f"Could not find end marker after {name}")
    end = min(candidates)
    print(f"removed function {name}")
    return text[:start] + text[end:]

def insert_functions(text: str) -> str:
    text = remove_function(text, "PhotoCalendarImportV64", ["\nfunction CalendarTimelineInlineV64(", "\nfunction CalendarTimelineInlineV63(", "\nfunction CalendarPanel("])
    text = remove_function(text, "CalendarTimelineInlineV64", ["\nfunction CalendarPanel("])
    text = remove_function(text, "CalendarTimelineInlineV63", ["\nfunction CalendarPanel("])
    marker = "\nfunction CalendarPanel("
    if marker not in text:
        raise RuntimeError("CalendarPanel marker was not found")
    return text.replace(marker, "\n" + PHOTO_FUNCTION.strip() + "\n\n" + TIMELINE_FUNCTION.strip() + marker, 1)

def patch_calendar_panel_call(text: str) -> str:
    text = re.sub(r'\n\s*<PhotoCalendarImportV64[^>]*/>\s*', "\n", text)
    text = re.sub(r'\n\s*<CalendarTimelineInlineV6[34][^>]*/>\s*', "\n", text)
    quick = '      <CalendarQuickAddPanel refreshSnapshot={refreshSnapshot} setSelected={setSelected} setCursorMonth={setCursorMonth} />\n'
    insert = quick + '      <PhotoCalendarImportV64 refreshSnapshot={refreshSnapshot} setSelected={setSelected} />\n' + '      <CalendarTimelineInlineV64 events={snapshot?.events || []} todos={snapshot?.todos || []} selected={selected} setSelected={setSelected} />\n'
    if quick not in text:
        raise RuntimeError("CalendarQuickAddPanel line was not found")
    return text.replace(quick, insert, 1)

def patch_page(path: Path) -> bool:
    if not path.exists():
        return False
    backup(path)
    text = path.read_text(encoding="utf-8")
    before = text
    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")
    text = insert_functions(text)
    text = patch_calendar_panel_call(text)
    path.write_text(text, encoding="utf-8")
    print(("patched" if text != before else "checked"), path)
    return True

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup(path)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def patch_css(path: Path):
    if not path.exists():
        return
    backup(path)
    text = path.read_text(encoding="utf-8")
    if "v64 photo calendar + todo link" not in text:
        text += "\n" + CSS_FIX
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("css already patched", path)

root = Path.cwd()
base = Path(__file__).resolve().parent
api = (base / "photo-extract-route.ts").read_text(encoding="utf-8")
patched = False

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "api" / "calendar" / "photo-extract" / "route.ts", api)
    patched = patch_page(root / "app" / "page.tsx") or patched
    patch_css(root / "app" / "globals.css")

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "api" / "calendar" / "photo-extract" / "route.ts", api)
    patched = patch_page(root / "src" / "app" / "page.tsx") or patched
    patch_css(root / "src" / "app" / "globals.css")

if not patched:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v64 photo AI calendar and TODO link completed")
