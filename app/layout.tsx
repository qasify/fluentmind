import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ToastHost from "@/components/ToastHost";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FluentMind AI — Your Intelligent Speaking Coach",
  description:
    "Master English speaking with AI-powered analysis, real-time conversation practice, and personalized curriculum. Replace your human tutor with 24/7 intelligent coaching.",
  keywords: [
    "English speaking",
    "AI tutor",
    "IELTS preparation",
    "vocabulary builder",
    "speech coach",
    "language learning",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        {children}
        <ToastHost />
      </body>
    </html>
  );
}
