import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ideiamultichat.com.br"),
  title: {
    default: "Ideia Chat — Atendimento WhatsApp Profissional",
    template: "%s | Ideia Chat",
  },
  description:
    "Atendimento via WhatsApp para empresas com múltiplos atendentes, IA e API Oficial Meta. +400 empresas confiam.",
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-screen bg-surface text-text antialiased">{children}</body>
    </html>
  );
}
