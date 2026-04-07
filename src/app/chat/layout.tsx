import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Chat",
  description: "SOSO assistant workspace.",
  robots: { index: false, follow: false },
};

export default function ChatLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
