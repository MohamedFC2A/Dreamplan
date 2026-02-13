"use client";

import { useEffect, useState } from "react";
import { Protocol } from "@/lib/protocols";
import ProtocolDashboard from "@/components/ProtocolDashboard";
import { useLanguage } from "@/lib/LanguageContext";
import { t } from "@/lib/i18n";
import { motion } from "framer-motion";
import Link from "next/link";
import { XCircle } from "lucide-react";
import {
  findPrivateProtocolById,
  getLastOpenedPrivateProtocolId,
  getPrivateProtocols,
  openPrivateProtocolEntry,
} from "@/lib/protocol-storage";

export default function AiProtocolLoader() {
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [error, setError] = useState(false);
  const { locale } = useLanguage();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("ai-protocol");
      if (stored) {
        const parsed = JSON.parse(stored);
        setProtocol(parsed);
        return;
      }

      const lastOpenedId = getLastOpenedPrivateProtocolId();
      const fallbackEntry =
        (lastOpenedId ? findPrivateProtocolById(lastOpenedId) : null) || getPrivateProtocols()[0] || null;

      if (fallbackEntry?.protocol) {
        openPrivateProtocolEntry(fallbackEntry);
        setProtocol(fallbackEntry.protocol);
        return;
      }

      setError(true);
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
          <div className="mb-6"><XCircle className="w-16 h-16 text-red-500 mx-auto" /></div>
          <h1 className="font-heading text-3xl font-bold text-gray-100 mb-4">
            {t(locale, "protocolNotFound")}
          </h1>
          <p className="text-gray-500 mb-8">{t(locale, "protocolNotFoundDesc")}</p>
          <Link
            href="/"
            className="bg-gold-500 hover:bg-gold-600 text-black font-heading font-bold tracking-wider px-6 py-3 rounded-xl transition-colors uppercase text-sm"
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
          <div className="w-16 h-16 border-4 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mx-auto mb-6" />
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
