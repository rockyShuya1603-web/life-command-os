# Life Command OS v46 Mobile Rollback Compact

v45で悪化したスマホUIを戻しながら、必要な部分だけコンパクト化する修正です。

## 重要

このパッチは、過去のv39〜v45系の追記CSSを一度削除してから、v46の整理済みCSSだけを入れます。  
`app/globals.css.backup-v46-...` のバックアップも自動作成します。

## 修正内容

- v45で悪化したCSSを削除
- 検索欄付近のダブり原因になりやすい全ページ一覧カードをスマホでは非表示
- ステータスタイルを5つ横並びに戻して縦長化を軽減
- 今日の予定 / 今日のメモを2カラムで維持しつつ縦書き崩れを抑制
- 習慣トラッカーを最大高さで止め、縦長に戻らないように修正
- Quick Addを小さめ虹色ボタンへ調整
- 下部ナビをコンパクト化

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v46-mobile-ui
unzip -o ~/Downloads/life-command-os-v46-mobile-rollback-compact.zip -d ./tmp-v46-mobile-ui
python3 ./tmp-v46-mobile-ui/apply-v46-mobile-rollback-compact.py

npm run build
```

## デプロイ

```bash
npx vercel --prod --force
```

## 確認

```bash
grep -n 'v46 mobile rollback compact fix' app/globals.css
grep -n 'v45 mobile duplicate header fix\|v44 mobile compact fix\|v43 mobile UI real fix' app/globals.css
```

2つ目のgrepで何も出なければ、古い悪化CSSは消えています。

## GitHub

```bash
git add app src public
git commit -m "Rollback bad mobile CSS and compact home layout v46"
git push origin main
```
