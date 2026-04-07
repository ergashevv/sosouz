import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "University Search",
  description:
    "Search real-time global university data by country and keyword. Filter by country, compare institutions, and open official profiles on SOSO.",
  keywords: [
    "university search",
    "global universities",
    "higher education",
    "country university lookup",
    "study abroad finder",
    "SOSO",
  ],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "University Search | SOSO",
    description:
      "Explore and filter live university listings across countries with SOSO search.",
    type: "website",
    url: "/search",
  },
  twitter: {
    card: "summary_large_image",
    title: "University Search | SOSO",
    description:
      "Explore and filter live university listings across countries with SOSO search.",
  },
};

export default function SearchLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
