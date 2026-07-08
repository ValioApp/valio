import type { Metadata } from "next";
import { Fraunces, Geist, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Fraunces (variable, óptico) para los titulares editoriales de landing y auth.
// Expuesta como --font-fraunces; la utilidad `.font-serif-display` la consume.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VALIO — Cuánto vale un inmueble. Y por qué.",
  description:
    "Valoración orientativa de inmuebles con testigos de cierre reales, factor de renta por sección censal y ajuste por ocupación. Cada euro, explicado. Para inversores y agencias.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geist.variable} ${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
