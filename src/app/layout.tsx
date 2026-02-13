import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import DirectionSetter from "@/components/DirectionSetter";

export const metadata: Metadata = {
  title: "Masculine Peak | ذروة الرجولة - بروتوكول التحول في 7 أيام",
  description: "بروتوكولات بيو-هاكينج مدعومة بالذكاء الاصطناعي مصممة لتحقيق أقصى تحول جسدي. AI-powered bio-hacking protocols for peak physique transformation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <body className="font-body bg-dark-bg min-h-screen antialiased" suppressHydrationWarning>
        <LanguageProvider>
          <DirectionSetter />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
