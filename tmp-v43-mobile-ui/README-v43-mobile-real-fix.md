# Life Command OS v43 Mobile Real Fix

スマホUI/GUIが縦長・文字縦折れ・カード細すぎで崩れている問題を修正するパッチです。

## 修正内容

- 小さいスマホでは「今日の予定」「今日のメモ」を1カラムに戻す
- 文字が縦に折れる問題を抑制
- カード高さ・余白を圧縮
- 下部ナビを少し低くする
- Quick Addを小さめ虹色オーブに調整
- 天気カード重複をCSS側で抑制

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v43-mobile-ui
unzip -o ~/Downloads/life-command-os-v43-mobile-real-fix.zip -d ./tmp-v43-mobile-ui
python3 ./tmp-v43-mobile-ui/apply-v43-mobile-real-fix.py

npm run build
```

## デプロイ

```bash
npx vercel --prod --force
```

## 確認

```bash
grep -n 'v43 mobile UI real fix' app/globals.css
```

## GitHub

```bash
git add app src public
git commit -m "Fix mobile UI readability and compact layout v43"
git push origin main
```
