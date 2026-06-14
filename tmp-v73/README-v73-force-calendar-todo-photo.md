# Life Command OS v73 Force Calendar TODO + Photo

## 原因

前回までの問題は主に2つです。

1. 写真から予定追加の保存先が `events` になっていた  
   でも実際の読み込みは `calendar_events` なので、追加に失敗 or 反映されません。

2. カレンダー表示が snapshot 依存で、TODO追加直後に古いデータを見ていました。

## v73で直すこと

- 写真から予定追加の保存先を `calendar_events` に修正
- `CalendarTodoPhotoFixV72.tsx` を中身v73に上書き
- カレンダーが `todos` と `calendar_events` を直接再取得
- 「TODO同期」ボタンで即再取得
- フォーカス時・10秒ごとに自動同期
- `.from("events")` を `.from("calendar_events")` へ置換
- 写真AIが失敗しても手動候補から追加可能

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v73
unzip -o ~/Downloads/life-command-os-v73-force-calendar-todo-photo.zip -d ./tmp-v73
python3 ./tmp-v73/apply-v73-force-calendar-todo-photo.py

npm run build
```

## 確認

```bash
grep -R 'from("events")\|from('\''events'\'')' app src || true
grep -n 'FORCE TODO CALENDAR SYNC v73\|PHOTO TO CALENDAR v73\|calendar_events' app/components/CalendarTodoPhotoFixV72.tsx
npm run build
```

## デプロイ

```bash
npx --yes vercel@latest --prod --force
```

## GitHub保存

```bash
git add -A
git commit -m "Force fix calendar TODO sync and photo calendar save v73"
git push origin main
```
