import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your SOSO profile.",
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
