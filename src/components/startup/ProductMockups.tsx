import { MapPin, Search, Sparkles } from 'lucide-react';

/**
 * CSS-only “screens” for the startup product page (no binary assets, fast to load).
 */
export function SearchDiscoveryMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-[0_24px_60px_-20px_rgba(28,25,23,0.2)]">
      <div className="flex h-9 items-center gap-2 border-b border-stone-200/80 bg-white px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-400" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-400" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" aria-hidden />
        <div className="ml-2 flex min-w-0 flex-1 items-center rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-[10px] text-stone-500">
          <span className="truncate">soso.app/search</span>
        </div>
      </div>
      <div className="bg-gradient-to-b from-white to-stone-50 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-500">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          United Kingdom
        </div>
        <div className="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 text-sm text-stone-800">
            <Search className="h-4 w-4 text-stone-400" aria-hidden />
            <span className="font-medium">Imperial College London</span>
          </div>
          <span className="rounded-full bg-stone-900 px-3 py-1.5 text-center text-xs font-semibold text-white">
            Open profile
          </span>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {['Program fit', 'Official links', 'Rankings context', 'Next steps'].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-2 text-xs font-semibold text-stone-600"
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AiStudioMockup() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-[0_24px_60px_-20px_rgba(28,25,23,0.2)]">
      <div className="flex h-9 items-center gap-2 border-b border-stone-200/80 bg-stone-900 px-3 text-stone-300">
        <Sparkles className="h-3.5 w-3.5 text-amber-200" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-widest">SOSO AI</span>
        <span className="ml-auto text-[10px] text-stone-500">/ai-studio</span>
      </div>
      <div className="space-y-3 bg-gradient-to-b from-stone-900 to-stone-800 p-4 sm:p-6">
        <div className="rounded-xl border border-stone-600/50 bg-stone-800/80 p-3 text-sm text-stone-200">
          Suggest 3 reach / 3 target / 2 safe universities for Computer Science, budget-conscious, EU
          options included.
        </div>
        <div className="ml-4 max-w-[92%] rounded-xl border border-stone-600/30 bg-stone-950/40 p-3 text-sm text-stone-300">
          Here is a shortlist with rationale, trade-offs, and official application links to verify
          requirements.
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {['Match scores', 'Export list', 'Ask follow-up'].map((c) => (
            <span
              key={c}
              className="rounded-md border border-stone-600/50 bg-stone-900/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-400"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DataFreshnessMockup() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Platform signals</p>
      <ul className="mt-4 space-y-3 text-sm text-stone-700">
        <li className="flex items-start justify-between gap-3">
          <span>Verified institutions in index</span>
          <span className="shrink-0 font-bold text-stone-900">25.4K+</span>
        </li>
        <li className="flex items-start justify-between gap-3">
          <span>Countries covered</span>
          <span className="shrink-0 font-bold text-stone-900">195+</span>
        </li>
        <li className="flex items-start justify-between gap-3">
          <span>Student pricing</span>
          <span className="shrink-0 font-bold text-emerald-700">Free discovery</span>
        </li>
      </ul>
    </div>
  );
}
