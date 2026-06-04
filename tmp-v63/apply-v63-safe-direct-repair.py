#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

V62_IMPORTS = [
    'import UnifiedMemoV62 from "./components/UnifiedMemoV62";',
    'import CalendarTimelineV62 from "./components/CalendarTimelineV62";',
]

V62_PATTERNS = [
    r'\n\s*<UnifiedMemoV62[^>]*/>\s*\n',
    r'\n\s*<CalendarTimelineV62[^>]*/>\s*\n',
    r'\n\s*<div className="life-v62-injected">[\s\S]*?</div>\s*\n',
]

CALENDAR_TIMELINE_FUNCTION = r'''
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
        .sort((a, b) => (a.start_time || "99:99").localeCompare(b.start_time || "99:99")),
    [events, selected],
  );

  const dayTodos = useMemo(
    () =>
      todos
        .filter((todo) => !todo.done && (todo.due_date || getCreatedDateKey(todo.created_at)) === selected)
        .sort((a, b) => (a.due_time || "99:99").localeCompare(b.due_time || "99:99")),
    [todos, selected],
  );

  const allDayEvents = dayEvents.filter((event) => !event.start_time);
  const timedItems = [
    ...dayEvents
      .filter((event) => event.start_time)
      .map((event) => ({
        id: `event-${event.id}`,
        time: event.start_time || "終日",
        title: event.title,
        note: event.note || "予定",
        kind: "予定",
      })),
    ...dayTodos
      .filter((todo) => todo.due_time)
      .map((todo) => ({
        id: `todo-${todo.id}`,
        time: todo.due_time || "TODO",
        title: todo.title,
        note: todo.priority || "TODO",
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
    <GlassCard className="calendar-timeline-v63 bg-gradient-to-br from-sky-400/10 via-indigo-400/10 to-fuchsia-400/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.25em] text-cyan-100/60">
            CALENDAR TIMELINE
          </p>
          <h2 className="mt-1 text-2xl font-black">タイムライン付きカレンダー</h2>
          <p className="mt-1 text-sm text-white/55">
            上の「手軽に予定追加」で保存した予定を、そのままここに反映するよ。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelected(addDays(selected, -1))}
            className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black"
          >
            前日
          </button>
          <button
            type="button"
            onClick={() => setSelected(todayKey())}
            className="rounded-2xl bg-white px-3 py-2 text-sm font-black text-black"
          >
            今日
          </button>
          <button
            type="button"
            onClick={() => setSelected(addDays(selected, 1))}
            className="rounded-2xl bg-white/10 px-3 py-2 text-sm font-black"
          >
            翌日
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[80px_repeat(7,minmax(0,1fr))]">
        <div className="grid place-items-center rounded-3xl bg-white/10 p-3 text-2xl font-black">
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
              className={`rounded-3xl border p-3 text-center transition active:scale-[0.98] ${
                active
                  ? "border-cyan-200 bg-cyan-300 text-black shadow-lg shadow-cyan-500/20"
                  : "border-white/10 bg-black/25 hover:bg-white/10"
              }`}
            >
              <p className="text-xs font-black opacity-70">
                {["日", "月", "火", "水", "木", "金", "土"][d.getDay()]}
              </p>
              <p className="mt-1 text-2xl font-black">{d.getDate()}</p>
              <p className="mt-1 text-xs font-black opacity-75">
                {w.icon} {w.temp}
              </p>
              {count > 0 && (
                <p className={`mt-2 rounded-full px-2 py-1 text-[11px] font-black ${active ? "bg-black/10" : "bg-white/10"}`}>
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
          className={`rounded-2xl px-4 py-2 text-sm font-black ${viewMode === "day" ? "bg-white text-black" : "bg-white/10"}`}
        >
          日
        </button>
        <button
          type="button"
          onClick={() => setViewMode("timeline")}
          className={`rounded-2xl px-4 py-2 text-sm font-black ${viewMode === "timeline" ? "bg-white text-black" : "bg-white/10"}`}
        >
          タイムライン
        </button>
      </div>

      <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-black">{selected} の予定</h3>
            <p className="mt-1 text-sm text-white/50">
              予定 {dayEvents.length}件 / TODO {dayTodos.length}件
            </p>
          </div>
        </div>

        {viewMode === "day" ? (
          <div className="mt-4 space-y-3">
            <div className="grid gap-2 sm:grid-cols-[72px_1fr] sm:items-center">
              <p className="text-sm font-black text-white/45">終日</p>
              <div className="flex flex-wrap gap-2">
                {allDayEvents.length ? (
                  allDayEvents.map((event) => (
                    <span key={event.id} className="rounded-2xl bg-cyan-300/20 px-3 py-2 text-sm font-black text-cyan-50">
                      {event.title}
                    </span>
                  ))
                ) : (
                  <span className="rounded-2xl bg-white/10 px-3 py-2 text-sm text-white/45">
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
                    <time className="text-sm font-black text-white/45">{hourText}:00</time>
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
                          className={`w-full rounded-2xl p-3 text-left text-sm ${
                            item.kind === "TODO" ? "bg-emerald-300/15 text-emerald-50" : "bg-sky-300/15 text-sky-50"
                          }`}
                        >
                          <b>{item.time}</b> {item.title}
                          <p className="mt-1 text-xs opacity-60">{item.note}</p>
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
                className={`relative w-[calc(50%-1rem)] rounded-3xl border border-white/10 bg-slate-950/55 p-4 shadow-xl ${
                  index % 2 ? "justify-self-end" : "justify-self-start"
                }`}
              >
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-cyan-100">
                  {item.time}
                </span>
                <h3 className="mt-2 font-black">{item.title}</h3>
                <p className="mt-1 text-xs text-white/45">{item.kind} / {item.note}</p>
              </article>
            ))}
            {!dayEvents.length && !dayTodos.length && (
              <div className="relative justify-self-center rounded-3xl border border-white/10 bg-white/10 p-4 text-center">
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

def backup(path: Path) -> None:
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    out = path.with_suffix(path.suffix + f".backup-v63-{stamp}")
    shutil.copyfile(path, out)
    print("backup", out)

def remove_v62(text: str) -> str:
    for line in V62_IMPORTS:
        text = text.replace(line + "\n", "")
        text = text.replace(line, "")
    for pattern in V62_PATTERNS:
        text = re.sub(pattern, "\n", text, flags=re.DOTALL)
    return text

def patch_memos_panel(text: str) -> str:
    start = text.find("function MemosPanel(")
    end = text.find("\nfunction TweetsPanel(", start)
    if start == -1 or end == -1:
        raise RuntimeError("MemosPanel block was not found")

    block = text[start:end]
    original = block

    block = re.sub(r'\n\s*<MemoUpgradePanel memos=\{memos\} refreshSnapshot=\{refreshSnapshot\} onDraft=\{setContent\} />', "", block)

    if 'memoSearch' not in block:
        block = block.replace(
            '  const memos = snapshot?.memos || [];\n',
            '''  const memos = snapshot?.memos || [];
  const [memoSearch, setMemoSearch] = useState("");
  const visibleMemos = useMemo(() => {
    const query = memoSearch.trim().toLowerCase();
    if (!query) return memos;
    return memos.filter((memo) =>
      `${memo.content || ""} ${memo.created_at || ""}`.toLowerCase().includes(query),
    );
  }, [memos, memoSearch]);
'''
        )

    if 'id="memo-create-top-v63"' not in block:
        block = block.replace(
            '      <TextArea\n        className="h-32"',
            '''      <GlassCard id="memo-create-top-v63" className="border-cyan-200/20 bg-gradient-to-br from-cyan-400/10 via-indigo-400/10 to-fuchsia-400/10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.25em] text-cyan-100/60">MEMO WRITE</p>
            <h2 className="mt-1 text-2xl font-black">メモを書く</h2>
            <p className="mt-1 text-sm text-white/55">
              ここで書いたメモが、下のメモ一覧にそのまま追加されるよ。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setContent("")}
            className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black"
          >
            入力をクリア
          </button>
        </div>
      </GlassCard>
      <TextArea
        className="h-32"'''
        )

    if 'id="memo-list-search-v63"' not in block:
        block = block.replace(
            '      {!memos.length && (\n        <Empty text="まだメモがないよ。追加するとここにカード表示されるよ。" />\n      )}\n      <div className="grid gap-3">\n        {memos.map((m) => (',
            '''      <GlassCard id="memo-list-search-v63">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.25em] text-sky-100/55">UNIFIED MEMO LIST</p>
            <h2 className="mt-1 text-xl font-black">メモ一覧</h2>
            <p className="mt-1 text-sm text-white/55">
              検索・編集・削除をこの一覧に統一したよ。別枠の重複メモ表示は外した。
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <Field
              placeholder="メモを検索"
              value={memoSearch}
              onChange={(e) => setMemoSearch(e.target.value)}
            />
          </div>
        </div>
        <p className="mt-3 text-xs font-black text-white/45">
          表示 {visibleMemos.length}件 / 全体 {memos.length}件
        </p>
      </GlassCard>
      {!visibleMemos.length && (
        <Empty text={memoSearch ? "検索に一致するメモはないよ。" : "まだメモがないよ。追加するとここにカード表示されるよ。"} />
      )}
      <div className="grid gap-3">
        {visibleMemos.map((m) => ('''
        )
    else:
        block = block.replace("{memos.map((m) => (", "{visibleMemos.map((m) => (")

    if block == original:
        print("MemosPanel: no changes were necessary")
    else:
        print("MemosPanel: patched")
    return text[:start] + block + text[end:]

def patch_calendar_panel(text: str) -> str:
    if "function CalendarTimelineInlineV63(" not in text:
        marker = "\nfunction CalendarPanel("
        if marker not in text:
            raise RuntimeError("CalendarPanel marker was not found")
        text = text.replace(marker, CALENDAR_TIMELINE_FUNCTION + marker)
        print("CalendarTimelineInlineV63: inserted")
    else:
        print("CalendarTimelineInlineV63: already exists")

    needle = '      <CalendarQuickAddPanel refreshSnapshot={refreshSnapshot} setSelected={setSelected} setCursorMonth={setCursorMonth} />\n'
    insertion = needle + '      <CalendarTimelineInlineV63 events={snapshot?.events || []} todos={snapshot?.todos || []} selected={selected} setSelected={setSelected} />\n'

    if insertion in text:
        print("CalendarPanel insertion: already exists")
    elif needle in text:
        text = text.replace(needle, insertion)
        print("CalendarPanel insertion: patched")
    else:
        raise RuntimeError("CalendarQuickAddPanel line was not found")
    return text

def patch_page(path: Path) -> bool:
    if not path.exists():
        return False
    backup(path)
    text = path.read_text(encoding="utf-8")
    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    text = remove_v62(text)
    text = patch_memos_panel(text)
    text = patch_calendar_panel(text)
    path.write_text(text, encoding="utf-8")
    print("patched", path)
    return True

def patch_css(path: Path) -> None:
    if not path.exists():
        return
    backup(path)
    text = path.read_text(encoding="utf-8")
    marker = "/* ===== v62 unified memo + calendar anchor ===== */"
    idx = text.find(marker)
    if idx != -1:
        text = text[:idx].rstrip() + "\n"
        print("removed v62 CSS block", path)
    path.write_text(text, encoding="utf-8")

root = Path.cwd()
patched = False
for page in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    patched = patch_page(page) or patched

for css in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    patch_css(css)

if not patched:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v63 safe direct repair completed")
