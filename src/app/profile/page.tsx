"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfilePanel from "@/components/ProfilePanel";
import { authFetch } from "@/lib/client-auth";

interface ProfileUser {
  firstName: string;
  lastName: string;
  email: string | null;
  avatarUrl: string | null;
  authProvider: string;
  hasPassword: boolean;
  phoneE164: string;
  phoneCountry: string;
}

interface MePayload {
  authenticated: boolean;
  user?: {
    firstName: string;
    lastName: string;
    email: string | null;
    avatarUrl: string | null;
    authProvider: string;
    hasPassword: boolean;
    phoneE164: string;
    phoneCountry: string;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMe = async () => {
      try {
        const response = await authFetch("/api/auth/me");
        if (!active) return;
        if (!response.ok) {
          router.replace("/login?next=/profile");
          return;
        }
        const payload = (await response.json()) as MePayload;
        if (!payload.authenticated || !payload.user) {
          router.replace("/login?next=/profile");
          return;
        }
        setUser(payload.user);
      } catch {
        if (active) router.replace("/login?next=/profile");
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

  return <ProfilePanel user={user} />;
}
