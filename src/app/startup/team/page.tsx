import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink, Mail } from 'lucide-react';
import { getContactEmail, getTeamLinkedInAzam, getTeamLinkedInPulat, SITE_BRAND_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Team',
  description: `Core team building ${SITE_BRAND_NAME}: leadership and engineering.`,
  alternates: { canonical: '/startup/team' },
};

export default function StartupTeamPage() {
  const linkedInPulat = getTeamLinkedInPulat();
  const linkedInAzam = getTeamLinkedInAzam();
  const email = getContactEmail();

  return (
    <main>
      <section className="border-b border-stone-200/80 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
            Team
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-stone-600">
            {SITE_BRAND_NAME} is built by a small, senior execution team. We are intentionally lean:
            <strong> product clarity</strong> and <strong>shipping velocity</strong> over headcount
            theatre.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <article className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-extrabold text-stone-900">Ergashev Pulat</h2>
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-stone-500">
                Founder &amp; CEO
              </p>
              <p className="mt-4 flex-1 text-stone-600 leading-relaxed">
                Leads product vision, go-to-market narrative, and overall strategy for {SITE_BRAND_NAME}.
                Focused on making global university discovery trustworthy and fast for real students,
                with an emphasis on responsible AI positioning and long-term data quality.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent(`Hello ${SITE_BRAND_NAME} (Pulat)`)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:border-stone-300"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  Email
                </a>
                {linkedInPulat ? (
                  <a
                    href={linkedInPulat}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:border-stone-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-extrabold text-stone-900">Azamkhuja Vosiljonov</h2>
              <p className="mt-1 text-sm font-bold uppercase tracking-widest text-stone-500">
                CTO &amp; Lead Developer
              </p>
              <p className="mt-4 flex-1 text-stone-600 leading-relaxed">
                Owns technical architecture, platform reliability, and the implementation of {SITE_BRAND_NAME}{' '}
                core systems—from search to AI services integration—with strong hands-on leadership in
                frontend engineering, performance on modern edge and cloud runtimes, and a balanced
                security posture.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent(`Hello ${SITE_BRAND_NAME} (Azamkhuja)`)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:border-stone-300"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden />
                  Email
                </a>
                {linkedInAzam ? (
                  <a
                    href={linkedInAzam}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-800 hover:border-stone-300"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </article>
          </div>

          <p className="mt-10 max-w-3xl text-sm text-stone-500">
            Public note: the company operates <strong>primarily in English for this line-of-business</strong>{' '}
            site, while the product can surface multiple languages in the app where configured.
          </p>

          <p className="mt-4">
            <Link href="/startup/contact" className="text-sm font-semibold text-stone-800 underline-offset-2 hover:underline">
              Contact the company →
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
