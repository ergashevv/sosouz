'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface ProfilePanelProps {
  user: {
    firstName: string;
    lastName: string;
    phoneE164: string;
    phoneCountry: string;
  };
}

export default function ProfilePanel({ user }: ProfilePanelProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-black/30 p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="mt-2 text-sm text-neutral-300">Your saved AI chats are linked to this profile.</p>

        <div className="mt-6 space-y-3 text-sm">
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-neutral-400">Name: </span>
            <span className="font-medium">{user.firstName} {user.lastName}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-neutral-400">Phone: </span>
            <span className="font-medium">{user.phoneE164}</span>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <span className="text-neutral-400">Country code: </span>
            <span className="font-medium">{user.phoneCountry}</span>
          </div>
        </div>

        <button
          onClick={() => void handleLogout()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-300/30 bg-red-500/10 hover:bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-200"
        >
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </main>
  );
}
