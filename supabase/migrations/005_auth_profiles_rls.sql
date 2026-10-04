-- ============================================================
-- 005: Supabase Auth — profiles, role helpers and real RLS
-- ============================================================
-- Replaces "RLS enabled with no policies" with an actual authorisation
-- model. Every statement is idempotent so this is safe to re-run.
--
-- Design notes
-- ------------
-- * `profiles` is the single auth-facing table: one row per auth.users.id.
--   role is one of admin | staff | driver.
-- * The legacy integer `users` table and its `*_assigned_employee_id`
--   columns are LEFT IN PLACE. Removing them would mean rewriting ~300
--   inline SQL strings across 45 handlers and 15 pages, which cannot be
--   verified until a live database exists. Phase 2 retires them.
-- * Assignment columns are added in their modern uuid form alongside the
--   legacy integer ones, so RLS has something to key on without breaking
--   any existing query.
-- * Anon gets NO access to any CRM table. RLS denies by default when no
--   policy matches, and every policy below is scoped to `authenticated`.
--
-- IMPORTANT: run 001-004 first. This file assumes that schema.
-- ============================================================

-- ---------- profiles ----------
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff'
    CHECK (role IN ('admin', 'staff', 'driver')),
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')),
  updated_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Map a profile to its legacy users row, so both worlds stay in sync.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS legacy_user_id INTEGER;
CREATE INDEX IF NOT EXISTS idx_profiles_legacy_user_id ON profiles(legacy_user_id);

-- ---------- modern assignment columns (uuid) ----------
-- Named `assigned_profile_id`, NOT `assigned_to`, on purpose.
--
-- `tasks.assigned_to` and `followups.assigned_to` already exist in 001 as
-- INTEGER REFERENCES users(id). `ADD COLUMN IF NOT EXISTS assigned_to uuid`
-- is therefore a SILENT NO-OP: the column stays integer, and the RLS policy
-- comparing it to auth.uid() dies with
--     ERROR 42883: operator does not exist: integer = uuid
-- `customers` and `trips` use the legacy name `assigned_employee_id`, so the
-- bare name `assigned_to` was inconsistent across the four tables anyway.
-- One unambiguous name for all four avoids the clash entirely.
--
-- The legacy integer columns are left untouched: the current CRM code still
-- reads and writes them. Phase 2 retires them.
ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE trips     ADD COLUMN IF NOT EXISTS assigned_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks     ADD COLUMN IF NOT EXISTS assigned_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE followups ADD COLUMN IF NOT EXISTS assigned_profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Clean up any half-applied state from an earlier run of this migration
-- that created a uuid `assigned_to` on customers/trips before failing.
-- These are never referenced by the policies below.
ALTER TABLE customers DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE trips     DROP COLUMN IF EXISTS assigned_to;

CREATE INDEX IF NOT EXISTS idx_customers_assigned_profile ON customers(assigned_profile_id);
CREATE INDEX IF NOT EXISTS idx_trips_assigned_profile     ON trips(assigned_profile_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_profile     ON tasks(assigned_profile_id);
CREATE INDEX IF NOT EXISTS idx_followups_assigned_profile ON followups(assigned_profile_id);

-- Link a driver profile to the driver row, so "driver sees own trips" works.
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_drivers_profile_id ON drivers(profile_id);

-- ---------- auto-create a profile when a user signs up ----------
-- Everyone lands as `staff`. Promote to `admin` by hand (see
-- scripts/create-first-admin.mjs). Public sign-ups should be DISABLED in the
-- Supabase dashboard — see docs/OWNER-GUIDE.md.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'phone',
    'staff'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- role helper functions ----------
-- SECURITY DEFINER + a pinned search_path so these cannot be hijacked by a
-- caller-controlled schema. STABLE so the planner can call them once per query.
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid() AND p.active = 1),
    'anon'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.current_role() = 'admin'; $$;

-- admin or staff — anyone who works in the CRM
CREATE OR REPLACE FUNCTION public.is_crm()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.current_role() IN ('admin', 'staff'); $$;

CREATE OR REPLACE FUNCTION public.is_driver()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$ SELECT public.current_role() = 'driver'; $$;

-- ---------- profiles policies ----------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: read own or admin reads all" ON profiles;
CREATE POLICY "profiles: read own or admin reads all" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "profiles: insert own" ON profiles;
CREATE POLICY "profiles: insert own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- A user may fix their own name/phone. Role and active are admin-only:
-- without this a staff member could promote themselves to admin.
DROP POLICY IF EXISTS "profiles: update own, admin updates all" ON profiles;
CREATE POLICY "profiles: update own, admin updates all" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

-- ---------- staff-or-above, whole-table visibility ----------
-- For reference/config tables that have no concept of "assigned to me":
-- suppliers, hotels, company settings, legacy users/sessions, and the
-- child rows that hang off a record (quotation_items, itinerary_days).
-- Staff read; only admin writes.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'suppliers', 'hotels', 'company_settings',
    'users', 'sessions', 'audit_logs'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "%s: crm read" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s: crm read" ON %I FOR SELECT TO authenticated USING (public.is_crm())', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s: admin write" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s: admin write" ON %I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', t, t);
  END LOOP;
END $$;

-- ---------- record-owned tables ----------
-- customers / trips / tasks / followups:
--   admin  -> everything
--   staff  -> rows assigned to them OR unassigned
--   driver -> (trips only) rows they are the driver for; nothing elsewhere

-- customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers: assigned or unassigned" ON customers;
CREATE POLICY "customers: assigned or unassigned" ON customers
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (public.is_crm() AND (assigned_profile_id = auth.uid() OR assigned_profile_id IS NULL))
  );
DROP POLICY IF EXISTS "customers: crm insert" ON customers;
CREATE POLICY "customers: crm insert" ON customers
  FOR INSERT TO authenticated WITH CHECK (public.is_crm());
DROP POLICY IF EXISTS "customers: assigned or admin update" ON customers;
CREATE POLICY "customers: assigned or admin update" ON customers
  FOR UPDATE TO authenticated
  USING (public.is_admin() OR (public.is_crm() AND (assigned_profile_id = auth.uid() OR assigned_profile_id IS NULL)))
  WITH CHECK (public.is_admin() OR public.is_crm());
DROP POLICY IF EXISTS "customers: admin delete" ON customers;
CREATE POLICY "customers: admin delete" ON customers
  FOR DELETE TO authenticated USING (public.is_admin());

-- trips — a driver additionally sees only trips they are driving
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trips: role scoped read" ON trips;
CREATE POLICY "trips: role scoped read" ON trips
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR (public.is_crm() AND (assigned_profile_id = auth.uid() OR assigned_profile_id IS NULL))
    OR (public.is_driver() AND EXISTS (
        SELECT 1 FROM drivers d WHERE d.assigned_trip_id = trips.id AND d.profile_id = auth.uid()
      ))
  );
DROP POLICY IF EXISTS "trips: crm insert" ON trips;
CREATE POLICY "trips: crm insert" ON trips
  FOR INSERT TO authenticated WITH CHECK (public.is_crm());
DROP POLICY IF EXISTS "trips: crm update" ON trips;
CREATE POLICY "trips: crm update" ON trips
  FOR UPDATE TO authenticated
  USING (public.is_crm() OR public.is_driver())
  WITH CHECK (public.is_crm() OR public.is_driver());
DROP POLICY IF EXISTS "trips: admin delete" ON trips;
CREATE POLICY "trips: admin delete" ON trips
  FOR DELETE TO authenticated USING (public.is_admin());

-- tasks / followups — same shape
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['tasks', 'followups'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "%s: assigned or unassigned" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s: assigned or unassigned" ON %I FOR SELECT TO authenticated USING (public.is_admin() OR (public.is_crm() AND (assigned_profile_id = auth.uid() OR assigned_profile_id IS NULL)))',
      t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s: crm insert" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s: crm insert" ON %I FOR INSERT TO authenticated WITH CHECK (public.is_crm())', t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s: crm update" ON %I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s: crm update" ON %I FOR UPDATE TO authenticated USING (public.is_admin() OR (public.is_crm() AND (assigned_profile_id = auth.uid() OR assigned_profile_id IS NULL))) WITH CHECK (public.is_admin() OR public.is_crm())',
      t, t);

    EXECUTE format('DROP POLICY IF EXISTS "%s: admin delete" ON %I', t, t);
    EXECUTE format('CREATE POLICY "%s: admin delete" ON %I FOR DELETE TO authenticated USING (public.is_admin())', t, t);
  END LOOP;
END $$;

-- ---------- child rows ----------
-- These hang off a record. Staff read them if they can read the parent.
-- Only admins and the owning staff write.

-- quotations
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quotations: via parent trip" ON quotations;
CREATE POLICY "quotations: via parent trip" ON quotations
  FOR SELECT TO authenticated
  USING (public.is_admin() OR EXISTS (
    SELECT 1 FROM trips t WHERE t.id = quotations.trip_id
      AND (public.is_crm() AND (t.assigned_profile_id = auth.uid() OR t.assigned_profile_id IS NULL))
  ));
DROP POLICY IF EXISTS "quotations: crm insert" ON quotations;
CREATE POLICY "quotations: crm insert" ON quotations
  FOR INSERT TO authenticated WITH CHECK (public.is_crm());
DROP POLICY IF EXISTS "quotations: crm update" ON quotations;
CREATE POLICY "quotations: crm update" ON quotations
  FOR UPDATE TO authenticated USING (public.is_crm()) WITH CHECK (public.is_crm());
DROP POLICY IF EXISTS "quotations: admin delete" ON quotations;
CREATE POLICY "quotations: admin delete" ON quotations
  FOR DELETE TO authenticated USING (public.is_admin());

-- quotation_items (child of quotations)
ALTER TABLE quotation_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quotation_items: via parent quotation" ON quotation_items;
CREATE POLICY "quotation_items: via parent quotation" ON quotation_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM quotations q WHERE q.id = quotation_items.quotation_id));
DROP POLICY IF EXISTS "quotation_items: crm write" ON quotation_items;
CREATE POLICY "quotation_items: crm write" ON quotation_items
  FOR ALL TO authenticated USING (public.is_crm()) WITH CHECK (public.is_crm());

-- itinerary_days (child of trips)
ALTER TABLE itinerary_days ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "itinerary_days: via parent trip" ON itinerary_days;
CREATE POLICY "itinerary_days: via parent trip" ON itinerary_days
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = itinerary_days.trip_id));
DROP POLICY IF EXISTS "itinerary_days: crm write" ON itinerary_days;
CREATE POLICY "itinerary_days: crm write" ON itinerary_days
  FOR ALL TO authenticated USING (public.is_crm()) WITH CHECK (public.is_crm());

-- payments (child of trips)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments: via parent trip" ON payments;
CREATE POLICY "payments: via parent trip" ON payments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = payments.trip_id));
DROP POLICY IF EXISTS "payments: crm write" ON payments;
CREATE POLICY "payments: crm write" ON payments
  FOR ALL TO authenticated USING (public.is_crm()) WITH CHECK (public.is_crm());

-- activities (timeline; child of trips and customers)
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activities: via parent" ON activities;
CREATE POLICY "activities: via parent" ON activities
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR public.is_crm()
    OR (trip_id IS NOT NULL AND EXISTS (SELECT 1 FROM trips t WHERE t.id = activities.trip_id))
  );
DROP POLICY IF EXISTS "activities: crm insert" ON activities;
CREATE POLICY "activities: crm insert" ON activities
  FOR INSERT TO authenticated WITH CHECK (public.is_crm());

-- communications (child of trips)
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "communications: via parent trip" ON communications;
CREATE POLICY "communications: via parent trip" ON communications
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM trips t WHERE t.id = communications.trip_id));
DROP POLICY IF EXISTS "communications: crm write" ON communications;
CREATE POLICY "communications: crm write" ON communications
  FOR ALL TO authenticated USING (public.is_crm()) WITH CHECK (public.is_crm());

-- documents (child of trips and customers) — metadata only.
-- The files themselves live in a private Storage bucket (migration 006).
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "documents: via parent" ON documents;
CREATE POLICY "documents: via parent" ON documents
  FOR SELECT TO authenticated
  USING (
    public.is_admin() OR public.is_crm()
    OR (trip_id IS NOT NULL AND EXISTS (SELECT 1 FROM trips t WHERE t.id = documents.trip_id))
  );
DROP POLICY IF EXISTS "documents: crm write" ON documents;
CREATE POLICY "documents: crm write" ON documents
  FOR ALL TO authenticated USING (public.is_crm()) WITH CHECK (public.is_crm());

-- drivers: staff read, admin write
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drivers: crm read" ON drivers;
CREATE POLICY "drivers: crm read" ON drivers
  FOR SELECT TO authenticated USING (public.is_crm() OR id = auth.uid() OR profile_id = auth.uid());
DROP POLICY IF EXISTS "drivers: admin write" ON drivers;
CREATE POLICY "drivers: admin write" ON drivers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- search performance ----------
-- pg_trgm powers ILIKE '%q%' search on the two tables staff search most.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_customers_name_trgm  ON customers  USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_phone_trgm ON customers  USING gin (phone gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_customers_email_trgm ON customers  USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_trips_reference_trgm ON trips USING gin (reference gin_trgm_ops);

-- Login lookup and dedup lookup indexes that 001 never created.
CREATE INDEX IF NOT EXISTS idx_users_email    ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_quotations_reference ON quotations(reference);

-- ============================================================
-- Verification (run after applying):
--
--   -- anon must see nothing:
--   SET ROLE anon;
--   SELECT count(*) FROM customers;  -- expect 0, and 0 even if RLS is off
--   RESET ROLE;
--
--   -- staff must not see another staff member's assigned rows
--   -- admin must see everything
-- See docs/OWNER-GUIDE.md for the full role test.
-- ============================================================