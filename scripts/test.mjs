#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

async function read(relativePath) {
  return readFile(resolve(root, relativePath), 'utf8');
}

async function assertFile(relativePath) {
  await access(resolve(root, relativePath));
}

const requiredFiles = [
  'next.config.ts',
  'src/app/api/leads/route.ts',
  'src/app/crm/api/auth/login/route.ts',
  'src/app/api/leads/route.ts',
  'src/lib/crm/db.ts',
  'src/lib/crm/public-leads.ts',
  'src/lib/crm/login-rate-limit.ts',
  'supabase/migrations/007_disable_demo_credentials.sql',
  'supabase/migrations/008_harden_profile_updates.sql',
  'supabase/migrations/009_public_lead_intake.sql',
];

for (const file of requiredFiles) {
  await assertFile(file);
}

const quickLead = await read('src/app/crm/(protected)/leads/quick/page.tsx');
const dashboard = await read('src/app/crm/(protected)/page.tsx');
const followUpWidget = await read('src/components/crm/dashboard/FollowUpWidget.tsx');
const nextConfig = await read('next.config.ts');
const loginRoute = await read('src/app/crm/api/auth/login/route.ts');
const dbModule = await read('src/lib/crm/db.ts');
const leadRoute = await read('src/app/api/leads/route.ts');
const publicLead = await read('src/lib/crm/public-leads.ts');
const leadMigration = await read('supabase/migrations/009_public_lead_intake.sql');
const enquiryForm = await read('src/components/forms/EnquiryForm.tsx');

if (!quickLead.includes('router.push(`/crm/leads/${tripId}`)')) {
  throw new Error('Quick lead success navigation must use the numeric trip ID.');
}

if (!dashboard.includes('f.id, f.trip_id') || !followUpWidget.includes('href={`/crm/leads/${f.trip_id}`}')) {
  throw new Error('Follow-up dashboard navigation must use the related trip ID.');
}

for (const header of [
  'X-Content-Type-Options',
  'Referrer-Policy',
  'X-Frame-Options',
  'Permissions-Policy',
]) {
  if (!nextConfig.includes(header)) {
    throw new Error(`Missing baseline security header: ${header}`);
  }
}

for (const marker of ['crmLoginSchema', 'isLoginRateLimited', 'recordFailedLogin']) {
  if (!loginRoute.includes(marker)) {
    throw new Error(`Login route is missing ${marker}.`);
  }
}

if (!dbModule.includes('process.env.SUPABASE_DB_URL || process.env.DATABASE_URL')) {
  throw new Error('CRM database access must prefer the Supabase session-pooler URL.');
}

if (enquiryForm.includes('useState(() => crypto.randomUUID())')) {
  throw new Error('Enquiry form must not generate a random value during render.');
}

for (const marker of ['createPublicLead', 'submissionId']) {
  if (!leadRoute.includes(marker) && !publicLead.includes(marker)) {
    throw new Error(`Public lead intake is missing ${marker}.`);
  }
}

for (const marker of ['public_lead_receipts', 'create_public_lead', 'REVOKE ALL']) {
  if (!leadMigration.includes(marker)) {
    throw new Error(`Public lead migration is missing ${marker}.`);
  }
}

const credentialScanFiles = [
  'README.md',
  'supabase/README.md',
  'src/app/crm/(auth)/login/page.tsx',
  'scripts/route-check.mjs',
  'scripts/e2e-crm.mjs',
  'supabase/migrations/002_seed_data.sql',
];
const forbiddenCredential = ['admin', '123'].join('');

for (const file of credentialScanFiles) {
  if ((await read(file)).includes(forbiddenCredential)) {
    throw new Error(`Usable demo credential found in ${file}.`);
  }
}

console.log(`Static checks passed (${requiredFiles.length} required files, ${credentialScanFiles.length} credential scans).`);
