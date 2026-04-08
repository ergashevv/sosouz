import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cookies } from "next/headers";
import type { Language } from "@/lib/i18n";
import FloatingChatLauncher from "@/components/FloatingChatLauncher";
import JsonLd from "@/components/JsonLd";
import { getSiteUrl } from "@/lib/site";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";

const gtmContainerId = process.env.NEXT_PUBLIC_GTM_ID;
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const analyticsEnabled = Boolean(gtmContainerId || gaMeasurementId);

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
        {analyticsEnabled ? (
          <>
            <Script id="google-consent-default" strategy="beforeInteractive">
              {`window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){dataLayer.push(arguments);};
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',personalization_storage:'denied',security_storage:'granted',wait_for_update:500});`}
            </Script>
            {gtmContainerId ? (
              <Script id="gtm-loader" strategy="afterInteractive">
                {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmContainerId}');`}
              </Script>
            ) : gaMeasurementId ? (
              <>
                <Script
                  id="ga-loader"
                  src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
                  strategy="afterInteractive"
                />
                <Script id="ga-config" strategy="afterInteractive">
                  {`window.gtag('js', new Date());window.gtag('config','${gaMeasurementId}');`}
                </Script>
              </>
            ) : null}
            {gtmContainerId ? (
              <noscript>
                <iframe
                  src={`https://www.googletagmanager.com/ns.html?id=${gtmContainerId}`}
                  height="0"
                  width="0"
                  style={{ display: "none", visibility: "hidden" }}
                  title="Google Tag Manager"
                />
              </noscript>
            ) : null}
          </>
        ) : null}
        <LanguageProvider initialLanguage={initialLanguage}>
          <JsonLd siteUrl={siteUrl} />
          {children}
          <FloatingChatLauncher />
          {analyticsEnabled ? <ConsentBanner /> : null}
        </LanguageProvider>
      </body>
    </html>
  );
}
