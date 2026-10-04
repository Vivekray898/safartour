import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

/**
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`. On Next.js 15 and earlier
 * this file is never called, so sessions never refresh and users get signed
 * out — do not rename it back.
 *
 * This is the single entry point that keeps a signed-in CRM user signed in and
 * bounces anonymous visitors away from /crm.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Run on every path except static assets and image files, so the session
     * cookie is refreshed for pages, server actions and route handlers alike.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
}