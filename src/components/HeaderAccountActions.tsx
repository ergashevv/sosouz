'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MessageCircle, UserCircle2 } from 'lucide-react';

interface AuthState {
  authenticated: boolean;
  user?: {
    firstName: string;
    lastName: string;
  };
}

export default function HeaderAccountActions() {
  const pathname = usePathname();
  const [authState, setAuthState] = useState<AuthState>({ authenticated: false });

  useEffect(() => {
    let active = true;

    const loadMe = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!active) return;
        if (!response.ok) {
          setAuthState({ authenticated: false });
          return;
        }
        const payload = (await response.json()) as { authenticated: boolean; user?: AuthState['user'] };
        setAuthState({
          authenticated: payload.authenticated,
          user: payload.user,
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

  const chatHref = authState.authenticated ? '/chat' : '/login?next=/chat';
  const profileHref = authState.authenticated ? '/profile' : '/login';
  const initials = authState.user
    ? `${authState.user.firstName?.[0] || ''}${authState.user.lastName?.[0] || ''}`.toUpperCase()
    : null;

  return (
    <div className="flex items-center gap-2">
      <Link
        href={chatHref}
        className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-neutral-700 hover:border-neutral-300 hover:text-black transition-colors"
        aria-label="Open AI chat"
      >
        <MessageCircle size={14} />
        <span>Chat</span>
      </Link>

      <Link
        href={profileHref}
        className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:text-black transition-colors"
        aria-label="Open profile"
      >
        {initials ? <span className="text-[11px] font-black">{initials}</span> : <UserCircle2 size={17} />}
      </Link>
    </div>
  );
}
