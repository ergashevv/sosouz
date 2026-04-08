'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { authFetch } from '@/lib/client-auth';

interface AuthState {
  authenticated: boolean;
}

export default function FloatingChatLauncher() {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({ authenticated: false });

  useEffect(() => {
    let active = true;

    const loadMe = async () => {
      try {
        const response = await authFetch('/api/auth/me');
        if (!active) return;
        if (!response.ok) {
          setAuthState({ authenticated: false });
          return;
        }
        const payload = (await response.json()) as { authenticated: boolean };
        setAuthState({
          authenticated: payload.authenticated,
        });
      } catch {
        if (active) setAuthState({ authenticated: false });
      }
    };

    void loadMe();
    return () => {
      active = false;
    };
  }, [pathname]);

  if (pathname === '/login' || pathname === '/signup' || pathname === '/chat') {
    return null;
  }

  const chatHref = authState.authenticated ? '/chat' : '/login?next=/chat';
  return (
    <div className="fixed bottom-6 right-6 z-60 sm:hidden">
      <Link
        href={chatHref}
        className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-800 shadow-xl hover:shadow-2xl hover:border-neutral-300 transition-all"
        aria-label="Open AI chat"
      >
        <MessageCircle size={22} />
      </Link>
    </div>
  );
}
