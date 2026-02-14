import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

type Locale = "ar" | "en";
type GoalType = "quick_visual" | "fat_loss" | "muscle_gain" | "posture_definition" | "general";

interface DurationSuggestion {
  suggestedDays: number;
  minDays: number;
  maxDays: number;
  planModeHint: "daily" | "weekly";
  rationale: string;
  question: string;
  goalType: GoalType;
  quickOptions: number[];
}

function createDeepSeekClient(): OpenAI | null {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({
    apiKey,
    baseURL: "https://api.deepseek.com",
  });
}

const GOAL_WINDOWS: Record<GoalType, { min: number; max: number; fallback: number }> = {
  quick_visual: { min: 7, max: 21, fallback: 14 },
  posture_definition: { min: 14, max: 45, fallback: 21 },
  fat_loss: { min: 21, max: 90, fallback: 45 },
  muscle_gain: { min: 42, max: 90, fallback: 60 },
  general: { min: 14, max: 60, fallback: 21 },
};

const ABSOLUTE_MIN = 7;
const ABSOLUTE_MAX = 90;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timeout);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

function parseJsonObject(raw: string): any {
  const trimmed = raw.trim();
  const noFence = trimmed.startsWith("```")
    ? trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
    : trimmed;

  try {
    return JSON.parse(noFence);
  } catch {
    const start = noFence.indexOf("{");
    const end = noFence.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(noFence.slice(start, end + 1));
    }
    throw new Error("INVALID_JSON");
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function extractRequestedDurationDays(query: string): number | null {
  const patterns = [
    /(\d+)\s*(?:day|days|d|يوم|أيام|ايام)/i,
    /(\d+)\s*(?:week|weeks|w|اسبوع|أسبوع|أسابيع|اسابيع)/i,
    /(\d+)\s*(?:month|months|m|شهر|أشهر|اشهر)/i,
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = query.match(patterns[i]);
    if (!match) continue;
    const num = Number.parseInt(match[1], 10);
    if (!Number.isFinite(num) || num <= 0) continue;
    if (i === 0) return num;
    if (i === 1) return num * 7;
    return num * 30;
  }

  return null;
}

function estimateUrgencyAdjustment(query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  if (/(asap|quick|fast|urgent|now|بسرعة|سريع|فورًا|حالًا)/i.test(q)) score -= 4;
  if (/(extreme|hardcore|pro|max|ضخم|احترافي|جذري)/i.test(q)) score += 5;
  if (/(sustainable|steady|safe|واقعي|تدريجي|آمن)/i.test(q)) score += 3;
  return score;
}

function estimateComplexityAdjustment(query: string): number {
  const q = query.toLowerCase();
  let score = 0;
  const featureMatches = [
    /(fat|دهون|تنشيف)/i,
    /(muscle|عضل|تضخيم)/i,
    /(posture|neck|jaw|وضعية|رقبة|فك)/i,
    /(vein|vascular|عروق)/i,
    /(strength|power|قوة)/i,
  ].reduce((acc, pattern) => acc + (pattern.test(q) ? 1 : 0), 0);
  if (featureMatches >= 3) score += 7;
  else if (featureMatches === 2) score += 3;
  return score;
}

function classifyGoalType(query: string): GoalType {
  const q = query.toLowerCase();

  const quickVisualKeywords = [
    "vein",
    "veins",
    "vascular",
    "vascularity",
    "pump",
    "water cut",
    "bloated",
    "عروق",
    "وريد",
    "ضخ",
    "نفخة",
  ];
  const fatLossKeywords = [
    "fat",
    "lose",
    "weight",
    "shred",
    "cut",
    "lean",
    "دهون",
    "خسارة",
    "وزن",
    "تنشيف",
    "نحت",
  ];
  const muscleGainKeywords = [
    "bulk",
    "muscle",
    "mass",
    "hypertrophy",
    "gain",
    "تضخيم",
    "عضلات",
    "كتلة",
    "زيادة",
  ];
  const postureDefinitionKeywords = [
    "neck",
    "jaw",
    "jawline",
    "posture",
    "face",
    "shoulder",
    "رقبة",
    "فك",
    "وضعية",
    "وجه",
    "اكتاف",
  ];

  if (quickVisualKeywords.some((kw) => q.includes(kw))) return "quick_visual";
  if (fatLossKeywords.some((kw) => q.includes(kw))) return "fat_loss";
  if (muscleGainKeywords.some((kw) => q.includes(kw))) return "muscle_gain";
  if (postureDefinitionKeywords.some((kw) => q.includes(kw))) return "posture_definition";
  return "general";
}

function buildDefaultRationale(goalType: GoalType, locale: Locale): string {
  const rationaleMapAr: Record<GoalType, string> = {
    quick_visual: "هذا الهدف غالبًا يستجيب في مدى قصير مع تغييرات مرئية تدريجية، لذلك المدى القصير-المتوسط هو الأكثر واقعية.",
    posture_definition: "الأهداف المرتبطة بالوضعية أو التفاصيل الشكلية تحتاج وقتًا متوسطًا لتثبيت السلوك العضلي وإظهار النتيجة.",
    fat_loss: "خفض الدهون بشكل صحي يحتاج وقتًا أطول نسبيًا لتفادي نتائج مؤقتة أو غير مستقرة.",
    muscle_gain: "بناء الكتلة العضلية يحتاج مدة أطول لأن التغير البنيوي في العضلات لا يحدث بسرعة.",
    general: "المدة المقترحة توازن بين سرعة النتيجة وإمكانية الالتزام الواقعي بالخطة.",
  };

  const rationaleMapEn: Record<GoalType, string> = {
    quick_visual: "This type of goal usually responds in a short window, so a short-to-medium duration is most realistic.",
    posture_definition: "Posture and definition goals need a moderate timeline to make the adaptation visible and stable.",
    fat_loss: "Sustainable fat-loss goals typically need a longer window to avoid unrealistic expectations.",
    muscle_gain: "Muscle gain requires a longer horizon because structural adaptation does not happen quickly.",
    general: "The suggested duration balances visible progress with realistic adherence.",
  };

  return locale === "ar" ? rationaleMapAr[goalType] : rationaleMapEn[goalType];
}

function buildDefaultQuestion(locale: Locale, suggestedDays: number, minDays: number, maxDays: number): string {
  if (locale === "ar") {
    return `أنا فاهم هدفك. أفضل مدة لك الآن ${suggestedDays} يوم. اخترها مباشرة أو عدّل بسهولة داخل ${minDays}-${maxDays} يوم.`;
  }
  return `I understand your goal. Best fit now is ${suggestedDays} days. Keep it or quickly adjust within ${minDays}-${maxDays} days.`;
}

function buildQuickOptions(suggested: number, minDays: number, maxDays: number): number[] {
  const fast = clamp(Math.round(suggested * 0.8), minDays, maxDays);
  const balanced = clamp(suggested, minDays, maxDays);
  const deep = clamp(Math.round(suggested * 1.25), minDays, maxDays);
  return Array.from(new Set([fast, balanced, deep])).sort((a, b) => a - b);
}

function buildDeterministicSuggestion(query: string, locale: Locale): DurationSuggestion {
  const goalType = classifyGoalType(query);
  const window = GOAL_WINDOWS[goalType];
  const requestedDays = extractRequestedDurationDays(query);
  const minDays = clamp(window.min, ABSOLUTE_MIN, ABSOLUTE_MAX);
  const maxDays = clamp(window.max, ABSOLUTE_MIN, ABSOLUTE_MAX);
  const adjustedBase =
    (requestedDays ?? window.fallback) +
    estimateUrgencyAdjustment(query) +
    estimateComplexityAdjustment(query);
  const suggested = clamp(adjustedBase, minDays, maxDays);

  return {
    suggestedDays: suggested,
    minDays,
    maxDays,
    planModeHint: suggested > 7 ? "weekly" : "daily",
    rationale: buildDefaultRationale(goalType, locale),
    question: buildDefaultQuestion(locale, suggested, minDays, maxDays),
    goalType,
    quickOptions: buildQuickOptions(suggested, minDays, maxDays),
  };
}

function normalizeGoalType(value: any, fallback: GoalType): GoalType {
  if (
    value === "quick_visual" ||
    value === "fat_loss" ||
    value === "muscle_gain" ||
    value === "posture_definition" ||
    value === "general"
  ) {
    return value;
  }
  return fallback;
}

function normalizeSuggestion(payload: any, fallback: DurationSuggestion, locale: Locale): DurationSuggestion {
  const goalType = normalizeGoalType(payload?.goalType, fallback.goalType);
  const window = GOAL_WINDOWS[goalType];

  const minDays = clamp(window.min, ABSOLUTE_MIN, ABSOLUTE_MAX);
  const maxDays = clamp(window.max, ABSOLUTE_MIN, ABSOLUTE_MAX);

  const rawSuggested =
    typeof payload?.suggestedDays === "number"
      ? payload.suggestedDays
      : Number.parseInt(String(payload?.suggestedDays || ""), 10);

  const suggestedDays = Number.isFinite(rawSuggested)
    ? clamp(Math.round(rawSuggested), minDays, maxDays)
    : fallback.suggestedDays;
  const planModeHint = suggestedDays > 7 ? "weekly" : "daily";

  const rationale =
    typeof payload?.rationale === "string" && payload.rationale.trim()
      ? payload.rationale.trim()
      : buildDefaultRationale(goalType, locale);

  const question =
    typeof payload?.question === "string" && payload.question.trim()
      ? payload.question.trim()
      : buildDefaultQuestion(locale, suggestedDays, minDays, maxDays);

  return {
    suggestedDays,
    minDays,
    maxDays,
    planModeHint,
    rationale,
    question,
    goalType,
    quickOptions: buildQuickOptions(suggestedDays, minDays, maxDays),
  };
}

function buildPrompt(query: string, locale: Locale, fallback: DurationSuggestion): string {
  return `You classify fitness/body goals and suggest realistic protocol duration.

Goal query: "${query}"
Language: ${locale}
Allowed goalType values: quick_visual, fat_loss, muscle_gain, posture_definition, general

Hard constraints:
- quick_visual: 7..21 days
- posture_definition: 14..45 days
- fat_loss: 21..90 days
- muscle_gain: 42..90 days
- general: 14..60 days
- absolute range: 7..90 days

Return JSON only:
{
  "goalType": "one of allowed values",
  "suggestedDays": number,
  "rationale": "short realistic explanation in ${locale}",
  "question": "ask user to confirm/adjust suggested duration in ${locale}"
}

Keep it concise and realistic. If uncertain, use this fallback goalType: ${fallback.goalType}.`;
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const query = typeof body?.query === "string" ? body.query.trim() : "";
  const locale: Locale = body?.locale === "en" ? "en" : "ar";

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const deterministic = buildDeterministicSuggestion(query, locale);
  const client = createDeepSeekClient();
  if (!client) {
    return NextResponse.json(deterministic);
  }

  try {
    const completion = await withTimeout(
      client.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "system", content: buildPrompt(query, locale, deterministic) }],
        max_tokens: 260,
        temperature: 0.2,
      }),
      7000
    );

    const content = completion.choices[0]?.message?.content;
    if (!content) return NextResponse.json(deterministic);

    const parsed = parseJsonObject(content);
    const normalized = normalizeSuggestion(parsed, deterministic, locale);
    return NextResponse.json(normalized);
  } catch {
    return NextResponse.json(deterministic);
  }
}
