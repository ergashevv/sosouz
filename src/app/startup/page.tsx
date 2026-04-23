import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe2, Sparkles } from 'lucide-react';
import { Outfit } from 'next/font/google';
import { SITE_BRAND_NAME } from '@/lib/site';

const outfit = Outfit({ subsets: ['latin'], weight: ['600', '700', '800'] });

export const metadata: Metadata = {
  title: 'Home',
  description: `${SITE_BRAND_NAME} helps students and advisors worldwide navigate higher education with fast search, verifiable data, and AI shortlists.`,
  alternates: { canonical: '/startup' },
};

export default function StartupHomePage() {
  return (
    <main>
      <section className="relative overflow-hidden border-b border-stone-200/80">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(28,25,23,0.08),transparent)]"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-stone-500 sm:text-sm">
            Global · Digital-native · Student-first
          </p>
          <h1
            className={`mt-4 max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl ${outfit.className}`}
          >
            The open discovery layer for studying abroad
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-600 sm:text-xl">
            {SITE_BRAND_NAME} is a global edtech product that unifies search, context, and next-step
            guidance so students can move from exploration to a confident shortlist without drowning in
            fragmented tabs and outdated blog posts.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/startup/product"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800"
            >
              Explore the product
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/startup/team"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-stone-400"
            >
              Meet the team
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200/80 bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            Problem, solution, and value
          </h2>
          <div className="mt-10 grid gap-8 lg:grid-cols-3">
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">Problem</h3>
              <p className="mt-3 text-stone-700 leading-relaxed">
                International applicants face overwhelming choice, unclear program fit, and noisy content
                funnels. Decisions are high-stakes, but trustworthy signals are scattered across
                countries, systems, and languages.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">Solution</h3>
              <p className="mt-3 text-stone-700 leading-relaxed">
                {SITE_BRAND_NAME} provides a single discovery surface: structured institution profiles,
                country-aware exploration, and AI-assisted shortlists that always point back to official
                sources and verifiable data.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-amber-800/80">
                Value proposition
              </h3>
              <p className="mt-3 text-stone-800 leading-relaxed">
                <strong>Clarity at speed.</strong> Students and advisors save time, reduce
                misinformation risk, and compare options in one workflow—from discovery to the next
                concrete step.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200/80">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
                Traction & credibility
              </h2>
              <p className="mt-2 max-w-2xl text-stone-600">
                Public signals from the live product. Numbers may evolve as the index grows; methodology
                follows transparent student-facing copy on the app.
              </p>
            </div>
            <Link
              href="/"
              className="text-sm font-semibold text-stone-700 underline-offset-2 hover:underline"
            >
              Open the live app →
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { k: '25.4K+', l: 'Verified records in our index (student-facing stat)' },
              { k: '195+', l: 'Countries represented for exploration' },
              { k: '100%', l: 'Free student discovery (core discovery workflow)' },
            ].map((row) => (
              <div
                key={row.k}
                className="rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-sm"
              >
                <p className="text-3xl font-black tracking-tight text-stone-900 sm:text-4xl">{row.k}</p>
                <p className="mt-2 text-xs font-medium leading-relaxed text-stone-600">{row.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">
            Why we are a global, digital-native company
          </h2>
          <ul className="mt-8 space-y-4 text-stone-700">
            <li className="flex gap-3">
              <Globe2 className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" aria-hidden />
              <span>
                Product and positioning are <strong>not tied to a single country</strong>—our datasets and
                experiences are designed for cross-border students and global institutions.
              </span>
            </li>
            <li className="flex gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" aria-hidden />
              <span>
                We ship a <strong>cloud-native web application</strong> with AI features where they add
                defensible value (matchmaking and guided chat), not as a gimmick.
              </span>
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" aria-hidden />
              <span>
                We emphasize <strong>verifiability</strong>: official links, freshness cues, and clear
                separation between information and next-step actions.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="border-t border-stone-200/80">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-stone-200 bg-stone-900 px-6 py-10 text-stone-50 sm:flex-row sm:items-center sm:px-10">
            <div>
              <h2 className="text-xl font-bold sm:text-2xl">Next step for partners & programs</h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-300">
                This English site is the public line-of-business view for {SITE_BRAND_NAME}. The product
                itself remains fully public—no paywall to explore universities.
              </p>
            </div>
            <Link
              href="/startup/contact"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900"
            >
              Contact
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
