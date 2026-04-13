import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/site";

const base = getSiteUrl().replace(/\/$/, "");

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SOSO collects, uses, and protects information when you use soso.uz — cookies, analytics, contact, and your rights.",
  alternates: { canonical: `${base}/privacy` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Privacy Policy | SOSO",
    description: "Privacy Policy for the SOSO university discovery platform.",
    url: `${base}/privacy`,
    siteName: "SOSO",
    type: "website",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
