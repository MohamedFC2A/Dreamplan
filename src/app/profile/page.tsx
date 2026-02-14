"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Gauge, LogIn, LogOut, Save, UserCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { UserProfile } from "@/lib/planner-types";
import {
  computeProfileReadiness,
  createDefaultProfile,
  getMetabolicSummary,
  inferActivityLevelFromProfile,
  normalizeStoredProfile,
  readStoredProfile,
  saveStoredProfile,
  validateProfile,
} from "@/lib/profile-storage";

const AGE_MIN = 13;
const AGE_MAX = 90;
const HEIGHT_MIN = 140;
const HEIGHT_MAX = 210;
const WEIGHT_MIN = 40;
const WEIGHT_MAX = 180;

type SaveState = "idle" | "saved";

interface HealthOption {
  id: string;
  value: string;
  ar: string;
  en: string;
}

const HEALTH_OPTIONS: HealthOption[] = [
  { id: "none", value: "none", ar: "لا يوجد", en: "None" },
  { id: "diabetes", value: "type 2 diabetes", ar: "سكري", en: "Diabetes" },
  { id: "hypertension", value: "hypertension", ar: "ضغط مرتفع", en: "Hypertension" },
  { id: "asthma", value: "asthma", ar: "ربو", en: "Asthma" },
  { id: "thyroid", value: "thyroid disorder", ar: "اضطراب الغدة", en: "Thyroid Disorder" },
  { id: "knee", value: "knee pain", ar: "ألم ركبة", en: "Knee Pain" },
  { id: "back", value: "lower-back pain", ar: "ألم أسفل الظهر", en: "Lower Back Pain" },
  { id: "heart", value: "heart condition", ar: "مشكلة قلب", en: "Heart Condition" },
  { id: "custom", value: "custom", ar: "مخصص", en: "Custom" },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function parseCondition(raw: string): { optionId: string; note: string } {
  const [base, ...rest] = (raw || "none").split("|");
  const baseValue = base.trim().toLowerCase();
  const note = rest.join("|").trim();
  const matched = HEALTH_OPTIONS.find((item) => item.value === baseValue);
  return { optionId: matched ? matched.id : "custom", note };
}

function buildConditionValue(optionId: string, note: string): string {
  const option = HEALTH_OPTIONS.find((item) => item.id === optionId);
  const base = option?.value && option.value !== "custom" ? option.value : "";
  if (note.trim()) return base ? `${base} | ${note.trim()}` : note.trim();
  return base || "none";
}

function buildInsightHints(profile: UserProfile, locale: "ar" | "en"): string[] {
  const summary = getMetabolicSummary(profile);
  const hints: string[] = [];
  if (summary.bmiCategory === "underweight") {
    hints.push(locale === "ar" ? "التركيز الأفضل: زيادة سعرات تدريجية مع تمارين مقاومة آمنة." : "Best focus: gradual calorie surplus with safe resistance work.");
  }
  if (summary.bmiCategory === "overweight" || summary.bmiCategory === "obesity") {
    hints.push(locale === "ar" ? "ابدأ بعجز سعرات محافظ + بروتين مرتفع لحماية الكتلة العضلية." : "Start with a conservative calorie deficit plus high protein to preserve lean mass.");
  }
  if ((profile.sleepHours || 7) < 7) {
    hints.push(locale === "ar" ? "رفع النوم إلى 7-8 ساعات سيحسن الاستشفاء وسرعة التقدم." : "Raising sleep to 7-8h will improve recovery and progress speed.");
  }
  if ((profile.injuriesOrConditions || "none").toLowerCase() !== "none") {
    hints.push(locale === "ar" ? "سيتم تفعيل فلترة أمان تلقائية لتجنب أي توصيات لا تناسب حالتك الصحية." : "Safety filtering will automatically avoid recommendations that conflict with your health condition.");
  }
  if (hints.length === 0) {
    hints.push(locale === "ar" ? "ملفك ممتاز. يمكنك الآن الحصول على خطة أدق وأكثر ثباتًا." : "Your profile looks strong. You can now get a more precise and stable plan.");
  }
  return hints;
}

function ProfilePageContent() {
  const { locale } = useLanguage();
  const { user, isConfigured, isLoading: authLoading, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const [profile, setProfile] = useState<UserProfile>(createDefaultProfile(""));
  const [conditionId, setConditionId] = useState<string>("none");
  const [conditionNote, setConditionNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [authError, setAuthError] = useState("");
  const [analysisReady, setAnalysisReady] = useState(false);

  useEffect(() => {
    const stored = readStoredProfile();
    const normalized = normalizeStoredProfile(stored || createDefaultProfile(""));
    const parsedCondition = parseCondition(normalized.injuriesOrConditions);
    setConditionId(parsedCondition.optionId);
    setConditionNote(parsedCondition.note);
    setProfile(normalized);
  }, []);

  const draftProfile = useMemo(() => {
    const condition = buildConditionValue(conditionId, conditionNote);
    const base: UserProfile = {
      ...profile,
      units: "metric",
      primaryGoal: "",
      availableEquipment: "bodyweight",
      injuriesOrConditions: condition,
    };
    const inferredActivity = inferActivityLevelFromProfile(base);
    return { ...base, activityLevel: inferredActivity };
  }, [conditionId, conditionNote, profile]);

  const profileErrors = useMemo(() => validateProfile(draftProfile, locale), [draftProfile, locale]);
  const readiness = useMemo(() => computeProfileReadiness(draftProfile), [draftProfile]);
  const completion = readiness.score;
  const summary = useMemo(() => getMetabolicSummary(draftProfile), [draftProfile]);
  const insightHints = useMemo(() => buildInsightHints(draftProfile, locale), [draftProfile, locale]);

  const bmiLabel =
    summary.bmiCategory === "underweight"
      ? locale === "ar"
        ? "نحافة"
        : "Underweight"
      : summary.bmiCategory === "normal"
      ? locale === "ar"
        ? "طبيعي"
        : "Normal"
      : summary.bmiCategory === "overweight"
      ? locale === "ar"
        ? "وزن زائد"
        : "Overweight"
      : locale === "ar"
      ? "سمنة"
      : "Obesity";

  const handleSaveProfile = () => {
    const validation = validateProfile(draftProfile, locale);
    setErrors(validation);
    if (validation.length > 0) return;
    saveStoredProfile(draftProfile);
    setProfile(draftProfile);
    setAnalysisReady(true);
    setSaveState("saved");
    setTimeout(() => setSaveState("idle"), 1800);
  };

  const handleGoogleSignIn = async () => {
    setAuthError("");
    const result = await signInWithGoogle("/profile");
    if (result.error) setAuthError(result.error);
  };

  const handleSignOut = async () => {
    setAuthError("");
    const result = await signOut();
    if (result.error) setAuthError(result.error);
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="max-w-6xl mx-auto px-4 pt-20 md:pt-24 pb-10 md:pb-14 space-y-4 md:space-y-5 ux-page-shell">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dark-border bg-dark-card overflow-hidden ux-card">
          <div className="p-4 md:p-6 border-b border-dark-border bg-gradient-to-r from-gold-500/10 via-gold-500/5 to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl font-bold text-white">{t(locale, "profilePageTitle")}</h1>
                <p className="text-sm text-gray-400 mt-1">{locale === "ar" ? "بيانات أقل، تأثير أكبر. ركّز فقط على المعلومات المفيدة فعلًا." : "Less input, more impact. Only provide what really improves planning."}</p>
              </div>
              <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2">
                <p className="text-[11px] uppercase text-gold-400">{locale === "ar" ? "جاهزية الملف" : "Readiness"}</p>
                <p className="font-heading text-2xl text-white">{completion}%</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  {locale === "ar" ? "تعتمد على صحة البيانات + عمق التخصيص" : "Based on data validity + personalization depth"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-dark-border bg-black/30 p-4 space-y-3 ux-card-soft">
                <div className="flex items-center gap-2 text-gray-100">
                  <UserCircle2 className="w-4 h-4 text-gold-400" />
                  <h2 className="text-sm font-heading">{locale === "ar" ? "تسجيل الدخول" : "Sign-In"}</h2>
                </div>
                {!isConfigured ? (
                  <p className="text-xs text-yellow-300">{locale === "ar" ? "أضف مفاتيح Supabase لتفعيل Google Login." : "Add Supabase env keys to enable Google login."}</p>
                ) : authLoading ? (
                  <p className="text-xs text-gray-400">{locale === "ar" ? "جاري التحقق من الجلسة..." : "Checking session..."}</p>
                ) : user ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-200 truncate">{user.email}</p>
                    <button type="button" onClick={handleSignOut} className="inline-flex items-center gap-1 border border-dark-border px-3 py-1.5 rounded-lg text-xs text-gray-200">
                      <LogOut className="w-3.5 h-3.5" />
                      {locale === "ar" ? "خروج" : "Sign out"}
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={handleGoogleSignIn} className="inline-flex items-center gap-2 border border-gold-500/40 bg-gold-500/10 text-gold-300 px-4 py-2 rounded-lg text-sm">
                    <LogIn className="w-4 h-4" />
                    {locale === "ar" ? "Google تسجيل الدخول" : "Continue with Google"}
                  </button>
                )}
                {authError && <p className="text-xs text-red-300">{authError}</p>}
              </div>

              <div className="rounded-xl border border-dark-border bg-black/30 p-4 space-y-3 ux-card-soft">
                <h2 className="text-sm font-heading text-gray-100">{locale === "ar" ? "البيانات الأساسية (متري فقط)" : "Core Metrics (Metric only)"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2 rounded-lg border border-dark-border bg-black px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-gray-400">{t(locale, "profileAge")}</label>
                      <span className="text-xs text-gold-300">{Math.round(profile.age)} {locale === "ar" ? "سنة" : "years"}</span>
                    </div>
                    <input type="range" min={AGE_MIN} max={AGE_MAX} step={1} value={Math.round(profile.age)} onChange={(e) => setProfile((p) => ({ ...p, age: clamp(Number(e.target.value), AGE_MIN, AGE_MAX) }))} className="w-full accent-gold-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setProfile((p) => ({ ...p, sex: "male" }))} className={`rounded-lg py-2 border text-xs ${profile.sex === "male" ? "border-gold-500/50 bg-gold-500/15 text-gold-300" : "border-dark-border text-gray-300"}`}>{t(locale, "profileSexMale")}</button>
                    <button type="button" onClick={() => setProfile((p) => ({ ...p, sex: "female" }))} className={`rounded-lg py-2 border text-xs ${profile.sex === "female" ? "border-gold-500/50 bg-gold-500/15 text-gold-300" : "border-dark-border text-gray-300"}`}>{t(locale, "profileSexFemale")}</button>
                  </div>

                  <div className="rounded-lg border border-dark-border bg-black px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-gray-400">{locale === "ar" ? "النوم" : "Sleep"}</label>
                      <span className="text-xs text-gold-300">{profile.sleepHours || 7}h</span>
                    </div>
                    <input type="range" min={5} max={10} step={0.5} value={profile.sleepHours || 7} onChange={(e) => setProfile((p) => ({ ...p, sleepHours: Number(e.target.value) }))} className="w-full accent-gold-500" />
                  </div>

                  <div className="md:col-span-2 rounded-lg border border-dark-border bg-black px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-gray-400">{t(locale, "profileHeight")} (cm)</label>
                      <span className="text-xs text-gold-300">{Math.round(profile.heightCm)} cm</span>
                    </div>
                    <input type="range" min={HEIGHT_MIN} max={HEIGHT_MAX} step={1} value={Math.round(profile.heightCm)} onChange={(e) => setProfile((p) => ({ ...p, heightCm: clamp(Number(e.target.value), HEIGHT_MIN, HEIGHT_MAX) }))} className="w-full accent-gold-500" />
                  </div>

                  <div className="md:col-span-2 rounded-lg border border-dark-border bg-black px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-gray-400">{t(locale, "profileWeight")} (kg)</label>
                      <span className="text-xs text-gold-300">{Math.round(profile.weightKg)} kg</span>
                    </div>
                    <input type="range" min={WEIGHT_MIN} max={WEIGHT_MAX} step={1} value={Math.round(profile.weightKg)} onChange={(e) => setProfile((p) => ({ ...p, weightKg: clamp(Number(e.target.value), WEIGHT_MIN, WEIGHT_MAX) }))} className="w-full accent-gold-500" />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dark-border bg-black/30 p-4 space-y-3 ux-card-soft">
                <h2 className="text-sm font-heading text-gray-100">{locale === "ar" ? "الحالة الصحية أو المرض المزمن (اختياري)" : "Health Issue / Chronic Condition (Optional)"}</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {HEALTH_OPTIONS.map((option) => (
                    <button key={option.id} type="button" onClick={() => setConditionId(option.id)} className={`px-2 py-2 rounded-lg text-xs border ${conditionId === option.id ? "border-gold-500/50 bg-gold-500/15 text-gold-300" : "border-dark-border text-gray-300"}`}>
                      {locale === "ar" ? option.ar : option.en}
                    </button>
                  ))}
                </div>
                <input value={conditionNote} onChange={(e) => setConditionNote(e.target.value)} placeholder={locale === "ar" ? "وصف مختصر إضافي (اختياري)" : "Extra short note (optional)"} className="w-full bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100" />
              </div>

              {errors.length > 0 && (
                <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm space-y-1">
                  {errors.map((item) => <p key={item}>- {item}</p>)}
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                <button type="button" onClick={handleSaveProfile} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 ux-btn-primary px-6 py-3 uppercase text-xs">
                  <Save className="w-4 h-4" />
                  {t(locale, "profileSaveBtn")}
                </button>
                <button type="button" onClick={() => router.push(returnTo)} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 ux-btn-secondary px-6 py-3 uppercase text-xs">
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                  {t(locale, "profileBackToPlanner")}
                </button>
                <Link href="/" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 ux-btn-ghost px-6 py-3 uppercase text-xs">{t(locale, "backToHome")}</Link>
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-24 h-fit">
              <div className="rounded-xl border border-dark-border bg-black/40 p-4 text-sm ux-card-soft">
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle2 className={`w-4 h-4 ${profileErrors.length === 0 ? "text-green-400" : "text-yellow-400"}`} />
                  <span>{profileErrors.length === 0 ? t(locale, "profileReady") : locale === "ar" ? "الملف غير مكتمل بعد." : "Profile is not complete yet."}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {saveState === "saved"
                    ? locale === "ar"
                      ? "تم الحفظ بنجاح. التحليل الذكي جاهز."
                      : "Saved successfully. Smart analysis is ready."
                    : locale === "ar"
                    ? "اضغط حفظ لتوليد التحليل الذكي."
                    : "Click save to generate smart analysis."}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg border border-dark-border bg-black px-2 py-1.5 text-gray-400">
                    {locale === "ar" ? "صحة البيانات" : "Validation"}: <span className="text-gold-300">{readiness.validationScore}/68</span>
                  </div>
                  <div className="rounded-lg border border-dark-border bg-black px-2 py-1.5 text-gray-400">
                    {locale === "ar" ? "عمق التخصيص" : "Personalization"}: <span className="text-gold-300">{readiness.personalizationScore}/32</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dark-border bg-black/40 p-4 space-y-3 ux-card-soft">
                <div className="flex items-center gap-2 text-gray-100">
                  <Gauge className="w-4 h-4 text-gold-400" />
                  <h3 className="text-sm font-heading">{locale === "ar" ? "تحليل ذكي بعد الحفظ" : "Smart Analysis (After Save)"}</h3>
                </div>

                {!analysisReady ? (
                  <p className="text-xs text-gray-500">
                    {locale === "ar"
                      ? "بعد الضغط على حفظ، سنولّد تحليلًا ذكيًا تلقائيًا من بياناتك (BMI / BMR / TDEE + توصيات عملية)."
                      : "After you click save, we generate a smart analysis from your data (BMI / BMR / TDEE + actionable tips)."}
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-dark-border bg-black p-2"><p className="text-gray-500">BMI</p><p className="text-gray-100">{summary.bmi} ({bmiLabel})</p></div>
                      <div className="rounded-lg border border-dark-border bg-black p-2"><p className="text-gray-500">BMR</p><p className="text-gray-100">{summary.bmr} kcal</p></div>
                      <div className="rounded-lg border border-dark-border bg-black p-2"><p className="text-gray-500">TDEE</p><p className="text-gray-100">{summary.tdee} kcal</p></div>
                      <div className="rounded-lg border border-dark-border bg-black p-2"><p className="text-gray-500">{locale === "ar" ? "النشاط المستنتج" : "Inferred Activity"}</p><p className="text-gray-100">{draftProfile.activityLevel}</p></div>
                    </div>
                    <div className="rounded-lg border border-dark-border bg-black p-3 text-xs text-gray-300 space-y-1">
                      <p>{locale === "ar" ? "السعرات المستهدفة" : "Target calories"}: <span className="text-gold-300">{summary.targetCalories.min}-{summary.targetCalories.max} kcal</span></p>
                      <p>{locale === "ar" ? "البروتين" : "Protein"}: <span className="text-gold-300">{summary.proteinRangeG.min}-{summary.proteinRangeG.max} g/day</span></p>
                      <p>{locale === "ar" ? "الوزن الصحي التقريبي" : "Healthy range"}: <span className="text-gold-300">{summary.healthyWeightRangeKg.min}-{summary.healthyWeightRangeKg.max} kg</span></p>
                    </div>
                    <div className="space-y-1.5">
                      {insightHints.map((hint) => (
                        <p key={hint} className="text-xs text-gray-300 flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" />
                          {hint}
                        </p>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<main className="min-h-screen" />}>
      <ProfilePageContent />
    </Suspense>
  );
}
