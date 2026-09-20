import { requireAuth } from '@/lib/crm/auth';
import CRMsidebar from '@/components/crm/layout/CRMsidebar';
import CRMTopBar from '@/components/crm/layout/CRMTopBar';

// CRM pages are always per-user (session cookie) and always fresh (live
// pipeline numbers). Never prerender or cache them.
export const dynamic = 'force-dynamic';

/**
 * Single authority for CRM page protection.
 *
 * Every route inside `crm/(protected)/` — the dashboard, customers, leads,
 * trips, payments, etc. — renders through this layout, which requires a
 * valid session and redirects to /crm/login exactly once when there isn't
 * one. `/crm/login` lives in the separate `crm/(auth)/` segment, so it never
 * passes through here and can never be redirected to itself.
 */
export default async function ProtectedCRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  if (process.env.NODE_ENV === 'development') {
    // Temporary auth debugging — never logs tokens or sensitive data.
    console.log('[crm-auth] protected layout', {
      authenticated: true,
      userId: session.id,
      role: session.role,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CRMsidebar user={session} />
      <div className="md:pl-16">
        <CRMTopBar user={session} />
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
