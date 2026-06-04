# Life Command OS v58 Memo Top Composer

## 目的

メモページの一番上に「メモを書く」コーナーを出します。

v57で既存メモページを戻したあとでも動くように、v58は以下の方式にしています。

- 既存メモページ本体は壊さない
- `MemoComposerTopV58` を追加
- `<main>` の直後に差し込み
- `page` が `memos` / `memo` / `notes` のときだけ表示
- localStorageの複数キーへ安全に橋渡し保存

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v58
unzip -o ~/Downloads/life-command-os-v58-memo-top-composer.zip -d ./tmp-v58
python3 ./tmp-v58/apply-v58-memo-top-composer.py

npm run build
```

## 確認

```bash
grep -n 'MemoComposerTopV58\|memo-v58-injected' app/page.tsx
ls app/components/MemoComposerTopV58.tsx
grep -n 'v58 memo composer true top' app/globals.css
```

`memo-v58-injected` が `<main` のすぐ下あたりに出ていればOKです。

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Add memo composer to top of memo page v58"
git push origin main
```
