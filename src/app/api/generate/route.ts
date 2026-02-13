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

  const progressData = Array.from({ length: clampedDays }, (_, i) => ({
    day: i + 1,
    impact: Math.round(((i + 1) / clampedDays) * 30),
  }));

  const systemPrompt = `You are an expert bio-hacking research scientist. Generate a scientifically-grounded ${clampedDays}-day transformation protocol.

RULES:
1. Scientific Realism: Use real physiological mechanisms only. No hallucination.
2. If the goal is biologically impossible in ${clampedDays} days, pivot to the closest scientific visual alternative that IS achievable.
3. Focus on fast visual changes: water manipulation, inflammation reduction, glycogen loading, pump-inducing nutrition.
4. Every claim must reference a mechanism with [Source: PMID XXXXX] placeholder.

OUTPUT FORMAT: Return ONLY valid JSON (no markdown, no code blocks) matching this exact structure:
{
  "id": "generated-protocol",
  "title": "English title",
  "titleAr": "Arabic title",
  "subtitle": "English subtitle",
  "subtitleAr": "Arabic subtitle",
  "focus": ["English focus 1", "English focus 2", "English focus 3"],
  "focusAr": ["Arabic focus 1", "Arabic focus 2", "Arabic focus 3"],
  "scienceOverview": "English science overview paragraph",
  "scienceOverviewAr": "Arabic science overview paragraph",
  "progressData": ${JSON.stringify(progressData)},
  "days": [
    {
      "day": 1,
      "title": "English day title",
      "titleAr": "Arabic day title",
      "theme": "English theme",
      "themeAr": "Arabic theme",
      "dailyGoal": "English daily goal description",
      "dailyGoalAr": "Arabic daily goal description",
      "tasks": [
        {
          "id": "d1t1",
          "action": "English task description",
          "actionAr": "Arabic task description",
          "category": "one of: wake|meal|supplement|training|recovery|hydration|sleep",
          "scienceWhy": "English science explanation [Source: PMID XXXXX]",
          "scienceWhyAr": "Arabic science explanation [Source: PMID XXXXX]",
          "visualImpact": "low|medium|high",
          "tips": "Optional English tips",
          "tipsAr": "Optional Arabic tips"
        }
      ]
    }
  ]
}

Generate ${clampedDays} days with 8-10 tasks each. Make Arabic text natural and proper.`;

  try {
    const completion = await client.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate a ${clampedDays}-day transformation protocol for: "${query}"` },
      ],
      max_tokens: 8192,
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
