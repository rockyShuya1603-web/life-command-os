import OpenAI from "openai";
import { NextResponse } from "next/server";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

type TodoCandidate = { title: string; priority?: "low" | "normal" | "high" | string; due_date?: string | null };

function normalizePriority(value: unknown): "low" | "normal" | "high" {
  const text = String(value || "normal");
  if (text === "low" || text === "normal" || text === "high") return text;
  return "normal";
}

function normalizeTodos(input: unknown): TodoCandidate[] {
  const source = Array.isArray(input) ? input : [];
  return source
    .map((item) => {
      if (typeof item === "string") return { title: item, priority: "normal", due_date: null };
      const row = item as Record<string, unknown>;
      return {
        title: String(row.title || row.todo || row.task || row.name || "").trim().slice(0, 120),
        priority: normalizePriority(row.priority),
        due_date: typeof row.due_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(row.due_date) ? row.due_date : null,
      };
    })
    .filter((item) => item.title.length > 0)
    .slice(0, 10);
}

function localTodoCandidates(text: string) {
  const lines = String(text || "")
    .split(/[\n。！？!？]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const keywords = /(する|やる|買う|行く|行か|予約|確認|連絡|提出|支払|払う|送る|作る|準備|持って|持参|更新|修正|掃除|洗濯|申請|登録|電話|メール|買い|返す|見る|調べる|受け取る|持つ)/;
  const todos = lines
    .filter((line) => keywords.test(line) || /^[-・*□☐]/.test(line))
    .map((line) => ({
      title: line.replace(/^[-・*□☐\s]+/, "").slice(0, 120),
      priority: /急ぎ|至急|今日|締切|重要|必ず/.test(line) ? "high" : "normal",
      due_date: null,
    }))
    .filter((todo) => todo.title.length > 0)
    .slice(0, 8);

  if (!todos.length && String(text || "").trim()) {
    todos.push({ title: String(text).trim().split(/[\n。！？!？]+/)[0].slice(0, 120), priority: "normal", due_date: null });
  }
  return { todos };
}

function extractJsonObject(text: string) {
  const raw = String(text || "").trim();
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
  const target = fenced || raw;
  const match = target.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}


function decodeXml(value: string) {
  return String(value || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value: string) {
  return decodeXml(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchGoogleNewsItems(query: string) {
  const q = encodeURIComponent(`${query} when:7d`);
  const url = `https://news.google.com/rss/search?q=${q}&hl=ja&gl=JP&ceid=JP:ja`;
  const res = await fetch(url, { headers: { "User-Agent": "LifeCommandOS/1.0" }, next: { revalidate: 900 } as any });
  if (!res.ok) return [];
  const xml = await res.text();
  return Array.from(xml.matchAll(/<item>([\s\S]*?)<\/item>/g)).slice(0, 8).map((match) => {
    const item = match[1];
    const title = stripTags(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "");
    const link = stripTags(item.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "");
    const pubDate = stripTags(item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "");
    const source = stripTags(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] || "");
    return { title, link, pubDate, source };
  }).filter((item) => item.title);
}

function splitNewsTerms(value: string) {
  return String(value || "")
    .split(/[、,\n]/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 6);
}

function normalizeBudget(input: unknown) {
  const row = (input || {}) as Record<string, unknown>;
  const amount = Math.max(0, Math.round(Number(row.amount || row.total || row.price || 0)));
  const allowed = ["食費", "カフェ", "交通", "日用品", "娯楽", "医療", "服", "学習", "サブスク", "家賃", "水道光熱", "通信", "その他"];
  const category = allowed.includes(String(row.category || "")) ? String(row.category) : "その他";
  return {
    amount,
    category,
    store: String(row.store || row.shop || row.name || "").slice(0, 80),
    memo: String(row.memo || row.store || row.shop || "レシート").slice(0, 120),
    wallet: String(row.wallet || "財布").slice(0, 40),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const mode = String(body.mode || "");
    const aiModes = [
      "memoAI", "diaryAI", "guideAI", "budgetAI", "emotionAI", "weeklyReportAI", "todayAnalysisAI",
      "memoSmartAI", "memoToTodosAI", "todoAI", "belongingsAI", "brainDumpAI", "navigationAI", "gentleNoticeAI", "emotionSpendingAI", "happinessBudgetAI", "mindMapAI", "lifeArchiveAI", "reversePlanAI", "futureSelfAI", "doingOrderAI", "imageScheduleAI", "imageToTodosAI", "receiptToBudgetAI", "aiNews",
    ];
    if (!aiModes.includes(mode)) return NextResponse.json({ error: "mode が不正です" }, { status: 400 });

    const openai = getOpenAIClient();
    if (!openai) {
      if (mode === "memoToTodosAI") return NextResponse.json(localTodoCandidates(String(body.text || "")));
      if (mode === "imageToTodosAI" || mode === "imageScheduleAI") return NextResponse.json({ todos: [], events: [], result: "OPENAI_API_KEY がVercelに設定されていないため、画像読み取りは使えません。" }, { status: 200 });
      if (mode === "receiptToBudgetAI") return NextResponse.json({ budget: null, result: "OPENAI_API_KEY がVercelに設定されていないため、レシート読み取りは使えません。" }, { status: 200 });
      if (mode === "aiNews") return NextResponse.json({ result: "OPENAI_API_KEY が未設定だから、癒し系AIのニュース要約はまだ使えないみたい。Vercelにキーを入れると動くよ。" }, { status: 200 });
      return NextResponse.json({ error: "OPENAI_API_KEY が設定されていません" }, { status: 500 });
    }


    if (mode === "aiNews") {
      const wantTerms = splitNewsTerms(body.want || "筋トレ、ランニング、サウナ、健康、睡眠、運動科学");
      const avoidText = String(body.avoid || "政治、事故、事件、災害、炎上");
      try {
        const fetched = (await Promise.all(wantTerms.map((term) => fetchGoogleNewsItems(term)))).flat();
        const avoidWords = splitNewsTerms(avoidText);
        const unique = Array.from(new Map(fetched.map((item) => [item.title, item])).values())
          .filter((item) => !avoidWords.some((word) => `${item.title} ${item.source}`.includes(word)))
          .slice(0, 12);
        if (!unique.length) return NextResponse.json({ result: "今日は好みに合うニュースが少なめだったよ。苦手な話題を避けた結果、無理に出さない方がよさそう。" });
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "あなたはLife Command OSの癒し系ニュース案内AIです。ユーザーが聞きたい話題だけを、政治・事故・事件など苦手な話題を避けながら、やさしく具体的に日本語でまとめます。命令口調は禁止。見出し3〜5個、各2文以内。最後に今日の行動に繋がる一言を添えてください。" },
            { role: "user", content: JSON.stringify({ want: wantTerms, avoid: avoidText, news: unique }, null, 2) },
          ],
        });
        return NextResponse.json({ result: completion.choices[0].message.content || "ニュースをまとめられなかったみたい。" });
      } catch (error) {
        console.error(error);
        return NextResponse.json({ result: "ニュース取得が少し詰まったみたい。設定は保存されているから、少し時間を置いてもう一度で大丈夫だよ。" }, { status: 200 });
      }
    }

    if (mode === "receiptToBudgetAI") {
      const imageDataUrl = String(body.imageDataUrl || "");
      if (!imageDataUrl.startsWith("data:image/")) return NextResponse.json({ budget: null, result: "画像データを受け取れませんでした。" }, { status: 400 });
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: 'あなたはレシート画像から家計簿登録情報を抽出するAIです。JSONだけ返してください。形式は {"budget":{"amount":1234,"category":"食費|カフェ|交通|日用品|娯楽|医療|服|学習|サブスク|家賃|水道光熱|通信|その他","store":"店名","memo":"短い補足","wallet":"財布"}}。合計金額を優先してください。' },
            { role: "user", content: [ { type: "text", text: "このレシートを家計簿に登録できる形で読み取って。" }, { type: "image_url", image_url: { url: imageDataUrl } } ] as any },
          ],
        });
        const text = completion.choices[0].message.content || "";
        const json = extractJsonObject(text) as any;
        return NextResponse.json({ budget: normalizeBudget(json?.budget), result: text });
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : String(error || "unknown error");
        return NextResponse.json({ budget: null, result: `レシートAIの読み取りに失敗しました。原因: ${message.slice(0, 240)}` }, { status: 200 });
      }
    }

    if (mode === "imageToTodosAI" || mode === "imageScheduleAI") {
      const imageDataUrl = String(body.imageDataUrl || "");
      if (!imageDataUrl.startsWith("data:image/")) return NextResponse.json({ todos: [], events: [], result: "画像データを受け取れませんでした。" }, { status: 400 });
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: mode === "imageToTodosAI"
                ? 'あなたは画像からTODO候補を読み取るAIです。買う物、やること、持っていく物、提出物、予定準備などを抽出し、JSONだけ返してください。形式は {"todos":[{"title":"TODO名","priority":"low|normal|high","due_date":"YYYY-MM-DD|null"}]}。日付が読めない場合はnull。推測で日付を作らないでください。'
                : 'あなたは写真から予定候補を読み取るAIです。画像内の日時、場所、イベント名、メモを読み取り、JSONだけを返してください。形式は {"events":[{"title":"予定名","event_date":"YYYY-MM-DD","note":"補足"}]}。日付が読めない場合は候補から除外してください。',
            },
            { role: "user", content: [ { type: "text", text: mode === "imageToTodosAI" ? "この画像からTODOにできる項目を抽出して。" : "この画像からカレンダーに入れられる予定候補を抽出して。" }, { type: "image_url", image_url: { url: imageDataUrl } } ] as any },
          ],
        });
        const text = completion.choices[0].message.content || "";
        const json = extractJsonObject(text) as any;
        if (mode === "imageToTodosAI") return NextResponse.json({ todos: normalizeTodos(json?.todos), result: text });
        return NextResponse.json(json || { result: text, events: [] });
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : String(error || "unknown error");
        return NextResponse.json({ todos: [], events: [], result: `画像AIの読み取りに失敗しました。原因: ${message.slice(0, 240)}` }, { status: 200 });
      }
    }

    const system =
      mode === "diaryAI" ? "日記を振り返り、感情整理、良かった点、明日の小さな一歩を優しく具体的に返してください。文章量は中くらいで、しゅうやくんに寄り添う口調にしてください。"
      : mode === "budgetAI" ? "あなたはLife Command OSの家計簿AIです。収入・支出・固定費・カテゴリ増減・残高情報を読み、使いすぎ警告、安心できる改善案、今月の見通しを女の子が優しく話しかける口調で120〜260字で返してください。命令口調は禁止です。"
      : mode === "guideAI" ? "あなたはLife Command OSの癒し系案内係AIです。全ページの直近内容を把握し、しゅうやくんへ女の子の案内係が隣で話すように優しく語りかけてください。120〜240字。"
      : mode === "emotionAI" ? "あなたはLife Command OSの感情分析AIです。疲労感・怒り・不安・前向きさ・達成感の傾向を優しく読み、120〜220字で返してください。命令口調は禁止。"
      : mode === "weeklyReportAI" ? "あなたはLife Command OSの週間レポートAIです。直近7日間を読み、今週の流れ、良かった点、少し整える点を180〜320字で返してください。"
      : mode === "todayAnalysisAI" ? "あなたはLife Command OSの今日分析AIです。今日の全ページの記録を横断して、120〜240字の語りかけを返してください。"
      : mode === "memoSmartAI" ? "メモを読み、要約、重要キーワード、TODO候補、予定候補、持ち物候補に分けて、日本語で具体的に整理してください。優しい案内係の口調。"
      : mode === "memoToTodosAI" ? 'メモからTODOだけを抽出するAIです。JSONだけ返してください。形式は {"todos":[{"title":"TODO名","priority":"low|normal|high","due_date":"YYYY-MM-DD|null"}]}。曖昧な日付はnullにしてください。'
      : mode === "todoAI" ? "TODO一覧を見て、優先順位、今日やると軽くなる順番、後回しでよいものを優しく整理してください。命令口調は禁止。120〜240字。"
      : mode === "brainDumpAI" ? "脳ダンプの文章を、TODO・メモ・後で読む・予定候補に分けて、しゅうやくんのワーキングメモリ負担が軽くなるように整理してください。JSONでなく普通の日本語で短く。"
      : mode === "navigationAI" ? "Life Command OSの現在データから、次に開くと良さそうなページを1つだけ優しく提案してください。理由は短く。命令口調は禁止。"
      : mode === "gentleNoticeAI" ? "ADHD向けの低圧通知文を作ってください。責めず、短く、5分だけ始めやすい言い方。"
      : mode === "emotionSpendingAI" ? "日記やつぶやきの感情と支出ログの関係を読み、疲れている時に増えやすい支出を優しく分析してください。120〜220字。"
      : mode === "happinessBudgetAI" ? "支出ログと良かった記録から、幸福度に効いていそうな支出を優しく分析してください。120〜220字。"
      : mode === "mindMapAI" ? "メモ・TODO・Diary・場所・支出のつながりを、短い思考マップとして整理してください。"
      : mode === "lifeArchiveAI" ? "最近の人生ログを、月次アーカイブのようにエモく短くまとめてください。"
      : mode === "reversePlanAI" ? "出発時刻や予定から、準備を逆算して優しく短く整理してください。"
      : mode === "futureSelfAI" ? "TODOを後回しにした時の未来負担を、責めずに優しく予測してください。"
      : mode === "doingOrderAI" ? "TODOを、今やると楽な順番に並べる提案を優しく返してください。"
      : mode === "belongingsAI" ? "持ち物リストを見て、足りなそうな物、重複していそうな物、出発前チェックのコツを優しく具体的に返してください。120〜240字。"
      : "メモを整理し、要約、TODO候補、予定候補、日記候補に分けて日本語で具体的に返してください。";

    const userContent = mode === "guideAI" || mode === "budgetAI" || mode === "emotionAI" || mode === "weeklyReportAI" || mode === "todayAnalysisAI"
      ? JSON.stringify(body.data || {}, null, 2)
      : String(body.text || "");

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [ { role: "system", content: system }, { role: "user", content: userContent } ],
      });
      const text = completion.choices[0].message.content || "";
      if (mode === "memoToTodosAI") {
        const json = extractJsonObject(text) as any;
        const aiTodos = normalizeTodos(json?.todos);
        return NextResponse.json({ todos: aiTodos.length ? aiTodos : localTodoCandidates(userContent).todos });
      }
      return NextResponse.json({ result: text });
    } catch (error) {
      console.error(error);
      if (mode === "memoToTodosAI") return NextResponse.json(localTodoCandidates(userContent));
      return NextResponse.json({ error: "APIエラー" }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "APIエラー" }, { status: 500 });
  }
}
