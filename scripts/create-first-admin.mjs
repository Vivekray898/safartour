#!/usr/bin/env node
/**
 * Create the first CRM admin.
 *
 * The demo accounts seeded by supabase/migrations/002_seed_data.sql (both
 * published with the password `admin123`) are deleted by migration 006, so
 * nobody can log in until this script has been run.
 *
 *   node --env-file=.env.local scripts/create-first-admin.mjs \
 *     you@example.com 'a-strong-password' 'Your Name'
 *
 * Uses the Supabase Admin API with the SECRET key, so the user does not have
 * to exist first and public sign-ups can stay disabled in the dashboard.
 *
 * Safe to re-run: if the email already exists it updates the password and
 * re-promotes the profile rather than failing.
 */
import { createClient } from '@supabase/supabase-js'

const [, , email, password, fullName = ''] = process.argv

if (!email || !password) {
  console.error(
    'Usage:\n' +
      '  node --env-file=.env.local scripts/create-first-admin.mjs \\\n' +
      '    <email> <password> "<full name>"',
  )
  process.exit(1)
}

if (password.length < 12) {
  console.error('Refusing: use a password of at least 12 characters.')
  process.exit(1)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const secretKey = process.env.SUPABASE_SECRET_KEY

if (!url || !secretKey) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.\n' +
      'Add them to .env.local — see .env.example.',
  )
  process.exit(1)
}

const admin = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// 1. Find or create the auth user.
let userId = null
const { data: existing, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
})

if (listErr) {
  console.error('Could not list users:', listErr.message)
  process.exit(1)
}

const found = existing?.users?.find(
  (u) => (u.email || '').toLowerCase() === email.toLowerCase(),
)

if (found) {
  userId = found.id
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
  })
  if (error) {
    console.error('Could not update the existing user:', error.message)
    process.exit(1)
  }
  console.log(`✓ Updated existing user ${email}`)
} else {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email.split('@')[0] },
  })
  if (error) {
    console.error('Could not create the user:', error.message)
    process.exit(1)
  }
  userId = data.user.id
  console.log(`✓ Created user ${email}`)
}

// 2. The on_auth_user_created trigger (migration 005) creates the profile as
//    `staff`. Promote it to admin.
const { error: profileErr } = await admin
  .from('profiles')
  .upsert({ id: userId, full_name: fullName || email.split('@')[0], role: 'admin', active: 1 })
  .select('id')
  .single()

if (profileErr) {
  console.error(
    'User created, but the profile could not be promoted to admin:\n  ' +
      profileErr.message +
      '\nDid you apply supabase/migrations/005_auth_profiles_rls.sql?',
  )
  process.exit(1)
}

console.log(`✓ Profile promoted to admin for ${email}`)
console.log(`\nSign in at /crm/login with ${email}.`)
console.log('Next: create a staff account for each team member the same way,')
console.log('then set their role to staff in the profiles table if needed.')