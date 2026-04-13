-- Denormalized Hipolabs rows for local search and fewer upstream calls.

CREATE TABLE "UniversityCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "alpha_two_code" TEXT NOT NULL,
    "web_pages" JSONB NOT NULL,
    "domains" JSONB NOT NULL,
    "state_province" TEXT,
    "source" TEXT NOT NULL DEFAULT 'hipolabs',
    "first_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversityCatalog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UniversityCatalog_name_country_key" ON "UniversityCatalog"("name", "country");
CREATE INDEX "UniversityCatalog_country_idx" ON "UniversityCatalog"("country");
CREATE INDEX "UniversityCatalog_name_idx" ON "UniversityCatalog"("name");
