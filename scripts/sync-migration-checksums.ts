/**
 * After editing migration SQL that was already applied, Prisma reports checksum mismatch.
 * Recomputes SHA-256 for each folder's migration.sql under prisma/migrations,
 * then writes checksums to _prisma_migrations on the target database.
 *
 * Run: npm run db:sync-migration-checksums
 */
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

function checksumForMigration(sql: string): string {
  const normalized = sql.replace(/\r\n/g, "\n");
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

function listMigrationFolders(migrationsRoot: string): string[] {
  return readdirSync(migrationsRoot)
    .filter((name) => {
      if (name === "migration_lock.toml") return false;
      const p = join(migrationsRoot, name);
      return statSync(p).isDirectory();
    })
    .sort();
}

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required");
  }

  const migrationsRoot = join(process.cwd(), "prisma", "migrations");
  const client = new pg.Client({ connectionString: url });
  await client.connect();

  try {
    for (const folder of listMigrationFolders(migrationsRoot)) {
      const file = join(migrationsRoot, folder, "migration.sql");
      let sql: string;
      try {
        sql = readFileSync(file, "utf8");
      } catch {
        continue;
      }
      const checksum = checksumForMigration(sql);
      const res = await client.query(
        `UPDATE "_prisma_migrations" SET "checksum" = $1 WHERE "migration_name" = $2`,
        [checksum, folder],
      );
      if (res.rowCount === 0) {
        console.warn(`[skip] no row for migration_name=${folder}`);
      } else {
        console.log(`[ok] ${folder} -> ${checksum.slice(0, 12)}…`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
