# Life Command OS v44 Mobile Compact Fix

スマホ版ホームがまだ縦長で、上部が重なって見える問題をさらに抑えるパッチです。

## 今回の修正

- ホームの各主要ブロックを **強制1カラム化**（430px以下）
- 「今日の予定 / 今日のメモ / 習慣トラッカー」などの **縦長化を抑制**
- 旧モバイルUI候補や重複表示候補を **CSSで非表示**
- 上部ロゴ / ベル / プロフィールの **重なり軽減**
- Quick Addを **小さめ虹色オーブ**に調整
- 下部ナビの高さを少し抑制

## 適用手順

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v44-mobile-ui
unzip -o ~/Downloads/life-command-os-v44-mobile-compact-fix.zip -d ./tmp-v44-mobile-ui
python3 ./tmp-v44-mobile-ui/apply-v44-mobile-compact-fix.py

npm run build
```

## デプロイ

```bash
npx vercel --prod --force
```

## 反映確認

```bash
grep -n 'v44 mobile compact fix' app/globals.css
```

## GitHub

```bash
git add app src public
git commit -m "Fix mobile home tall layout and duplicate blocks v44"
git push origin main
```
