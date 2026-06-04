# Life Command OS v65-69 Full Command OS

## 追加内容

### v65 Daily Command + AI自動振り分け
- ホーム上部に「今日の司令室」
- 今日の予定/TODO/メモ/支出を集約
- 一言入力からカレンダー/TODO/家計簿/Diary/メモ/体づくり/未処理Inboxに自動振り分け
- OpenAIが使える場合は `/api/life/route-intent` で分類補助
- 失敗時はローカルルールで安全に分類

### v66 予定達成チェック + Life XP連携
- Life Lv / XP / ステータス
- TODO・Diary・習慣・音読・家計簿・予定達成でXP付与
- Lifeレベル上昇でガチャ券
- 音読10分ごとに音読ガチャポイント
- ガチャ演出つき

### v67 未処理Inbox + 体づくり連携
- 分類が不安なものは未処理Inboxへ
- 筋トレ/ジム/睡眠/疲労/膝の痛みをLife OSに軽く記録

### v68 質問回答型AI検索
- 先週の支出
- 今月の支出
- ジム/筋トレ記録
- バグメモ一覧
- 未完了TODO
- 気分が落ちた日のDiary

### v69 週次レポート + 操作履歴/ゴミ箱
- 週次レポート自動生成
- 操作履歴保存
- ソフトゴミ箱
- バックアップファイルをGitから外しやすいよう .gitignore も更新

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v65-69
unzip -o ~/Downloads/life-command-os-v65-69-full-command-os.zip -d ./tmp-v65-69
python3 ./tmp-v65-69/apply-v65-69-full-command-os.py

npm run build
```

## 確認

```bash
grep -n 'LifeCommandExpansionV65_69\|SmartQuestionSearchV68\|WeeklyReviewV69\|TrashHistoryV69\|route-intent' app/page.tsx
ls app/components/LifeCommandExpansionV65_69.tsx
ls app/api/life/route-intent/route.ts
npm run build
```

## デプロイ

```bash
npx --yes vercel@latest --prod --force
```

## GitHub保存

バックアップファイルが消されるので `git add -A` 推奨。

```bash
git add -A
git commit -m "Add Daily Command AI routing Life XP reports and undo v65-69"
git push origin main
```

## 環境変数

任意:

```bash
OPENAI_API_KEY
OPENAI_LIFE_ROUTER_MODEL
```

`OPENAI_LIFE_ROUTER_MODEL` は未設定なら `gpt-4o-mini`。
