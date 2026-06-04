# Life Command OS v55 Memo Composer True Top Fix

## 原因

v54では「メモを書くコーナーを `<main>` 直後に入れる」つもりでしたが、  
スクリプト内の正規表現が間違っていました。

誤:

```python
r"<main\\b[^>]*>"
```

これだと `<main>` を見つけられず、結果として `</main>` の直前、つまり下の方に入っていました。

v55では正しく、

```python
r"<main\b[^>]*>"
```

で `<main>` を見つけて、メモ入力コンポーネントを本当に上へ移動します。

## 修正内容

- 既存の `LifeCommandV53Enhancements` / `LifeTopSearchBoostV54` の挿入タグを一度削除
- `<main ...>` の直後に入れ直し
- `.life-v55-top-injected` を追加して、CSS上も最上部優先にする
- 既存のコンポーネントやAPIはそのまま使用

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v55
unzip -o ~/Downloads/life-command-os-v55-memo-composer-true-top.zip -d ./tmp-v55
python3 ./tmp-v55/apply-v55-memo-composer-true-top.py

npm run build
```

## 確認

```bash
grep -n 'life-v55-top-injected\|LifeCommandV53Enhancements\|LifeTopSearchBoostV54' app/page.tsx
grep -n 'v55 memo composer true top fix' app/globals.css
```

`life-v55-top-injected` が `<main` のすぐ下あたりに出ていればOKです。

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Move memo composer to true top v55"
git push origin main
```
