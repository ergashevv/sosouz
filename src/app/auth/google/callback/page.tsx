"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthToken } from "@/lib/client-auth";

function coerceRelativePath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/profile";
  }
  return value;
}

export default function GoogleAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams?.get("token") || "";
    const next = coerceRelativePath(searchParams?.get("next") || "/profile");
    if (!token) {
      router.replace("/login?error=google_token_missing");
      return;
    }
    setAuthToken(token);
    router.replace(next);
    router.refresh();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-neutral-600">
      Completing Google sign-in...
    </div>
  );
}
