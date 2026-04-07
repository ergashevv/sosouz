/**
 * Shared geography helpers for rankings filters (client + API).
 */

import { COUNTRY_ALIAS_GROUPS } from "@/lib/countryAliasGroups";

const SPACE_RE = /\s+/g;

/** Lowercase, trim, strip combining marks so "España" ↔ "espana", "République" ↔ "republique". */
export function foldGeoLabel(value: string) {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(SPACE_RE, " ");
}

const ALIAS_TO_CANONICAL = new Map<string, string>();
for (const group of COUNTRY_ALIAS_GROUPS) {
  const canonical = foldGeoLabel(group[0]);
  for (const alias of group) {
    ALIAS_TO_CANONICAL.set(foldGeoLabel(alias), canonical);
  }
}

export function canonicalCountryKey(country: string): string {
  const folded = foldGeoLabel(country);
  return ALIAS_TO_CANONICAL.get(folded) ?? folded;
}

export function countryFilterMatches(entryCountry: string, filterCountry: string): boolean {
  if (!filterCountry.trim()) return true;
  if (!entryCountry.trim()) return false;
  return canonicalCountryKey(entryCountry) === canonicalCountryKey(filterCountry);
}

export function inferRegionFromCountry(country: string): string {
  if (!country.trim()) return "Other";
  const value = foldGeoLabel(canonicalCountryKey(country));
  if (
    [
      "united states",
      "canada",
      "mexico",
      "jamaica",
      "trinidad and tobago",
      "costa rica",
      "panama",
      "guatemala",
      "honduras",
      "el salvador",
      "dominican republic",
      "haiti",
      "puerto rico",
    ].includes(value)
  )
    return "North America";
  if (
    [
      "united kingdom",
      "france",
      "germany",
      "italy",
      "spain",
      "netherlands",
      "switzerland",
      "sweden",
      "norway",
      "denmark",
      "finland",
      "poland",
      "austria",
      "belgium",
      "ireland",
      "portugal",
      "greece",
      "czechia",
      "hungary",
      "romania",
      "bulgaria",
      "croatia",
      "slovakia",
      "slovenia",
      "serbia",
      "bosnia and herzegovina",
      "north macedonia",
      "albania",
      "ukraine",
      "belarus",
      "lithuania",
      "latvia",
      "estonia",
      "russia",
      "moldova",
      "georgia",
      "armenia",
      "azerbaijan",
      "luxembourg",
      "iceland",
      "malta",
      "cyprus",
    ].includes(value)
  )
    return "Europe";
  if (
    [
      "china",
      "japan",
      "south korea",
      "north korea",
      "singapore",
      "india",
      "malaysia",
      "thailand",
      "vietnam",
      "indonesia",
      "philippines",
      "pakistan",
      "bangladesh",
      "uzbekistan",
      "kazakhstan",
      "hong kong",
      "taiwan",
      "myanmar",
      "cambodia",
      "laos",
      "sri lanka",
      "nepal",
      "afghanistan",
      "kyrgyzstan",
      "tajikistan",
      "turkmenistan",
      "mongolia",
      "brunei",
      "maldives",
      "bhutan",
    ].includes(value)
  )
    return "Asia";
  if (["australia", "new zealand"].includes(value)) return "Oceania";
  if (
    [
      "brazil",
      "argentina",
      "chile",
      "colombia",
      "peru",
      "venezuela",
      "ecuador",
      "bolivia",
      "paraguay",
      "uruguay",
      "cuba",
    ].includes(value)
  )
    return "South America";
  if (
    [
      "south africa",
      "egypt",
      "morocco",
      "nigeria",
      "kenya",
      "ethiopia",
      "ghana",
      "uganda",
      "tanzania",
      "zimbabwe",
      "cameroon",
      "ivory coast",
      "senegal",
      "sudan",
      "angola",
      "mozambique",
      "democratic republic of the congo",
      "congo",
    ].includes(value)
  )
    return "Africa";
  if (
    [
      "saudi arabia",
      "united arab emirates",
      "qatar",
      "israel",
      "türkiye",
      "turkey",
      "kuwait",
      "bahrain",
      "oman",
      "jordan",
      "lebanon",
      "iraq",
      "iran",
      "syria",
      "yemen",
      "palestine",
    ].includes(value)
  )
    return "Middle East";
  if (value === "other") return "Other";
  return "Other";
}
