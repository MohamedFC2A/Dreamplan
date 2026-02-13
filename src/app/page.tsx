"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { PenLine, Bot, TrendingUp, Droplets, Skull, Zap, Crown, ArrowDown, ChevronDown, ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function Home() {
  const { locale } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), locale }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate protocol");
      }

      const protocol = await res.json();
      if (protocol.error) throw new Error(protocol.error);

      sessionStorage.setItem("ai-protocol", JSON.stringify(protocol));
      router.push("/protocol/ai-generated");
    } catch (err: any) {
      setError(err.message || t(locale, "errorDesc"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/95 to-black z-0" />

        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 flex items-end justify-end z-[1]"
        >
          <div className="relative w-[60%] md:w-[45%] h-[75vh] md:h-[90vh] ltr:mr-[5%] rtl:ml-[5%]" style={{direction: "ltr"}}>
            <Image
              src="/images/ronaldo-nassr.png"
              alt="Cristiano Ronaldo"
              fill
              className="object-contain object-bottom"
              priority
              sizes="(max-width: 768px) 60vw, 45vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-[2]" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-8 py-20">
          <div className="flex items-center min-h-[80vh]">
            <div className="relative z-20 w-full md:w-1/2">
              <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-500/15 border border-gold-500/30">
                <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
                <span className="text-xs text-gold-400 font-bold tracking-wider uppercase">
                  {t(locale, "aiPowered")}
                </span>
              </div>

              {locale === "ar" ? (
                <>
                  <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-wider mb-2 leading-tight">
                    ذروة <span className="text-gold-500">الرجولة</span>
                  </h1>
                  <p className="font-heading text-lg md:text-xl text-gray-500 tracking-widest mb-4">
                    MASCULINE PEAK
                  </p>
                </>
              ) : (
                <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-wider mb-4 leading-tight">
                  MASCULINE <span className="text-gold-500">PEAK</span>
                </h1>
              )}

              <p className="font-heading text-xl md:text-2xl text-gold-400/80 tracking-widest uppercase mb-4">
                {t(locale, "tagline")}
              </p>

              <p className="text-gray-400 text-base md:text-lg mb-8 max-w-lg leading-relaxed">
                {t(locale, "heroDescription")}
              </p>

              <div className="flex items-center gap-6 mb-8">
                {[
                  { value: "7", label: locale === "ar" ? "أيام" : "Days" },
                  { value: "70+", label: locale === "ar" ? "مهمة" : "Tasks" },
                  { value: "AI", label: locale === "ar" ? "مدعوم" : "Powered" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center">
                    <div className="text-center">
                      <div className="font-heading text-2xl md:text-3xl font-bold text-gold-500">{stat.value}</div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                    {i < 2 && <div className="w-1 h-1 rounded-full bg-gold-500/40 ltr:ml-6 rtl:mr-6" />}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => document.getElementById("protocol-form")?.scrollIntoView({ behavior: "smooth" })}
                  className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-heading font-bold tracking-wider px-6 py-3 rounded-xl transition-all uppercase text-sm active:scale-[0.98] shadow-lg shadow-gold-500/20 hover:shadow-gold-500/30"
                >
                  <ArrowDown className="w-4 h-4" />
                  {locale === "ar" ? "ابدأ الآن" : "Start Now"}
                </button>
                <Link
                  href="/plans"
                  className="inline-flex items-center gap-2 border border-gold-500/50 text-gold-400 hover:bg-gold-500/10 font-heading font-bold tracking-wider px-6 py-3 rounded-xl transition-all uppercase text-sm active:scale-[0.98]"
                >
                  <Crown className="w-4 h-4" />
                  {locale === "ar" ? "عرض الخطط" : "View Plans"}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-6 h-6 text-gold-500/50" />
        </motion.div>
      </section>

      <section id="protocol-form" className="relative z-10 px-4 py-16 max-w-5xl mx-auto w-full -mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-dark-card border border-dark-border rounded-2xl p-8 md:p-10 mb-16"
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white text-center mb-2 tracking-wide">
            {locale === "ar" ? "صمم بروتوكولك" : "Design Your Protocol"}
          </h2>
          <p className="text-gray-500 text-center mb-8 text-sm">
            {locale === "ar" ? "صف الجسم الذي تحلم به وسيبني الذكاء الاصطناعي خطتك" : "Describe your dream physique and AI will build your plan"}
          </p>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="flex flex-col gap-3">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(locale, "searchPlaceholder")}
                rows={3}
                className="w-full bg-black border border-dark-border rounded-xl px-5 py-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition-colors resize-none text-base"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="bg-gold-500 hover:bg-gold-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-heading font-bold tracking-wider px-8 py-4 rounded-xl transition-all uppercase text-sm"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                    </svg>
                    {t(locale, "loading")}
                  </span>
                ) : (
                  t(locale, "generateBtn")
                )}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
              >
                {error}
              </motion.div>
            )}
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-200 text-center mb-4 tracking-wide">
            {t(locale, "howItWorks")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 relative">
            <div className="hidden md:block absolute top-7 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
            {[
              { num: "01", title: t(locale, "step1Title"), desc: t(locale, "step1Desc"), icon: <PenLine className="w-6 h-6 text-gold-400" /> },
              { num: "02", title: t(locale, "step2Title"), desc: t(locale, "step2Desc"), icon: <Bot className="w-6 h-6 text-gold-400" /> },
              { num: "03", title: t(locale, "step3Title"), desc: t(locale, "step3Desc"), icon: <TrendingUp className="w-6 h-6 text-gold-400" /> },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-dark-card border border-dark-border rounded-xl p-6 text-center relative z-10"
              >
                <div className="w-14 h-14 rounded-full bg-gold-500/10 flex items-center justify-center mx-auto mb-4">{step.icon}</div>
                <span className="text-gold-500 font-heading text-sm font-bold">{step.num}</span>
                <h3 className="font-heading text-lg font-bold text-gray-100 mt-1 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-200 text-center mb-8 tracking-wide">
            {t(locale, "featuredProtocols")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/protocol/hand-veins" className="group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-gold-500/50 transition-all duration-300 h-full"
              >
                <div className="flex items-start gap-4">
                  <Droplets className="w-8 h-8 text-red-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-xl font-bold text-gray-100 mb-2 tracking-wide">
                      {t(locale, "vascularity")}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      {t(locale, "vascularityDesc")}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[t(locale, "vasodilation"), t(locale, "noBoost"), t(locale, "forearmPump")].map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-gold-500/60 group-hover:text-gold-400 transition-colors text-xs">
                      <span>{locale === "ar" ? "عرض البروتوكول" : "View Protocol"}</span>
                      <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link href="/protocol/ronaldo-neck" className="group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-gold-500/50 transition-all duration-300 h-full"
              >
                <div className="flex items-start gap-4">
                  <Skull className="w-8 h-8 text-gray-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="font-heading text-xl font-bold text-gray-100 mb-2 tracking-wide">
                      {t(locale, "ronaldoNeck")}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      {t(locale, "ronaldoNeckDesc")}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[t(locale, "scmGrowth"), t(locale, "postureFix"), t(locale, "jawline")].map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-gold-500/60 group-hover:text-gold-400 transition-colors text-xs">
                      <span>{locale === "ar" ? "عرض البروتوكول" : "View Protocol"}</span>
                      <ArrowLeft className="w-3 h-3 rtl:rotate-180" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      <section className="px-4 py-12 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="bg-dark-card border border-gold-500/30 rounded-2xl p-8 md:p-10 text-center"
        >
          <Crown className="w-10 h-10 text-gold-500 mx-auto mb-4" />
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide">
            {locale === "ar" ? "اكتشف خطة PRO للوصول غير المحدود" : "Unlock unlimited access with PRO"}
          </h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            {locale === "ar" ? "احصل على بروتوكولات حصرية ودعم متقدم بالذكاء الاصطناعي" : "Get exclusive protocols and advanced AI support"}
          </p>
          <Link
            href="/plans"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-600 text-black font-heading font-bold tracking-wider px-8 py-3 rounded-xl transition-all uppercase text-sm"
          >
            <Crown className="w-4 h-4" />
            {locale === "ar" ? "عرض الخطط" : "View Plans"}
          </Link>
        </motion.div>
      </section>

      <footer className="py-8 border-t border-dark-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <Link href="/" className="font-heading text-sm font-bold text-white tracking-widest">
              MASCULINE <span className="text-gold-500">PEAK</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/" className="text-sm text-gray-500 hover:text-gold-400 transition-colors">
                {locale === "ar" ? "الرئيسية" : "Home"}
              </Link>
              <Link href="/plans" className="text-sm text-gray-500 hover:text-gold-400 transition-colors">
                {locale === "ar" ? "الاشتراكات" : "Plans"}
              </Link>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-gray-600 text-xs flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-gold-400 inline" />
              {locale === "ar"
                ? "مدعوم بالذكاء الاصطناعي DeepSeek — جميع البروتوكولات مبنية على أسس علمية"
                : "Powered by DeepSeek AI — All protocols are scientifically grounded"}
            </p>
            <p className="text-gray-600 text-xs">
              {locale === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"} &copy; {new Date().getFullYear()} Masculine Peak
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
