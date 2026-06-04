# Life Command OS v59 Additive Life Hub

## 方針

既存のデータや機能を壊さないため、v59は既存ページへ無理やり差し込まず、独立ページとして追加します。  
既存のlocalStorageは読み取り中心で扱い、新しく保存するデータは `life-command-os-v59-*` に分離しています。

## 追加ページ

- `/life-hub` 今日の司令塔ページ
- `/quick-add` 1行Quick Add強化
- `/memo-to-todo` メモからTODO化
- `/routine-templates` 習慣・ルーティンテンプレート
- `/titles` Life称号システム
- `/gacha-collection` 音読ガチャ景品図鑑
- `/money-insights` 支出のAIふりかえり
- `/weekly-review` 週間レビュー

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v59
unzip -o ~/Downloads/life-command-os-v59-additive-life-hub.zip -d ./tmp-v59
python3 ./tmp-v59/apply-v59-additive-life-hub.py

npm run build
```

## 確認

```bash
ls app/life-hub/page.tsx
ls app/quick-add/page.tsx
ls app/memo-to-todo/page.tsx
ls app/routine-templates/page.tsx
ls app/titles/page.tsx
ls app/gacha-collection/page.tsx
ls app/money-insights/page.tsx
ls app/weekly-review/page.tsx
ls app/components/LifeV59FeatureHub.tsx
```

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Add additive Life Hub features v59"
git push origin main
```

## 次の安全な統合手順

このv59で各ページが安定してから、既存のホームやナビへリンクだけ追加するのが安全です。  
いきなり既存メモページやホームに差し込むと、以前のようにUIが崩れるリスクが高いです。
