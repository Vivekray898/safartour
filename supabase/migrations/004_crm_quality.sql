-- ============================================================
-- 004: CRM production-quality pass
-- ============================================================
-- 1. company_settings (singleton): branding, GST, banking, PDF footer,
--    quotation prefix. Read by the settings UI and the PDF generator.
-- 2. quotations.tax_rate: GST % snapshot so an old quotation's PDF never
--    changes when the global rate changes.
-- 3. archived on hotels/suppliers/drivers: soft delete, matching the
--    trips/customers design (historical references stay intact).
-- All statements are idempotent; existing data is preserved.

-- ---------- 1. company settings ----------
CREATE TABLE IF NOT EXISTS company_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),

  -- Company / branding
  company_name TEXT NOT NULL DEFAULT 'Safar Tours',
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,

  -- GST (optional)
  gst_enabled INTEGER NOT NULL DEFAULT 0,
  gst_rate INTEGER NOT NULL DEFAULT 5,
  gstin TEXT,
  gst_legal_name TEXT,
  gst_state TEXT,
  gst_state_code TEXT,

  -- Banking / payment details (optional)
  bank_name TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  upi_id TEXT,

  -- PDF footer content
  payment_terms TEXT,
  cancellation_policy TEXT,
  terms_conditions TEXT,
  pdf_footer_text TEXT,

  -- Quotation numbering prefix (QT-2026-0001 by default)
  quotation_prefix TEXT NOT NULL DEFAULT 'QT',

  updated_at TEXT DEFAULT (to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'))
);

INSERT INTO company_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "server only" ON company_settings;
CREATE POLICY "server only" ON company_settings FOR ALL USING (false) WITH CHECK (false);

-- ---------- 2. quotation tax snapshot ----------
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax_rate INTEGER NOT NULL DEFAULT 0;

-- ---------- 3. soft delete for catalog entities ----------
ALTER TABLE hotels    ADD COLUMN IF NOT EXISTS archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS archived INTEGER NOT NULL DEFAULT 0;
ALTER TABLE drivers   ADD COLUMN IF NOT EXISTS archived INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_hotels_archived    ON hotels(archived);
CREATE INDEX IF NOT EXISTS idx_suppliers_archived ON suppliers(archived);
CREATE INDEX IF NOT EXISTS idx_drivers_archived   ON drivers(archived);
