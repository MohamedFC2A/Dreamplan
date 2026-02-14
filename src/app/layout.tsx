import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/lib/LanguageContext";
import DirectionSetter from "@/components/DirectionSetter";
import { AuthProvider } from "@/lib/AuthContext";

export const metadata: Metadata = {
  title: "Dreamplan | NEXUS AI Protocol Planner",
  description:
    "Dreamplan builds realistic NEXUS AI-powered transformation protocols with smart duration planning, profile-aware recommendations, and adaptive Q&A. Built by MATANY LABS.",
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
          <AuthProvider>
            <DirectionSetter />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
