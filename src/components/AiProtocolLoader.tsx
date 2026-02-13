"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Protocol } from "@/lib/protocols";
import ProtocolDashboard from "@/components/ProtocolDashboard";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import Link from "next/link";

export default function AiProtocolLoader() {
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [error, setError] = useState(false);
  const { locale } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ai-protocol");
      if (stored) {
        const parsed = JSON.parse(stored);
        setProtocol(parsed);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
  }, []);

  if (error) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="text-5xl mb-6">❌</div>
          <h1 className="font-heading text-3xl font-bold text-gray-100 mb-4">
            {t(locale, "protocolNotFound")}
          </h1>
          <p className="text-gray-500 mb-8">{t(locale, "protocolNotFoundDesc")}</p>
          <Link
            href="/"
            className="bg-cyber-500 hover:bg-cyber-600 text-dark-bg font-heading font-bold tracking-wider px-6 py-3 rounded-xl transition-colors uppercase text-sm"
          >
            {t(locale, "backToHome")}
          </Link>
        </motion.div>
      </main>
    );
  }

  if (!protocol) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-cyber-500/30 border-t-cyber-500 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="font-heading text-xl text-gray-200 mb-2">
            {t(locale, "loading")}
          </h2>
          <p className="text-gray-500 text-sm">{t(locale, "loadingDesc")}</p>
        </motion.div>
      </main>
    );
  }

  return <ProtocolDashboard protocol={protocol} />;
}
