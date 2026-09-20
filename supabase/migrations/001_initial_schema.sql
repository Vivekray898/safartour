-- ============================================================
-- Safar Tours CRM — Supabase PostgreSQL schema
-- ============================================================
-- Run this once in the Supabase SQL Editor (or `psql $DATABASE_URL`),
-- then run supabase/seed.sql for the default users + demo data.
--
-- Notes
--  - Date/time and boolean-ish columns are TEXT / INTEGER(0|1) on purpose:
--    they match the formats the CRM UI was built against, so the UI behaves
--    exactly as before (see src/lib/crm/db.ts).
--  - All tables get Row Level Security. The app connects with the Postgres
--    role from DATABASE_URL (service-level access) and enforces the CRM's
--    own session/role permissions in src/lib/crm/auth.ts +
--    src/lib/crm/permissions.ts; RLS here is the safety net that blocks any
--    other anonymous/authenticated Supabase client from touching CRM data.

-- ---------- users / auth ----------
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin','employee')) DEFAULT 'employee',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')),
  updated_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

-- ---------- customers ----------
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  city TEXT,
  alt_phone TEXT,
  preferred_contact TEXT CHECK (preferred_contact IN ('phone','whatsapp','email')),
  company TEXT,
  company_contact_person TEXT,
  assigned_employee_id INTEGER REFERENCES users(id),
  first_trip_at TEXT,
  last_trip_at TEXT,
  trip_count INTEGER DEFAULT 0,
  is_repeat_customer INTEGER DEFAULT 0,
  archived INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')),
  updated_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

-- ---------- trips (leads) ----------
CREATE TABLE IF NOT EXISTS trips (
  id SERIAL PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  assigned_employee_id INTEGER REFERENCES users(id),
  status TEXT CHECK (status IN (
    'new','contacted','requirement_collected','quotation_preparing',
    'quotation_sent','negotiation','booking_pending','booked',
    'trip_ongoing','completed','lost','cancelled'
  )) DEFAULT 'new',
  priority TEXT CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  lead_source TEXT CHECK (lead_source IN (
    'website','whatsapp','call','walk_in','ads','referral',
    'google','google_business','facebook','instagram','existing_customer','partner','other'
  )) DEFAULT 'website',
  campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  destination TEXT,
  trip_type TEXT CHECK (trip_type IN (
    'package','car_rental','hotel_transport','custom_trip',
    'airport_transfer','sightseeing','honeymoon','family_holiday',
    'corporate','other'
  )),
  group_type TEXT CHECK (group_type IN (
    'family','couple','group','corporate','solo','friends','senior_citizens','other'
  )),
  start_date TEXT,
  end_date TEXT,
  flexible_dates INTEGER DEFAULT 0,
  adults INTEGER DEFAULT 0,
  children_below_5 INTEGER DEFAULT 0,
  children_5_12 INTEGER DEFAULT 0,
  children_above_12 INTEGER DEFAULT 0,
  infants INTEGER DEFAULT 0,
  total_pax INTEGER,
  rooms_single INTEGER DEFAULT 0,
  rooms_double INTEGER DEFAULT 0,
  rooms_triple INTEGER DEFAULT 0,
  extra_beds INTEGER DEFAULT 0,
  child_with_bed INTEGER DEFAULT 0,
  child_without_bed INTEGER DEFAULT 0,
  room_note TEXT,
  meal_plan TEXT CHECK (meal_plan IN ('EP','CP','MAP','AP')),
  hotel_category TEXT,
  hotel_location_pref TEXT,
  hotel_view_pref TEXT,
  hotel_property_pref TEXT,
  hotel_special_req TEXT,
  transport_required TEXT CHECK (transport_required IN ('yes','no','partial')) DEFAULT 'no',
  vehicle_type TEXT,
  pickup_location TEXT,
  pickup_date TEXT,
  pickup_time TEXT,
  drop_location TEXT,
  drop_date TEXT,
  drop_time TEXT,
  local_sightseeing INTEGER DEFAULT 0,
  airport_transfer INTEGER DEFAULT 0,
  njp_transfer INTEGER DEFAULT 0,
  railway_transfer INTEGER DEFAULT 0,
  intercity_transfer INTEGER DEFAULT 0,
  special_honeymoon INTEGER DEFAULT 0,
  special_birthday INTEGER DEFAULT 0,
  special_anniversary INTEGER DEFAULT 0,
  special_child_friendly INTEGER DEFAULT 0,
  special_senior_citizen INTEGER DEFAULT 0,
  special_wheelchair INTEGER DEFAULT 0,
  special_vegetarian INTEGER DEFAULT 0,
  special_early_checkin INTEGER DEFAULT 0,
  special_late_checkout INTEGER DEFAULT 0,
  special_mountain_view INTEGER DEFAULT 0,
  special_driver_pref TEXT,
  special_other_req TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  budget_type TEXT CHECK (budget_type IN ('per_person','total_trip')) DEFAULT 'total_trip',
  next_followup_date TEXT,
  next_followup_time TEXT,
  next_followup_type TEXT CHECK (next_followup_type IN ('call','whatsapp','email','meeting','other')),
  next_followup_by_employee_id INTEGER REFERENCES users(id),
  next_followup_note TEXT,
  customer_facing_notes TEXT,
  internal_notes TEXT,
  lost_reason TEXT,
  lost_note TEXT,
  cancelled_at TEXT,
  cancelled_reason TEXT,
  refund_amount INTEGER,
  refund_status TEXT,
  cancellation_note TEXT,
  trip_completed_at TEXT,
  customer_feedback_status TEXT,
  customer_feedback_rating INTEGER,
  customer_feedback_comment TEXT,
  feedback_followup_required INTEGER DEFAULT 0,
  page_url TEXT,
  referrer TEXT,
  received_at TEXT,
  created_by INTEGER REFERENCES users(id),
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')),
  updated_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

-- ---------- quotations ----------
CREATE TABLE IF NOT EXISTS quotations (
  id SERIAL PRIMARY KEY,
  reference TEXT UNIQUE NOT NULL,
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  version TEXT,
  status TEXT CHECK (status IN (
    'draft','sent','viewed','revised','accepted','rejected','expired'
  )) DEFAULT 'draft',
  quotation_date TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')),
  valid_until TEXT,
  prepared_by INTEGER REFERENCES users(id),
  subtotal INTEGER DEFAULT 0,
  discount INTEGER DEFAULT 0,
  tax INTEGER DEFAULT 0,
  final_amount INTEGER DEFAULT 0,
  notes TEXT,
  terms TEXT,
  sent_via TEXT,
  viewed_at TEXT,
  accepted_at TEXT,
  rejected_at TEXT,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')),
  updated_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('hotel','transport','sightseeing','other')) NOT NULL,
  description TEXT NOT NULL,
  details TEXT,
  quantity INTEGER DEFAULT 1,
  amount INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

-- ---------- payments / followups / tasks ----------
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  amount INTEGER NOT NULL,
  payment_date TEXT NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash','upi','bank_transfer','card','other')) NOT NULL,
  transaction_id TEXT,
  note TEXT,
  recorded_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE IF NOT EXISTS followups (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  scheduled_date TEXT NOT NULL,
  scheduled_time TEXT,
  followup_type TEXT CHECK (followup_type IN ('call','whatsapp','email','meeting','other')) NOT NULL,
  assigned_to INTEGER REFERENCES users(id),
  note TEXT,
  status TEXT CHECK (status IN ('pending','completed','missed')) DEFAULT 'pending',
  completed_at TEXT,
  completed_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to INTEGER REFERENCES users(id),
  priority TEXT CHECK (priority IN ('low','medium','high','urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending','in_progress','completed')) DEFAULT 'pending',
  due_date TEXT,
  completed_at TEXT,
  completed_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

-- ---------- activities / communications / documents / itinerary ----------
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id),
  customer_id INTEGER REFERENCES customers(id),
  user_id INTEGER REFERENCES users(id),
  activity_type TEXT NOT NULL,
  description TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE IF NOT EXISTS communications (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id),
  communication_type TEXT CHECK (communication_type IN ('call','whatsapp','email','meeting')) NOT NULL,
  occurred_at TEXT NOT NULL,
  subject TEXT,
  outcome TEXT,
  summary TEXT,
  recorded_by INTEGER REFERENCES users(id),
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER REFERENCES trips(id),
  customer_id INTEGER REFERENCES customers(id),
  document_type TEXT CHECK (document_type IN (
    'id_proof','passport','visa','permit','ticket','hotel_voucher',
    'payment_receipt','quotation','invoice','itinerary','other'
  )),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE IF NOT EXISTS itinerary_days (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date TEXT,
  location TEXT,
  activities TEXT,
  hotel TEXT,
  meals TEXT,
  transport TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

-- ---------- hotels / suppliers / drivers ----------
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('hotel','driver','vehicle_owner','transport_company','local_agent','activity_provider','other')),
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  location TEXT,
  notes TEXT,
  internal_rating INTEGER,
  status TEXT CHECK (status IN ('active','inactive')) DEFAULT 'active',
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE IF NOT EXISTS hotels (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  destination TEXT NOT NULL,
  category TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  room_types TEXT,
  meal_plans TEXT,
  notes TEXT,
  supplier_id INTEGER REFERENCES suppliers(id),
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

CREATE TABLE IF NOT EXISTS drivers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  vehicle_type TEXT,
  vehicle_number TEXT,
  destination_route TEXT,
  availability TEXT,
  assigned_trip_id INTEGER REFERENCES trips(id),
  notes TEXT,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

-- ---------- audit ----------
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id INTEGER,
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_trips_customer_id ON trips(customer_id);
CREATE INDEX IF NOT EXISTS idx_trips_assigned_employee_id ON trips(assigned_employee_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_reference ON trips(reference);
CREATE INDEX IF NOT EXISTS idx_quotations_trip_id ON quotations(trip_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_payments_trip_id ON payments(trip_id);
CREATE INDEX IF NOT EXISTS idx_followups_trip_id ON followups(trip_id);
CREATE INDEX IF NOT EXISTS idx_followups_scheduled_date ON followups(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_trip_id ON tasks(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_trip_id ON activities(trip_id);
CREATE INDEX IF NOT EXISTS idx_activities_customer_id ON activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_documents_trip_id ON documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_days_trip_id ON itinerary_days(trip_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ---------- Row Level Security ----------
-- The Next.js server is the only CRM client. It authenticates via its own
-- session cookie (src/lib/crm/auth.ts) and role permissions
-- (src/lib/crm/permissions.ts), and connects with the privileged Postgres
-- role from DATABASE_URL. RLS stays enabled so the tables are closed to
-- anon/authenticated Supabase API access from the browser.
ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips            ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotation_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE followups        ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks            ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE itinerary_days   ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;
