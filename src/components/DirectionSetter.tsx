"use client";

import { useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function DirectionSetter() {
  const { locale, isRTL } = useLanguage();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
  }, [locale, isRTL]);

  return null;
}
