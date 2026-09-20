-- ============================================================
-- 003: soft-delete (archive) support for trips
-- ============================================================
-- The CRM code has always treated trips as soft-deletable: every list
-- query filters `WHERE archived = 0` (52 references) and DELETE
-- /crm/api/trips/[id] runs `UPDATE trips SET archived = 1`. The original
-- schema (SQLite and the initial Postgres port) never declared the column
-- on `trips`, which made every trips-listing query fail with
-- 42703 column "archived" does not exist.
--
-- `customers.archived` already exists and is left untouched.
-- Idempotent: safe to run more than once. Existing rows default to
-- archived = 0 (not archived), preserving all data.

ALTER TABLE trips
  ADD COLUMN IF NOT EXISTS archived INTEGER NOT NULL DEFAULT 0;

-- List queries ORDER BY updated_at and filter on archived frequently.
CREATE INDEX IF NOT EXISTS idx_trips_archived ON trips(archived);

-- Consistency with the rest of the CRM: 0 = active, 1 = archived (the
-- UI never sets other values; CHECK guards against accidents).
-- Applied separately so the ALTER above stays idempotent even if the
-- constraint already exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trips_archived_check'
  ) THEN
    ALTER TABLE trips ADD CONSTRAINT trips_archived_check CHECK (archived IN (0, 1));
  END IF;
END $$;
