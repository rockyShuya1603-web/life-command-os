# Life Command OS v64 Photo AI Calendar + TODO Link

## 追加・修正内容

### 写真から予定をAI読み取り

カレンダーページに「写真から予定を読み取る」を追加します。

できること:

- 写真/スクショ/手書きメモを選択
- `/api/calendar/photo-extract` に送信
- OpenAI Visionで予定候補を抽出
- 候補を確認・編集
- 予定としてカレンダーに追加

使用する環境変数:

```bash
OPENAI_API_KEY
OPENAI_CALENDAR_VISION_MODEL # 任意。未設定なら gpt-4o-mini
```

### TODOとカレンダー連携

- TODOに日付と時間がある場合、その日のその時間帯に表示
- TODOに日付はあるけど時間がない場合、終日欄の横の「いつでもTODO」に表示
- TODOタイトルに `11:14` / `11時14分` / `午後3時` / `昼` / `朝` / `夜` などがあれば時刻推定
- 予定も時刻が空でもタイトル/メモから時刻推定して、終日ではなく時間帯へ表示

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v64
unzip -o ~/Downloads/life-command-os-v64-photo-ai-calendar-todo-link.zip -d ./tmp-v64
python3 ./tmp-v64/apply-v64-photo-ai-calendar-todo-link.py

npm run build
```

## 確認

```bash
grep -n 'PhotoCalendarImportV64\|CalendarTimelineInlineV64\|photo-extract\|いつでもTODO\|todoTime' app/page.tsx
ls app/api/calendar/photo-extract/route.ts
npm run build
```

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Add photo AI calendar import and TODO calendar link v64"
git push origin main
```
