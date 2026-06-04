# Life Command OS v40 Mobile UI Home Button Patch

しゅうやくんが送ってくれた理想スマホUIの方向に寄せつつ、
**ホームボタンを添付の発光デザインに差し替える**ためのパッチです。

## 反映内容

- スマホ下部ナビを整理
  - ホーム / メモ / TODO / 予定 / もっと
- **ホームボタンを画像ボタン化**
  - `mobile-home-button-v40.png` を使用
- **Quick Addを虹色のフローティングボタン化**
- 旧スマホ下部ナビを非表示化
- スマホ時のカード間隔・余白を圧縮して、**縦長すぎる見た目を軽減**
- 下部2カラム表示を優先して、ホームを少し見やすく調整

---

## 使い方

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v40-mobile-ui
unzip -o ~/Downloads/life-command-os-v40-mobile-ui-home-button.zip -d ./tmp-v40-mobile-ui
python3 ./tmp-v40-mobile-ui/apply-v40-mobile-ui.py
```

---

## ビルド確認

```bash
npm run build
```

---

## 確認コマンド

```bash
grep -n 'image-mobile-nav-v40\|image-floating-quickadd-v40\|mobile-home-button-v40\|setPage("todos")' app/page.tsx
grep -n 'v40 mobile UI polish + home image button' app/globals.css
ls -lh public/mobile-home-button-v40.png
```

---

## GitHub用

```bash
git add app src public
 git commit -m "Upgrade mobile UI with home image button v40"
 git push origin main
```

---

## Vercel用

```bash
npx vercel --prod --force
```

