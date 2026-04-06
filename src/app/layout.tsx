import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cookies } from "next/headers";
import type { Language } from "@/lib/i18n";
import FloatingChatLauncher from "@/components/FloatingChatLauncher";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SOSO | Global University Discovery Engine",
  description: "Real-time, live-fetched global university search engine for the modern expert.",
};

function coerceLanguage(value: string | undefined): Language {
  if (value === "uz" || value === "ru" || value === "en") return value;
  return "en";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLanguage = coerceLanguage(cookieStore.get("soso_lang")?.value);

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLanguage={initialLanguage}>
          {children}
          <FloatingChatLauncher />
        </LanguageProvider>
      </body>
    </html>
  );
}
