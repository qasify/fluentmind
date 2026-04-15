import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
