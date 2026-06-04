# Life Command OS v63 Safe Direct Repair

## 目的

v62のように既存UIを隠したり、別コンポーネントを上から被せたりしません。  
今回は **既存の MemosPanel / CalendarPanel を直接、安全に並び替える** 方式です。

## 修正内容

### メモページ

- v62の差し込みとCSSを外す
- `MemoUpgradePanel` を外して、メモの二重表示を解消
- 既存メモは消さない
- 既存のメモ保存処理 `supabase.from("memos").insert(...)` をそのまま使う
- メモ作成欄を既存メモ一覧より上へ配置
- 検索は実際のメモ一覧に統合
- 編集・削除ボタンは既存の本物のメモカード側をそのまま使用

### カレンダー

- v62の差し込みを外す
- 既存の `CalendarPanel` 内に `CalendarTimelineInlineV63` を追加
- `CalendarQuickAddPanel` の真下に表示
- `snapshot.events` / `snapshot.todos` を直接読むので、上の予定追加欄で保存後に `refreshSnapshot` されれば反映される
- 見た目は青いLiquid Glass系のまま

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v63
unzip -o ~/Downloads/life-command-os-v63-safe-direct-repair.zip -d ./tmp-v63
python3 ./tmp-v63/apply-v63-safe-direct-repair.py

npm run build
```

## 確認

```bash
grep -n 'UnifiedMemoV62\|CalendarTimelineV62\|life-v62-injected\|MemoUpgradePanel\|memo-create-top-v63\|memo-list-search-v63\|CalendarTimelineInlineV63' app/page.tsx
npm run build
```

期待:

- `UnifiedMemoV62` / `CalendarTimelineV62` / `life-v62-injected` は出ない
- `MemoUpgradePanel` はメモページから消える
- `memo-create-top-v63` が出る
- `memo-list-search-v63` が出る
- `CalendarTimelineInlineV63` が出る

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Safely repair memo page and calendar timeline v63"
git push origin main
```
