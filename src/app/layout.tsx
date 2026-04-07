import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cookies } from "next/headers";
import type { Language } from "@/lib/i18n";
import FloatingChatLauncher from "@/components/FloatingChatLauncher";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SOSO | Global University Discovery Engine",
    template: "%s | SOSO",
  },
  description:
    "Search universities worldwide with live data: countries, rankings context, programs, and official links. Built for students, advisors, and researchers.",
  applicationName: "SOSO",
  keywords: [
    "university search",
    "study abroad",
    "global universities",
    "higher education",
    "college finder",
    "world university rankings",
  ],
  authors: [{ name: "SOSO" }],
  creator: "SOSO",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "SOSO",
    title: "SOSO | Global University Discovery Engine",
    description:
      "Real-time global university search, filters by country, and trustworthy institutional signals in one place.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SOSO | Global University Discovery Engine",
    description:
      "Real-time global university search, filters by country, and trustworthy institutional signals in one place.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
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
          <JsonLd siteUrl={siteUrl} />
          {children}
          <FloatingChatLauncher />
        </LanguageProvider>
      </body>
    </html>
  );
}
