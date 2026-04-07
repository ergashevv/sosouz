import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Mission, platform features, data practices, and contact options for SOSO — the global university discovery engine.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About SOSO",
    description:
      "What SOSO offers students, how we handle university data, and how to reach our team.",
    url: "/about",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function AboutLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
