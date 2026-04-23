import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart, Lightbulb, Target } from 'lucide-react';
import { SITE_BRAND_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Company',
  description: `Mission, vision, and how ${SITE_BRAND_NAME} operates as a remote-first, globally oriented education technology company.`,
  alternates: { canonical: '/startup/company' },
};

export default function StartupCompanyPage() {
  return (
    <main>
      <section className="border-b border-stone-200/80 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
            Company
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-stone-600">
            {SITE_BRAND_NAME} is a focused education technology team building a global discovery layer
            for higher education. We are <strong>remote-first</strong>, <strong>software-led</strong>, and{' '}
            <strong>student-aligned</strong> in how we measure success.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-8">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800">
                <Target className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-stone-900">Mission</h2>
              <p className="mt-3 text-stone-700 leading-relaxed">
                Make high-quality university discovery <strong>accessible, fast, and defensible</strong> for
                any student with an internet connection—regardless of passport, first language, or
                background budget for expensive counseling.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-8">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800">
                <Lightbulb className="h-5 w-5" aria-hidden />
              </div>
              <h2 className="mt-5 text-xl font-extrabold text-stone-900">Vision</h2>
              <p className="mt-3 text-stone-700 leading-relaxed">
                A world where students compare institutions with the same confidence they compare
                flights: <strong>clear parameters</strong>, <strong>transparent trade-offs</strong>, and
                an obvious path to the authoritative place to act next.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-amber-200/70 bg-amber-50/40 p-8">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-200/80 bg-white text-amber-900/90">
              <Heart className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="mt-5 text-xl font-extrabold text-stone-900">Principles we ship against</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-stone-700">
              <li>
                <strong>Global by default</strong> — the product is not a single-market brochure; it is a
                discovery engine.
              </li>
              <li>
                <strong>Verifiability over hype</strong> — we point users to official sources, especially
                where requirements change.
              </li>
              <li>
                <strong>Privacy-aware AI</strong> — we treat AI as an accelerator with clear user
                control and consent where analytics are used.
              </li>
            </ul>
          </div>

          <p className="mt-10 text-sm text-stone-500">
            This page is provided in <strong>English</strong> for global partners, cloud programs, and
            investor diligence. The consumer product supports additional languages in the main app
            experience.
          </p>

          <div className="mt-8">
            <Link
              href="/startup/team"
              className="text-sm font-semibold text-stone-800 underline-offset-2 hover:underline"
            >
              View team →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
