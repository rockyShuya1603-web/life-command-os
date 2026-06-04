# Life Command OS v53 Memo / Routine-Habit Split / AI Search Boost

## 修正内容

1. メモページに「メモをすぐ書く」新規メモ入力欄を追加
2. 習慣ページとルーティンページを分離
3. AI検索強化カードと `/api/life-ai/search` を追加

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v53-upgrade
unzip -o ~/Downloads/life-command-os-v53-memo-routine-habit-ai-search.zip -d ./tmp-v53-upgrade
python3 ./tmp-v53-upgrade/apply-v53-memo-routine-habit-ai-search.py

npm run build
```

## 確認

```bash
grep -n 'LifeCommandV53Enhancements' app/page.tsx
ls app/components/LifeCommandV53Enhancements.tsx
ls app/api/life-ai/search/route.ts
grep -n 'v53 Memo / Routine-Habit split' app/globals.css
```

## ローカルAI検索確認

```bash
npm run dev
curl "http://localhost:3000/api/life-ai/search?q=未完了TODO"
```

## OpenAI検索補助を使う場合

任意です。設定しなくてもローカルfallbackで動きます。

```bash
npx vercel env add OPENAI_SEARCH_MODEL production
npx vercel env add OPENAI_SEARCH_MODEL preview
```

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Add memo composer routine habit split and AI search boost v53"
git push origin main
```
