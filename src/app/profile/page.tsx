"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Save, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { MeasurementUnits, UserProfile } from "@/lib/planner-types";
import {
  createDefaultProfile,
  readStoredProfile,
  saveStoredProfile,
  toDisplayHeight,
  toDisplayWeight,
  validateProfile,
  withConvertedHeight,
  withConvertedWeight,
} from "@/lib/profile-storage";

function ProfilePageContent() {
  const { locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/";

  const [profile, setProfile] = useState<UserProfile>(createDefaultProfile(""));
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = readStoredProfile();
    if (stored) {
      setProfile(stored);
    }
  }, []);

  const profileStatus = useMemo(() => validateProfile(profile, locale), [profile, locale]);

  const saveProfile = () => {
    const validation = validateProfile(profile, locale);
    setErrors(validation);
    if (validation.length > 0) {
      setSaved(false);
      return;
    }
    saveStoredProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <main className="min-h-screen">
      <Navbar />
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dark-border bg-dark-card overflow-hidden"
        >
          <div className="p-6 md:p-8 border-b border-dark-border bg-gradient-to-r from-gold-500/12 via-gold-500/5 to-transparent">
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-white">{t(locale, "profilePageTitle")}</h1>
            <p className="text-sm text-gray-400 mt-2">{t(locale, "profilePageSubtitle")}</p>
          </div>

          <div className="p-6 md:p-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="number"
                value={Number.isFinite(profile.age) ? profile.age : ""}
                onChange={(event) => setProfile((prev) => ({ ...prev, age: Number(event.target.value) }))}
                placeholder={t(locale, "profileAge")}
                className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100"
              />
              <select
                value={profile.sex}
                onChange={(event) => setProfile((prev) => ({ ...prev, sex: event.target.value as UserProfile["sex"] }))}
                className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100"
              >
                <option value="male">{t(locale, "profileSexMale")}</option>
                <option value="female">{t(locale, "profileSexFemale")}</option>
              </select>
              <select
                value={profile.activityLevel}
                onChange={(event) =>
                  setProfile((prev) => ({
                    ...prev,
                    activityLevel: event.target.value as UserProfile["activityLevel"],
                  }))
                }
                className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100"
              >
                <option value="sedentary">{t(locale, "profileActivitySedentary")}</option>
                <option value="light">{t(locale, "profileActivityLight")}</option>
                <option value="moderate">{t(locale, "profileActivityModerate")}</option>
                <option value="active">{t(locale, "profileActivityActive")}</option>
                <option value="athlete">{t(locale, "profileActivityAthlete")}</option>
              </select>
              <select
                value={profile.units}
                onChange={(event) => setProfile((prev) => ({ ...prev, units: event.target.value as MeasurementUnits }))}
                className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100"
              >
                <option value="metric">{locale === "ar" ? "متري" : "Metric"}</option>
                <option value="imperial">{locale === "ar" ? "إمبريالي" : "Imperial"}</option>
              </select>
              <input
                type="number"
                value={toDisplayHeight(profile)}
                onChange={(event) => setProfile((prev) => withConvertedHeight(prev, Number(event.target.value)))}
                placeholder={`${t(locale, "profileHeight")} ${profile.units === "metric" ? "(cm)" : "(in)"}`}
                className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100"
              />
              <input
                type="number"
                value={toDisplayWeight(profile)}
                onChange={(event) => setProfile((prev) => withConvertedWeight(prev, Number(event.target.value)))}
                placeholder={`${t(locale, "profileWeight")} ${profile.units === "metric" ? "(kg)" : "(lb)"}`}
                className="bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100"
              />
            </div>

            <textarea
              rows={3}
              value={profile.injuriesOrConditions}
              onChange={(event) => setProfile((prev) => ({ ...prev, injuriesOrConditions: event.target.value }))}
              placeholder={t(locale, "profileInjuries")}
              className="w-full bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100"
            />
            <textarea
              rows={3}
              value={profile.availableEquipment}
              onChange={(event) => setProfile((prev) => ({ ...prev, availableEquipment: event.target.value }))}
              placeholder={t(locale, "profileEquipment")}
              className="w-full bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100"
            />
            <input
              value={profile.primaryGoal}
              onChange={(event) => setProfile((prev) => ({ ...prev, primaryGoal: event.target.value }))}
              placeholder={locale === "ar" ? "الهدف الأساسي (اختياري)" : "Primary goal (optional)"}
              className="w-full bg-black border border-dark-border rounded-lg px-3 py-2.5 text-gray-100"
            />

            {errors.length > 0 && (
              <div className="p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-300 text-sm space-y-1">
                {errors.map((item) => (
                  <p key={item}>- {item}</p>
                ))}
              </div>
            )}

            <div className="p-3 rounded-lg border border-dark-border bg-black/30">
              <div className="flex items-center gap-2 text-gray-300 text-sm">
                <ShieldCheck className={`w-4 h-4 ${profileStatus.length === 0 ? "text-green-400" : "text-yellow-400"}`} />
                <span>
                  {profileStatus.length === 0
                    ? t(locale, "profileReady")
                    : locale === "ar"
                    ? "الملف غير مكتمل بعد."
                    : "Profile is not complete yet."}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={saveProfile}
                className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-heading font-bold tracking-wider px-6 py-3 rounded-xl uppercase text-xs"
              >
                <Save className="w-4 h-4" />
                {t(locale, "profileSaveBtn")}
              </button>
              <button
                type="button"
                onClick={() => router.push(returnTo)}
                className="inline-flex items-center gap-2 border border-dark-border text-gray-300 hover:border-gold-500/40 px-6 py-3 rounded-xl uppercase text-xs"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {t(locale, "profileBackToPlanner")}
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 border border-dark-border text-gray-400 px-6 py-3 rounded-xl uppercase text-xs"
              >
                {t(locale, "backToHome")}
              </Link>
            </div>

            {saved && (
              <p className="text-green-400 text-sm">{t(locale, "profileSavedOk")}</p>
            )}
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
