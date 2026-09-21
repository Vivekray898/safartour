import { requireAuth } from '@/lib/crm/auth';
import CRMShell from '@/components/crm/layout/CRMShell';

// CRM pages are always per-user (session cookie) and always fresh (live
// pipeline numbers). Never prerender or cache them.
export const dynamic = 'force-dynamic';

/**
 * Single authority for CRM page protection + the CRM application shell.
 *
 * Every route inside `crm/(protected)/` — the dashboard, customers, leads,
 * trips, payments, etc. — renders through this layout, which requires a
 * valid session and redirects to /crm/login exactly once when there isn't
 * one. `/crm/login` lives in the separate `crm/(auth)/` segment, so it never
 * passes through here and can never be redirected to itself.
 *
 * The shell (icon rail + mobile slide-over drawer + top bar) is fully
 * self-contained and has no dependency on the public website layout.
 */
export default async function ProtectedCRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  return <CRMShell user={session}>{children}</CRMShell>;
}
