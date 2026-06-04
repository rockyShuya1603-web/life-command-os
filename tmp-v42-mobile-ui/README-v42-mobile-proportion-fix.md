# Life Command OS v42 Mobile Proportion Fix

これは **v41の上からさらに当てる修正パッチ** です。

## 主な修正

- スマホ画面が縦長すぎる問題を緩和
- ホームカードの縦幅を圧縮して、理想画像みたいに密度を上げる
- 「今日の予定」と「今日のメモ」を2カラム寄りにして見た目を改善
- 下部ナビを理想寄せ
  - ホーム
  - メモ
  - TODO
  - カレンダー
  - もっと
- Quick Addの虹色ボタンを、右下の小さめ発光オーブ風に調整
- 重複しやすい天気ブロックをCSS側で1つだけ見せやすくする

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v42-mobile-ui
unzip -o ~/Downloads/life-command-os-v42-mobile-proportion-fix.zip -d ./tmp-v42-mobile-ui
python3 ./tmp-v42-mobile-ui/apply-v42-mobile-proportion-fix.py

npm run build
```

## デプロイ

```bash
npx vercel --prod --force
```

## 確認

```bash
grep -n 'life-mobile-nav-v41\|life-floating-quickadd-v41\|mobile-home-button-v40\|カレンダー' app/page.tsx
grep -n 'v42 mobile proportion fix / closer to ideal' app/globals.css
```

## GitHub

```bash
git add app src public
git commit -m "Refine mobile proportions and nav to match target"
git push origin main
```
