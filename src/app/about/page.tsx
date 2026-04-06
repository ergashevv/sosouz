'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AboutPage() {
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
              About Us.
            </h1>
          </div>

          <div className="prose prose-lg max-w-none text-black leading-relaxed">
            <p className="text-2xl font-bold uppercase tracking-tight text-neutral-400">
              Building the most comprehensive and verified academic database for students globally.
            </p>
            
            <div className="space-y-8 mt-12 text-sm font-bold uppercase tracking-widest leading-loose text-neutral-600">
               <p>
                 SOSO is a sophisticated university discovery platform designed to connect ambitious students with top-tier global institutions. Our verified data pipeline integrates directly with international institutional metadata to provide accurate, real-time insights into academic nodes across 195+ countries.
               </p>
               <p>
                 We believe in absolute transparency and accessibility in academic research. By standardizing diverse institutional registries into a single, high-performance interface, we eliminate the friction typically associated with researching international education.
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
