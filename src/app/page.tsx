"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";

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
      <LanguageToggle />

      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-500/5 rounded-full blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center max-w-4xl mx-auto relative z-10"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-500/10 border border-cyber-500/20"
          >
            <span className="w-2 h-2 rounded-full bg-cyber-500 animate-pulse" />
            <span className="text-xs text-cyber-400 font-bold tracking-wider uppercase">
              {t(locale, "aiPowered")}
            </span>
          </motion.div>

          {locale === "ar" ? (
            <>
              <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-glow text-cyber-500 tracking-wider mb-2">
                ذروة الرجولة
              </h1>
              <p className="font-heading text-lg md:text-xl text-gray-500 tracking-wide mb-2">
                MASCULINE PEAK
              </p>
            </>
          ) : (
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl font-bold text-glow text-cyber-500 tracking-wider mb-4">
              MASCULINE PEAK
            </h1>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-heading text-xl md:text-2xl text-gray-400 tracking-widest uppercase mb-6"
          >
            {t(locale, "tagline")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-gray-500 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            {t(locale, "heroDescription")}
          </motion.p>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mb-8 max-w-2xl mx-auto"
          >
            <div className="flex flex-col gap-3">
              <div className="relative">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t(locale, "searchPlaceholder")}
                  rows={3}
                  className="w-full bg-dark-card border border-dark-border rounded-xl px-5 py-4 text-gray-100 placeholder-gray-600 focus:outline-none focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500 transition-colors resize-none text-base"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="bg-cyber-500 hover:bg-cyber-600 disabled:opacity-50 disabled:cursor-not-allowed text-dark-bg font-heading font-bold tracking-wider px-8 py-4 rounded-xl transition-all uppercase text-sm animate-pulse-glow"
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
          </motion.form>
        </motion.div>
      </section>

      <section className="px-4 py-16 max-w-5xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-heading text-2xl md:text-3xl font-bold text-gray-200 text-center mb-4 tracking-wide">
            {t(locale, "howItWorks")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { num: "01", title: t(locale, "step1Title"), desc: t(locale, "step1Desc"), icon: "✍️" },
              { num: "02", title: t(locale, "step2Title"), desc: t(locale, "step2Desc"), icon: "🤖" },
              { num: "03", title: t(locale, "step3Title"), desc: t(locale, "step3Desc"), icon: "📈" },
            ].map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-dark-card border border-dark-border rounded-xl p-6 text-center"
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <span className="text-cyber-500 font-heading text-sm font-bold">{step.num}</span>
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
                className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-cyber-500 transition-all duration-300 group-hover:box-glow h-full"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">🩸</span>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-gray-100 mb-2 tracking-wide">
                      {t(locale, "vascularity")}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      {t(locale, "vascularityDesc")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[t(locale, "vasodilation"), t(locale, "noBoost"), t(locale, "forearmPump")].map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-cyber-500/10 text-cyber-400 border border-cyber-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>

            <Link href="/protocol/ronaldo-neck" className="group">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-dark-card border border-dark-border rounded-xl p-6 hover:border-cyber-500 transition-all duration-300 group-hover:box-glow h-full"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">🗿</span>
                  <div>
                    <h3 className="font-heading text-xl font-bold text-gray-100 mb-2 tracking-wide">
                      {t(locale, "ronaldoNeck")}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-4">
                      {t(locale, "ronaldoNeckDesc")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[t(locale, "scmGrowth"), t(locale, "postureFix"), t(locale, "jawline")].map((tag) => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-full bg-cyber-500/10 text-cyber-400 border border-cyber-500/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="py-8 text-center border-t border-dark-border">
        <p className="text-gray-600 text-xs">
          {locale === "ar"
            ? "⚡ مدعوم بالذكاء الاصطناعي DeepSeek — جميع البروتوكولات مبنية على أسس علمية"
            : "⚡ Powered by DeepSeek AI — All protocols are scientifically grounded"}
        </p>
      </footer>
    </main>
  );
}
