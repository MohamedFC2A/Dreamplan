import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Masculine Peak | 7-Day Transformation Protocol",
  description: "Science-backed bio-hacking protocols for peak masculine physique transformation. Generate your personalized 7-day protocol.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-body bg-dark-bg min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
