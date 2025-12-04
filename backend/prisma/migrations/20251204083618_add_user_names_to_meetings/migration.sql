/*
  Migration: Lägg till användarnamn på möten för att möjliggöra borttagning av användare

  Steg:
  1. Lägg till de nya kolumnerna som nullable först
  2. Fyll i namn från User-tabellen för befintliga möten
  3. Gör kolumnerna required
  4. Uppdatera foreign keys till onDelete: SetNull
*/

-- Steg 1: Lägg till nya kolumner som nullable
ALTER TABLE "Meeting" ADD COLUMN "booker_name" TEXT;
ALTER TABLE "Meeting" ADD COLUMN "owner_name" TEXT;

-- Steg 2: Fyll i namn från User-tabellen för befintliga möten
UPDATE "Meeting" m
SET "booker_name" = u.name
FROM "User" u
WHERE m."bookerId" = u.id;

UPDATE "Meeting" m
SET "owner_name" = u.name
FROM "User" u
WHERE m."ownerId" = u.id;

-- Steg 3: Gör kolumnerna required (NOT NULL)
ALTER TABLE "Meeting" ALTER COLUMN "booker_name" SET NOT NULL;
ALTER TABLE "Meeting" ALTER COLUMN "owner_name" SET NOT NULL;

-- Steg 4: Ta bort gamla foreign key constraints
ALTER TABLE "Meeting" DROP CONSTRAINT IF EXISTS "Meeting_bookerId_fkey";
ALTER TABLE "Meeting" DROP CONSTRAINT IF EXISTS "Meeting_ownerId_fkey";

-- Steg 5: Gör bookerId och ownerId nullable
ALTER TABLE "Meeting" ALTER COLUMN "bookerId" DROP NOT NULL;
ALTER TABLE "Meeting" ALTER COLUMN "ownerId" DROP NOT NULL;

-- Steg 6: Lägg till nya foreign keys med onDelete: SetNull
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_bookerId_fkey"
  FOREIGN KEY ("bookerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Steg 7: Droppa gamla indexes (om de finns)
DROP INDEX IF EXISTS "Meeting_bodyPreview_gin_trgm_idx";
DROP INDEX IF EXISTS "Meeting_notes_gin_trgm_idx";
DROP INDEX IF EXISTS "Meeting_subject_gin_trgm_idx";
