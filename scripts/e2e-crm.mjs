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

console.log('— cleanup (soft archive only) —');
await api('DELETE', `/crm/api/trips/${tripId}`);
await api('DELETE', `/crm/api/customers/${customerId}`);
const arch = await sql`SELECT (SELECT archived FROM trips WHERE id = ${tripId}) AS t, (SELECT archived FROM customers WHERE id = ${customerId}) AS c`;
ok('trip + customer archived (data preserved)', Number(arch[0]?.t) === 1 && Number(arch[0]?.c) === 1);

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
await sql.end({ timeout: 5 });
process.exit(fail === 0 ? 0 : 1);
