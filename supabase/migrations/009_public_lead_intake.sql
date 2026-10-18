-- Safar Tours CRM — durable, idempotent public lead intake
--
-- The website calls this function with the server-only Supabase secret key.
-- It performs customer deduplication, trip creation, activity logging, and the
-- retry receipt in one transaction. The public API roles cannot execute it.

CREATE TABLE IF NOT EXISTS public.public_lead_receipts (
  idempotency_key TEXT PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  created_at TEXT NOT NULL DEFAULT to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')
);

ALTER TABLE public.public_lead_receipts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_public_lead(
  p_idempotency_key TEXT,
  p_form_type TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_destination TEXT,
  p_travel_date TEXT,
  p_travellers INTEGER,
  p_package TEXT,
  p_message TEXT,
  p_page TEXT
)
RETURNS TABLE (
  trip_id INTEGER,
  trip_reference TEXT,
  customer_id INTEGER,
  duplicate BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_receipt public.public_lead_receipts%ROWTYPE;
  existing_customer_id INTEGER;
  created_customer_id INTEGER;
  created_trip_id INTEGER;
  created_reference TEXT;
  next_number BIGINT;
  normalized_email TEXT := NULLIF(lower(trim(p_email)), '');
  normalized_phone TEXT := NULLIF(trim(p_phone), '');
  normalized_form_type TEXT := CASE WHEN p_form_type = 'car' THEN 'car' ELSE 'tour' END;
  normalized_pax INTEGER := GREATEST(COALESCE(p_travellers, 1), 1);
BEGIN
  IF length(trim(p_idempotency_key)) < 16 OR length(trim(p_idempotency_key)) > 128 THEN
    RAISE EXCEPTION 'Invalid lead idempotency key' USING ERRCODE = '22023';
  END IF;

  IF length(trim(p_name)) < 2 OR length(trim(p_name)) > 100 THEN
    RAISE EXCEPTION 'Invalid lead name' USING ERRCODE = '22023';
  END IF;

  IF normalized_phone IS NULL OR length(normalized_phone) > 32 THEN
    RAISE EXCEPTION 'Invalid lead phone' USING ERRCODE = '22023';
  END IF;

  IF length(trim(p_destination)) < 1 OR length(trim(p_destination)) > 200 THEN
    RAISE EXCEPTION 'Invalid lead destination' USING ERRCODE = '22023';
  END IF;

  -- Serialize public intake so dedupe and reference generation cannot race.
  PERFORM pg_advisory_xact_lock(hashtext('safartour:public-lead-intake'));

  SELECT * INTO existing_receipt
  FROM public.public_lead_receipts
  WHERE idempotency_key = trim(p_idempotency_key);

  IF FOUND THEN
    RETURN QUERY
      SELECT t.id, t.reference, t.customer_id, TRUE
      FROM public.trips t
      WHERE t.id = existing_receipt.trip_id;
    RETURN;
  END IF;

  SELECT c.id INTO existing_customer_id
  FROM public.customers c
  WHERE (normalized_phone IS NOT NULL AND c.phone = normalized_phone)
     OR (normalized_email IS NOT NULL AND lower(c.email) = normalized_email)
  ORDER BY c.id
  LIMIT 1
  FOR UPDATE;

  IF existing_customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, whatsapp, email, trip_count, is_repeat_customer)
    VALUES (trim(p_name), normalized_phone, normalized_phone, normalized_email, 0, 0)
    RETURNING id INTO created_customer_id;
  ELSE
    created_customer_id := existing_customer_id;
    UPDATE public.customers
    SET name = COALESCE(NULLIF(trim(name), ''), trim(p_name)),
        phone = COALESCE(phone, normalized_phone),
        whatsapp = COALESCE(whatsapp, normalized_phone),
        email = COALESCE(email, normalized_email),
        updated_at = to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')
    WHERE id = created_customer_id;
  END IF;

  SELECT COALESCE(MAX(NULLIF(substring(reference FROM '[0-9]+$'), '')::BIGINT), 0) + 1
  INTO next_number
  FROM public.trips;

  created_reference := 'ST-' || to_char(current_date, 'YYYY') || '-' || lpad(next_number::TEXT, 5, '0');

  INSERT INTO public.trips (
    reference, customer_id, status, priority, lead_source, destination,
    trip_type, start_date, adults, total_pax, customer_facing_notes,
    page_url, received_at, created_by
  ) VALUES (
    created_reference,
    created_customer_id,
    'new',
    'medium',
    'website',
    trim(p_destination),
    CASE WHEN normalized_form_type = 'car' THEN 'car_rental' ELSE 'package' END,
    NULLIF(trim(p_travel_date), ''),
    normalized_pax,
    normalized_pax,
    NULLIF(trim(concat_ws(E'\n', NULLIF(trim(p_package), ''), NULLIF(trim(p_message), ''))), ''),
    NULLIF(trim(p_page), ''),
    to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'),
    NULL
  )
  RETURNING id INTO created_trip_id;

  UPDATE public.customers
  SET trip_count = COALESCE(trip_count, 0) + 1,
      first_trip_at = COALESCE(first_trip_at, to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')),
      last_trip_at = to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS'),
      is_repeat_customer = CASE WHEN COALESCE(trip_count, 0) + 1 > 1 THEN 1 ELSE 0 END,
      updated_at = to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')
  WHERE id = created_customer_id;

  INSERT INTO public.activities (trip_id, customer_id, activity_type, description, metadata)
  VALUES (
    created_trip_id,
    created_customer_id,
    'lead_created',
    'Website enquiry received',
    jsonb_build_object('form_type', normalized_form_type, 'page', NULLIF(trim(p_page), ''), 'source', 'website')::TEXT
  );

  INSERT INTO public.public_lead_receipts (idempotency_key, trip_id)
  VALUES (trim(p_idempotency_key), created_trip_id);

  RETURN QUERY SELECT created_trip_id, created_reference, created_customer_id, FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_public_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.create_public_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.create_public_lead(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT, TEXT, TEXT) TO service_role;
