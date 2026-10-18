-- Safar Tours CRM — disable the known demo password on already-seeded databases
--
-- This migration is intentionally narrow: it only changes the two seed account
-- addresses. Review these addresses with the owner before applying it, then
-- provision replacement accounts with scripts/create-crm-user.mjs.

UPDATE users
SET password_hash = '!disabled!',
    is_active = 0,
    updated_at = to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')
WHERE email IN ('enquiry@safartour.in', 'rajesh@safartour.crm')
  AND is_active = 1;
