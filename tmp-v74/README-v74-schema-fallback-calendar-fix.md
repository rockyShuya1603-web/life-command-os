# Life Command OS v74 Schema + Fallback Calendar Fix

## 今回の本当の原因

カレンダー予定テーブル `calendar_events` に `start_time` 列が無い状態だと、写真から予定追加で `start_time` を保存しようとして失敗します。

また、TODO側も `due_time` 列が無い状態だと、TODO追加時に時刻が保存されず、カレンダーが時間帯に出せません。

つまり、コードだけではなく **SupabaseのDB列追加が必要** です。

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v74
unzip -o ~/Downloads/life-command-os-v74-schema-fallback-calendar-fix.zip -d ./tmp-v74
python3 ./tmp-v74/apply-v74-schema-fallback-calendar-fix.py

npm run build
```

## 重要：Supabase SQL Editorで実行

このSQLを Supabase の SQL Editor にコピペして実行してください。

```bash
cat supabase-v74-calendar-todo-schema-fix.sql
```

中身をコピーして Supabase SQL Editor で Run。

これをやらないと、`start_time` / `due_time` がDBに存在しないままなので、時間指定の完全反映はできません。

## 確認

```bash
grep -n 'SCHEMA SAFE TODO CALENDAR v74\|PHOTO TO CALENDAR v74' app/components/CalendarTodoPhotoFixV72.tsx
grep -n 'dueTime ?.*cleanTitle\|nextEdit.due_time' app/page.tsx
ls supabase-v74-calendar-todo-schema-fix.sql
npm run build
```

## デプロイ

```bash
npx --yes vercel@latest --prod --force
```

## GitHub保存

```bash
git add -A
git commit -m "Fix calendar TODO photo schema fallback v74"
git push origin main
```
