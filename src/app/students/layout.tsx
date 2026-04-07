import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "For Students",
  description:
    "Guidance for students using SOSO to explore universities abroad: search, compare, and plan your next step with live institutional data.",
  alternates: { canonical: "/students" },
  openGraph: {
    title: "For Students | SOSO",
    description:
      "How to use SOSO to discover universities, countries, and trustworthy signals for your application journey.",
    url: "/students",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function StudentsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
