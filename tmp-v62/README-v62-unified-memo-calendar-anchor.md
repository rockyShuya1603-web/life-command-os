# Life Command OS v62 Unified Memo + Calendar Anchor

## 修正内容

### メモページ

- メモ作成欄を **Life Command OSタイトル下、既存メモ一覧より上** に配置
- 既存の「探せるメモ」と「削除ボタン側のメモ」を非表示にして、v62の統一メモ欄に合体
- 作成・検索・削除を1つのメモ欄で統一
- 重複メモを本文/タイトルで dedupe
- 削除は全memo系localStorageから同じメモを削除
- メモ追加の保存先を強化
- 画像添付、AI補助、TODO化、音声入力は維持

### カレンダー

- タイムライン付きカレンダーを **カレンダーページの「手軽に予定追加」の真下** に配置
- 既存予定の取得を強化
- event/calendar/schedule/plan/todo系localStorageから予定候補を拾う
- 予定追加時はv62/v61/v59/既存events系に橋渡し保存
- 見た目はv61の青いLiquid Glass方向を維持

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v62
unzip -o ~/Downloads/life-command-os-v62-unified-memo-calendar-anchor.zip -d ./tmp-v62
python3 ./tmp-v62/apply-v62-unified-memo-calendar-anchor.py

npm run build
```

## 確認

```bash
grep -n 'UnifiedMemoV62\|CalendarTimelineV62\|life-v62-injected' app/page.tsx
ls app/components/UnifiedMemoV62.tsx
ls app/components/CalendarTimelineV62.tsx
ls app/timeline/page.tsx
ls app/calendar-pro/page.tsx
grep -n 'v62 unified memo' app/globals.css
```

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Unify memo page and anchor calendar timeline v62"
git push origin main
```
