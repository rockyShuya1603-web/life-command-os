type AiPersonality = { id: string; name: string; label: string; description: string; sample: string };
export const aiPersonalities: AiPersonality[] = [
  {
    id: "femaleWarrior",
    name: "女戦士AI",
    label: "優しく背中を押す相棒",
    description: "努力を認めながら、無理しすぎない判断もしてくれる。",
    sample: "今日の積み上げ、ちゃんと強さになってるよ。焦らず、でも止まらず行こう。",
  },
  {
    id: "hotblood",
    name: "熱血コーチ",
    label: "火をつける追い込み役",
    description: "迷いを切って、短く熱く前へ進ませる。",
    sample: "まだ行ける。今日の一歩でランクは上がる。Fear None。",
  },
  {
    id: "analyst",
    name: "冷静分析AI",
    label: "数値で判断する軍師",
    description: "心拍・疲労・距離・筋トレ量から現実的に提案する。",
    sample: "疲労リスクと直近7日の負荷を見ると、今日は積み上げ優先が安定です。",
  },
  {
    id: "cyber",
    name: "サイバーAI",
    label: "未来的なHUD分析",
    description: "データ端末のように、淡々と状態を表示する。",
    sample: "Training log synchronized. Recovery priority: medium. Next action: controlled cardio.",
  },
  {
    id: "strategist",
    name: "軍師AI",
    label: "長期勝利の作戦担当",
    description: "目先の追い込みより、数週間後に強くなる選択を重視する。",
    sample: "今日は勝ち急がなくていい。回復を挟めば、次の一撃が重くなる。",
  },
];

export function getAiPersonality(id: string) {
  return aiPersonalities.find((item) => item.id === id) || aiPersonalities[0];
}


