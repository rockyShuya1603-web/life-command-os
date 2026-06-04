# Life Command OS v60.1 Rich Memo Syntax Fix

## 原因

Vercel build のエラー原因はここです。

```tsx
.onerror: (() => void) | null;
```

先頭に余計な `.` が入っていて、TypeScript/ECMAScriptとして構文エラーになっていました。

正しくはこれです。

```tsx
onerror: (() => void) | null;
```

ついでに、AI補助モードの `<option value="付け足し">補助</option>` も型定義に合わせて `<option value="補助">補助</option>` に直します。

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v60-1
unzip -o ~/Downloads/life-command-os-v60-1-rich-memo-syntaxfix.zip -d ./tmp-v60-1
python3 ./tmp-v60-1/apply-v60-1-rich-memo-syntaxfix.py

npm run build
```

## 確認

```bash
grep -n '\.onerror\|onerror:\|value="付け足し"\|value="補助"' app/components/RichMemoComposerTopV60.tsx
npm run build
```

`.onerror` が出ず、`onerror:` と `value="補助"` が出ればOKです。

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Fix rich memo speech recognition syntax v60.1"
git push origin main
```
