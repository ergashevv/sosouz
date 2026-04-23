import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BookOpen, Bot, MapPin, ShieldCheck, Workflow } from 'lucide-react';
import {
  AiStudioMockup,
  DataFreshnessMockup,
  SearchDiscoveryMockup,
} from '@/components/startup/ProductMockups';
import { SITE_BRAND_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Product',
  description: `${SITE_BRAND_NAME} product: global university search, AI Match Studio, rankings context, and verifiable official links for students and advisors.`,
  alternates: { canonical: '/startup/product' },
};

const features = [
  {
    title: 'Global search & shortlisting',
    body: 'Explore universities by country with structured results grounded in the platform index—so discovery stays focused instead of random web crawling.',
    icon: MapPin,
  },
  {
    title: 'Institution intelligence',
    body: 'Profiles connect programs, context, and “what to verify next” cues so students can separate facts, incentives, and official requirements.',
    icon: BookOpen,
  },
  {
    title: 'AI Match Studio',
    body: 'Goal-based prompts and match scoring help build reach / target / safe lists, with transparent reasoning and an emphasis on official next steps.',
    icon: Bot,
  },
  {
    title: 'Trust by design',
    body: 'Official URLs, data freshness language, and explicit guardrails reduce mis-click risk in a space full of unverified listicles and recycled rankings.',
    icon: ShieldCheck,
  },
] as const;

const steps = [
  { n: '1', t: 'Choose a destination country and intent', d: 'Anchor the search in realistic geography and program goals.' },
  { n: '2', t: 'Compare institutions and read structured signals', d: 'Move from a long list to a small set of serious candidates.' },
  { n: '3', t: 'Use AI for shortlist and trade-offs', d: 'Stress-test options against constraints: budget, language, calendar, and risk tolerance.' },
  { n: '4', t: 'Exit to official sources', d: 'Confirm deadlines, entry requirements, and fees on the university’s own site.' },
] as const;

export default function StartupProductPage() {
  return (
    <main>
      <section className="border-b border-stone-200/80 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
            Product overview
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-stone-600">
            {SITE_BRAND_NAME} is a web application for international higher-education discovery. The core
            loop is <strong>search → profile → decision support → official verification</strong>, with
            optional sign-in for returning users. The public discovery experience is accessible without
            a paywall.
          </p>
        </div>
      </section>

      <section className="border-b border-stone-200/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">What the product does</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="rounded-2xl border border-stone-200 bg-stone-50/60 p-6">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-stone-900">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200/80">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">Visual walkthrough (mockups)</h2>
          <p className="mt-2 max-w-3xl text-stone-600">
            The illustrations below are lightweight UI mockups to explain the workflow; the live
            experience is in the app.
          </p>
          <div className="mt-10 grid items-start gap-10 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">Discovery</h3>
              <p className="mt-2 text-sm text-stone-600">
                Country-scoped search with structured institution results.
              </p>
              <div className="mt-6">
                <SearchDiscoveryMockup />
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-500">AI Match Studio</h3>
              <p className="mt-2 text-sm text-stone-600">
                Goal-first prompts, shortlist support, and follow-up—without losing link-out to official
                sources.
              </p>
              <div className="mt-6">
                <AiStudioMockup />
              </div>
            </div>
          </div>
          <div className="mt-10 max-w-md">
            <DataFreshnessMockup />
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200/80 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="flex items-start gap-3">
            <Workflow className="mt-1 h-6 w-6 shrink-0 text-stone-500" aria-hidden />
            <div>
              <h2 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">How it works (user journey)</h2>
              <p className="mt-2 text-stone-600">A clear path from “where should I look?” to “what do I verify next?”</p>
            </div>
          </div>
          <ol className="mt-10 space-y-5">
            {steps.map((s) => (
              <li
                key={s.n}
                className="flex flex-col gap-2 rounded-2xl border border-stone-200 bg-stone-50/70 p-5 sm:flex-row sm:items-start"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">
                  {s.n}
                </span>
                <div>
                  <h3 className="font-bold text-stone-900">{s.t}</h3>
                  <p className="mt-1 text-sm text-stone-600 leading-relaxed">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h2 className="text-2xl font-extrabold text-stone-900 sm:text-3xl">Who it is for</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h3 className="text-lg font-bold text-stone-900">Students (primary)</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Applicants comparing universities across countries who need speed, structure, and a
                checklist-driven path to official requirements—especially in STEM, business, and
                competitive intakes.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h3 className="text-lg font-bold text-stone-900">Advisors & families (secondary)</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                Anyone supporting a student decision benefits from a shared, linkable object model:
                shortlists, context, and consistent language across regions.
              </p>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/search?country=United%20Kingdom"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white"
            >
              Launch search
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/ai-studio"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-6 py-3 text-sm font-semibold text-stone-800"
            >
              Open AI Match Studio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
