-- Add columns required by Google OAuth account linking.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "email" TEXT,
ADD COLUMN IF NOT EXISTS "google_sub" TEXT;

-- Keep uniqueness guarantees for linked identities.
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "User_google_sub_key" ON "User"("google_sub");
