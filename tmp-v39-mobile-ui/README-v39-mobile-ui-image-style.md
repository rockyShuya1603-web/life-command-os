# Life Command OS v39 Mobile UI Image Style

添付の理想スマホUIを元に、既存機能を壊さずにスマホUI/GUIを上書き調整するパッチです。

## 変更内容

- スマホ上部HUDを画像寄せに調整
  - ロゴ風リング
  - Life Command OSタイトル
  - 丸い通知/プロフィール
  - 横長検索バー
- ホームカードを画像寄せに調整
  - 中央〜右寄りのLiquid Glassカード
  - 今日の進行 / 今日の予定 / 今日のメモをコンパクト化
  - 天気情報 + 習慣トラッカーを下部2カラム化
  - スマホでは余計に長いカードを非表示
- 下部ナビを画像寄せに変更
  - ホーム / メモ / TODO / カレンダー / もっと
- Quick Addを右下の虹色フローティングボタンへ変更
- 古い下部ナビを無効化

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v39-mobile-ui
unzip -o ~/Downloads/life-command-os-v39-mobile-ui-image-style.zip -d ./tmp-v39-mobile-ui
python3 ./tmp-v39-mobile-ui/apply-v39-mobile-ui.py

npm run build
npx vercel --prod --force
```

## 確認

```bash
grep -n 'image-mobile-nav-v39\|image-floating-quickadd-v39\|hard-mobile-nav\|lc-mobile-nav-final\|safe-bottom\|setPage("todos")' app/page.tsx
grep -n 'v39 mobile UI based on reference image' app/globals.css
```

期待:
- image-mobile-nav-v39 が出る
- image-floating-quickadd-v39 が出る
- setPage("todos") が出る
- hard-mobile-nav / lc-mobile-nav-final / safe-bottom は app/page.tsx に出ない

## GitHub

```bash
git add app src
git commit -m "Upgrade mobile UI based on reference image"
git push origin main
```
