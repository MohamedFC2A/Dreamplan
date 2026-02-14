import { NextRequest, NextResponse } from "next/server";
import { PlannerAnswer, PlannerQuestion, UserProfile } from "@/lib/planner-types";

type Locale = "ar" | "en";
type GoalArchetype =
  | "speed_performance"
  | "fat_loss"
  | "muscle_gain"
  | "quick_visual"
  | "posture_definition"
  | "general";

interface AskResponse {
  status: "ask";
  nextQuestion: PlannerQuestion;
  progress: number;
  reasoningHint: string;
}

interface ReadyResponse {
  status: "ready";
  progress: number;
  planBrief: string;
  keyConstraints: string[];
  profileFitSummary: string;
}

const TOTAL_QUESTIONS = 3;

function inferGoalArchetype(query: string): GoalArchetype {
  const q = query.toLowerCase();
  if (/(speed|sprint|acceleration|agility|explosive|quickness|soccer|football|ronaldo|cr7|سرعة|انطلاق|رشاقة|انفجار|رونالدو|كرة)/i.test(q)) {
    return "speed_performance";
  }
  if (/(fat|lose|cut|lean|shred|دهون|خسارة|تنشيف|نحت)/i.test(q)) return "fat_loss";
  if (/(muscle|mass|bulk|hypertrophy|gain|عضل|كتلة|تضخيم)/i.test(q)) return "muscle_gain";
  if (/(vein|vascular|pump|عروق|وريد|ضخ)/i.test(q)) return "quick_visual";
  if (/(posture|neck|jaw|face|shoulder|وضعية|رقبة|فك|وجه|كتف)/i.test(q)) return "posture_definition";
  return "general";
}

function isValidProfile(profile: any): profile is UserProfile {
  if (!profile || typeof profile !== "object") return false;
  const requiredStringFields = ["injuriesOrConditions", "availableEquipment", "activityLevel", "sex", "units"];
  for (const key of requiredStringFields) {
    if (typeof profile[key] !== "string" || !profile[key].trim()) return false;
  }
  return (
    Number.isFinite(profile.age) &&
    profile.age >= 13 &&
    profile.age <= 90 &&
    Number.isFinite(profile.heightCm) &&
    profile.heightCm >= 120 &&
    profile.heightCm <= 230 &&
    Number.isFinite(profile.weightKg) &&
    profile.weightKg >= 35 &&
    profile.weightKg <= 250
  );
}

function normalizeQaHistory(raw: any, allowedIds: Set<string>): PlannerAnswer[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => ({
      questionId: typeof entry?.questionId === "string" ? entry.questionId : "",
      value: typeof entry?.value === "string" ? entry.value : "",
      label: typeof entry?.label === "string" ? entry.label : undefined,
    }))
    .filter((entry) => entry.questionId && entry.value && allowedIds.has(entry.questionId))
    .slice(0, TOTAL_QUESTIONS);
}

function speedQuestionPack(query: string, locale: Locale, durationDays: number): PlannerQuestion[] {
  return [
    {
      id: "q_speed_baseline",
      question:
        locale === "ar"
          ? `واضح إن هدفك "${query}" يحتاج بروتوكول سرعة حقيقي. مستواك الحالي في السرعة؟`
          : `Your "${query}" goal needs real speed engineering. What is your current speed baseline?`,
      questionAr: `واضح إن هدفك "${query}" يحتاج بروتوكول سرعة حقيقي. مستواك الحالي في السرعة؟`,
      inputType: "single_choice",
      required: true,
      options: [
        { value: "starter", label: "Starter (building mechanics)", labelAr: "مبتدئ (تأسيس ميكانيكا)" },
        { value: "intermediate", label: "Intermediate (solid but inconsistent)", labelAr: "متوسط (جيد لكن غير ثابت)" },
        { value: "advanced", label: "Advanced (ready for elite progression)", labelAr: "متقدم (جاهز لتدرج احترافي)" },
      ],
      reasoningHint:
        locale === "ar"
          ? "نحدد به شدة السرعات، مسافات الانطلاق، وحجم التحمل العصبي."
          : "This controls sprint intensity, acceleration distance, and neural load volume.",
      reasoningHintAr: "نحدد به شدة السرعات، مسافات الانطلاق، وحجم التحمل العصبي.",
    },
    {
      id: "q_speed_bottleneck",
      question:
        locale === "ar"
          ? `ما العامل الأهم الذي تريد نرفعه خلال ${durationDays} يوم؟`
          : `Which bottleneck should we improve most over ${durationDays} days?`,
      questionAr: `ما العامل الأهم الذي تريد نرفعه خلال ${durationDays} يوم؟`,
      inputType: "single_choice",
      required: true,
      options: [
        { value: "first_10m", label: "First 10m acceleration", labelAr: "الانطلاق أول 10 متر" },
        { value: "max_velocity", label: "Top speed mechanics", labelAr: "ميكانيكا السرعة القصوى" },
        { value: "repeat_sprint", label: "Repeat sprint endurance", labelAr: "تحمل التكرارات السريعة" },
      ],
      reasoningHint:
        locale === "ar"
          ? "هذا يحدد نوع تمارين السرعة الأساسية والمكملات الداعمة."
          : "This defines the core speed drill family and supportive supplement strategy.",
      reasoningHintAr: "هذا يحدد نوع تمارين السرعة الأساسية والمكملات الداعمة.",
    },
    {
      id: "q_speed_environment",
      question:
        locale === "ar"
          ? "أي بيئة تدريب تناسبك أكثر للاستمرارية؟"
          : "Which training environment fits your consistency best?",
      questionAr: "أي بيئة تدريب تناسبك أكثر للاستمرارية؟",
      inputType: "single_choice",
      required: true,
      options: [
        { value: "field_track", label: "Field/track focused", labelAr: "ملعب/مضمار" },
        { value: "gym_hybrid", label: "Gym + field hybrid", labelAr: "مزيج جيم + ملعب" },
        { value: "minimal_space", label: "Minimal-space drills", labelAr: "تمارين مساحة محدودة" },
      ],
      reasoningHint:
        locale === "ar"
          ? "نصمم الخطة حول بيئتك الفعلية حتى لا تضيع الحماسة."
          : "We design around your real environment so motivation stays high.",
      reasoningHintAr: "نصمم الخطة حول بيئتك الفعلية حتى لا تضيع الحماسة.",
    },
  ];
}

function buildQuestionPack(query: string, locale: Locale, archetype: GoalArchetype, durationDays: number): PlannerQuestion[] {
  if (archetype === "speed_performance") {
    return speedQuestionPack(query, locale, durationDays);
  }

  const q1 =
    locale === "ar"
      ? `أنا فاهم هدفك "${query}". أي مستوى التزام يناسبك فعلًا؟`
      : `I understand "${query}". Which commitment level is truly realistic for you?`;
  const q2 =
    locale === "ar"
      ? `لتحقيق أفضل نتيجة خلال ${durationDays} يوم، ما أولوية التنفيذ؟`
      : `To maximize results in ${durationDays} days, what execution priority should lead?`;
  const q3 =
    locale === "ar"
      ? "ما نوع النتيجة التي ستحفزك جدًا للاستمرار أسبوعيًا؟"
      : "Which type of weekly win would keep you highly motivated?";

  const strategyOptions =
    archetype === "fat_loss"
      ? [
          { value: "deficit_precision", label: "Calorie deficit precision", labelAr: "دقة العجز الحراري" },
          { value: "metabolic_training", label: "Metabolic training density", labelAr: "كثافة التدريب الأيضي" },
          { value: "hybrid_cut", label: "Balanced cut hybrid", labelAr: "تنشيف متوازن" },
        ]
      : archetype === "muscle_gain"
      ? [
          { value: "progressive_load", label: "Progressive overload", labelAr: "الحمل التدريجي" },
          { value: "shape_symmetry", label: "Shape and symmetry", labelAr: "الشكل والتناسق" },
          { value: "joint_safe_bulk", label: "Joint-safe growth", labelAr: "زيادة آمنة للمفاصل" },
        ]
      : archetype === "quick_visual"
      ? [
          { value: "rapid_visual", label: "Rapid visual impact", labelAr: "تأثير بصري سريع" },
          { value: "stable_visual", label: "Stable visual improvement", labelAr: "تحسن بصري ثابت" },
          { value: "balanced_visual", label: "Balanced visual plan", labelAr: "خطة بصرية متوازنة" },
        ]
      : archetype === "posture_definition"
      ? [
          { value: "posture_reset", label: "Posture reset first", labelAr: "تصحيح وضعية أولًا" },
          { value: "neck_jaw", label: "Neck/jawline emphasis", labelAr: "تركيز رقبة/فك" },
          { value: "balanced_form", label: "Balanced form and definition", labelAr: "توازن الشكل والتحديد" },
        ]
      : [
          { value: "habit_system", label: "Strong habit system", labelAr: "نظام عادات قوي" },
          { value: "performance_progress", label: "Performance progression", labelAr: "تدرج الأداء" },
          { value: "visual_focus", label: "Visual transformation focus", labelAr: "تركيز بصري" },
        ];

  return [
    {
      id: "q_commitment",
      question: q1,
      questionAr: q1,
      inputType: "single_choice",
      required: true,
      options: [
        { value: "lean_mode", label: "Lean mode (light)", labelAr: "وضع خفيف" },
        { value: "balanced_mode", label: "Balanced mode", labelAr: "وضع متوازن" },
        { value: "pro_mode", label: "Pro mode (high push)", labelAr: "وضع احترافي" },
      ],
      reasoningHint: locale === "ar" ? "تحديد واضح لمستوى الحمل القابل للاستمرار." : "Clear calibration for sustainable load.",
      reasoningHintAr: "تحديد واضح لمستوى الحمل القابل للاستمرار.",
    },
    {
      id: "q_strategy",
      question: q2,
      questionAr: q2,
      inputType: "single_choice",
      required: true,
      options: strategyOptions,
      reasoningHint: locale === "ar" ? "نحدد المحرك الرئيسي للنتيجة حسب حلمك." : "Defines the primary result driver for your exact goal.",
      reasoningHintAr: "نحدد المحرك الرئيسي للنتيجة حسب حلمك.",
    },
    {
      id: "q_motivation",
      question: q3,
      questionAr: q3,
      inputType: "single_choice",
      required: true,
      options: [
        { value: "mirror", label: "Visible mirror change", labelAr: "تغير واضح في الشكل" },
        { value: "numbers", label: "Clear measurable numbers", labelAr: "أرقام أداء واضحة" },
        { value: "consistency", label: "Smooth consistency", labelAr: "استمرارية سهلة" },
      ],
      reasoningHint: locale === "ar" ? "نستخدمه للحفاظ على حماسك أسبوعًا بعد أسبوع." : "Used to keep motivation high week after week.",
      reasoningHintAr: "نستخدمه للحفاظ على حماسك أسبوعًا بعد أسبوع.",
    },
  ];
}

function buildPlanBrief(locale: Locale, query: string, profile: UserProfile, qaHistory: PlannerAnswer[], archetype: GoalArchetype): string {
  const topAnswers = qaHistory.map((qa) => qa.label || qa.value).slice(0, 3).join(" • ");
  if (locale === "ar") {
    return `تم تفكيك هدف "${query}" إلى خطة تنفيذ دقيقة (${archetype}) مع مراعاة ملفك (${profile.age} سنة) وتفضيلاتك: ${topAnswers}.`;
  }
  return `Your "${query}" goal was decomposed into a precise execution blueprint (${archetype}), calibrated to your profile (${profile.age}y) and preferences: ${topAnswers}.`;
}

function buildKeyConstraints(profile: UserProfile, qaHistory: PlannerAnswer[]): string[] {
  const list: string[] = [];
  list.push(`Inferred activity: ${profile.activityLevel}`);
  list.push(`Health conditions: ${profile.injuriesOrConditions}`);
  qaHistory.forEach((answer) => list.push(`${answer.questionId}: ${answer.label || answer.value}`));
  return list.slice(0, 6);
}

function buildProfileFitSummary(locale: Locale, profile: UserProfile): string {
  if (locale === "ar") {
    return `الخطة ستتكيّف تلقائيًا مع العمر (${profile.age})، الوزن (${Math.round(profile.weightKg)} كجم)، الحالة الصحية، والنشاط المستنتج (${profile.activityLevel}).`;
  }
  return `The plan auto-adapts to age (${profile.age}), weight (${Math.round(profile.weightKg)} kg), health constraints, and inferred activity (${profile.activityLevel}).`;
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
  const durationDays = Number(body?.durationDays);
  const profile = body?.profile;

  if (!query) {
    return NextResponse.json({ error: "Query is required.", code: "MISSING_QUERY" }, { status: 400 });
  }
  if (!Number.isFinite(durationDays) || durationDays < 7 || durationDays > 90) {
    return NextResponse.json({ error: "Duration must be between 7 and 90.", code: "INVALID_DURATION" }, { status: 400 });
  }
  if (!isValidProfile(profile)) {
    return NextResponse.json({ error: "Valid profile is required.", code: "MISSING_PROFILE" }, { status: 400 });
  }

  const archetype = inferGoalArchetype(`${query} ${profile.primaryGoal || ""}`);
  const questionPack = buildQuestionPack(query, locale, archetype, durationDays);
  const allowedIds = new Set(questionPack.map((item) => item.id));
  const qaHistory = normalizeQaHistory(body?.qaHistory, allowedIds);

  if (qaHistory.length >= TOTAL_QUESTIONS) {
    const response: ReadyResponse = {
      status: "ready",
      progress: 100,
      planBrief: buildPlanBrief(locale, query, profile, qaHistory, archetype),
      keyConstraints: buildKeyConstraints(profile, qaHistory),
      profileFitSummary: buildProfileFitSummary(locale, profile),
    };
    return NextResponse.json(response);
  }

  const nextQuestion = questionPack[qaHistory.length];
  const response: AskResponse = {
    status: "ask",
    nextQuestion,
    progress: Math.round((qaHistory.length / TOTAL_QUESTIONS) * 100),
    reasoningHint: locale === "ar" ? nextQuestion.reasoningHintAr || "" : nextQuestion.reasoningHint || "",
  };
  return NextResponse.json(response);
}
