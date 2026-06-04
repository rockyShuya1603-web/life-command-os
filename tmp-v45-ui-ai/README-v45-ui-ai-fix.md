# Life Command OS v45 UI + AI Fix

## 修正内容

- スマホ上部の検索欄・全ページ一覧まわりの重複表示をCSSで抑制
- ホームカードの縦長感を圧縮
- 小さいスマホでは予定/メモを1カラムに戻して、文字の縦折れを防止
- Quick Addを小さめ虹色ボタンに調整
- AI強化の土台として、自然文の一言入力を分類するAPIを追加

## 追加AI API

```text
/api/life-ai/intent?q=明日8:30ジム
```

POSTでも使えます。

```json
{ "text": "カフェ 650円" }
```

判定先:

- calendar
- todo
- memo
- budget
- shopping
- mail
- search

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v45-ui-ai
unzip -o ~/Downloads/life-command-os-v45-ui-ai-fix.zip -d ./tmp-v45-ui-ai
python3 ./tmp-v45-ui-ai/apply-v45-ui-ai-fix.py

npm run build
```

## デプロイ

```bash
npx vercel --prod --force
```

## 確認

```bash
grep -n 'v45 mobile duplicate header fix' app/globals.css
ls app/api/life-ai/intent/route.ts
curl "http://localhost:3000/api/life-ai/intent?q=明日8:30ジム"
```

## GitHub

```bash
git add app src lib public
git commit -m "Fix mobile duplicate header and add smart AI intent API v45"
git push origin main
```
