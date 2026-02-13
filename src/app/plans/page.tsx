"use client";

import { useLanguage } from "@/lib/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import { Crown, Check, X, Zap, Shield, ArrowRight, ArrowLeft, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const content = {
  ar: {
    backToHome: "العودة للرئيسية",
    title: "الاشتراكات",
    subtitle: "اختر الخطة المناسبة لرحلة تحولك",
    free: "مجاني",
    freePlan: "الخطة المجانية",
    pro: "PRO",
    proPlan: "الخطة الاحترافية",
    proPrice: "$9.99/شهرياً",
    mostPopular: "الأكثر شعبية",
    startFree: "ابدأ مجاناً",
    subscribeNow: "اشترك الآن",
    faqTitle: "الأسئلة الشائعة",
    freeFeatures: [
      { included: true, text: "بروتوكولان مميزان" },
      { included: true, text: "تتبع المهام الأساسي" },
      { included: true, text: "خطط 7 أيام" },
      { included: false, text: "بروتوكولات الذكاء الاصطناعي" },
      { included: false, text: "الاستشهادات العلمية" },
      { included: false, text: "أدلة فيديو التمارين" },
      { included: false, text: "الدعم ذو الأولوية" },
    ],
    proFeatures: [
      { text: "كل ما في الخطة المجانية" },
      { text: "بروتوكولات ذكاء اصطناعي غير محدودة" },
      { text: "استشهادات علمية كاملة مع PMID" },
      { text: "أدلة فيديو التمارين" },
      { text: "تتبع تقدم متقدم" },
      { text: "مدة بروتوكول مخصصة" },
      { text: "دعم ذو أولوية" },
    ],
    faqs: [
      {
        q: "هل يمكنني الترقية في أي وقت؟",
        a: "نعم، يمكنك الترقية من الخطة المجانية إلى الخطة الاحترافية في أي وقت. سيتم تطبيق التغييرات فوراً.",
      },
      {
        q: "هل يمكنني إلغاء اشتراكي؟",
        a: "بالطبع. يمكنك إلغاء اشتراكك في أي وقت من إعدادات حسابك دون أي رسوم إضافية.",
      },
      {
        q: "ما هي طرق الدفع المتاحة؟",
        a: "نقبل بطاقات الائتمان الرئيسية (Visa, Mastercard, AMEX) وApple Pay وGoogle Pay.",
      },
      {
        q: "هل البروتوكولات مبنية على أسس علمية؟",
        a: "نعم، جميع البروتوكولات مدعومة بأبحاث علمية محكّمة مع استشهادات PMID في الخطة الاحترافية.",
      },
    ],
  },
  en: {
    backToHome: "Back to Home",
    title: "Plans",
    subtitle: "Choose the right plan for your transformation journey",
    free: "Free",
    freePlan: "Free Plan",
    pro: "PRO",
    proPlan: "Pro Plan",
    proPrice: "$9.99/month",
    mostPopular: "Most Popular",
    startFree: "Start Free",
    subscribeNow: "Subscribe Now",
    faqTitle: "Frequently Asked Questions",
    freeFeatures: [
      { included: true, text: "2 featured protocols" },
      { included: true, text: "Basic task tracking" },
      { included: true, text: "7-day plans" },
      { included: false, text: "AI-generated protocols" },
      { included: false, text: "Science citations" },
      { included: false, text: "Exercise video guides" },
      { included: false, text: "Priority support" },
    ],
    proFeatures: [
      { text: "Everything in Free" },
      { text: "Unlimited AI-generated protocols" },
      { text: "Full science citations with PMID" },
      { text: "Exercise video guides" },
      { text: "Advanced progress tracking" },
      { text: "Custom protocol duration" },
      { text: "Priority support" },
    ],
    faqs: [
      {
        q: "Can I upgrade at any time?",
        a: "Yes, you can upgrade from the Free plan to Pro at any time. Changes take effect immediately.",
      },
      {
        q: "Can I cancel my subscription?",
        a: "Absolutely. You can cancel your subscription at any time from your account settings with no extra fees.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept major credit cards (Visa, Mastercard, AMEX), Apple Pay, and Google Pay.",
      },
      {
        q: "Are the protocols science-based?",
        a: "Yes, all protocols are backed by peer-reviewed research with PMID citations available on the Pro plan.",
      },
    ],
  },
};

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-dark-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-start hover:bg-dark-card transition-colors"
      >
        <span className="font-heading text-white text-sm md:text-base">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-gold-400 shrink-0 ms-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-5 text-neutral-400 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function PlansPage() {
  const { locale, isRTL } = useLanguage();
  const t = content[locale];
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-dark-bg">
      <LanguageToggle />

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gold-400 hover:text-gold-300 transition-colors text-sm mb-10"
        >
          <BackArrow className="w-4 h-4" />
          <span>{t.backToHome}</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="font-heading text-3xl md:text-4xl text-white mb-3">
            {t.title}
          </h1>
          <p className="text-neutral-400 text-base md:text-lg max-w-xl mx-auto">
            {t.subtitle}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-dark-card border border-dark-border rounded-2xl p-6 md:p-8 flex flex-col"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center">
                <Shield className="w-5 h-5 text-neutral-400" />
              </div>
              <div>
                <h2 className="font-heading text-white text-lg">{t.freePlan}</h2>
              </div>
            </div>

            <div className="mb-8">
              <span className="font-heading text-3xl text-white">{t.free}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {t.freeFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-gold-500 shrink-0" />
                  ) : (
                    <X className="w-5 h-5 text-neutral-600 shrink-0" />
                  )}
                  <span className={feature.included ? "text-neutral-300 text-sm" : "text-neutral-600 text-sm"}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <button className="w-full py-3 rounded-lg border border-gold-500 text-gold-500 font-heading text-sm hover:bg-gold-500/10 transition-colors">
              {t.startFree}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-dark-card border-2 border-gold-500 rounded-2xl p-6 md:p-8 flex flex-col relative"
          >
            <div className="absolute -top-3 start-1/2 -translate-x-1/2 rtl:translate-x-1/2 bg-gold-500 text-black text-xs font-heading px-4 py-1 rounded-full">
              {t.mostPopular}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gold-500/10 flex items-center justify-center">
                <Crown className="w-5 h-5 text-gold-500" />
              </div>
              <div>
                <h2 className="font-heading text-white text-lg">{t.proPlan}</h2>
              </div>
            </div>

            <div className="mb-8">
              <span className="font-heading text-3xl text-gold-500">{t.proPrice}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {t.proFeatures.map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-gold-500 shrink-0" />
                  <span className="text-neutral-300 text-sm">{feature.text}</span>
                </li>
              ))}
            </ul>

            <button className="w-full py-3 rounded-lg bg-gold-500 text-black font-heading text-sm hover:bg-gold-400 transition-colors">
              {t.subscribeNow}
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="font-heading text-2xl text-white text-center mb-8">
            {t.faqTitle}
          </h2>
          <div className="max-w-2xl mx-auto space-y-3">
            {t.faqs.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
