import { requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_DESTINATIONS, CRM_LEAD_SOURCES } from '@/config/crm';
import NewLeadForm from './NewLeadForm';


/**
 * Dedicated lead-creation page: `/crm/leads/new`.
 *
 * This static segment shadows the `[id]` dynamic segment, so the URL never
 * reaches the trip-detail page (which would try `WHERE id = 'new'`).
 * The detail page additionally validates numeric ids with notFound(), so
 * garbage URLs like `/crm/leads/abc` render the 404 instead of a Postgres
 * type error.
 */
export default async function NewLeadPage() {
  const session = await requireAuth();
  const db = getDb();

  const employees = await db.prepare(
    "SELECT id, name FROM users WHERE is_active = 1 ORDER BY name"
  ).all() as Array<{ id: number; name: string }>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Lead</h1>
        <p className="text-sm text-gray-500">
          Create a customer and their trip enquiry in one form.
        </p>
      </div>

      <NewLeadForm
        destinations={CRM_DESTINATIONS}
        sources={CRM_LEAD_SOURCES}
        employees={employees}
        currentUserId={session.id}
      />
    </div>
  );
}
