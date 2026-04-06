import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "University Search",
  description:
    "Search real-time global university data by country and keyword with SOSO.",
  keywords: [
    "university search",
    "global universities",
    "higher education",
    "country university lookup",
    "SOSO",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "University Search | SOSO",
    description:
      "Explore and filter live university listings across countries with SOSO search.",
    type: "website",
  },
  twitter: {
    card: "summary",
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
