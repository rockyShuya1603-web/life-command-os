# Life Command OS v54

## 修正内容

### 1. メモを書くコーナーを一番上へ

- `LifeCommandV53Enhancements` の挿入位置を `<main>` 直後に変更
- メモページでは「メモをすぐ書く」が上に出る
- 下部に出ていたAI検索強化カードは廃止

### 2. LifeレベルのPC/スマホ不一致を改善

これまでLifeレベルは `localStorage` 中心だったので、PCとスマホで一致しませんでした。  
v54では `/api/life/level` を追加し、Supabaseに保存できるようにしています。

追加SQL:

```text
lib/supabase/sql/life-level-state.sql
```

Supabase SQL EditorでこのSQLを一度実行すると、PC/スマホで同期できます。

### 3. 下部AI検索強化カードを削除

- v53の下部AI検索カードは非表示
- 代わりに、上部の検索欄を押したときにAI検索モーダルが開く

### 4. 上部AI検索を強化

例:

```text
先週の支出を教えて
```

これでlocalStorage内の家計簿候補を横断して、日付・金額・カテゴリを集計します。  
OpenAI設定がある場合は `/api/life-ai/search` が補助します。ない場合もローカル判定で動きます。

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v54
unzip -o ~/Downloads/life-command-os-v54-memo-top-life-sync-top-ai.zip -d ./tmp-v54
python3 ./tmp-v54/apply-v54-memo-top-life-sync-top-ai.py

npm run build
```

## Supabase SQL

PC/スマホ同期を有効化する場合は、Supabase SQL Editorで以下のファイル内容を実行してください。

```bash
cat lib/supabase/sql/life-level-state.sql
```

## 確認

```bash
grep -n 'LifeTopSearchBoostV54\|LifeCommandV53Enhancements' app/page.tsx
ls app/api/life/level/route.ts
ls app/api/life-ai/search/route.ts
grep -n 'v54 memo top' app/globals.css
```

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src lib
git commit -m "Move memo composer top sync life level and boost top AI search v54"
git push origin main
```
