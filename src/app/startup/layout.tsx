import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import StartupPageShell from '@/components/startup/StartupPageShell';
import { getSiteUrl, SITE_BRAND_NAME } from '@/lib/site';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: {
    default: `Company & product | ${SITE_BRAND_NAME}`,
    template: `%s | ${SITE_BRAND_NAME}`,
  },
  description:
    `${SITE_BRAND_NAME} is a global, digital-native education technology company. We help students worldwide discover and compare universities with transparent data, rankings context, and AI-assisted guidance. Public company site in English.`,
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/startup',
    siteName: SITE_BRAND_NAME,
    title: `${SITE_BRAND_NAME} | Global edtech & university discovery`,
    description:
      'A remote-first team building a global university discovery engine with AI matchmaking and verifiable official sources.',
  },
  robots: { index: true, follow: true },
};

export default function StartupLayout({ children }: { children: ReactNode }) {
  return <StartupPageShell>{children}</StartupPageShell>;
}
