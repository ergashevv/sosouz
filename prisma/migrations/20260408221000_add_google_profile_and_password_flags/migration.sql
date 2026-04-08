-- Extend user profile/auth metadata for Google OAuth UX.
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "avatar_url" TEXT,
ADD COLUMN IF NOT EXISTS "auth_provider" TEXT NOT NULL DEFAULT 'phone',
ADD COLUMN IF NOT EXISTS "has_password" BOOLEAN NOT NULL DEFAULT true;
