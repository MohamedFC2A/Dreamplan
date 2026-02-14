"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Gauge, LogIn, LogOut, Save, UserCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { useAuth } from "@/lib/AuthContext";
import { MeasurementUnits, UserProfile } from "@/lib/planner-types";
import {
  classifyGoal,
  createDefaultProfile,
  getMetabolicSummary,
  readStoredProfile,
  saveStoredProfile,
  toDisplayHeight,
  toDisplayWeight,
  validateProfile,
  withConvertedHeight,
  withConvertedWeight,
} from "@/lib/profile-storage";

type GoalPreset = "fat_loss" | "muscle_gain" | "definition" | "custom";
type InjuryPreset = "none" | "knee" | "back" | "shoulder" | "custom";
type EquipmentPreset = "bodyweight" | "dumbbells" | "bands" | "full_gym" | "custom";

const GOAL_VALUES: Record<Exclude<GoalPreset, "custom">, string> = {
  fat_loss: "fat loss with visible definition",
  muscle_gain: "muscle gain and shape",
  definition: "lean aesthetic definition",
};

const INJURY_VALUES: Record<Exclude<InjuryPreset, "custom">, string> = {
  none: "none",
  knee: "knee sensitivity",
  back: "lower-back sensitivity",
  shoulder: "shoulder sensitivity",
};

const EQUIPMENT_VALUES: Record<Exclude<EquipmentPreset, "custom">, string> = {
  bodyweight: "bodyweight only",
  dumbbells: "dumbbells",
  bands: "resistance bands",
  full_gym: "full gym access",
};

function parseNumber(value: string): number {
  if (!value.trim()) return Number.NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : Number.NaN;
}

function parsePresetAndNote(raw: string): { base: string; note: string } {
  const [base, ...rest] = raw.split("|");
  return { base: base.trim().toLowerCase(), note: rest.join("|").trim() };
}

function ProfilePageContent() {
  const { locale } = useLanguage();
  const { user, isConfigured, isLoading: authLoading, signInWithGoogle, signOut } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const [profile, setProfile] = useState<UserProfile>(createDefaultProfile(""));
  const [goalPreset, setGoalPreset] = useState<GoalPreset>("definition");
  const [goalNote, setGoalNote] = useState("");
  const [injuryPreset, setInjuryPreset] = useState<InjuryPreset>("none");
  const [injuryNote, setInjuryNote] = useState("");
  const [equipmentPreset, setEquipmentPreset] = useState<EquipmentPreset>("bodyweight");
  const [equipmentNote, setEquipmentNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [authError, setAuthError] = useState("");
  const initializedRef = useRef(false);

  useEffect(() => {
    const stored = readStoredProfile();
    if (stored) {
      setProfile(stored);
      const goal = stored.primaryGoal.toLowerCase();
      if (goal.includes("fat") || goal.includes("تنشيف")) setGoalPreset("fat_loss");
      else if (goal.includes("muscle") || goal.includes("تضخيم")) setGoalPreset("muscle_gain");
      else if (goal.includes("|")) {
        setGoalPreset("custom");
        setGoalNote(stored.primaryGoal);
      }

      const injuryParts = parsePresetAndNote(stored.injuriesOrConditions || "none");
      if (injuryParts.base.includes("knee")) setInjuryPreset("knee");
      else if (injuryParts.base.includes("back")) setInjuryPreset("back");
      else if (injuryParts.base.includes("shoulder")) setInjuryPreset("shoulder");
      else if (injuryParts.base === "none") setInjuryPreset("none");
      else setInjuryPreset("custom");
      setInjuryNote(injuryParts.note);

      const equipmentParts = parsePresetAndNote(stored.availableEquipment || "bodyweight");
      if (equipmentParts.base.includes("dumbbell")) setEquipmentPreset("dumbbells");
      else if (equipmentParts.base.includes("band")) setEquipmentPreset("bands");
      else if (equipmentParts.base.includes("gym")) setEquipmentPreset("full_gym");
      else if (equipmentParts.base.includes("bodyweight")) setEquipmentPreset("bodyweight");
      else setEquipmentPreset("custom");
      setEquipmentNote(equipmentParts.note);
    }
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (!initializedRef.current) return;
    const timer = setTimeout(() => {
      setSaveState("saving");
      saveStoredProfile(profile);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1200);
    }, 350);
    return () => clearTimeout(timer);
  }, [profile]);

  useEffect(() => {
    const base = goalPreset === "custom" ? "" : GOAL_VALUES[goalPreset];
    const value = goalNote.trim() ? (base ? `${base} | ${goalNote.trim()}` : goalNote.trim()) : base;
    setProfile((prev) => ({ ...prev, primaryGoal: value }));
  }, [goalNote, goalPreset]);

  useEffect(() => {
    const base = injuryPreset === "custom" ? "" : INJURY_VALUES[injuryPreset];
    const value = injuryNote.trim() ? (base ? `${base} | ${injuryNote.trim()}` : injuryNote.trim()) : base || "none";
    setProfile((prev) => ({ ...prev, injuriesOrConditions: value }));
  }, [injuryNote, injuryPreset]);

  useEffect(() => {
    const base = equipmentPreset === "custom" ? "" : EQUIPMENT_VALUES[equipmentPreset];
    const value = equipmentNote.trim()
      ? base
        ? `${base} | ${equipmentNote.trim()}`
        : equipmentNote.trim()
      : base || "bodyweight";
    setProfile((prev) => ({ ...prev, availableEquipment: value }));
  }, [equipmentNote, equipmentPreset]);

  const profileErrors = useMemo(() => validateProfile(profile, locale), [profile, locale]);
  const completion = Math.max(0, Math.min(100, Math.round(((7 - profileErrors.length) / 7) * 100)));
  const metabolism = useMemo(() => getMetabolicSummary(profile), [profile]);
  const goalType = classifyGoal(profile.primaryGoal || "");

  const bmiLabel =
    metabolism.bmiCategory === "underweight"
      ? locale === "ar"
        ? "نحافة"
        : "Underweight"
      : metabolism.bmiCategory === "normal"
      ? locale === "ar"
        ? "طبيعي"
        : "Normal"
      : metabolism.bmiCategory === "overweight"
      ? locale === "ar"
        ? "وزن زائد"
        : "Overweight"
      : locale === "ar"
      ? "سمنة"
      : "Obesity";

  const hints = useMemo(() => {
    const out: string[] = [];
    if (goalType === "fat_loss") out.push(locale === "ar" ? "عجز حراري محافظ أفضل من الحِرمان الشديد." : "A conservative deficit beats aggressive restriction.");
    if (goalType === "muscle_gain") out.push(locale === "ar" ? "زد السعرات تدريجيًا وركز على التمرين المركب." : "Increase calories gradually and focus on compound training.");
    if ((profile.sleepHours || 7) < 7) out.push(locale === "ar" ? "النوم أقل من 7 ساعات يبطئ التعافي." : "Sleep below 7 hours slows recovery.");
    if (out.length === 0) out.push(locale === "ar" ? "بياناتك جيدة لبدء خطة متوازنة عالية الالتزام." : "Your data supports a balanced high-adherence plan.");
    return out;
  }, [goalType, locale, profile.sleepHours]);

  const saveNow = () => {
    const validation = validateProfile(profile, locale);
    setErrors(validation);
    if (validation.length > 0) return;
    saveStoredProfile(profile);
    setSaveState("saved");
  };

  const handleSignIn = async () => {
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
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-14 space-y-5">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-dark-border bg-dark-card overflow-hidden">
          <div className="p-6 border-b border-dark-border bg-gradient-to-r from-gold-500/10 via-gold-500/5 to-transparent">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="font-heading text-2xl font-bold text-white">{t(locale, "profilePageTitle")}</h1>
                <p className="text-sm text-gray-400 mt-1">{t(locale, "profilePageSubtitle")}</p>
              </div>
              <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 px-4 py-2">
                <p className="text-[11px] uppercase text-gold-400">{locale === "ar" ? "جاهزية الملف" : "Readiness"}</p>
                <p className="font-heading text-2xl text-white">{completion}%</p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-dark-border bg-black/30 p-4 space-y-3">
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
                  <button type="button" onClick={handleSignIn} className="inline-flex items-center gap-2 border border-gold-500/40 bg-gold-500/10 text-gold-300 px-4 py-2 rounded-lg text-sm">
                    <LogIn className="w-4 h-4" />
                    {locale === "ar" ? "Google تسجيل الدخول" : "Continue with Google"}
                  </button>
                )}
                {authError && <p className="text-xs text-red-300">{authError}</p>}
              </div>

              <div className="rounded-xl border border-dark-border bg-black/30 p-4 space-y-3">
                <h2 className="text-sm font-heading text-gray-100">{locale === "ar" ? "إعداد الهدف" : "Goal Setup"}</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { id: "fat_loss", ar: "تنشيف", en: "Fat Loss" },
                    { id: "muscle_gain", ar: "تضخيم", en: "Muscle Gain" },
                    { id: "definition", ar: "تعريف عضلي", en: "Definition" },
                    { id: "custom", ar: "مخصص", en: "Custom" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setGoalPreset(item.id as GoalPreset)}
                      className={`px-3 py-2 rounded-lg text-xs border ${
                        goalPreset === item.id ? "border-gold-500/50 bg-gold-500/15 text-gold-300" : "border-dark-border text-gray-300"
                      }`}
                    >
                      {locale === "ar" ? item.ar : item.en}
                    </button>
                  ))}
                </div>
                <input value={goalNote} onChange={(e) => setGoalNote(e.target.value)} placeholder={locale === "ar" ? "تفصيل اختياري" : "Optional detail"} className="w-full bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100" />
              </div>

              <div className="rounded-xl border border-dark-border bg-black/30 p-4 space-y-3">
                <h2 className="text-sm font-heading text-gray-100">{locale === "ar" ? "البيانات الأساسية" : "Core Data"}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input type="number" value={Number.isFinite(profile.age) ? profile.age : ""} onChange={(e) => setProfile((p) => ({ ...p, age: parseNumber(e.target.value) }))} placeholder={t(locale, "profileAge")} className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100" />
                  <select value={profile.activityLevel} onChange={(e) => setProfile((p) => ({ ...p, activityLevel: e.target.value as UserProfile["activityLevel"] }))} className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100">
                    <option value="sedentary">{t(locale, "profileActivitySedentary")}</option>
                    <option value="light">{t(locale, "profileActivityLight")}</option>
                    <option value="moderate">{t(locale, "profileActivityModerate")}</option>
                    <option value="active">{t(locale, "profileActivityActive")}</option>
                    <option value="athlete">{t(locale, "profileActivityAthlete")}</option>
                  </select>
                  <select value={profile.units} onChange={(e) => setProfile((p) => ({ ...p, units: e.target.value as MeasurementUnits }))} className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100">
                    <option value="metric">Metric</option>
                    <option value="imperial">Imperial</option>
                  </select>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setProfile((p) => ({ ...p, sex: "male" }))} className={`rounded-lg py-2 border text-xs ${profile.sex === "male" ? "border-gold-500/50 bg-gold-500/15 text-gold-300" : "border-dark-border text-gray-300"}`}>{t(locale, "profileSexMale")}</button>
                    <button type="button" onClick={() => setProfile((p) => ({ ...p, sex: "female" }))} className={`rounded-lg py-2 border text-xs ${profile.sex === "female" ? "border-gold-500/50 bg-gold-500/15 text-gold-300" : "border-dark-border text-gray-300"}`}>{t(locale, "profileSexFemale")}</button>
                  </div>
                  <input type="number" value={Number.isFinite(toDisplayHeight(profile)) ? Number(toDisplayHeight(profile).toFixed(1)) : ""} onChange={(e) => setProfile((p) => withConvertedHeight(p, parseNumber(e.target.value)))} placeholder={`${t(locale, "profileHeight")} ${profile.units === "metric" ? "(cm)" : "(in)"}`} className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100" />
                  <input type="number" value={Number.isFinite(toDisplayWeight(profile)) ? Number(toDisplayWeight(profile).toFixed(1)) : ""} onChange={(e) => setProfile((p) => withConvertedWeight(p, parseNumber(e.target.value)))} placeholder={`${t(locale, "profileWeight")} ${profile.units === "metric" ? "(kg)" : "(lb)"}`} className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-400"><span>{locale === "ar" ? "النوم" : "Sleep"}</span><span>{profile.sleepHours || 7}h</span></div>
                  <input type="range" min={4} max={10} step={0.5} value={profile.sleepHours || 7} onChange={(e) => setProfile((p) => ({ ...p, sleepHours: Number(e.target.value) }))} className="w-full accent-gold-500" />
                </div>
              </div>

              <div className="rounded-xl border border-dark-border bg-black/30 p-4 space-y-3">
                <h2 className="text-sm font-heading text-gray-100">{locale === "ar" ? "الحالة الصحية والمعدات" : "Safety & Equipment"}</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { id: "none", ar: "لا يوجد", en: "None" },
                    { id: "knee", ar: "ركبة", en: "Knee" },
                    { id: "back", ar: "ظهر", en: "Back" },
                    { id: "shoulder", ar: "كتف", en: "Shoulder" },
                    { id: "custom", ar: "مخصص", en: "Custom" },
                  ].map((item) => (
                    <button key={item.id} type="button" onClick={() => setInjuryPreset(item.id as InjuryPreset)} className={`px-2 py-2 rounded-lg text-xs border ${injuryPreset === item.id ? "border-gold-500/50 bg-gold-500/15 text-gold-300" : "border-dark-border text-gray-300"}`}>{locale === "ar" ? item.ar : item.en}</button>
                  ))}
                </div>
                <input value={injuryNote} onChange={(e) => setInjuryNote(e.target.value)} placeholder={locale === "ar" ? "ملاحظة صحية اختيارية" : "Optional safety note"} className="w-full bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { id: "bodyweight", ar: "وزن الجسم", en: "Bodyweight" },
                    { id: "dumbbells", ar: "دمبل", en: "Dumbbells" },
                    { id: "bands", ar: "مطاط", en: "Bands" },
                    { id: "full_gym", ar: "جيم كامل", en: "Full Gym" },
                    { id: "custom", ar: "مخصص", en: "Custom" },
                  ].map((item) => (
                    <button key={item.id} type="button" onClick={() => setEquipmentPreset(item.id as EquipmentPreset)} className={`px-2 py-2 rounded-lg text-xs border ${equipmentPreset === item.id ? "border-gold-500/50 bg-gold-500/15 text-gold-300" : "border-dark-border text-gray-300"}`}>{locale === "ar" ? item.ar : item.en}</button>
                  ))}
                </div>
                <input value={equipmentNote} onChange={(e) => setEquipmentNote(e.target.value)} placeholder={locale === "ar" ? "تفصيل المعدات (اختياري)" : "Equipment detail (optional)"} className="w-full bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100" />
              </div>

              {errors.length > 0 && (
                <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm space-y-1">
                  {errors.map((item) => <p key={item}>- {item}</p>)}
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={saveNow} className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-heading font-bold tracking-wider px-6 py-3 rounded-xl uppercase text-xs">
                  <Save className="w-4 h-4" />
                  {t(locale, "profileSaveBtn")}
                </button>
                <button type="button" onClick={() => router.push(returnTo)} className="inline-flex items-center gap-2 border border-dark-border text-gray-300 hover:border-gold-500/40 px-6 py-3 rounded-xl uppercase text-xs">
                  <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                  {t(locale, "profileBackToPlanner")}
                </button>
                <Link href="/" className="inline-flex items-center gap-2 border border-dark-border text-gray-400 px-6 py-3 rounded-xl uppercase text-xs">{t(locale, "backToHome")}</Link>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-dark-border bg-black/40 p-4 text-sm">
                <div className="flex items-center gap-2 text-gray-200">
                  <CheckCircle2 className={`w-4 h-4 ${profileErrors.length === 0 ? "text-green-400" : "text-yellow-400"}`} />
                  <span>{profileErrors.length === 0 ? t(locale, "profileReady") : locale === "ar" ? "الملف غير مكتمل بعد." : "Profile is not complete yet."}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">{saveState === "saving" ? (locale === "ar" ? "يتم الحفظ..." : "Saving...") : saveState === "saved" ? (locale === "ar" ? "تم الحفظ محليًا." : "Saved locally.") : locale === "ar" ? "الحفظ التلقائي مفعل." : "Autosave enabled."}</p>
              </div>

              <div className="rounded-xl border border-dark-border bg-black/40 p-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-100">
                  <Gauge className="w-4 h-4 text-gold-400" />
                  <h3 className="text-sm font-heading">{locale === "ar" ? "تحليل ذكي" : "Smart Insights"}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-dark-border bg-black p-2"><p className="text-gray-500">BMI</p><p className="text-gray-100">{metabolism.bmi} ({bmiLabel})</p></div>
                  <div className="rounded-lg border border-dark-border bg-black p-2"><p className="text-gray-500">BMR</p><p className="text-gray-100">{metabolism.bmr} kcal</p></div>
                  <div className="rounded-lg border border-dark-border bg-black p-2"><p className="text-gray-500">TDEE</p><p className="text-gray-100">{metabolism.tdee} kcal</p></div>
                  <div className="rounded-lg border border-dark-border bg-black p-2"><p className="text-gray-500">{locale === "ar" ? "الماء" : "Water"}</p><p className="text-gray-100">{metabolism.hydrationMl} ml</p></div>
                </div>
                <div className="rounded-lg border border-dark-border bg-black p-3 text-xs text-gray-300 space-y-1">
                  <p>{locale === "ar" ? "السعرات المستهدفة" : "Target calories"}: <span className="text-gold-300">{metabolism.targetCalories.min}-{metabolism.targetCalories.max} kcal</span></p>
                  <p>{locale === "ar" ? "البروتين" : "Protein"}: <span className="text-gold-300">{metabolism.proteinRangeG.min}-{metabolism.proteinRangeG.max} g/day</span></p>
                  <p>{locale === "ar" ? "الوزن الصحي التقريبي" : "Healthy range"}: <span className="text-gold-300">{metabolism.healthyWeightRangeKg.min}-{metabolism.healthyWeightRangeKg.max} kg</span></p>
                </div>
                <div className="space-y-1.5">
                  {hints.map((hint) => (
                    <p key={hint} className="text-xs text-gray-300 flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold-400 mt-0.5 shrink-0" />
                      {hint}
                    </p>
                  ))}
                </div>
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
