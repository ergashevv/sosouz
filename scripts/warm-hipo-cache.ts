/**
 * Prefetch Hipolabs country lists into SearchCache + UniversityCatalog (reduces live user upstream calls).
 * Run: node --env-file=.env node_modules/tsx/dist/cli.mjs scripts/warm-hipo-cache.ts
 */
import { getHipoSearchResultsCached } from "../src/lib/hipo-search";

const DEFAULT_COUNTRIES = [
  "United Kingdom",
  "United States",
  "Uzbekistan",
  "Germany",
  "South Korea",
  "France",
  "Canada",
  "Australia",
];

async function main() {
  const extra = (process.env.HIPO_WARM_COUNTRIES || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const list = extra.length > 0 ? extra : DEFAULT_COUNTRIES;

  for (const country of list) {
    const { data, source } = await getHipoSearchResultsCached({ country });
    console.log(`[warm] ${country}: ${data.length} rows (${source})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
