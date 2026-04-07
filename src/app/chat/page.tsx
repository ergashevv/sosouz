"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ChatWorkspace from "@/components/ChatWorkspace";
import { authFetch } from "@/lib/client-auth";

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  phoneCountry: string;
}

interface MePayload {
  authenticated: boolean;
  user?: ChatUser;
}

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMe = async () => {
      try {
        const response = await authFetch("/api/auth/me");
        if (!active) return;
        if (!response.ok) {
          router.replace("/login?next=/chat");
          return;
        }
        const payload = (await response.json()) as MePayload;
        if (!payload.authenticated || !payload.user) {
          router.replace("/login?next=/chat");
          return;
        }
        setUser(payload.user);
      } catch {
        if (active) router.replace("/login?next=/chat");
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadMe();
    return () => {
      active = false;
    };
  }, [router]);

  if (loading || !user) {
    return <div className="min-h-screen bg-white" />;
  }

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <ChatWorkspace user={user} />
    </Suspense>
  );
}
