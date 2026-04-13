import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Studio — SOSO",
  description:
    "Indexed shortlists, advisor chat, and catalog search — clear rules, answers you can verify on official sites.",
};

export default function AiStudioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
