# Life Command OS v72 Calendar TODO + Photo Fix

## 直す内容

### TODOがカレンダーに自動反映されない問題
- TODOの `due_date` / `date` / `deadline` / `scheduled_date` などを広く拾う
- TODOの `due_time` / `time` / `deadline_time` などを広く拾う
- タイトル内の `11:14` / `11時14分` / `午後3時` / `昼` / `朝` / `夜` も時刻推定
- 時間ありTODOは指定時間帯へ表示
- 時間なしTODOは「いつでもTODO」へ表示
- カレンダーに「TODO同期」ボタン追加
- フォーカス時と20秒ごとに自動同期

### カレンダー画像追加が失敗する問題
- 画像を送信前に自動圧縮
- `/api/calendar/photo-extract` を堅牢化
- OPENAI_API_KEY未設定やAI失敗でも、手動編集できる候補を出す
- 「失敗しました」で止まらず、そのまま編集して予定追加できる

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v72
unzip -o ~/Downloads/life-command-os-v72-calendar-todo-photo-fix.zip -d ./tmp-v72
python3 ./tmp-v72/apply-v72-calendar-todo-photo-fix.py

npm run build
```

## 確認

```bash
grep -n 'CalendarTodoPhotoFixV72\|PhotoCalendarImportV72\|CalendarTodoTimelineV72\|TODO同期' app/page.tsx
ls app/components/CalendarTodoPhotoFixV72.tsx
ls app/api/calendar/photo-extract/route.ts
npm run build
```

## デプロイ

```bash
npx --yes vercel@latest --prod --force
```

## GitHub保存

```bash
git add -A
git commit -m "Fix calendar TODO sync and photo import v72"
git push origin main
```

## 写真AIに必要な環境変数

```bash
OPENAI_API_KEY
OPENAI_CALENDAR_VISION_MODEL
```

`OPENAI_CALENDAR_VISION_MODEL` は任意。未設定なら `gpt-4o-mini` を使います。
