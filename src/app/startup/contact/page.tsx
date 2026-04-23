import type { Metadata } from 'next';
import { getContactEmail, getSiteUrl, SITE_BRAND_NAME } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Contact',
  description: `Contact ${SITE_BRAND_NAME} for partnerships, cloud programs, and investor inquiries.`,
  alternates: { canonical: '/startup/contact' },
};

export default function StartupContactPage() {
  const siteUrl = getSiteUrl();
  const email = getContactEmail();

  return (
    <main>
      <section className="border-b border-stone-200/80 bg-white/50">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
            Contact
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-stone-600">
            This page is public—no login required. Use the channel that fits your inquiry: partnerships,
            cloud providers, diligence, or press.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
              <h2 className="text-lg font-extrabold text-stone-900">Email</h2>
              <p className="mt-2 text-sm text-stone-600">
                Primary reach for {SITE_BRAND_NAME}: programs, procurement, and institutional questions.
              </p>
              <p className="mt-5 text-lg font-semibold">
                <a
                  href={`mailto:${email}?subject=${encodeURIComponent(`${SITE_BRAND_NAME} inquiry`)}`}
                  className="text-stone-900 underline-offset-4 hover:underline"
                >
                  {email}
                </a>
              </p>
              <p className="mt-4 text-xs text-stone-500">
                Tip: include your organization, role, and whether the request is time-sensitive.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-stone-50/80 p-8">
              <h2 className="text-lg font-extrabold text-stone-900">Product &amp; web</h2>
              <dl className="mt-4 space-y-4 text-sm">
                <div>
                  <dt className="font-bold uppercase tracking-widest text-stone-500">Live site</dt>
                  <dd className="mt-1">
                    <a href={siteUrl} className="font-semibold text-stone-900 underline-offset-2 hover:underline break-all">
                      {siteUrl}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-widest text-stone-500">Company site (English)</dt>
                  <dd className="mt-1 font-medium text-stone-800">
                    <a href={`${siteUrl.replace(/\/$/, '')}/startup`} className="underline-offset-2 hover:underline break-all">
                      {siteUrl.replace(/\/$/, '')}/startup
                    </a>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-stone-200 bg-white p-8">
            <h2 className="text-lg font-extrabold text-stone-900">Response expectations</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              We are a small team; we prioritize student safety, data accuracy, and sustainable
              operations. For partnership and cloud program reviews, please allow a few business days
              unless you have stated a hard deadline.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
