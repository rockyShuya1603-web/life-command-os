#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

NEW_CALENDAR_TIMELINE_FUNCTION = r'''
function CalendarTimelineInlineV63({
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

  const eventTime = (event: EventItem) =>
    normalizeClock(event.start_time) || inferTimeFromText(`${event.title || ""} ${event.note || ""}`);

  const todoTime = (todo: Todo) =>
    normalizeClock(todo.due_time) || inferTimeFromText(`${todo.title || ""} ${todo.priority || ""}`);

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

  const dayEvents = useMemo(
    () =>
      events
        .filter((event) => event.event_date === selected)
        .sort((a, b) => (eventTime(a) || "99:99").localeCompare(eventTime(b) || "99:99")),
    [events, selected],
  );

  const dayTodos = useMemo(
    () =>
      todos
        .filter((todo) => !todo.done && (todo.due_date || getCreatedDateKey(todo.created_at)) === selected)
        .sort((a, b) => (todoTime(a) || "99:99").localeCompare(todoTime(b) || "99:99")),
    [todos, selected],
  );

  const allDayEvents = dayEvents.filter((event) => !eventTime(event));
  const timedItems = [
    ...dayEvents
      .filter((event) => eventTime(event))
      .map((event) => ({
        id: `event-${event.id}`,
        time: eventTime(event) || "終日",
        title: event.title,
        note: event.start_time ? event.note || "予定" : "タイトルから時刻を推定",
        kind: "予定",
      })),
    ...dayTodos
      .filter((todo) => todoTime(todo))
      .map((todo) => ({
        id: `todo-${todo.id}`,
        time: todoTime(todo) || "TODO",
        title: todo.title,
        note: todo.due_time ? todo.priority || "TODO" : "タイトルから時刻を推定",
        kind: "TODO",
      })),
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

  return (
    <GlassCard className="calendar-timeline-v63 bg-gradient-to-br from-sky-400/10 via-indigo-400/10 to-fuchsia-400/10 text-white">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-cyan-100/60">
            CALENDAR TIMELINE
          </p>
          <h2 className="mt-1 text-2xl font-black text-white">タイムライン付きカレンダー</h2>
          <p className="mt-1 text-sm text-white/60">
            上の「手軽に予定追加」で保存した予定を、そのままここに反映するよ。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(addDays(selected, -1))}
            className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-white"
          >
            前日
          </button>
          <button
            type="button"
            onClick={() => setSelected(todayKey())}
            className="rounded-2xl bg-white/15 px-3 py-2 text-sm font-black text-white"
          >
            今日
          </button>
          <button
            type="button"
            onClick={() => setSelected(addDays(selected, 1))}
            className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black text-white"
          >
            翌日
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[80px_repeat(7,minmax(0,1fr))]">
        <div className="grid place-items-center rounded-3xl bg-white/10 p-3 text-2xl font-black text-white">
          {Number(selected.slice(5, 7))}月
        </div>
        {weekDays.map((date, index) => {
          const d = new Date(`${date}T00:00:00`);
          const active = date === selected;
          const w = weatherFor(index);
          const count =
            events.filter((event) => event.event_date === date).length +
            todos.filter((todo) => !todo.done && (todo.due_date || getCreatedDateKey(todo.created_at)) === date).length;
          return (
            <button
              key={date}
              type="button"
              onClick={() => setSelected(date)}
              className={`rounded-3xl border p-3 text-center text-white transition active:scale-[0.98] ${
                active
                  ? "border-cyan-200 bg-cyan-300/30 shadow-lg shadow-cyan-500/20"
                  : "border-white/10 bg-black/25 hover:bg-white/10"
              }`}
            >
              <p className="text-xs font-black text-white/75">
                {["日", "月", "火", "水", "木", "金", "土"][d.getDay()]}
              </p>
              <p className="mt-1 text-2xl font-black text-white">{d.getDate()}</p>
              <p className="mt-1 text-xs font-black text-white/75">
                {w.icon} {w.temp}
              </p>
              {count > 0 && (
                <p className="mt-2 rounded-full bg-white/10 px-2 py-1 text-[11px] font-black text-white">
                  {count}件
                </p>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setViewMode("day")}
          className={`rounded-2xl px-4 py-2 text-sm font-black text-white ${viewMode === "day" ? "bg-white/20" : "bg-white/10"}`}
        >
          日
        </button>
        <button
          type="button"
          onClick={() => setViewMode("timeline")}
          className={`rounded-2xl px-4 py-2 text-sm font-black text-white ${viewMode === "timeline" ? "bg-white/20" : "bg-white/10"}`}
        >
          タイムライン
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4 text-white">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black text-white">{selected} の予定</h3>
            <p className="mt-1 text-sm text-white/55">
              予定 {dayEvents.length}件 / TODO {dayTodos.length}件
            </p>
          </div>
        </div>

        {viewMode === "day" ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-[72px_1fr] sm:items-center">
              <p className="text-sm font-black text-white/55">終日</p>
              <div className="flex flex-wrap gap-2">
                {allDayEvents.length ? (
                  allDayEvents.map((event) => (
                    <span key={event.id} className="rounded-2xl bg-cyan-300/20 px-3 py-2 text-sm font-black text-cyan-50">
                      {event.title}
                    </span>
                  ))
                ) : (
                  <span className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/55">
                    終日の予定なし
                  </span>
                )}
              </div>
            </div>
            <div className="relative grid gap-0">
              {currentLine !== null && (
                <div
                  className="pointer-events-none absolute left-20 right-0 z-10 h-0.5 bg-rose-400 shadow-[0_0_16px_rgba(251,113,133,.7)]"
                  style={{ top: `${currentLine}%` }}
                >
                  <span className="absolute -left-20 -top-3 text-xs font-black text-rose-200">
                    {new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              )}
              {Array.from({ length: 15 }, (_, index) => index + 8).map((hour) => {
                const hourText = String(hour).padStart(2, "0");
                const hits = timedItems.filter((item) => item.time.startsWith(hourText));
                return (
                  <div key={hour} className="grid min-h-20 grid-cols-[72px_1fr] gap-3 border-t border-white/10 py-3">
                    <time className="text-sm font-black text-white/55">{hourText}:00</time>
                    <div className="space-y-2">
                      {hits.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (item.id.startsWith("todo-")) {
                              const id = item.id.replace("todo-", "");
                              const node = document.getElementById(`todo-${id}`);
                              node?.scrollIntoView({ behavior: "smooth", block: "center" });
                            }
                          }}
                          className={`w-full rounded-2xl p-3 text-left text-sm text-white ${
                            item.kind === "TODO" ? "bg-emerald-300/15" : "bg-sky-300/15"
                          }`}
                        >
                          <b>{item.time}</b> {item.title}
                          <p className="mt-1 text-xs text-white/60">{item.note}</p>
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
            {[...allDayEvents.map((event) => ({
              id: `event-${event.id}`,
              time: "終日",
              title: event.title,
              note: event.note || "予定",
              kind: "予定",
            })), ...timedItems].map((item, index) => (
              <article
                key={item.id}
                className={`relative w-[calc(50%-1rem)] rounded-3xl border border-white/10 bg-slate-950/55 p-4 text-white shadow-xl ${
                  index % 2 ? "justify-self-end" : "justify-self-start"
                }`}
              >
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">
                  {item.time}
                </span>
                <h3 className="mt-2 font-black text-white">{item.title}</h3>
                <p className="mt-1 text-xs text-white/55">{item.kind} / {item.note}</p>
              </article>
            ))}
            {!dayEvents.length && !dayTodos.length && (
              <div className="relative justify-self-center rounded-3xl border border-white/10 bg-white/10 p-4 text-center text-white">
                <p className="font-black">この日はまだ空だよ</p>
                <p className="mt-1 text-sm text-white/55">上の予定追加から入れるとここに出るよ。</p>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
'''

CSS_FIX = r'''
/* ===== v63.3 memo readability ===== */
#memo-create-top-v63,
#memo-list-search-v63 {
  color: white !important;
}

#memo-create-top-v63 ~ * button,
#memo-list-search-v63 button,
#memo-create-top-v63 button,
.calendar-timeline-v63 button {
  color: rgba(255,255,255,.96) !important;
}

#memo-create-top-v63 ~ * button:disabled,
#memo-list-search-v63 button:disabled {
  color: rgba(255,255,255,.45) !important;
}

#memo-create-top-v63 ~ * input,
#memo-create-top-v63 ~ * textarea,
#memo-list-search-v63 input {
  color: white !important;
}

#memo-create-top-v63 ~ * input::placeholder,
#memo-create-top-v63 ~ * textarea::placeholder,
#memo-list-search-v63 input::placeholder {
  color: rgba(255,255,255,.45) !important;
}
'''

def backup(path: Path) -> None:
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    out = path.with_suffix(path.suffix + f".backup-v63-3-{stamp}")
    shutil.copyfile(path, out)
    print("backup", out)

def replace_function(text: str, func_name: str, new_func: str) -> str:
    start = text.find(f"function {func_name}(")
    if start == -1:
        raise RuntimeError(f"{func_name} was not found")

    next_func = text.find("\nfunction CalendarPanel(", start)
    if next_func == -1:
        raise RuntimeError("CalendarPanel marker after timeline function was not found")

    return text[:start] + new_func.strip() + "\n" + text[next_func:]

def patch_memo_buttons(block: str) -> str:
    labels = ["メモを保存", "音声入力", "AIで整理", "メモからTODO作成", "入力をクリア"]

    def patch_match(match: re.Match) -> str:
        full = match.group(0)
        patched = full
        if 'className="' in patched:
            def repl(m: re.Match) -> str:
                cls = m.group(1).replace("text-black", "text-white")
                if "text-white" not in cls:
                    cls += " text-white"
                return f'className="{cls}"'
            patched = re.sub(r'className="([^"]*)"', repl, patched, count=1)
        else:
            patched = patched.replace("<button", '<button className="text-white"', 1)
        return patched

    for label in labels:
        pattern = re.compile(rf'<button\b[\s\S]*?>[\s\S]*?{re.escape(label)}[\s\S]*?</button>', re.MULTILINE)
        block = pattern.sub(patch_match, block)

    return block

def ensure_todo_handler(block: str) -> str:
    if "createTodoFromMemoV633" not in block:
        anchor = '  const visibleMemos = useMemo(() => {\n'
        if anchor in block:
            handler = '''  const createTodoFromMemoV633 = async () => {
    const text = content.trim();
    if (!text) return;
    const title = text.split(/\\n|。|！|!/).map((line) => line.trim()).filter(Boolean)[0]?.slice(0, 60) || "メモからTODO";
    await supabase.from("todos").insert({ title, done: false, priority: "medium" });
    setContent("");
    await refreshSnapshot();
  };

'''
            block = block.replace(anchor, handler + anchor)
            print("MemosPanel: createTodoFromMemoV633 inserted")
        else:
            print("MemosPanel: visibleMemos anchor not found, TODO handler skipped")

    # 「メモからTODO作成」ボタンに onClick が無い場合だけ付ける
    button_pattern = re.compile(r'<button\b(?P<attrs>[^>]*)>(?P<body>[\s\S]*?メモからTODO作成[\s\S]*?)</button>', re.MULTILINE)

    def patch_todo_button(match: re.Match) -> str:
        attrs = match.group("attrs")
        body = match.group("body")
        if "onClick=" in attrs:
            return match.group(0)
        return f'<button type="button" onClick={{createTodoFromMemoV633}}{attrs}>{body}</button>'

    block = button_pattern.sub(patch_todo_button, block, count=1)
    return block

def patch_memos_panel(text: str) -> str:
    start = text.find("function MemosPanel(")
    end = text.find("\nfunction TweetsPanel(", start)
    if start == -1 or end == -1:
        print("MemosPanel not found, skipped")
        return text

    block = text[start:end]
    before = block
    block = patch_memo_buttons(block)
    block = ensure_todo_handler(block)

    if block != before:
        print("MemosPanel readability/TODO patched")
    else:
        print("MemosPanel no changes")
    return text[:start] + block + text[end:]

def patch_page(path: Path) -> bool:
    if not path.exists():
        return False

    backup(path)
    text = path.read_text(encoding="utf-8")
    before = text

    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    text = replace_function(text, "CalendarTimelineInlineV63", NEW_CALENDAR_TIMELINE_FUNCTION)
    text = patch_memos_panel(text)

    path.write_text(text, encoding="utf-8")
    print(("patched" if text != before else "checked"), path)
    return True

def patch_css(path: Path):
    if not path.exists():
        return
    backup(path)
    text = path.read_text(encoding="utf-8")
    if "v63.3 memo readability" not in text:
        text += "\n" + CSS_FIX
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("css already patched", path)

root = Path.cwd()
patched = False

for page in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    patched = patch_page(page) or patched

for css in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    patch_css(css)

if not patched:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v63.3 calendar memo readability completed")
