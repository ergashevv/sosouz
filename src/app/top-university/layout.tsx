import type { Metadata } from "next";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Top Universities & World Rankings",
  description:
    "Browse leading universities with transparent ranking context: world lists, regional filters, and refreshed snapshots to compare institutions.",
  keywords: [
    "top universities",
    "world university rankings",
    "best universities by country",
    "global higher education rankings",
    "SOSO",
  ],
  robots: { index: true, follow: true },
  alternates: { canonical: "/top-university" },
  openGraph: {
    title: "Top Universities & Rankings | SOSO",
    description:
      "World and country views of top universities with filters and live data context.",
    type: "website",
    url: "/top-university",
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Universities & Rankings | SOSO",
    description:
      "World and country views of top universities with filters and live data context.",
  },
};

export default function TopUniversityLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
