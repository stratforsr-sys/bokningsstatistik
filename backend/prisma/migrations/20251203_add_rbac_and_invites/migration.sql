-- Step 1: Add password_hash and is_active columns to User table
ALTER TABLE "User" ADD COLUMN "password_hash" TEXT;
ALTER TABLE "User" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- Step 2: Create temporary new enum type with new values
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'MANAGER', 'ADMIN');

-- Step 3: Migrate existing data from old roles to new roles
-- BOOKER -> USER
-- SALES -> MANAGER
-- ADMIN -> ADMIN (stays the same)
ALTER TABLE "User" ALTER COLUMN "role" TYPE TEXT;

UPDATE "User" SET "role" = 'USER' WHERE "role" = 'BOOKER';
UPDATE "User" SET "role" = 'MANAGER' WHERE "role" = 'SALES';
-- ADMIN stays as ADMIN, no update needed

-- Step 4: Drop old enum and rename new enum
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";

-- Step 5: Convert role column to use new enum
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");

-- Step 6: Create UserInvite table
CREATE TABLE "UserInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "accepted_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserInvite_pkey" PRIMARY KEY ("id")
);

-- Step 7: Create indexes on UserInvite
CREATE INDEX "UserInvite_email_idx" ON "UserInvite"("email");
CREATE INDEX "UserInvite_token_hash_idx" ON "UserInvite"("token_hash");
CREATE INDEX "UserInvite_expires_at_idx" ON "UserInvite"("expires_at");
