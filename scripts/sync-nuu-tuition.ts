/**
 * Backfill tuition_fees for National University of Uzbekistan rows in UniversityDetails
 * so cached DB values match getResearchTuitionOverride (UZ/RU/EN per ::lang key).
 *
 * Run: `npx tsx scripts/sync-nuu-tuition.ts` (DATABASE_URL from env, e.g. `node --env-file=.env`)
 */
import { prisma } from "../src/lib/prisma";
import {
  getResearchTuitionOverride,
  isNationalUniversityOfUzbekistan,
  parseResearchCacheKey,
} from "../src/lib/university-research-overrides";

async function main() {
  const rows = await prisma.universityDetails.findMany({
    select: { id: true, university_name: true, tuition_fees: true },
  });

  let updated = 0;
  for (const row of rows) {
    const parsed = parseResearchCacheKey(row.university_name);
    if (!parsed || !isNationalUniversityOfUzbekistan(parsed.university)) continue;

    const tuition = getResearchTuitionOverride(parsed.university, parsed.lang);
    if (!tuition || tuition === row.tuition_fees) continue;

    await prisma.universityDetails.update({
      where: { id: row.id },
      data: { tuition_fees: tuition },
    });
    updated += 1;
    console.log("Updated:", row.university_name);
  }

  console.log(`Done. ${updated} row(s) updated, ${rows.length} total scanned.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
