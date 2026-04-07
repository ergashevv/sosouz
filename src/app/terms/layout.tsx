import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for SOSO — acceptable use, data aggregation notice, and platform policies.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | SOSO",
    description: "Legal terms governing use of the SOSO university discovery platform.",
    url: "/terms",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function TermsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
