# Life Command OS v49 Mobile Header/Nav + Quick Add + Auto Sync

## 今回の修正

- v48内容に加えて、消えていたQuick AddボタンをJSX側にも復活
- 下部バナーがスクロールに一緒に動く問題を修正
- 検索欄付近の名前アイコン / 手動同期ボタンのダブりを抑制
- 全ページ一覧を開閉するボタンをスマホで復活
- お天気 / 習慣 / モチベーションは今の表示を残す
- Gmail常時オート同期の入口APIを追加
  - `/api/mail/gmail/auto-sync`
- Vercel Cronを追加
  - Hobby制限に合わせて `0 */6 * * *`、6時間おき

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v49-mobile
unzip -o ~/Downloads/life-command-os-v49-mobile-header-nav-quickadd-autosync.zip -d ./tmp-v49-mobile
python3 ./tmp-v49-mobile/apply-v49-mobile-header-nav-quickadd-autosync.py

npm run build
```

## オート同期用ENV

任意だけど設定推奨。

```bash
npx vercel env add MAIL_CRON_SECRET production
npx vercel env add MAIL_CRON_SECRET preview
```

値は長めのランダム文字列でOK。

## ローカル確認

```bash
npm run dev
curl "http://localhost:3000/api/mail/gmail/auto-sync"
```

`MAIL_CRON_SECRET` を設定した場合:

```bash
curl "http://localhost:3000/api/mail/gmail/auto-sync?secret=入れた値"
```

## 反映確認

```bash
grep -n 'life-floating-quickadd-v49' app/page.tsx
grep -n 'v49 mobile header/nav/quickadd/autosync fix' app/globals.css
ls app/api/mail/gmail/auto-sync/route.ts
```

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub

```bash
git add app src vercel.json
git commit -m "Fix mobile nav quick add header and Gmail auto sync"
git push origin main
```

## 注意

Vercel Hobbyは10分おきCronが使えないので、6時間おきにしています。  
もっと短い間隔の完全バックグラウンド受信は、Vercel Pro、Google Pub/Sub、または外部cronが必要です。
