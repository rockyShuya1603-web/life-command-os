# Life Command OS v57 Emergency Rollback Stable

## 目的

v53〜v56でメモページとAI検索が悪化したため、まず壊した部分を戻します。

## 実行内容

1. `app/page.tsx` の v53/v54/v55/v56 追加コンポーネントを削除
2. 可能なら `backup-v53-*` から復元
3. v53-v56の重複UIをCSSで非表示
4. 既存メモページをこれ以上壊さない
5. 独立ルートとして安全なページを追加
   - `/habits`
   - `/routines`
   - `/memo-write`
   - `/ai-search`

## なぜ独立ルートにしたか

今の単一 `app/page.tsx` にさらに無理やり差し込むと、またメモページやホームが崩れる可能性が高いです。  
なのでv57では、まず既存画面を戻し、追加機能は独立ページとして安全に追加します。

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v57
unzip -o ~/Downloads/life-command-os-v57-emergency-rollback-stable.zip -d ./tmp-v57
python3 ./tmp-v57/apply-v57-emergency-rollback-stable.py

npm run build
```

## 確認

```bash
grep -n 'LifeCommandV53Enhancements\|LifeTopSearchBoostV54\|LifeTopAISearchV56\|LifeHabitRoutinePagesV56' app/page.tsx
ls app/habits/page.tsx
ls app/routines/page.tsx
ls app/memo-write/page.tsx
ls app/ai-search/page.tsx
```

1つ目のgrepで何も出なければ、悪化原因の差し込みは消えています。

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Rollback broken memo AI injections and add stable habit routes v57"
git push origin main
```

## 使えるURL

- `/habits` 習慣ページ
- `/routines` ルーティンページ
- `/memo-write` 安全な新規メモ入力
- `/ai-search` 安全版AI検索
