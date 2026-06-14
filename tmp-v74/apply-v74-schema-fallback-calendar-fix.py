#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil

def backup(path: Path, root: Path):
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    rel = path.relative_to(root)
    out = root / ".life-backups" / "v74" / f"{str(rel).replace('/', '__')}.backup-{stamp}"
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, out)
    print("backup", out)

def write_file(path: Path, content: str, root: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup(path, root)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def patch_component(path: Path, root: Path):
    if not path.exists():
        print("component not found", path)
        return False

    text = path.read_text(encoding="utf-8")
    original = text

    helper = r'''
function schemaMismatchV74(error: unknown) {
  const message = String((error as any)?.message || error || "");
  return /start_time|end_time|due_time|schema cache|column|Could not find/i.test(message);
}

function withTimeInTextV74(title: string, time: string) {
  if (!time || title.includes(time)) return title;
  return `${time} ${title}`;
}
'''
    if "function schemaMismatchV74" not in text:
        marker = "function Card({ children, className = \"\" }: { children: React.ReactNode; className?: string }) {"
        if marker not in text:
            raise RuntimeError("Card marker not found in CalendarTodoPhotoFixV72.tsx")
        text = text.replace(marker, helper + "\n" + marker, 1)

    text = text.replace("FORCE TODO CALENDAR SYNC v73", "SCHEMA SAFE TODO CALENDAR v74")
    text = text.replace("PHOTO TO CALENDAR v73", "PHOTO TO CALENDAR v74")
    text = text.replace(
        "snapshot待ちではなく、todos / calendar_events から直接再取得して反映する版。",
        "DB列が足りない場合でも、タイトル/メモ内の時刻を拾って表示。SQL実行後は正式な時刻列で動く。"
    )
    text = text.replace(
        "保存先を calendar_events に修正。AIが失敗しても手動候補から追加できるよ。",
        "DB列不足でも fallback 保存する版。SQL実行後は正式な時刻列で保存できるよ。"
    )

    old = '''    try {
      const note = [c.note ? `写真AIメモ: ${c.note}` : "", c.sourceText ? `読み取り根拠: ${c.sourceText}` : "", filename ? `画像: ${filename}` : ""].filter(Boolean).join("\\n");
      const { error } = await supabase.from("calendar_events").insert({ title, event_date: date, start_time: time || null, note });
      if (error) throw error;
      setSelected?.(date);
      await Promise.resolve(refreshSnapshot?.());
      setMessage(time ? `${date} ${time} に予定を追加しました。` : `${date} の終日予定として追加しました。`);
    } catch (e) {
      setMessage(e instanceof Error ? `予定追加に失敗しました: ${e.message}` : "予定追加に失敗しました。");
    } finally {
      setBusy(false);
    }'''
    new = '''    try {
      const note = [time ? `時刻: ${time}` : "", c.note ? `写真AIメモ: ${c.note}` : "", c.sourceText ? `読み取り根拠: ${c.sourceText}` : "", filename ? `画像: ${filename}` : ""].filter(Boolean).join("\\n");

      const fullResult = await supabase
        .from("calendar_events")
        .insert({ title, event_date: date, start_time: time || null, note })
        .select("*")
        .single();

      if (fullResult.error) {
        if (!schemaMismatchV74(fullResult.error)) throw fullResult.error;

        const fallbackResult = await supabase
          .from("calendar_events")
          .insert({
            title: withTimeInTextV74(title, time),
            event_date: date,
            note,
          })
          .select("*")
          .single();

        if (fallbackResult.error) throw fallbackResult.error;
      }

      setSelected?.(date);
      await Promise.resolve(refreshSnapshot?.());
      setMessage(time ? `${date} ${time} に予定を追加しました。` : `${date} の終日予定として追加しました。`);
    } catch (e) {
      setMessage(e instanceof Error ? `予定追加に失敗しました: ${e.message}` : "予定追加に失敗しました。");
    } finally {
      setBusy(false);
    }'''

    if old in text:
        text = text.replace(old, new, 1)
    elif "schemaMismatchV74(fullResult.error)" in text:
        print("photo fallback already patched")
    else:
        print("photo fallback anchor not found")

    if text != original:
        backup(path, root)
        path.write_text(text, encoding="utf-8")
        print("patched component", path)
        return True
    print("component already patched", path)
    return False

def patch_page(path: Path, root: Path):
    if not path.exists():
        return False
    text = path.read_text(encoding="utf-8")
    original = text

    text = text.replace('.from("events")', '.from("calendar_events")')
    text = text.replace(".from('events')", ".from('calendar_events')")

    text = text.replace(
'''        const fallbackPayload = {
          title: cleanTitle,
          priority,
          due_date: dueDate || null,
          done: false,
        };''',
'''        const fallbackPayload = {
          title: dueTime ? `${dueTime} ${cleanTitle}` : cleanTitle,
          priority,
          due_date: dueDate || null,
          done: false,
        };'''
    )

    text = text.replace(
'''            title: nextEdit.title,
            priority: nextEdit.priority,
            due_date: nextEdit.due_date,''',
'''            title: nextEdit.due_time && !nextEdit.title.includes(nextEdit.due_time)
              ? `${nextEdit.due_time} ${nextEdit.title}`
              : nextEdit.title,
            priority: nextEdit.priority,
            due_date: nextEdit.due_date,'''
    )

    if text != original:
        backup(path, root)
        path.write_text(text, encoding="utf-8")
        print("patched page", path)
        return True
    print("page already patched", path)
    return False

def patch_gitignore(path: Path):
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    adds = [line for line in [".life-backups/", "*.backup-*", "app/*.backup-*", "src/app/*.backup-*"] if line not in text]
    if adds:
        path.write_text(text.rstrip() + "\n" + "\n".join(adds) + "\n", encoding="utf-8")
        print("patched", path)

root = Path.cwd()
base = Path(__file__).resolve().parent
sql = (base / "supabase-v74-calendar-todo-schema-fix.sql").read_text(encoding="utf-8")

targets = []
if (root / "app" / "page.tsx").exists():
    targets.append(root / "app")
if (root / "src" / "app" / "page.tsx").exists():
    targets.append(root / "src" / "app")

if not targets:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

for appdir in targets:
    patch_component(appdir / "components" / "CalendarTodoPhotoFixV72.tsx", root)
    patch_page(appdir / "page.tsx", root)

write_file(root / "supabase-v74-calendar-todo-schema-fix.sql", sql, root)
patch_gitignore(root / ".gitignore")

print("v74 schema fallback calendar fix completed")
