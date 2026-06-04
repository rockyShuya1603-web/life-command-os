# Life Command OS v53.1 Build Fix

## 原因

前回のv53適用スクリプトで、`app/page.tsx` を保存するときに本来の改行ではなく `\n` という文字列で結合してしまい、1行目が次のように壊れました。

```tsx
"use client";\n\nimport ...
```

その結果、Turbopackが `Expected unicode escape` で止まっています。

## このv53.1で直すこと

- `app/page.tsx.backup-v53-*` があれば、そこから安全に復元
- バックアップがない場合は、先頭付近の `\n` 文字列を本物の改行に戻す
- v53のコンポーネント、CSS、AI検索APIを改めて正しい改行で適用
- 今後の保存処理では `\n` 文字列ではなく本物の改行を使用

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v53-1-fix
unzip -o ~/Downloads/life-command-os-v53-1-buildfix.zip -d ./tmp-v53-1-fix
python3 ./tmp-v53-1-fix/apply-v53-1-buildfix.py

npm run build
```

## 確認

```bash
head -n 5 app/page.tsx
grep -n 'LifeCommandV53Enhancements' app/page.tsx
ls app/components/LifeCommandV53Enhancements.tsx
ls app/api/life-ai/search/route.ts
```

`head -n 5 app/page.tsx` で `\n` が見えず、ちゃんと複数行に分かれていればOKです。

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Fix v53 newline build error"
git push origin main
```
