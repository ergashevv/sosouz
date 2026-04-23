import Link from 'next/link';
import ContactMailtoLink from '@/components/ContactMailtoLink';
import { getSiteUrl, SITE_BRAND_NAME } from '@/lib/site';

const year = new Date().getFullYear();

export default function StartupFooter() {
  const siteUrl = getSiteUrl();
  return (
    <footer className="mt-auto border-t border-stone-200 bg-stone-50/80">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-stone-400">Brand</p>
            <p className="mt-2 text-lg font-extrabold text-stone-900">{SITE_BRAND_NAME}</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Global university discovery, rankings context, and AI guidance for the next generation of
              students.
            </p>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-stone-400">Startup</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-stone-600">
              <li>
                <Link href="/startup/product" className="hover:text-stone-900">
                  Product
                </Link>
              </li>
              <li>
                <Link href="/startup/company" className="hover:text-stone-900">
                  Company
                </Link>
              </li>
              <li>
                <Link href="/startup/team" className="hover:text-stone-900">
                  Team
                </Link>
              </li>
              <li>
                <Link href="/startup/contact" className="hover:text-stone-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-stone-400">Product</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-stone-600">
              <li>
                <Link href="/search" className="hover:text-stone-900">
                  University search
                </Link>
              </li>
              <li>
                <Link href="/ai-studio" className="hover:text-stone-900">
                  AI Match Studio
                </Link>
              </li>
              <li>
                <Link href="/top-university" className="hover:text-stone-900">
                  Top programs
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-stone-400">Legal & contact</p>
            <ul className="mt-3 space-y-2 text-sm font-semibold text-stone-600">
              <li>
                <a href={siteUrl} className="hover:text-stone-900">
                  {siteUrl.replace(/^https?:\/\//, '')}
                </a>
              </li>
              <li>
                <ContactMailtoLink className="hover:text-stone-900" />
              </li>
              <li>
                <Link href="/terms" className="hover:text-stone-900">
                  Terms
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-stone-900">
                  Privacy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-stone-200/80 pt-8 text-center text-xs font-medium text-stone-500">
          © {year} {SITE_BRAND_NAME}. English company site. Product available worldwide at{' '}
          <Link href="/" className="font-semibold text-stone-700 underline-offset-2 hover:underline">
            the main experience
          </Link>
          .
        </p>
      </div>
    </footer>
  );
}
