# Life Command OS v62 Rollback Restore

## 目的

v62で起きた問題を戻します。

- メモページで既存メモが消えた
- 他ページに移動できなくなった
- v62の統合メモが既存UIを隠した
- v62のカレンダー差し込みが期待通り反映しなかった

このzipは **v62の差し込みだけを外す緊急復旧版** です。

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v62-rollback
unzip -o ~/Downloads/life-command-os-v62-rollback-restore.zip -d ./tmp-v62-rollback
python3 ./tmp-v62-rollback/apply-v62-rollback-restore.py

npm run build
```

## 確認

```bash
grep -n 'UnifiedMemoV62\|CalendarTimelineV62\|life-v62-injected\|v62 unified memo' app/page.tsx app/globals.css
npm run build
```

この `grep` で何も出なければ、v62の差し込みは外れています。

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Rollback v62 unified memo calendar injection"
git push origin main
```

## 次の方針

次は既存メモUIを隠さず、既存の「メモを書く欄」の位置だけをコード上で移動する方式にするのが安全です。
カレンダーも「既存の予定追加処理」と同じ保存関数・同じstateを使う必要があります。
DOMを探して上から被せる方式はやめた方が安全です。
