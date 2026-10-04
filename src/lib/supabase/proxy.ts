/**
 * Session refresh for the Next.js 16 `proxy.ts`.
 *
 * Server Components cannot write cookies, so a refreshed token has to be
 * written here, on the response, or a signed-in user is signed out after the
 * access token expires.
 *
 * `getClaims()` is used rather than `getSession()` on purpose: it verifies
 * the JWT signature. `getSession()` just reads the cookie, and "anyone can
 * forge the session cookie" — trusting it server-side would let an attacker
 * render another user's page.
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!url || !publishableKey) {
    // Supabase not configured yet (fresh clone, or Phase 1 not finished).
    // Pass through rather than throwing, so the public marketing site keeps
    // working. CRM routes are still protected by the per-page session check.
    return supabaseResponse
  }

  supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  // IMPORTANT: do not run code between createServerClient and getClaims() —
  // it can deadlock the refresh.
  // getClaims() returns the VERIFIED JWT payload, so `sub` is trustworthy.
  //
  // Wrapped in try/catch on purpose: if Supabase is unreachable, a visitor
  // who still holds a session cookie must not get a 500 for a public page.
  // On failure we pass through and let the page's own guard decide — the
  // per-page session check still protects /crm.
  let claims: { sub?: string } | null = null
  try {
    const result = await supabase.auth.getClaims()
    claims = result.data?.claims ?? null
  } catch {
    claims = null
  }

  if (!claims?.sub && request.nextUrl.pathname.startsWith('/crm')) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/crm/login'
    // Preserve where they were headed so login can send them back.
    if (request.nextUrl.pathname !== '/crm/login') {
      loginUrl.searchParams.set('next', request.nextUrl.pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}