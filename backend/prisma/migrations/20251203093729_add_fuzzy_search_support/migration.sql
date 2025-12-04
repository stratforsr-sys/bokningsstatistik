-- Enable pg_trgm extension for fuzzy search (trigram similarity)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for fuzzy search on subject, notes, and bodyPreview
-- GIN (Generalized Inverted Index) is optimized for trigram searches
CREATE INDEX IF NOT EXISTS "Meeting_subject_gin_trgm_idx" ON "Meeting" USING gin (subject gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Meeting_notes_gin_trgm_idx" ON "Meeting" USING gin (notes gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Meeting_bodyPreview_gin_trgm_idx" ON "Meeting" USING gin ("bodyPreview" gin_trgm_ops);

-- Create composite index for better performance on combined searches
CREATE INDEX IF NOT EXISTS "Meeting_text_search_idx" ON "Meeting" USING gin ((
  COALESCE(subject, '') || ' ' ||
  COALESCE(notes, '') || ' ' ||
  COALESCE("bodyPreview", '')
) gin_trgm_ops);
