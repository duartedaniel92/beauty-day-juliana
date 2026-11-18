import type { Metadata } from "next";
import { Oswald, Manrope } from "next/font/google";
import "./globals.css";
import { connection } from 'next/server';

const brand = Oswald({
  variable: "--font-brand",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beauty Day Juliana",
  description: "Agende seu horário com a Juliana — corte, coloração, escova e manicure.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // O nonce da CSP é específico da requisição, não de uma página estática compartilhada.
  await connection();
  return (
    <html lang="pt-BR" className={`${brand.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
