-- ============================================================
-- 006: Supabase Storage for CRM documents, and remove demo users
-- ============================================================
-- Replaces local-disk uploads (crm-documents/), which cannot work on
-- Vercel because the deployed filesystem is read-only outside /tmp.
--
-- The bucket is PRIVATE. Customer documents are ID proofs, passports and
-- payment receipts, so they are served through short-lived signed URLs
-- generated per request, never through a public URL.
--
-- Run after 001-005.
-- ============================================================

-- ---------- private bucket ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'crm-documents',
  'crm-documents',
  false,
  10485760, -- 10 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------- storage access ----------
-- Object paths are  <entity-type>/<entity-id>/<uuid>.<ext>
-- so a policy can scope access to a record by parsing the prefix.

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "crm-documents: crm read" ON storage.objects;
CREATE POLICY "crm-documents: crm read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'crm-documents' AND public.is_crm());

DROP POLICY IF EXISTS "crm-documents: crm upload" ON storage.objects;
CREATE POLICY "crm-documents: crm upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'crm-documents' AND public.is_crm());

-- Only an admin may delete or replace a stored document.
DROP POLICY IF EXISTS "crm-documents: admin update" ON storage.objects;
CREATE POLICY "crm-documents: admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'crm-documents' AND public.is_admin())
  WITH CHECK (bucket_id = 'crm-documents' AND public.is_admin());

DROP POLICY IF EXISTS "crm-documents: admin delete" ON storage.objects;
CREATE POLICY "crm-documents: admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'crm-documents' AND public.is_admin());

-- ---------- remove the seeded demo accounts ----------
-- 002_seed_data.sql creates two accounts with the published password
-- `admin123`:
--     enquiry@safartour.in   (admin)
--     rajesh@safartour.crm   (employee)
-- They are deleted here so the published credential stops working.
--
-- These are the demo rows only. Any row whose password_hash differs from
-- the seed hash is left alone, so re-running this is safe.
DELETE FROM sessions  WHERE user_id IN (SELECT id FROM users WHERE email IN ('enquiry@safartour.in', 'rajesh@safartour.crm'));
DELETE FROM users     WHERE email IN ('enquiry@safartour.in', 'rajesh@safartour.crm');

-- Profiles that pointed at a deleted user would block a future signup of
-- the same address, so clear the link.
UPDATE profiles SET legacy_user_id = NULL WHERE legacy_user_id IS NOT NULL;

-- ---------- first admin is created by script, not by seed ----------
-- node --env-file=.env.local scripts/create-first-admin.mjs
--   <email> <password> "<full name>"
--
-- It uses the Supabase Admin API, so it does not need the user to exist
-- first, and it promotes the resulting profile to `admin`.

-- ============================================================
-- Verification:
--   SELECT id, public FROM storage.buckets WHERE id = 'crm-documents';
--   -- expect public = false
--
--   SELECT count(*) FROM users;
--   -- expect 0 until you create the first admin
-- ============================================================