# Life Command OS v63.1 GlassCard id Fix

## 原因

`GlassCard` の型がこうなっているため、

```ts
{ children: ReactNode; className?: string }
```

`<GlassCard id="...">` がTypeScriptエラーになります。

## 修正内容

- `id="memo-create-top-v63"` を GlassCard から外側の `<div>` に移動
- `id="memo-list-search-v63"` も同じく外側の `<div>` に移動
- 既存メモ・カレンダー処理は触らない

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v63-1
unzip -o ~/Downloads/life-command-os-v63-1-glasscard-id-fix.zip -d ./tmp-v63-1
python3 ./tmp-v63-1/apply-v63-1-glasscard-id-fix.py

npm run build
```

## 確認

```bash
grep -n 'GlassCard id="memo-create-top-v63"\|GlassCard id="memo-list-search-v63"\|id="memo-create-top-v63"\|id="memo-list-search-v63"' app/page.tsx
npm run build
```

期待:

- `GlassCard id="..."` は出ない
- `id="memo-create-top-v63"` は外側divとして出る
- `id="memo-list-search-v63"` は外側divとして出る
