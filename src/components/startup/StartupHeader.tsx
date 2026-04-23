'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { Outfit } from 'next/font/google';

const outfit = Outfit({ subsets: ['latin'], weight: ['700', '800'] });

const nav = [
  { href: '/startup', label: 'Home' },
  { href: '/startup/product', label: 'Product' },
  { href: '/startup/company', label: 'Company' },
  { href: '/startup/team', label: 'Team' },
  { href: '/startup/contact', label: 'Contact' },
] as const;

function isActive(pathname: string, href: string) {
  if (href === '/startup') return pathname === '/startup' || pathname === '/startup/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function StartupHeader() {
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/90 backdrop-blur-md supports-backdrop-filter:bg-white/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/startup" className="group flex items-baseline gap-0.5" onClick={() => setOpen(false)}>
          <span
            className={`text-2xl tracking-tight text-stone-900 sm:text-3xl ${outfit.className}`}
          >
            soso
          </span>
          <span className="text-2xl text-stone-500 sm:text-3xl">.</span>
          <span className="sr-only">SOSO — startup</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(pathname, item.href)
                  ? 'rounded-lg bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-900 transition-colors'
                  : 'rounded-lg px-3 py-2 text-sm font-semibold text-stone-500 transition-colors hover:bg-stone-50 hover:text-stone-900'
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/"
            className="text-sm font-semibold text-stone-500 transition-colors hover:text-stone-900"
          >
            Open product
          </Link>
          <Link
            href="/search?country=United%20Kingdom"
            className="inline-flex items-center rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-stone-50 shadow-sm transition hover:bg-stone-800"
          >
            Try search
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/search?country=United%20Kingdom"
            className="rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-stone-50"
          >
            Try search
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="border-t border-stone-100 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={
                  isActive(pathname, item.href)
                    ? 'rounded-xl bg-stone-100 px-3 py-3 text-sm font-semibold text-stone-900'
                    : 'rounded-xl px-3 py-3 text-sm font-semibold text-stone-600'
                }
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl border border-stone-200 px-3 py-3 text-center text-sm font-semibold text-stone-800"
            >
              Open product
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
