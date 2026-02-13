import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

function extractDuration(query: string): number {
  const patterns = [
    /(\d+)\s*(?:day|days|يوم|أيام|ايام)/i,
    /(\d+)\s*(?:week|weeks|اسبوع|أسبوع|أسابيع|اسابيع)/i,
    /(\d+)\s*(?:month|months|شهر|أشهر|اشهر)/i,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = query.match(patterns[i]);
    if (match) {
      const num = parseInt(match[1], 10);
      if (i === 0) return num;
      if (i === 1) return num * 7;
      if (i === 2) return num * 30;
    }
  }

  return 7;
}

function getSampleDays(totalDays: number): number[] {
  if (totalDays <= 7) return Array.from({ length: totalDays }, (_, i) => i + 1);
  if (totalDays <= 14) {
    const days = [1, 2, 3];
    for (let d = 5; d <= totalDays; d += 2) days.push(d);
    if (!days.includes(totalDays)) days.push(totalDays);
    return days.slice(0, 7);
  }
  const days = [1, 2, 3];
  const step = Math.floor((totalDays - 3) / 4);
  for (let i = 1; i <= 4; i++) {
    const d = 3 + step * i;
    if (d <= totalDays && !days.includes(d)) days.push(d);
  }
  if (!days.includes(totalDays)) days.push(totalDays);
  return days.slice(0, 7);
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { query, locale } = body;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (locale && !["ar", "en"].includes(locale)) {
    return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
  }

  const durationDays = extractDuration(query);
  const clampedDays = Math.max(7, Math.min(90, durationDays));
  const sampleDays = getSampleDays(clampedDays);

  const progressData = Array.from({ length: clampedDays }, (_, i) => ({
    day: i + 1,
    impact: Math.round(((i + 1) / clampedDays) * 30),
  }));

  const sampleDaysStr = sampleDays.join(", ");

  const systemPrompt = `You are a bio-hacking scientist. Generate a ${clampedDays}-day protocol.

RULES:
1. Use real physiological mechanisms only.
2. If goal is impossible in ${clampedDays} days, pivot to closest achievable alternative.
3. Focus on fast visual changes: water manipulation, inflammation reduction, glycogen loading, pump nutrition.
4. Reference mechanisms with [Source: PMID XXXXX].

OUTPUT: Return ONLY valid JSON (no markdown, no code blocks):
{
  "id": "generated-protocol",
  "title": "English title",
  "titleAr": "Arabic title",
  "subtitle": "English subtitle (include ${clampedDays}-day mention)",
  "subtitleAr": "Arabic subtitle (include ${clampedDays} يوم)",
  "focus": ["focus1", "focus2", "focus3"],
  "focusAr": ["تركيز1", "تركيز2", "تركيز3"],
  "scienceOverview": "English overview paragraph",
  "scienceOverviewAr": "Arabic overview paragraph",
  "progressData": ${JSON.stringify(progressData)},
  "days": [
    {
      "day": NUMBER,
      "title": "English day title",
      "titleAr": "Arabic day title",
      "theme": "English theme",
      "themeAr": "Arabic theme",
      "dailyGoal": "English goal",
      "dailyGoalAr": "Arabic goal",
      "tasks": [
        {
          "id": "d1t1",
          "action": "English task",
          "actionAr": "Arabic task",
          "category": "wake|meal|supplement|training|recovery|hydration|sleep",
          "scienceWhy": "English explanation [Source: PMID XXXXX]",
          "scienceWhyAr": "Arabic explanation",
          "visualImpact": "low|medium|high",
          "tips": "English tips",
          "tipsAr": "Arabic tips"
        }
      ]
    }
  ]
}

Generate ONLY days: ${sampleDaysStr}. Each day should have 8 tasks. Keep Arabic natural.`;

  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `${clampedDays}-day protocol for: "${query}"` },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    let jsonStr = content.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const protocol = JSON.parse(jsonStr);
    return NextResponse.json(protocol);
  } catch (error: any) {
    console.error("DeepSeek API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate protocol" },
      { status: 500 }
    );
  }
}
