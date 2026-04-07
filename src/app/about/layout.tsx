import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn how SOSO aggregates live university data to help students and advisors discover institutions worldwide.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About SOSO",
    description:
      "Mission, data approach, and trust model behind the global university discovery engine.",
    url: "/about",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function AboutLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
