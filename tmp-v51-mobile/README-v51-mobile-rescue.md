# Life Command OS v51 Mobile Rescue

今の状態で大きく崩れているスマホUIを、まず実用状態へ戻すための修正です。

## 修正内容

- 過去の v39〜v49 追記CSSを削除
- v51の整理済みCSSだけを追加
- 旧下部ナビを隠し、v51下部ナビだけを固定表示
  - ホーム / メモ / TODO / カレンダー / もっと
- Quick Addをv51として復活
- 全ページ一覧をdetails形式で復活
  - 開く / 閉じる ができる
- 検索欄まわりの名前アイコン / 手動同期系の重なりを抑制
- 習慣トラッカー / モチベーション / 天気を切らずに見えるよう、下部カードのmax-heightを解除
- Gmail auto-sync APIは維持
- Vercel Hobby対応のdaily cronへ修正

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v51-mobile
unzip -o ~/Downloads/life-command-os-v51-mobile-rescue.zip -d ./tmp-v51-mobile
python3 ./tmp-v51-mobile/apply-v51-mobile-rescue.py

npm run build
```

## 確認

```bash
grep -n 'life-mobile-nav-v51\|life-floating-quickadd-v51\|life-page-drawer-v51' app/page.tsx
grep -n 'v51 mobile rescue' app/globals.css
cat vercel.json
```

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src vercel.json
git commit -m "Rescue mobile UI nav drawer quick add and visible cards v51"
git push origin main
```

## 戻す場合

このパッチは `app/page.tsx.backup-v51-...` と `app/globals.css.backup-v51-...` を自動作成します。
戻したい場合はバックアップを元のファイル名に戻してください。
