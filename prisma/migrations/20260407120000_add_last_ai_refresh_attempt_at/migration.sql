-- Cache / research debounce column (must match prisma/schema.prisma UniversityDetails)
ALTER TABLE "UniversityDetails" ADD COLUMN IF NOT EXISTS "last_ai_refresh_attempt_at" TIMESTAMP(3);
