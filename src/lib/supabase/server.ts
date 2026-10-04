/**
 * Server Supabase clients.
 *
 * Two factories, per the current Supabase SSR docs:
 *
 *   createClient()               — cookie-based, carries the signed-in
 *                                  user's own session, so RLS applies.
 *                                  Use this for everything a signed-in user
 *                                  does: reading and writing CRM records.
 *
 *   createServiceRoleClient()    — bypasses RLS. Use ONLY for narrowly scoped
 *                                  server work with no user session: public
 *                                  form intake, cron jobs, admin scripts.
 *                                  Never pass this to the client or into a
 *                                  component.
 *
 * Trust rule: never read identity out of a raw cookie. Use
 * `getClaims()`, which verifies the JWT signature, or `getUser()` when you
 * genuinely need a fresh server-side copy of the user record.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function requireEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local (see .env.example).',
    )
  }

  return { url, publishableKey }
}

/**
 * Cookie-backed client that respects RLS.
 *
 * Uses `getAll` / `setAll` (the non-deprecated cookie API) so it works with
 * the Next.js 16 `proxy.ts` session refresh.
 */
export async function createClient() {
  const { url, publishableKey } = requireEnv()
  const cookieStore = await cookies()

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // Server Components cannot set cookies. The proxy refreshes the
          // session and writes the new cookies on the response, so this is
          // safe to ignore here — see src/lib/supabase/proxy.ts.
        }
      },
    },
  })
}

/**
 * Service-role client. Bypasses RLS by design.
 *
 * Server-only: this throws if it is ever imported into a browser bundle.
 */
export async function createServiceRoleClient() {
  const { url, publishableKey } = requireEnv()
  const secretKey = process.env.SUPABASE_SECRET_KEY

  if (!secretKey) {
    throw new Error(
      'SUPABASE_SECRET_KEY is not set. It is server-only and must never be ' +
        'exposed to the browser. See .env.example.',
    )
  }

  if (typeof window !== 'undefined') {
    throw new Error(
      'createServiceRoleClient() must never run in the browser.',
    )
  }

  // Auth is deliberately NOT persisted here: this client performs one-off
  // privileged work and must never become the ambient session of a request.
  return createServerClient(url, secretKey || publishableKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {
        // no-op on purpose
      },
    },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/**
 * The verified caller, or null.
 *
 * `getClaims()` validates the JWT signature on every call, so a forged cookie
 * cannot pass as another user. Prefer this over reading the cookie directly.
 */
export async function getUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims?.sub) return null
  return data.claims
}