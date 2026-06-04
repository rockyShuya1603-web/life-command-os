# Life Command OS v52 Life Level / Routine / Reading Gacha

## 追加内容

- ホームに Lifeレベル コーナーを追加
  - レベルは1から
  - TODO / Diary / 習慣・ルーティン / 音読でXP獲得
  - レベルアップでLifeガチャ券を獲得
- 習慣・ルーティン改善カード
  - 朝ルーティン / 音読 / 体づくり / Diary / 夜ルーティン
  - 各ブロックを押すと1週間履歴を表示
- 音読ポイント
  - 音読10分ごとに音読ガチャポイント +1
- 音読ガチャ / Lifeガチャ
  - 名言 / バッジ / トロフィー / ハズレ
- ガチャ演出
  - 数秒アニメーション
  - 結果表示
  - タップでホーム側へ戻る
- 景品コレクション保存
  - localStorage保存

## 実行

```bash
cd ~/Sky/Apps/Memo/Life-Command-OS

rm -rf ./tmp-v52-life
unzip -o ~/Downloads/life-command-os-v52-life-level-reading-gacha.zip -d ./tmp-v52-life
python3 ./tmp-v52-life/apply-v52-life-level-reading-gacha.py

npm run build
```

## 確認

```bash
grep -n 'LifeLevelGachaV52' app/page.tsx
ls app/components/LifeLevelGachaV52.tsx
grep -n 'v52 Life Level' app/globals.css
```

## デプロイ

```bash
npx vercel --prod --force
```

## GitHub保存

```bash
git add app src
git commit -m "Add life level routine reading gacha system v52"
git push origin main
```

## 補足

既存データを壊さないため、まず localStorage ベースで独立追加しています。  
既存TODO / Diary / 習慣側の「完了」「達成」「保存しました」系クリックも、できる範囲で自動XP加算します。
