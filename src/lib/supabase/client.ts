/**
 * Browser Supabase client.
 *
 * Uses the PUBLISHABLE key only. Never import a secret key here — this file
 * runs in the browser and anything it reads ships to the client.
 *
 * Per the current Supabase SSR docs the browser client only ever needs the
 * publishable key; there is no secret in the browser by design.
 */
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (see .env.example).',
    )
  }

  return createBrowserClient(url, key)
}