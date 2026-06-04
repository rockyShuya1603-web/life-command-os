# Life Command OS v63.3 Calendar Memo Readability

## 修正内容

### カレンダー

- 終日ではない予定が終日に入る問題を修正
- `start_time` が空でも、タイトル/メモから時刻を推定
  - 昼 / 昼分 / ランチ → 12:00
  - 朝 / 午前 → 08:00
  - 午前中 → 10:00
  - 夕方 → 17:30
  - 夜 → 19:00
  - 就寝 → 23:00
  - `11:14` / `11時14分` / `午後3時` も読み取り
- 推定できた予定は終日ではなく指定時間帯に表示
- カレンダー内の黒文字を白文字に修正

### メモ

- メモページのボタン文字を白に修正
- 入力欄・placeholderの見やすさを改善
- `メモからTODO作成` ボタンがonClickを持っていない場合は、直接TODO作成処理を補強

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v63-3
unzip -o ~/Downloads/life-command-os-v63-3-calendar-memo-readability.zip -d ./tmp-v63-3
python3 ./tmp-v63-3/apply-v63-3-calendar-memo-readability.py

npm run build
```

## 確認

```bash
grep -n 'inferTimeFromText\|昼分\|createTodoFromMemoV633\|v63.3 memo readability' app/page.tsx app/globals.css
npm run build
```

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Fix calendar time placement and memo readability v63.3"
git push origin main
```
