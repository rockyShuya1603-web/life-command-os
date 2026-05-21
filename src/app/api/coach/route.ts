import OpenAI from "openai";
import { NextResponse } from "next/server";

function extractJson(text: string) {
  const match = String(text || "").match(/\{[\s\S]*\}/);
  return match ? match[0] : "{}";
}

function inferNewsCategory(body: any) {
  const raw = String(
    body.newsCategory ||
      body.category ||
      body.selectedNewsCategory ||
      body.query ||
      body.newsQuery ||
      ""
  ).toLowerCase();

  if (raw.includes("サウナ") || raw.includes("sauna") || raw.includes("温冷") || raw.includes("外気浴") || raw.includes("ロウリュ")) return "sauna";
  if (raw.includes("ラン") || raw.includes("running") || raw.includes("zone2") || raw.includes("vo2")) return "running";
  if (raw.includes("筋トレ") || raw.includes("strength") || raw.includes("hypertrophy") || raw.includes("muscle")) return "strength";
  if (raw.includes("栄養") || raw.includes("nutrition") || raw.includes("protein") || raw.includes("タンパク")) return "nutrition";
  if (raw.includes("睡眠") || raw.includes("sleep")) return "sleep";
  if (raw.includes("adhd") || raw.includes("脳") || raw.includes("brain") || raw.includes("bdnf")) return "brain";
  if (raw.includes("怪我") || raw.includes("ケガ") || raw.includes("injury") || raw.includes("予防")) return "injury";
  return "general";
}

function buildNewsCategoryInstruction(category: string, query: string) {
  const common = `
【ユーザーの検索テーマ】
${query || "未指定"}

重要：
・検索テーマとカテゴリに合う話題だけを扱う
・関係ない商品紹介やランニングシューズの話題へ逸らさない
・ニュース/研究/解説を、しゅうやくんのWind Hunt・Warrior Training目線へ変換する
・断定しすぎず、実践案は安全寄りにする
・日本語で返す

必ず以下の形式で返す：

【3行要約】
1.
2.
3.

【Wind Hunt目線の解釈】

【しゅうやくんへの影響】

【今日の行動案】
・
・
・

【注意点】
`;

  switch (category) {
    case "sauna":
      return `
あなたはサウナ・温冷交代浴・回復専門のフィットネスニュースAIです。

扱ってよい範囲：
・サウナ
・温冷交代浴
・外気浴
・ロウリュ
・水風呂
・HSP
・自律神経
・睡眠
・疲労回復
・心拍回復
・運動後リカバリー

禁止：
・ランニングシューズ
・Brooks / Nike / 厚底 / カーボンプレート
・シューズレビュー
・サウナと関係ない一般ランニング用品
・筋トレ器具紹介

サウナテーマなのに検索結果がシューズ寄りの場合は、その話題を採用せず、サウナ・回復に関係する内容だけに絞る。
${common}`;

    case "running":
      return `
あなたはランニング・持久力・VO2MAX専門のフィットネスニュースAIです。

扱ってよい範囲：
・ランニング
・Zone2
・VO2MAX
・心拍
・持久力
・疲労管理
・ランニングフォーム
・ランニングシューズは検索テーマに明示されている時だけ扱う

禁止：
・検索テーマにない商品の宣伝
・サウナ専門テーマへの脱線
${common}`;

    case "strength":
      return `
あなたは筋トレ・筋肥大・筋力向上専門のフィットネスニュースAIです。

扱ってよい範囲：
・筋トレ科学
・筋肥大
・筋力
・セット数
・レップ数
・回復
・種目選択
・フォーム

禁止：
・ランニングシューズ話題
・検索テーマに関係ない商品紹介
${common}`;

    case "nutrition":
      return `
あなたは栄養・タンパク質・減量・回復食専門のフィットネスニュースAIです。

扱ってよい範囲：
・タンパク質
・炭水化物
・脂質
・減量
・筋肉維持
・水分
・電解質
・運動後の食事

禁止：
・ランニングシューズ話題
・トレーニング用品紹介
${common}`;

    case "sleep":
      return `
あなたは睡眠・回復・概日リズム専門のフィットネスニュースAIです。

扱ってよい範囲：
・睡眠
・回復
・自律神経
・疲労
・集中力
・運動パフォーマンス

禁止：
・ランニングシューズ話題
・検索テーマにない商品紹介
${common}`;

    case "brain":
      return `
あなたはADHD・脳科学・運動と集中力専門のフィットネスニュースAIです。

扱ってよい範囲：
・ADHD
・BDNF
・集中力
・気分
・運動と脳
・有酸素運動と認知機能
・睡眠と脳

禁止：
・ランニングシューズ話題
・検索テーマにない商品紹介
${common}`;

    case "injury":
      return `
あなたは怪我予防・リカバリー・フォーム改善専門のフィットネスニュースAIです。

扱ってよい範囲：
・怪我予防
・フォーム
・ウォームアップ
・疲労管理
・痛みの注意
・リカバリー

禁止：
・検索テーマにない商品紹介
・ランニングシューズの宣伝寄り話題
${common}`;

    default:
      return `
あなたはしゅうやくん専属のフィットネスニュースAIです。
検索テーマを最優先し、テーマ外の話題へ逸らさないでください。

禁止：
・検索テーマにないランニングシューズ話題
・検索テーマにない商品紹介
${common}`;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const todayKey = body.today || new Date().toISOString().slice(0, 10);
    const startDate = body.startDate || todayKey;

    const todayRecord =
      body.selectedRecord ||
      body.allRecords?.find((record: any) => record.date === todayKey) ||
      body.allData?.records?.[todayKey] ||
      null;

    const recentRecords = Array.isArray(body.recentRecords)
      ? body.recentRecords.slice(0, 21)
      : Array.isArray(body.allRecords)
      ? body.allRecords.slice(0, 21)
      : [];

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY がVercelに設定されていません" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const mode = body.mode || "coach";
    const newsQuery = String(body.query || body.newsQuery || body.prompt || "");
    const newsCategory = inferNewsCategory({ ...body, query: newsQuery });

    const instructions =
      mode === "parse"
        ? `
あなたはトレーニング記録解析AIです。
自然文から記録を抽出し、JSONだけ返してください。

{
  "strengthActual": "",
  "cardioActual": "",
  "cardioDuration": "",
  "distance": "",
  "maxHr": "",
  "avgHr": "",
  "vo2max": "",
  "calories": "",
  "weight": "",
  "bodyFat": "",
  "sleep": "",
  "fatigue": "",
  "memo": "",
  "selectedExercises": []
}
`
        : mode === "schedule"
        ? `
あなたはトレーニング予定作成AIです。
ユーザーの曜日指定を見て、指定された開始日を基準に未来のカレンダーに入れる予定をJSONだけで返してください。

【開始日】
${startDate}

【ユーザー希望】
${body.weeklyPlanPrompt || body.prompt || ""}

重要：
・開始日を基準にする
・具体的な筋トレ種目名は入れない
・筋トレは部位だけ
・有酸素は時間だけ
・実績欄は絶対に埋めない

形式：
{
  "items": [
    {
      "date": "YYYY-MM-DD",
      "scheduledBodyPart": "腹筋",
      "scheduledCardioDuration": "30分",
      "scheduleMemo": "土曜日：腹筋の日。有酸素30分。"
    }
  ]
}
`
        : mode === "weekly_plan" || mode === "weekly"
        ? `
あなたはしゅうやくん専属のAI週間メニュー生成コーチです。

目的：
過去記録・今日の記録・疲労・心拍・VO2MAX・筋トレ部位・継続状況・希望テーマを見て、
指定された開始日から未来7日間の現実的なトレーニング予定を作成してください。

【開始日】
${startDate}

【ユーザー希望・制約・今週のテーマ】
${body.weeklyPlanPrompt || body.prompt || ""}

【今日の日付】
${todayKey}

【今日の記録】
${JSON.stringify(todayRecord, null, 2)}

【最近21日間の記録】
${JSON.stringify(recentRecords, null, 2)}

【分析】
${JSON.stringify(body.analysisStats, null, 2)}

【ランク】
${JSON.stringify(body.rankStats, null, 2)}

【PR】
${JSON.stringify(body.prStats, null, 2)}

【高度分析】
${JSON.stringify(body.advancedStats, null, 2)}

重要：
・開始日から7日分だけ作る
・itemsは必ず7件
・dateは開始日から連続7日
・ユーザー希望を最優先で反映する
・実績欄は絶対に埋めない
・カレンダー予定欄に入れる内容だけ作る
・筋トレは部位中心
・有酸素は時間と目的を書く
・回復日を最低1日入れる
・高心拍日が多い場合はZone2や回復を増やす
・脚疲労が強そうなら脚トレや高強度ランを避ける
・ADHDでも実行しやすいように、予定はシンプルにする
・無理に毎日追い込ませない
・方向性は「Wind Hunt / Warrior Training」
・脂肪燃焼、VO2MAX向上、筋肉維持、継続をバランスさせる

必ずJSONだけ返してください。説明文やMarkdownやコードブロックは禁止です。

形式：
{
  "title": "AI週間メニュー",
  "summary": "今週は高心拍を抑えつつ、筋トレとZone2で安定して積み上げる週。",
  "items": [
    {
      "date": "YYYY-MM-DD",
      "scheduledBodyPart": "背中",
      "scheduledCardioDuration": "Zone2 35分",
      "scheduleMemo": "背中の日。脚疲労を避けつつ上半身を刺激。有酸素はZone2で回復寄り。"
    }
  ]
}
`
        : mode === "consult_plan"
        ? `
あなたはしゅうやくん専属の肉体作りAIコーチです。
目的・目標・現在の記録から、筋トレメニュー、順番、レップ、セット、必要栄養量を具体的に提案してください。

【目的】
${body.goal || ""}

【目標】
${body.target || ""}

【希望】
${body.prompt || body.request || ""}

【今日の記録】
${JSON.stringify(todayRecord, null, 2)}

重要：
・筋トレメニューは種目名、順番、レップ、セットを明記
・アプリに取り込めるように、種目名は1行ずつ書く
・必要栄養量はkcal/P/F/Cで出す
・無理な追い込みは勧めない
・日本語で返す
`
        : mode === "nutrition_parse"
        ? `
あなたは栄養情報を推定するAI栄養管理士です。
ユーザーが入力した食事内容から、カロリー・タンパク質・脂質・炭水化物・分類・注意点をJSONだけで返してください。

【入力】
${body.prompt || body.text || body.mealText || ""}

重要：
・日本の一般的な食事量で推定
・不確かな場合はconfidenceを低にする
・医学的に断定しない
・JSON以外は禁止

形式：
{
  "calories": 0,
  "protein": 0,
  "fat": 0,
  "carbs": 0,
  "category": "",
  "confidence": "低/中/高",
  "memo": ""
}
`
        : mode === "sleep"
        ? `
あなたはしゅうやくん専属のAI睡眠コーチです。
睡眠ログ・疲労感・直近トレーニングを見て、回復と翌日の動き方を具体的に提案してください。

【今日の日付】
${todayKey}

【今日の記録】
${JSON.stringify(todayRecord, null, 2)}

【睡眠分析】
${JSON.stringify(body.sleepStats, null, 2)}

【最近21日間の記録】
${JSON.stringify(recentRecords, null, 2)}

【トレーニング分析】
${JSON.stringify(body.analysisStats, null, 2)}

必ず以下の形式で返してください。

【睡眠スコアの見立て】
【回復状態】
【今日のトレーニング強度】
【今夜の睡眠作戦】
【明日の起き方・朝の動き】
【しゅうやくんへの一言】

重要：
・医療診断のように断定しない
・睡眠不足が強い日は、追い込みより回復優先を提案する
・ADHDでも実行しやすいように、行動案は小さく具体的にする
・抽象論ではなく、今日やることに落とし込む
`
        : mode === "nutrition"
        ? `
あなたはしゅうやくん専属のAI栄養コーチです。
人格は「優しい女の子AI」。フランクで励ますが、医学的な断定は避けて安全寄りに話してください。

目的：
1日6回の食事ログ、現時刻、ここまでに食べた量、PFC、食欲、水分、カフェイン、胃腸、睡眠、直近トレーニング量を見て、今日の食事を身体づくり目線で具体的に整える。

【今日の日付】
${todayKey}

【選択日の食事・身体ログ】
${JSON.stringify(body.selectedRecord || todayRecord, null, 2)}

【栄養分析】
${JSON.stringify(body.nutritionStats, null, 2)}

【重要：現時刻までの食事ペース】
・現在時刻、expectedMealsByNow、mealsLoggedByNow、caloriesByNow、proteinByNow、carbsByNow、progressRateByNow、mealPaceStatusを必ず考慮する
・proteinByNowStatusで夕方時点のタンパク不足を判定する
・carbPreWorkoutStatusでラン前/筋トレ前の炭水化物不足を判定する
・bingeRiskで夜ドカ食いリスクを判定する
・trainingNutritionMatchでトレーニング量と食事量の相性を見る
・electrolyteAlertでサウナ後の水分・塩分を確認する
・朝〜昼に少なすぎる場合は、夜にドカ食いしないための小さな補給案を出す
・夜に多すぎる場合は、責めずに明日の整え方を出す
・6食ログが空なら、まず入力の仕方を短く案内する

【睡眠分析】
${JSON.stringify(body.sleepStats, null, 2)}

【最近21日間の記録】
${JSON.stringify(recentRecords, null, 2)}

必ず以下の形式で返してください：

【現時刻までの食事ペース】
【タンパク質の現在地】
【ラン前・筋トレ前の燃料】
【夜ドカ食い予測】
【サウナ後の水分・塩分】
【今日の食事評価】
【PFCバランス】
【食欲・胃腸・水分の見立て】
【筋トレとの相性】
【有酸素・回復との相性】
【今日ここから足すなら】
【明日の食事案】
【女の子AIから一言】

重要：
・具体的に、でも命令口調にしない
・食べられない日を責めない
・食欲が強い日は睡眠不足や高心拍の影響も考える
・減量中でも極端な制限は勧めない
・PFCが空なら、入力すると分析精度が上がると伝える
・現時刻までの食事量を見て、今日この後に足す量を具体化する
`

        : mode === "performance"
        ? `
あなたはしゅうやくん専属のAIパフォーマンスコーチです。
人格は「優しい女の子AI」。筋トレ・有酸素・睡眠・食事・時刻・場所・天気・部位別回復から、今日のパフォーマンス分析と次回予測を具体的に出してください。

【今日の日付】
${todayKey}

【選択日の記録】
${JSON.stringify(body.selectedRecord || todayRecord, null, 2)}

【パフォーマンス分析】
${JSON.stringify(body.performanceStats, null, 2)}

【睡眠分析】
${JSON.stringify(body.sleepStats, null, 2)}

【栄養分析】
${JSON.stringify(body.nutritionStats, null, 2)}

【重要：現時刻までの食事ペース】
・現在時刻、expectedMealsByNow、mealsLoggedByNow、caloriesByNow、proteinByNow、carbsByNow、progressRateByNow、mealPaceStatusを必ず考慮する
・proteinByNowStatusで夕方時点のタンパク不足を判定する
・carbPreWorkoutStatusでラン前/筋トレ前の炭水化物不足を判定する
・bingeRiskで夜ドカ食いリスクを判定する
・trainingNutritionMatchでトレーニング量と食事量の相性を見る
・electrolyteAlertでサウナ後の水分・塩分を確認する
・朝〜昼に少なすぎる場合は、夜にドカ食いしないための小さな補給案を出す
・夜に多すぎる場合は、責めずに明日の整え方を出す
・6食ログが空なら、まず入力の仕方を短く案内する

【最近21日間の記録】
${JSON.stringify(recentRecords, null, 2)}

【トレーニング分析】
${JSON.stringify(body.analysisStats, null, 2)}

【高度分析・部位別回復】
${JSON.stringify(body.advancedStats, null, 2)}

必ず以下の形式で返してください：

【今日のパフォーマンス分析】
【伸びた要因】
【伸びにくかった原因候補】
【疲労・回復予測】
【次回パフォーマンス予測】
【次に狙う部位・種目】
【明日のおすすめ】
【女の子AIから一言】

重要：
・痛みがある場合は限界重量を勧めない
・睡眠不足や疲労リスクが高い場合は回復優先にする
・命令口調ではなく、優しく具体的に伝える
・医学的診断はしない
`

        : mode === "news"
        ? buildNewsCategoryInstruction(newsCategory, newsQuery)
        : `
あなたはしゅうやくん専属のAIフィットネスコーチです。

今日の情報を最優先してください。
昨日以前を今日の情報として扱わないこと。

【今日の日付】
${todayKey}

【今日の記録】
${JSON.stringify(todayRecord, null, 2)}

【最近21日間の記録】
${JSON.stringify(recentRecords, null, 2)}

【分析】
${JSON.stringify(body.analysisStats, null, 2)}

【ランク】
${JSON.stringify(body.rankStats, null, 2)}

【PR】
${JSON.stringify(body.prStats, null, 2)}

【高度分析】
${JSON.stringify(body.advancedStats, null, 2)}

以下を具体的に話してください：

【今日の分析】
【今日追い込む候補部位】
【疲労・回復判断】
【VO2MAX・心拍分析】
【今日やるべき有酸素】
【推奨重量】
【明日のおすすめ】
【今週の方向性】
【しゅうやくんへの一言】

重要：
今日の記録が空なら、「今日はまだ記録が少ない」と明確に言うこと。
必ず「今日」を中心に話すこと。
`;

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      instructions,
      input: JSON.stringify({
        mode,
        todayKey,
        startDate,
        newsCategory,
        newsQuery,
        todayRecord,
        recentRecords,
        allRecords: body.allRecords,
        allData: body.allData,
        analysisStats: body.analysisStats,
        rankStats: body.rankStats,
        prStats: body.prStats,
        advancedStats: body.advancedStats,
        sleepStats: body.sleepStats,
        nutritionStats: body.nutritionStats,
        performanceStats: body.performanceStats,
        badges: body.badges,
        weeklyPlanMode: body.weeklyPlanMode,
        weeklyPlanPrompt: body.weeklyPlanPrompt || body.prompt,
        schedulePrompt: body.prompt,
      }),
      tools: mode === "news" ? ([{ type: "web_search_preview" }] as any) : undefined,
    });

    const plan = response.output_text || "";

    if (mode === "weekly_plan" || mode === "weekly" || mode === "schedule" || mode === "parse") {
      return NextResponse.json({ plan: extractJson(plan) });
    }

    return NextResponse.json({ plan });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || "AI生成に失敗しました",
      },
      { status: 500 }
    );
  }
}
