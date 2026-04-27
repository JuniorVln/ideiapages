import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Ideia Chat — Atendimento WhatsApp Profissional",
    template: "%s | Ideia Chat",
  },
  description:
    "Atendimento via WhatsApp para empresas com múltiplos atendentes, IA e API Oficial Meta. +400 empresas confiam.",
  robots: { index: true, follow: true },
};

const GA4_ID =
  process.env.NEXT_PUBLIC_GA4_ID ?? process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
const IS_PROD = process.env.NEXT_PUBLIC_ENV === "production";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-text antialiased font-sans">
        {children}
        {IS_PROD && GA4_ID && <GoogleAnalytics gaId={GA4_ID} />}
      </body>
    </html>
  );
}
