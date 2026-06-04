# Life Command OS v50 Vercel Hobby Cron Fix

Vercel Hobby の制限で、cron は1日1回までです。

v49では `0 */6 * * *`、つまり6時間おきにしていたため、以下のエラーになります。

```text
Hobby accounts are limited to daily cron jobs.
```

このv50は `vercel.json` の Gmail auto-sync cron を、Hobbyで通る1日1回に修正します。

## 反映内容

```json
{
  "path": "/api/mail/gmail/auto-sync",
  "schedule": "0 3 * * *"
}
```

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v50-cron
unzip -o ~/Downloads/life-command-os-v50-vercel-hobby-cron-fix.zip -d ./tmp-v50-cron
python3 ./tmp-v50-cron/apply-v50-vercel-hobby-cron-fix.py

npm run build
npx vercel --prod --force
```

## 確認

```bash
cat vercel.json
```

## GitHub

```bash
git add vercel.json
git commit -m "Fix Gmail auto sync cron for Vercel Hobby"
git push origin main
```

## 注意

Vercel Hobbyでは「アプリを閉じた状態で数分おきの常時同期」はできません。

できる形は以下です。

1. Hobbyのまま：Vercel Cronは1日1回
2. アプリを開いている間：フロント側で数分おきに受信取得
3. 本当の常時受信：Vercel Pro / Google Pub/Sub / 外部cronが必要
