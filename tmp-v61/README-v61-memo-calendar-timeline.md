# Life Command OS v61 Memo + Calendar Timeline

## 内容

### メモページ

- v60の「無理やり一番上に載せた感じ」を修正
- `Life Command OS` のタイトル/検索ヘッダーの下に自然に配置
- メモ保存処理を強化
  - v61専用保存
  - v60/v59/v58/v57/v53系キーへ橋渡し
  - 既存のmemo/note/diary/mind系localStorage配列にも安全に追記
- 画像添付
- ファイル添付
- AI補助
- AI整理
- メモからTODO作成
- 音声入力

### カレンダー

添付画像の方向性を、今の青いテーマに合わせて改造。

- 週間カレンダー
- 天気/気温風の表示
- 終日予定バー
- 日表示
- 現在時刻ライン
- タイムライン表示
- 予定追加
- `/timeline`
- `/calendar-pro`

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v61
unzip -o ~/Downloads/life-command-os-v61-memo-calendar-timeline.zip -d ./tmp-v61
python3 ./tmp-v61/apply-v61-memo-calendar-timeline.py

npm run build
```

## 確認

```bash
grep -n 'RichMemoComposerTopV61\|CalendarTimelineV61\|life-v61-injected' app/page.tsx
ls app/components/RichMemoComposerTopV61.tsx
ls app/components/CalendarTimelineV61.tsx
ls app/timeline/page.tsx
ls app/calendar-pro/page.tsx
grep -n 'v61 memo placement' app/globals.css
```

## 使い方

- メモページを開くと、Life Command OSのタイトル/検索ヘッダーの下に高機能メモ欄が出る
- カレンダーページを開くと、改造版カレンダー/タイムラインが出る
- 直接確認するなら:
  - `/timeline`
  - `/calendar-pro`

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Improve memo placement and add calendar timeline v61"
git push origin main
```
