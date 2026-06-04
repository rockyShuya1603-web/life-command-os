# Life Command OS v71 Clean Home Dashboard

## 目的

ホームが v65〜v70 のパネルでごちゃついてきたため、ホームを **すっきりした司令室UI** に整理します。

## 変更内容

- ホーム上部を `HomeOrganizerV71` に置き換え
- 既存の巨大パネル群はホーム上には直接並べず、`従来ホームの詳細パネルを開く` に格納
- 今日の情報を5つに整理
  - 今日予定
  - 今日TODO
  - 今日メモ
  - 今日支出
  - 未処理
- 一言追加を1つのカードに統合
- 今日の優先順位を1カードに統合
- 案内係AI、記憶カード、ページランチャーを整理
- 詳細表示ボタンで未処理メモ救出・未来メモも見られる
- バックアップは `.life-backups/` に保存し、Gitに入らないよう `.gitignore` も更新

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v71
unzip -o ~/Downloads/life-command-os-v71-home-clean-dashboard.zip -d ./tmp-v71
python3 ./tmp-v71/apply-v71-home-clean-dashboard.py

npm run build
```

## 確認

```bash
grep -n 'HomeOrganizerV71\|従来ホームの詳細パネル' app/page.tsx
ls app/components/HomeOrganizerV71.tsx
npm run build
```

## デプロイ

```bash
npx --yes vercel@latest --prod --force
```

## GitHub保存

```bash
git add -A
git commit -m "Clean up home dashboard layout v71"
git push origin main
```
