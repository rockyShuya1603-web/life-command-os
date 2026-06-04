# Life Command OS v47 Mobile Clean Repair

v45/v46で崩れたスマホUIを、過去パッチCSSを削除した上で整理し直す修正版です。

## 内容

- v39〜v46の追記CSSを一度削除
- 検索欄まわりの重複表示を抑制
- アプリ名の省略を抑制
- お天気コーナーを消さない
- 習慣トラッカー / モチベーションを消さず、縦長化だけ抑える
- 下部ナビのホームだけ巨大化・飛び出しを止める
- Quick Addを小さめ虹色ボタンに調整

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v47-mobile-ui
unzip -o ~/Downloads/life-command-os-v47-mobile-clean-repair.zip -d ./tmp-v47-mobile-ui
python3 ./tmp-v47-mobile-ui/apply-v47-mobile-clean-repair.py

npm run build
```

## 確認

```bash
grep -n 'v47 mobile clean repair' app/globals.css
grep -n 'v46 mobile rollback compact fix\|v45 mobile duplicate header fix\|v44 mobile compact fix\|v43 mobile UI real fix' app/globals.css
```

2つ目が何も出なければ、古い悪化CSSは消えています。

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub

```bash
git add app src public
git commit -m "Clean repair mobile UI layout v47"
git push origin main
```
