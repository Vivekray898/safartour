import { getDb } from './db';
import type { SessionUser } from './auth';

export type ActivityType =
  | 'lead_created'
  | 'customer_created'
  | 'customer_updated'
  | 'status_changed'
  | 'employee_assigned'
  | 'note_added'
  | 'followup_scheduled'
  | 'followup_completed'
  | 'followup_missed'
  | 'quotation_created'
  | 'quotation_revised'
  | 'quotation_sent'
  | 'quotation_viewed'
  | 'quotation_accepted'
  | 'quotation_rejected'
  | 'payment_received'
  | 'payment_recorded'
  | 'booking_confirmed'
  | 'document_uploaded'
  | 'task_created'
  | 'task_completed'
  | 'trip_completed'
  | 'customer_feedback'
  | 'communication_logged'
  | 'cancelled';

interface ActivityParams {
  trip_id?: number;
  customer_id?: number;
  user: SessionUser;
  activity_type: ActivityType;
  description: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: ActivityParams): Promise<void> {
  const db = getDb();
  const { trip_id, customer_id, user, activity_type, description, metadata } = params;

  await db.prepare(`
    INSERT INTO activities (trip_id, customer_id, user_id, activity_type, description, metadata, created_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `).run(
    trip_id || null,
    customer_id || null,
    user.id,
    activity_type,
    description,
    metadata ? JSON.stringify(metadata) : null
  );
}

export async function logStatusChange(
  tripId: number,
  customerId: number,
  user: SessionUser,
  from: string,
  to: string,
  note?: string
): Promise<void> {
  logActivity({
    trip_id: tripId,
    customer_id: customerId,
    user,
    activity_type: 'status_changed',
    description: `Status changed from ${from} to ${to}`,
    metadata: { from, to, note },
  });
}

export async function logQuotationAction(
  tripId: number,
  customerId: number,
  user: SessionUser,
  action: 'created' | 'revised' | 'sent' | 'viewed' | 'accepted' | 'rejected',
  quotationRef: string,
  amount: number,
  note?: string
): Promise<void> {
  const actionLabels: Record<string, string> = {
    created: 'created',
    revised: 'revised',
    sent: 'sent',
    viewed: 'viewed',
    accepted: 'accepted',
    rejected: 'rejected',
  };

  logActivity({
    trip_id: tripId,
    customer_id: customerId,
    user,
    activity_type: `quotation_${action}`,
    description: `Quotation ${quotationRef} ${actionLabels[action]}`,
    metadata: { quotation_ref: quotationRef, amount, note },
  });
}

export async function logPayment(
  tripId: number,
  customerId: number,
  user: SessionUser,
  amount: number,
  method: string,
  transactionId?: string,
  note?: string
): Promise<void> {
  logActivity({
    trip_id: tripId,
    customer_id: customerId,
    user,
    activity_type: 'payment_received',
    description: `Payment of ₹${amount.toLocaleString()} received via ${method}`,
    metadata: { amount, method, transaction_id: transactionId, note },
  });
}

export async function logFollowUp(
  tripId: number,
  customerId: number,
  user: SessionUser,
  action: 'scheduled' | 'completed' | 'missed',
  followUpType: string,
  note?: string
): Promise<void> {
  const actionLabels: Record<string, string> = {
    scheduled: 'scheduled',
    completed: 'completed',
    missed: 'missed',
  };

  logActivity({
    trip_id: tripId,
    customer_id: customerId,
    user,
    activity_type: `followup_${action}`,
    description: `Follow-up ${actionLabels[action]}: ${followUpType}`,
    metadata: { followup_type: followUpType, note },
  });
}

export async function getActivitiesForTrip(tripId: number, limit = 50): Promise<Array<{
  id: number;
  trip_id: number | null;
  customer_id: number | null;
  user_id: number | null;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user_name?: string | null;
}> {
  const db = getDb();
  const rows = await db.prepare(`
    SELECT a.*,
      u.name as user_name
    FROM activities a
    LEFT JOIN users u ON a.user_id = u.id
    WHERE a.trip_id = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(tripId, limit) as Array<{
    id: number;
    trip_id: number | null;
    customer_id: number | null;
    user_id: number | null;
    activity_type: string;
    description: string;
    metadata: string | null;
    created_at: string;
    user_name: string | null;
  }>;

  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }));
}

export async function getActivitiesForCustomer(customerId: number, limit = 50): Promise<Array<{
  id: number;
  trip_id: number | null;
  customer_id: number | null;
  user_id: number | null;
  activity_type: string;
  description: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  user_name?: string | null;
  trip_reference?: string | null;
}> {
  const db = getDb();
  const rows = await db.prepare(`
    SELECT a.*,
      u.name as user_name,
      t.reference as trip_reference
    FROM activities a
    LEFT JOIN users u ON a.user_id = u.id
    LEFT JOIN trips t ON a.trip_id = t.id
    WHERE a.customer_id = ?
    ORDER BY a.created_at DESC
    LIMIT ?
  `).all(customerId, limit) as Array<{
    id: number;
    trip_id: number | null;
    customer_id: number | null;
    user_id: number | null;
    activity_type: string;
    description: string;
    metadata: string | null;
    created_at: string;
    user_name: string | null;
    trip_reference: string | null;
  }>;

  return rows.map(row => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }));
}
