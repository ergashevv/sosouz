'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <nav className="flex items-center px-6 py-8 border-b border-black/5 bg-white">
        <Link href="/" className="text-xl font-black text-black tracking-tighter uppercase leading-none">
          SOSO
        </Link>
      </nav>

      <section className="flex-1 flex flex-col pt-32 px-6">
        <div className="max-w-4xl mx-auto w-full space-y-12">
          <Link href="/" className="btn-secondary inline-flex !py-4 !px-8 hover:bg-black hover:text-white transition-all w-fit">
            <ArrowLeft size={16} /> BACK TO HOME
          </Link>

          <div>
            <h1 className="text-5xl md:text-7xl font-black text-black tracking-tighter uppercase italic underline decoration-neutral-100">
              Terms of Service.
            </h1>
          </div>

          <div className="prose prose-lg max-w-none text-black leading-relaxed">
            <p className="text-2xl font-bold uppercase tracking-tight text-neutral-400">
              Please read these terms carefully before utilizing our global registry data.
            </p>
            
            <div className="space-y-8 mt-12 text-sm font-bold uppercase tracking-widest leading-loose text-neutral-600">
               <p>
                 <strong className="text-black block mb-2">1. Acceptance of Terms</strong>
                 By accessing or using the SOSO university discovery tool, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
               </p>
               <p>
                 <strong className="text-black block mb-2">2. Data Accuracy and Liability</strong>
                 SOSO acts as an aggregator of public institutional data. While we strive for accuracy, the verified status of nodes does not guarantee entirely fault-free metadata. We map data dynamically structured from the HipoLabs global API and our internal AI enrichment services. All official admission details should be re-verified natively with the University&apos;s primary web domain.
               </p>
               <p>
                 <strong className="text-black block mb-2">3. Service Availability</strong>
                 We reserve the right to withdraw or amend the service we provide without notice. We will not be liable if, for any reason, our platform is unavailable at any time or for any period.
               </p>
               <p>
                 <strong className="text-black block mb-2">4. Acceptable Use</strong>
                 You must not use the platform in any way that causes, or may cause, damage to the network layer or impairment of the availability or accessibility of the SOSO domains. Scraping or automated extraction of aggregated metadata mapping is strictly prohibited without explicit clearance.
               </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-black/10 bg-white mt-32">
         <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.4em]">
               &copy; 2026 SOSO 
            </div>
         </div>
      </footer>
    </main>
  );
}
