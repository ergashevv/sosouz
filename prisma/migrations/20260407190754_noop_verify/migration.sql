-- Align UniversityLogo.updated_at with Prisma @updatedAt (no DB default; client updates on write).
ALTER TABLE "UniversityLogo" ALTER COLUMN "updated_at" DROP DEFAULT;
