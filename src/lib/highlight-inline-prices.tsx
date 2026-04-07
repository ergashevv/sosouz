import type { ReactNode } from 'react';

/**
 * Matches currency amounts inside prose: $1,234 · £9,250 · €400 · 1200 USD · 1.25 GBP etc.
 * Intentionally conservative to avoid years/rankings (no bare 4-digit matches).
 */
const INLINE_PRICE_RE =
  /(\$|£|€|US\$)\s*[\d,]+(?:\.\d{1,2})?|\b[\d,]+(?:\.\d{1,2})?\s*(?:USD|GBP|EUR|AUD|CAD)\b/gi;

export function highlightInlinePrices(text: string): ReactNode {
  if (!text) return null;
  const re = new RegExp(INLINE_PRICE_RE.source, INLINE_PRICE_RE.flags);
  const segments: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      segments.push(text.slice(last, m.index));
    }
    segments.push(
      <span key={`p-${m.index}-${k++}`} className="text-role-price-inline">
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    segments.push(text.slice(last));
  }
  return segments.length ? <>{segments}</> : text;
}
