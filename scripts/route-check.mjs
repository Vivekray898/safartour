#!/usr/bin/env node
/**
 * Route-level smoke test for the whole app.
 *
 *   node --env-file=.env.local scripts/route-check.mjs [baseUrl]
 *
 * Verifies:
 *  - every CRM page loads (auth) and redirects to login when logged out
 *  - /crm/leads/new works and /crm/leads/abc 404s (no Postgres cast errors)
 *  - API routes validate ids (400) instead of 500ing
 *  - CRM pages never contain public-site chrome and vice versa
 */
const BASE = process.argv[2] || process.env.BASE_URL || 'http://localhost:50770';
const EMAIL = process.env.CRM_EMAIL || 'enquiry@safartour.in';
const PASS = process.env.CRM_PASS || 'admin123';

let cookie = '';
let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${extra}`); }
};

async function req(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual',
  });
  for (const c of res.headers.getSetCookie?.() || []) {
    if (c.startsWith('crm_session=')) cookie = c.split(';')[0];
  }
  const text = await res.text();
  return { status: res.status, location: res.headers.get('location'), text };
}

console.log('— logged out —');
let r = await req('/crm');
// With PPR-style streaming the shell may flush as 200 and the redirect is
// delivered inside the body (browsers follow it) — accept either shape.
ok('/crm sends unauthenticated user to /crm/login',
  (r.status >= 300 && r.status < 400 && r.location === '/crm/login') ||
  (r.status === 200 && r.text.includes('crm/login')),
  `${r.status} ${r.location ?? ''}`);

r = await req('/crm/login');
ok('/crm/login loads (no chrome, no redirect)', r.status === 200 && !r.text.includes('href="/packages"'));

console.log('— login —');
r = await req('/crm/api/auth/login', { method: 'POST', body: { email: EMAIL, password: PASS } });
ok('login ok', r.status === 200);

console.log('— CRM pages (authenticated) —');
const pages = [
  '/crm', '/crm/customers', '/crm/leads', '/crm/leads/new', '/crm/leads/quick',
  '/crm/quotations', '/crm/payments', '/crm/tasks', '/crm/followups',
  '/crm/documents', '/crm/itineraries', '/crm/hotels', '/crm/suppliers',
  '/crm/drivers', '/crm/reports', '/crm/settings',
  '/crm/customers/1', '/crm/leads/1', '/crm/quotations/1',
  '/crm/leads?status=booked', '/crm/leads?status=active&priority=high&source=website',
  '/crm/customers?search=a', '/crm/hotels?search=a', '/crm/customers?page=1',
];
for (const p of pages) {
  r = await req(p);
  ok(`GET ${p}`, r.status === 200, `→ ${r.status}`);
}

console.log('— CRM chrome separation —');
r = await req('/crm');
ok('dashboard has no public nav', !r.text.includes('href="/packages"') && !r.text.includes('href="/gallery"'));
ok('dashboard has CRM rail', r.text.includes('href="/crm/leads"') && r.text.includes('href="/crm/settings"'));
r = await req('/crm/login');
ok('login has no public nav or footer', !r.text.includes('href="/packages"') && !r.text.includes('href="/privacy-policy"'));

console.log('— invalid ids —');
r = await req('/crm/leads/new');
ok('/crm/leads/new renders form', r.status === 200 && r.text.includes('New Lead'));
// notFound() after the shell flush streams the 404 UI in a 200 response —
// browsers still show the 404 page; assert the payload is the 404 UI.
const is404 = (res) => res.status === 404 || (res.status === 200 && res.text.includes('Not Found'));
r = await req('/crm/leads/abc');
ok('/crm/leads/abc → 404 UI', is404(r), `→ ${r.status}`);
r = await req('/crm/customers/abc');
ok('/crm/customers/abc → 404 UI', is404(r), `→ ${r.status}`);
r = await req('/crm/quotations/abc');
ok('/crm/quotations/abc → 404 UI', is404(r), `→ ${r.status}`);
r = await req('/crm/api/trips/abc');
ok('API /crm/api/trips/abc → 400', r.status === 400, `→ ${r.status}`);
r = await req('/crm/api/customers/abc');
ok('API /crm/api/customers/abc → 400', r.status === 400, `→ ${r.status}`);

console.log('— public site —');
r = await req('/');
ok('homepage 200 with site chrome', r.status === 200 && r.text.includes('href="/packages"') && r.text.includes('href="/privacy-policy"'));
r = await req('/packages');
ok('/packages 200', r.status === 200);
r = await req('/car-rentals');
ok('/car-rentals 200', r.status === 200);
r = await req('/contact');
ok('/contact 200', r.status === 200);

console.log('— logged out API —');
const saved = cookie;
cookie = '';
r = await req('/crm/api/customers');
ok('API rejects without session', r.status === 401);
cookie = saved;

console.log(`\nRESULT: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
