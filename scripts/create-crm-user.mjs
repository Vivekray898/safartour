#!/usr/bin/env node
import bcrypt from 'bcryptjs';
import postgres from 'postgres';

const [, , emailArg, nameArg, roleArg = 'employee'] = process.argv;
const email = emailArg?.trim().toLowerCase();
const name = nameArg?.trim();
const role = roleArg.trim().toLowerCase();
const password = process.env.CRM_BOOTSTRAP_PASSWORD;

const databaseUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('SUPABASE_DB_URL or DATABASE_URL is required. Load it from .env.local or the deployment environment.');
  process.exit(2);
}

if (!email || !name || !password || !['admin', 'employee'].includes(role)) {
  console.error('Usage: CRM_BOOTSTRAP_PASSWORD=<password> pnpm crm:user -- <email> <name> [admin|employee]');
  process.exit(2);
}

if (password.length < 12) {
  console.error('CRM_BOOTSTRAP_PASSWORD must be at least 12 characters.');
  process.exit(2);
}

const sql = postgres(databaseUrl, { prepare: false, max: 1 });

try {
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await sql`
    INSERT INTO users (name, email, password_hash, role, is_active)
    VALUES (${name}, ${email}, ${passwordHash}, ${role}, 1)
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      is_active = 1,
      updated_at = to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')
    RETURNING id, email, role
  `;

  console.log(`Provisioned CRM user ${user.email} with role ${user.role}.`);
} finally {
  await sql.end({ timeout: 5 });
}
