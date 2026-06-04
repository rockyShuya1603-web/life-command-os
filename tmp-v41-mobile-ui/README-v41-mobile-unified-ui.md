# Life Command OS v41 Mobile Unified UI

v40を前提に、スマホUIをさらに画像方向へ寄せるパッチです。

## 反映内容

- スマホ上部HUDをさらに画像寄せ
  - ロゴ風リング
  - 横長検索バー
  - 丸い通知/プロフィール
- ホームカードをさらにコンパクト化
  - 縦長すぎる見た目を軽減
  - 今日の進行 / 今日の予定 / 今日のメモを小さめに整理
  - 天気/習慣系を2カラム寄せ
- メモ / TODO / カレンダーの入力欄・カードを未来感あるLiquid Glass風に統一
- ホーム下部ボタンは送ってくれた画像ボタンを使用
- 下部ナビ
  - ホーム / メモ / TODO / 予定 / もっと
- Quick Addは右下の虹色フローティングボタン

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v41-mobile-ui
unzip -o ~/Downloads/life-command-os-v41-mobile-unified-ui.zip -d ./tmp-v41-mobile-ui
python3 ./tmp-v41-mobile-ui/apply-v41-mobile-unified-ui.py

npm run build
```

## デプロイ

```bash
npx vercel --prod --force
```

## 確認

```bash
grep -n 'life-mobile-nav-v41\|life-floating-quickadd-v41\|mobile-home-button-v40\|setPage("todos")' app/page.tsx
grep -n 'v41 mobile unified UI / reference image direction' app/globals.css
ls -lh public/mobile-home-button-v40.png
```

## GitHub

```bash
git add app src public
git commit -m "Upgrade mobile UI to unified v41 design"
git push origin main
```
