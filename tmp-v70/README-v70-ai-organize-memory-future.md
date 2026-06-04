# Life Command OS v70 AI Organizer / Memory / Future

## 追加内容

### 1. AI自動整理ボックス
- 書いた内容をAI/ローカルルールで分類
- メモ / TODO / カレンダー / Diary / 家計簿 / 筋トレ体調 / 信念カード / 未来メモ / アイデア / 未処理に振り分け

### 2. 今日の司令室
- 今日の予定
- 今日のTODO
- 今日の支出
- 今日のメモ
- 未来の自分からのメモ

### 3. 未処理メモ救出
- 古いメモから、TODO/予定/支払い/求人/筋トレなどの放置候補を抽出
- ワンタップで未処理Inboxへ救出

### 4. 感情ログ → 原因分析
- メモ/Diaryから、不安・ストレス・暇・コーヒー・運動・読書/アニメの傾向を簡易分析

### 5. 筋トレ・体調メモ連携
- 筋トレ/体調ログをLife OSに保存
- Wind-Hunt OSへ渡しやすいJSONを表示

### 6. AI記憶カード
- 名言/信念/人生方針をカード化
- ホームにランダム表示

### 7. 未来の自分へのメモ
- 指定日に再表示される未来メモ

### 8. 1タップ脳ダンプ
- そのまま保存
- TODO化
- 予定化
- 日記化
- 筋トレログ化
- お金メモ化
- 記憶カード化
- アイデア化

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v70
unzip -o ~/Downloads/life-command-os-v70-ai-organize-memory-future.zip -d ./tmp-v70
python3 ./tmp-v70/apply-v70-ai-organize-memory-future.py

npm run build
```

## 確認

```bash
grep -n 'MemoLifeOSExpansionV70\|memo-organize-v70' app/page.tsx
ls app/components/MemoLifeOSExpansionV70.tsx
ls app/api/life/memo-organize-v70/route.ts
npm run build
```

## デプロイ

```bash
npx --yes vercel@latest --prod --force
```

## GitHub保存

```bash
git add -A
git commit -m "Add AI organize box memory future and memo rescue v70"
git push origin main
```

## 任意の環境変数

```bash
OPENAI_API_KEY
OPENAI_MEMO_ORGANIZER_MODEL
```

未設定でもローカル分類で動きます。
