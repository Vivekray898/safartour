#!/usr/bin/env node
/**
 * One-time import of Google Sheets enquiries into the CRM.
 *
 * The website used to write enquiries to a Google Sheet instead of the CRM
 * (migration 001's `trips` table has been sitting empty). This turns that
 * exported CSV into customers + trips so the history is not lost.
 *
 *   # 1. export the Sheet: File -> Download -> Comma-separated values (.csv)
 *   # 2. preview first — touches nothing, needs no database:
 *   node --env-file=.env.local scripts/import-sheets-leads.mjs leads.csv --dry-run
 *
 *   # 3. import for real:
 *   node --env-file=.env.local scripts/import-sheets-leads.mjs leads.csv
 *
 * Behaviour
 * ---------
 * * Phone numbers are normalised to E.164 (+91 by default) and used to dedupe:
 *   a repeat enquiry attaches to the existing customer instead of creating a
 *   second one. This is the same rule Phase 2 puts in /api/leads.
 * * Rows without a usable name or phone are skipped and reported.
 * * Idempotent: re-running does not duplicate, because the phone is the key.
 *
 * Uses the SECRET key on purpose — this is a one-off operator script with no
 * signed-in user, which is exactly the narrow case where bypassing RLS is
 * correct.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const args = process.argv.slice(2)
const csvPath = args.find((a) => !a.startsWith('--'))
const dryRun = args.includes('--dry-run')

if (!csvPath) {
  console.error(
    'Usage:\n' +
      '  node --env-file=.env.local scripts/import-sheets-leads.mjs <file.csv> [--dry-run]',
  )
  process.exit(1)
}

// ---------- CSV parsing ----------
/** Minimal RFC-4180 parser: handles quoted fields, escaped quotes and newlines. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  // Strip a UTF-8 BOM, which Sheets adds and which corrupts the first header.
  text = text.replace(/^﻿/, '')

  for (let i = 0; i < text.length; i++) {
    const c = text[i]

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }

    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''))
}

/** Google Sheets writes a header row; match on it but tolerate any casing. */
function toObjects(rows) {
  if (!rows.length) return []
  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((r) => {
    const o = {}
    headers.forEach((h, i) => {
      o[h] = (r[i] ?? '').trim()
    })
    return o
  })
}

/** Pick the first non-empty value among several possible column names. */
function pick(row, ...names) {
  for (const n of names) {
    for (const key of Object.keys(row)) {
      if (key.toLowerCase() === n.toLowerCase() && row[key]) return row[key]
    }
  }
  return ''
}

/**
 * Normalise to E.164. Indian numbers land as +91XXXXXXXXXX.
 * Returns '' when the input cannot be a phone number at all.
 *
 * Handles the shapes Indians actually type:
 *   9876543210     -> +919876543210   (10 digits)
 *   09876543210    -> +919876543210   (leading 0 is trunk prefix, not part of the number)
 *   +91 98765 43210-> +919876543210  (already has the country code)
 *   98765-43210    -> +919876543210   (spaces and dashes are noise)
 */
export function normalisePhone(raw, defaultCountry = '91') {
  if (!raw) return ''
  let digits = raw.replace(/\D/g, '')
  if (digits.length < 8 || digits.length > 15) return ''

  // Strip leading zeros. An E.164 country code never starts with 0, so any
  // leading 0 is national trunk prefix, not part of the number:
  //   11 digits + 0 -> mobile typed with a leading zero (09876543211)
  //   10 digits + 0 -> landline, STD code + subscriber (0354 123456)
  // Without this, 09876543211 would become +09876543211 — invalid E.164,
  // and it would not match 9876543211, so dedup would silently fail.
  digits = digits.replace(/^0+/, '')

  // Stripping may have left too little to be a number.
  if (digits.length < 8 || digits.length > 15) return ''

  // Already carries a country code.
  if (digits.length > 10) return `+${digits}`
  return `+${defaultCountry}${digits}`
}

const FORM_TYPE_TO_TRIP_TYPE = {
  tour: 'package',
  car: 'car_rental',
  car_rental: 'car_rental',
  transfer: 'airport_transfer',
  contact: 'other',
}

function mapRow(row) {
  const name = pick(row, 'name', 'full name', 'customer name')
  const phone = normalisePhone(pick(row, 'phone', 'mobile', 'contact number'))
  const email = pick(row, 'email', 'e-mail')
  const destination = pick(row, 'destination', 'place', 'city')
  const travelDate = pick(row, 'traveldate', 'travel date', 'date')
  const travellers = pick(row, 'travellers', 'travelers', 'pax', 'people')
  const pkg = pick(row, 'package', 'vehicle', 'package / vehicle', 'package/vehicle')
  const message = pick(row, 'message', 'notes', 'comment')
  const page = pick(row, 'page', 'page url', 'source page', 'landing page')
  const receivedAt = pick(row, 'receivedat', 'received at', 'date received', 'timestamp')
  const formType = (pick(row, 'formtype', 'form type', 'type') || 'tour').toLowerCase()

  const notes = [message, pkg ? `Interested in: ${pkg}` : '', destination ? `Destination: ${destination}` : '']
    .filter(Boolean)
    .join('\n')

  return {
    name,
    phone,
    email,
    customer: { name, phone, whatsapp: phone, email, city: '' },
    trip: {
      destination,
      trip_type: FORM_TYPE_TO_TRIP_TYPE[formType] || 'other',
      start_date: travelDate,
      total_pax: /^\d+$/.test(travellers) ? Number(travellers) : null,
      adults: /^\d+$/.test(travellers) ? Number(travellers) : null,
      customer_facing_notes: notes || null,
      page_url: page || null,
      received_at: receivedAt || null,
      lead_source: 'website',
      status: 'new',
    },
    valid: Boolean(name && phone),
  }
}

// ---------- run ----------
const rows = toObjects(parseCsv(readFileSync(csvPath, 'utf8')))
const mapped = rows.map(mapRow)
const usable = mapped.filter((m) => m.valid)
const skipped = mapped.filter((m) => !m.valid)

const uniquePhones = new Set(usable.map((m) => m.phone))
const duplicateRows = usable.length - uniquePhones.size

console.log(`Rows in CSV:      ${rows.length}`)
console.log(`Usable:           ${usable.length}`)
console.log(`Skipped:          ${skipped.length}${skipped.length ? ' (missing name or valid phone)' : ''}`)
console.log(`Unique phones:    ${uniquePhones.size}`)
console.log(`Repeat enquiries: ${duplicateRows} (attach to the existing customer)`)

if (skipped.length) {
  console.log('\nFirst few skipped rows:')
  for (const s of skipped.slice(0, 5)) {
    console.log(`  name=${JSON.stringify(s.name)} phone=${JSON.stringify(s.phone)}`)
  }
}

if (dryRun) {
  console.log('\nDRY RUN — nothing was written.')
  console.log('\nFirst 3 records that would be created:')
  for (const m of usable.slice(0, 3)) {
    console.log(
      `  ${m.customer.name} <${m.phone}> -> ${m.trip.destination || '?'} (${m.trip.trip_type})`,
    )
  }
  process.exit(0)
}

// ---------- write ----------
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY
if (!url || !secretKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY. ' +
      'Did you mean to run --dry-run first?',
  )
  process.exit(1)
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Load existing phones once, so repeat runs do not duplicate.
const phoneToCustomer = new Map()
const { data: existing, error: readErr } = await supabase
  .from('customers')
  .select('id, phone, name')
  .not('phone', 'is', null)

if (readErr) {
  console.error('Could not read existing customers:', readErr.message)
  process.exit(1)
}
for (const c of existing || []) phoneToCustomer.set(c.phone, c)
console.log(`\nExisting customers in CRM: ${phoneToCustomer.size}`)

let createdCustomers = 0
let reusedCustomers = 0
let createdTrips = 0
const failures = []

// Sequential on purpose: it keeps a duplicate phone from racing with itself.
for (const [i, m] of usable.entries()) {
  try {
    let customerId = phoneToCustomer.get(m.phone)?.id

    if (customerId) {
      reusedCustomers++
    } else {
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...m.customer, created_at: new Date().toISOString() })
        .select('id')
        .single()
      if (error) throw new Error(`customer: ${error.message}`)
      customerId = data.id
      phoneToCustomer.set(m.phone, { id: customerId })
      createdCustomers++
    }

    // Trip reference, matching the ST-YYYY-NNNNN shape the CRM expects.
    const year = new Date().getFullYear()
    const { data: maxRow } = await supabase
      .from('trips')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    const seq = String((maxRow?.id ?? 0) + i + 1).padStart(5, '0')

    const { error: tripErr } = await supabase.from('trips').insert({
      reference: `ST-${year}-${seq}`,
      customer_id: customerId,
      ...m.trip,
      created_at: new Date().toISOString(),
    })
    if (tripErr) throw new Error(`trip: ${tripErr.message}`)
    createdTrips++

    await supabase.from('activities').insert({
      trip_id: null,
      customer_id: customerId,
      activity_type: 'lead_created',
      description: 'Imported from Google Sheets',
      metadata: JSON.stringify({ source: 'google_sheets_import', page: m.trip.page_url }),
    })
  } catch (err) {
    failures.push({ row: i + 2, name: m.customer.name, phone: m.phone, error: err.message })
  }

  if ((i + 1) % 25 === 0) console.log(`  …${i + 1}/${usable.length}`)
}

console.log('\n================ IMPORT COMPLETE ================')
console.log(`Customers created:  ${createdCustomers}`)
console.log(`Customers reused:   ${reusedCustomers}  (repeat enquiries)`)
console.log(`Trips created:      ${createdTrips}`)
console.log(`Failed rows:        ${failures.length}`)

if (failures.length) {
  console.log('\nFailures:')
  for (const f of failures.slice(0, 20)) {
    console.log(`  row ${f.row}: ${f.name} <${f.phone}> — ${f.error}`)
  }
  console.log('\nRe-run is safe: dedup is by phone.')
}

process.exit(failures.length ? 1 : 0)