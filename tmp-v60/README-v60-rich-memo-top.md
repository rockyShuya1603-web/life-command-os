# Life Command OS v60 Rich Memo Top

## 内容

今一番上にある簡易メモコーナーを、画像のような高機能メモコーナーに置き換えます。

追加機能:

- 画像添付
- ファイル添付
- 添付画像プレビュー
- AI補助モード
  - 注釈
  - 補助
  - 分類
  - 整理
  - TODO化
- `AIで整理`
- `メモからTODO作成`
- 音声入力
- タグ
- 分類
- 既存メモ保存キーへの橋渡し保存
- `/api/memo/assist` 追加

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v60
unzip -o ~/Downloads/life-command-os-v60-rich-memo-top.zip -d ./tmp-v60
python3 ./tmp-v60/apply-v60-rich-memo-top.py

npm run build
```

## 確認

```bash
grep -n 'RichMemoComposerTopV60\|rich-memo-v60-injected' app/page.tsx
ls app/components/RichMemoComposerTopV60.tsx
ls app/api/memo/assist/route.ts
grep -n 'v60 rich memo composer top' app/globals.css
```

`rich-memo-v60-injected` が `<main` のすぐ下あたりに出ていればOKです。

## OpenAIを使う場合

`OPENAI_API_KEY` が入っていればAI補助APIが使います。  
モデル指定は任意です。

```bash
npx vercel env add OPENAI_MEMO_MODEL production
npx vercel env add OPENAI_MEMO_MODEL preview
```

値の例:

```text
gpt-4o-mini
```

未設定でもローカル補助で動きます。

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Upgrade top memo composer with attachments and AI assist v60"
git push origin main
```

## 注意

添付画像はブラウザ内保存向けに圧縮しています。大量・高解像度画像を何十枚も保存するとlocalStorage容量に当たる場合があります。
