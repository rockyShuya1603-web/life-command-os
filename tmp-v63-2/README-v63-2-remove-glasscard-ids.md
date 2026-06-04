# Life Command OS v63.2 Remove GlassCard IDs

## 原因

まだこれが残っています。

```tsx
<GlassCard id="memo-list-search-v63">
```

`GlassCard` は `id` を受け取れない型なので、TypeScriptが止まります。

## 修正内容

`app/page.tsx` と `src/app/page.tsx` から、`GlassCard` に付いている `id` だけを全削除します。

対象例:

```tsx
<GlassCard id="memo-list-search-v63">
<GlassCard id="memo-create-top-v63" className="...">
```

修正後:

```tsx
<GlassCard>
<GlassCard className="...">
```

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v63-2
unzip -o ~/Downloads/life-command-os-v63-2-remove-glasscard-ids.zip -d ./tmp-v63-2
python3 ./tmp-v63-2/apply-v63-2-remove-glasscard-ids.py

npm run build
```

## 確認

```bash
grep -n 'GlassCard[^>]*id=' app/page.tsx src/app/page.tsx
npm run build
```

`grep` で何も出なければOKです。

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Remove unsupported GlassCard id props v63.2"
git push origin main
```
