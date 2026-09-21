#!/usr/bin/env node
/**
 * End-to-end CRM smoke test (real HTTP + real Postgres verification).
 *
 *   pnpm build && pnpm start            # in one terminal
 *   node --env-file=.env.local scripts/e2e-crm.mjs
 *
 * Requires CRM_EMAIL / CRM_PASS (defaults: enquiry@safartour.in / admin123).
 * Leaves one archived test trip + customer behind (soft delete, no data destroyed).
 */
import postgres from 'postgres';

const BASE = process.env.BASE_URL || 'http://localhost:50760';
const EMAIL = process.env.CRM_EMAIL || 'enquiry@safartour.in';
const PASS = process.env.CRM_PASS || 'admin123';
const STAMP = Date.now();

const sql = postgres(process.env.DATABASE_URL, { prepare: false, max: 1 });
let cookie = '';
let pass = 0, fail = 0;

const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
};

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  if (res.headers.getSetCookie) {
    for (const c of res.headers.getSetCookie()) {
      if (c.startsWith('crm_session=')) cookie = c.split(';')[0];
    }
  }
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* non-JSON */ }
  return { status: res.status, json, text };
}

const one = async (q, ...p) => (await sql`${sql(q, ...p)}`)[0]; // helper not used; kept simple below

console.log('— auth —');
const bad = await api('POST', '/crm/api/auth/login', { email: EMAIL, password: 'wrong' });
ok('wrong password rejected', bad.status === 401);

const login = await api('POST', '/crm/api/auth/login', { email: EMAIL, password: PASS });
ok('login succeeds', login.status === 200 && cookie.includes('crm_session='));

const noauth = await fetch(BASE + '/crm/api/customers', { redirect: 'manual' });
ok('API requires session', noauth.status === 401);

console.log('— customers —');
const cust = await api('POST', '/crm/api/customers', {
  name: `E2E Customer ${STAMP}`, phone: `900000${`${STAMP}`.slice(-5)}`,
  email: `e2e${STAMP}@test.local`, city: 'Siliguri',
});
ok('create customer', cust.status === 200 || cust.status === 201);
const custRow = await sql`SELECT id, name, archived FROM customers WHERE name = ${`E2E Customer ${STAMP}`} ORDER BY id DESC LIMIT 1`;
ok('customer persisted in Postgres', custRow.length === 1);
const customerId = custRow[0]?.id;

const got = await api('GET', `/crm/api/customers/${customerId}`);
ok('read customer via API', got.status === 200 && JSON.stringify(got.json).includes(`E2E Customer ${STAMP}`));

const put = await api('PUT', `/crm/api/customers/${customerId}`, { name: `E2E Renamed ${STAMP}`, city: 'Gangtok' });
ok('edit customer', put.status === 200);
const renamed = await sql`SELECT name FROM customers WHERE id = ${customerId}`;
ok('customer edit persisted', renamed[0]?.name === `E2E Renamed ${STAMP}`);

console.log('— trips (leads) —');
const trip = await api('POST', '/crm/api/trips', {
  customer_id: customerId, destination: 'E2E Gangtok', adults: 2, children_5_12: 1,
  start_date: '2026-10-01', end_date: '2026-10-05', lead_source: 'website',
  trip_type: 'custom_trip', group_type: 'family',
});
ok('create trip/lead', trip.status === 200 || trip.status === 201);
const tripRow = await sql`SELECT id, reference, archived FROM trips WHERE destination = 'E2E Gangtok' ORDER BY id DESC LIMIT 1`;
ok('trip persisted with reference', tripRow.length === 1 && !!tripRow[0]?.reference);
const tripId = tripRow[0]?.id;

if (!customerId || !tripId) {
  console.log(`FATAL: setup incomplete (customer=${customerId}, trip=${tripId})`);
  process.exit(1);
}

const tput = await api('PUT', `/crm/api/trips/${tripId}`, { destination: 'E2E Pelling', priority: 'high' });
ok('edit trip', tput.status === 200);
const trow = await sql`SELECT destination, priority FROM trips WHERE id = ${tripId}`;
ok('trip edit persisted', trow[0]?.destination === 'E2E Pelling' && trow[0]?.priority === 'high');

const st = await api('POST', `/crm/api/trips/${tripId}/status`, { status: 'contacted', note: 'e2e status change' });
ok('update trip status', st.status === 200);
const srow = await sql`SELECT status FROM trips WHERE id = ${tripId}`;
ok('status persisted', srow[0]?.status === 'contacted');

console.log('— quotations + payments (totals) —');
const quote = await api('POST', '/crm/api/quotations', {
  trip_id: tripId,
  items: [ { category: 'hotel', description: 'Hotel', quantity: 3, amount: 2000 }, { category: 'transport', description: 'Cab', quantity: 1, amount: 5000 } ],
  discount: 1000, tax: 500,
});
ok('create quotation (11k - 1k + 500)', quote.status === 200 || quote.status === 201);
const qrow = await sql`SELECT id, subtotal, discount, tax, final_amount FROM quotations WHERE trip_id = ${tripId} ORDER BY id DESC LIMIT 1`;
const qTotal = Number(qrow[0]?.final_amount ?? 0);
ok('quotation total computed = 10500', qTotal === 10500, `got ${qTotal} (${JSON.stringify(qrow[0] ?? null)})`);

const pay = await api('POST', '/crm/api/payments', {
  trip_id: tripId, amount: 2500, payment_date: '2026-09-20', payment_method: 'upi', note: 'e2e advance',
});
ok('record payment', pay.status === 200 || pay.status === 201);
const prow = await sql`SELECT COALESCE(SUM(amount),0) AS paid FROM payments WHERE trip_id = ${tripId}`;
ok('paid total = 2500', Number(prow[0]?.paid) === 2500, `got ${prow[0]?.paid}`);
const plist = await api('GET', '/crm/api/payments');
ok('payments API lists the payment', plist.status === 200 && JSON.stringify(plist.json).includes('2500'));

console.log('— tasks + followups + dashboard —');
const task = await api('POST', '/crm/api/tasks', {
  trip_id: tripId, title: `E2E Task ${STAMP}`, priority: 'high', due_date: '2026-09-25',
});
ok('create task', task.status === 200 || task.status === 201);
const trow2 = await sql`SELECT id FROM tasks WHERE title = ${`E2E Task ${STAMP}`} ORDER BY id DESC LIMIT 1`;
const taskId = trow2[0]?.id;
const done = await api('PUT', `/crm/api/trips/${tripId}/tasks?taskId=${taskId}`, {});
ok('complete task', done.status === 200);
const drow = await sql`SELECT status, completed_at FROM tasks WHERE id = ${taskId}`;
ok('task completion persisted', drow[0]?.status === 'completed' && !!drow[0]?.completed_at);

const fu = await api('POST', '/crm/api/followups', {
  trip_id: tripId, scheduled_date: '2026-09-21', scheduled_time: '10:30',
  followup_type: 'call', note: 'e2e followup',
});
ok('create followup', fu.status === 200 || fu.status === 201);
const frow = await sql`SELECT id, status FROM followups WHERE trip_id = ${tripId} ORDER BY id DESC LIMIT 1`;
ok('followup persisted', frow.length === 1);

const act = await sql`SELECT COUNT(*)::int AS n FROM activities WHERE trip_id = ${tripId}`;
ok('activity timeline auto-logged', Number(act[0]?.n) >= 3, `got ${act[0]?.n}`);

const dash = await api('GET', '/crm/api/dashboard');
ok('dashboard API from live data', dash.status === 200 && dash.json !== null);

console.log('— hotels / suppliers / drivers (new CRUD) —');
const sup = await api('POST', '/crm/api/suppliers', { name: `E2E Supplier ${STAMP}`, type: 'transport_company', phone: '9000000000', location: 'Siliguri' });
ok('create supplier', sup.status === 201 || sup.status === 200);
const supRow = await sql`SELECT id FROM suppliers WHERE name = ${`E2E Supplier ${STAMP}`} ORDER BY id DESC LIMIT 1`;
const supplierId = supRow[0]?.id;
ok('supplier persisted', !!supplierId);

const supPut = await api('PUT', `/crm/api/suppliers/${supplierId}`, { name: `E2E Supplier Renamed ${STAMP}`, type: 'transport_company', status: 'active' });
ok('edit supplier', supPut.status === 200);

const hotel = await api('POST', '/crm/api/hotels', { name: `E2E Hotel ${STAMP}`, destination: 'Darjeeling', category: 'Deluxe', supplier_id: supplierId, is_active: true });
ok('create hotel', hotel.status === 201 || hotel.status === 200);
const hotelRow = await sql`SELECT id, supplier_id FROM hotels WHERE name = ${`E2E Hotel ${STAMP}`} ORDER BY id DESC LIMIT 1`;
const hotelId = hotelRow[0]?.id;
ok('hotel persisted with supplier link', !!hotelId && Number(hotelRow[0]?.supplier_id) === Number(supplierId));

const hotelPut = await api('PUT', `/crm/api/hotels/${hotelId}`, { name: `E2E Hotel Renamed ${STAMP}`, destination: 'Darjeeling', is_active: true });
ok('edit hotel', hotelPut.status === 200);

const drv = await api('POST', '/crm/api/drivers', { name: `E2E Driver ${STAMP}`, phone: '9800000000', vehicle_type: 'Innova', vehicle_number: 'WB-E2E-001', availability: 'available' });
ok('create driver', drv.status === 201 || drv.status === 200);
const drvRow = await sql`SELECT id FROM drivers WHERE name = ${`E2E Driver ${STAMP}`} ORDER BY id DESC LIMIT 1`;
const driverId = drvRow[0]?.id;
ok('driver persisted', !!driverId);
const drvPut = await api('PUT', `/crm/api/drivers/${driverId}`, { name: `E2E Driver Renamed ${STAMP}`, availability: 'on_trip' });
ok('edit driver', drvPut.status === 200);

console.log('— quotation duplicate + tax_rate —');
const dup = await api('POST', '/crm/api/quotations', { duplicateOf: Number(qrow[0]?.id) });
ok('duplicate quotation', dup.status === 201 || dup.status === 200);
const dupRow = await sql`SELECT id, reference, status, subtotal, final_amount, tax_rate FROM quotations WHERE trip_id = ${tripId} ORDER BY id DESC LIMIT 1`;
ok('duplicate is a fresh draft with same amounts',
  dupRow.length === 1 && dupRow[0]?.status === 'draft' && Number(dupRow[0]?.subtotal) === 11000 && Number(dupRow[0]?.final_amount) === 10500,
  JSON.stringify(dupRow[0] ?? null));

const qWithTax = await api('POST', '/crm/api/quotations', {
  trip_id: tripId,
  items: [ { category: 'other', description: 'Package', quantity: 1, amount: 10000 } ],
  discount: 0, tax_rate: 5,
});
ok('create quotation with GST 5%', qWithTax.status === 200 || qWithTax.status === 201);
const qTaxRow = await sql`SELECT subtotal, tax, tax_rate, final_amount FROM quotations WHERE trip_id = ${tripId} ORDER BY id DESC LIMIT 1`;
ok('GST snapshot = 500 on 10000 @5%',
  Number(qTaxRow[0]?.tax) === 500 && Number(qTaxRow[0]?.tax_rate) === 5 && Number(qTaxRow[0]?.final_amount) === 10500,
  JSON.stringify(qTaxRow[0] ?? null));

console.log('— settings: company profile —');
const settingsGet = await api('GET', '/crm/api/settings');
ok('settings includes company profile', settingsGet.status === 200 && settingsGet.json?.company?.company_name !== undefined);
const settingsSet = await api('POST', '/crm/api/settings', { action: 'updateCompany', values: { company_name: 'Safar Tours', phone: '+91 98765 43210', gst_rate: 5 } });
ok('update company profile', settingsSet.status === 200 && settingsSet.json?.ok === true);

console.log('— PDF generation —');
const pdfRes = await fetch(`${BASE}/crm/api/quotations/${qrow[0]?.id}/pdf`, { headers: { Cookie: cookie } });
const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
ok('PDF endpoint returns a real PDF', pdfRes.status === 200 && pdfBuf.subarray(0, 4).toString('ascii') === '%PDF', `status=${pdfRes.status} bytes=${pdfBuf.length}`);
ok('PDF has substantial content', pdfBuf.length > 5000, `bytes=${pdfBuf.length}`);
const pdfInline = await fetch(`${BASE}/crm/api/quotations/${qrow[0]?.id}/pdf?inline=1`, { headers: { Cookie: cookie } });
ok('inline PDF preview mode works', pdfInline.status === 200 && (pdfInline.headers.get('content-disposition') || '').includes('inline'));

console.log('— cleanup (soft archive only) —');
await api('DELETE', `/crm/api/hotels/${hotelId}`);
await api('DELETE', `/crm/api/suppliers/${supplierId}`);
await api('DELETE', `/crm/api/drivers/${driverId}`);
await api('DELETE', `/crm/api/trips/${tripId}`);
await api('DELETE', `/crm/api/customers/${customerId}`);
const arch = await sql`SELECT (SELECT archived FROM trips WHERE id = ${tripId}) AS t, (SELECT archived FROM customers WHERE id = ${customerId}) AS c, (SELECT archived FROM hotels WHERE id = ${hotelId}) AS h, (SELECT archived FROM suppliers WHERE id = ${supplierId}) AS s, (SELECT archived FROM drivers WHERE id = ${driverId}) AS d`;
ok('trip + customer + hotel + supplier + driver archived (data preserved)',
  Number(arch[0]?.t) === 1 && Number(arch[0]?.c) === 1 && Number(arch[0]?.h) === 1 && Number(arch[0]?.s) === 1 && Number(arch[0]?.d) === 1);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
await sql.end({ timeout: 5 });
process.exit(fail === 0 ? 0 : 1);
