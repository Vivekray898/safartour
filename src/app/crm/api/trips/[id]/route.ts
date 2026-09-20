import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logActivity, logStatusChange } from '@/lib/crm/activity';
import { getActivitiesForTrip } from '@/lib/crm/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const trip = await db.prepare(`
      SELECT t.*,
        c.id as customer_id, c.name as customer_name, c.phone as customer_phone,
        c.whatsapp as customer_whatsapp, c.email as customer_email,
        c.city as customer_city, c.alt_phone as customer_alt_phone,
        c.preferred_contact as customer_preferred_contact,
        c.company as customer_company, c.company_contact_person as customer_company_contact,
        u.id as assigned_employee_id, u.name as assigned_employee_name,
        u.email as assigned_employee_email,
        (SELECT u2.name FROM users u2 WHERE t.created_by = u2.id) as created_by_name,
        (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') as quoted_amount,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount,
        (SELECT COUNT(*) FROM quotation_items qi JOIN quotations q ON qi.quotation_id = q.id WHERE q.trip_id = t.id) as quotation_items_count
      FROM trips t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.assigned_employee_id = u.id
      WHERE t.id = ?
    `).get(id);

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const activities = await getActivitiesForTrip(Number(id));
    const quotations = await db.prepare(`
      SELECT q.*,
        u.name as prepared_by_name,
        (SELECT COUNT(*) FROM quotation_items qi WHERE qi.quotation_id = q.id) as items_count
      FROM quotations q
      LEFT JOIN users u ON q.prepared_by = u.id
      WHERE q.trip_id = ?
      ORDER BY q.created_at DESC
    `).all(id);

    const payments = await db.prepare(`
      SELECT p.*,
        u.name as recorded_by_name
      FROM payments p
      LEFT JOIN users u ON p.recorded_by = u.id
      WHERE p.trip_id = ?
      ORDER BY p.payment_date DESC
    `).all(id);

    const followups = await db.prepare(`
      SELECT f.*,
        u.name as assigned_to_name,
        u2.name as completed_by_name
      FROM followups f
      LEFT JOIN users u ON f.assigned_to = u.id
      LEFT JOIN users u2 ON f.completed_by = u2.id
      WHERE f.trip_id = ?
      ORDER BY f.scheduled_date DESC
    `).all(id);

    const tasks = await db.prepare(`
      SELECT t.*,
        u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.trip_id = ?
      ORDER BY t.created_at DESC
    `).all(id);

    const documents = await db.prepare(`
      SELECT d.*,
        u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.trip_id = ?
      ORDER BY d.created_at DESC
    `).all(id);

    const itinerary = await db.prepare(`
      SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY day_number ASC
    `).all(id);

    const communications = await db.prepare(`
      SELECT cm.*,
        u.name as recorded_by_name
      FROM communications cm
      LEFT JOIN users u ON cm.recorded_by = u.id
      WHERE cm.trip_id = ?
      ORDER BY cm.occurred_at DESC
    `).all(id);

    const pendingAmount = (trip.quoted_amount as number || 0) - (trip.paid_amount as number || 0);

    return NextResponse.json({
      ok: true,
      trip: {
        ...trip,
        pending_amount: pendingAmount,
        activities,
        quotations,
        payments,
        followups,
        tasks,
        documents,
        itinerary,
        communications,
      },
    });
  } catch (error) {
    console.error('Get trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ?').get(id) as {
      id: number;
      customer_id: number;
      assigned_employee_id: number | null;
      status: string;
      reference: string;
    } | undefined;

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const oldStatus = trip.status;
    let newStatus = body.status || oldStatus;

    if (body.status !== undefined && body.status !== oldStatus) {
      if (body.status === 'lost' && !body.lost_reason) {
        return NextResponse.json({ error: 'Lost reason is required when marking as lost' }, { status: 400 });
      }

      if (body.status === 'cancelled' && !body.cancelled_reason) {
        return NextResponse.json({ error: 'Cancellation reason is required when marking as cancelled' }, { status: 400 });
      }
    }

    const updates: string[] = [];
    const values: (string | number | null | boolean)[] = [];

    const fields = [
      'assigned_employee_id', 'priority', 'lead_source',
      'destination', 'trip_type', 'group_type',
      'start_date', 'end_date', 'flexible_dates',
      'adults', 'children_below_5', 'children_5_12', 'children_above_12', 'infants',
      'rooms_single', 'rooms_double', 'rooms_triple', 'extra_beds', 'child_with_bed', 'child_without_bed',
      'room_note', 'meal_plan', 'hotel_category',
      'hotel_location_pref', 'hotel_view_pref', 'hotel_property_pref', 'hotel_special_req',
      'transport_required', 'vehicle_type',
      'pickup_location', 'pickup_date', 'pickup_time',
      'drop_location', 'drop_date', 'drop_time',
      'local_sightseeing', 'airport_transfer', 'njp_transfer', 'railway_transfer', 'intercity_transfer',
      'special_honeymoon', 'special_birthday', 'special_anniversary', 'special_child_friendly',
      'special_senior_citizen', 'special_wheelchair', 'special_vegetarian',
      'special_early_checkin', 'special_late_checkout', 'special_mountain_view',
      'special_driver_pref', 'special_other_req',
      'budget_min', 'budget_max', 'budget_type',
      'next_followup_date', 'next_followup_time', 'next_followup_type',
      'next_followup_by_employee_id', 'next_followup_note',
      'customer_facing_notes', 'internal_notes',
      'lost_reason', 'lost_note',
      'cancelled_at', 'cancelled_reason', 'refund_amount', 'refund_status', 'cancellation_note',
      'trip_completed_at',
      'customer_feedback_status', 'customer_feedback_rating', 'customer_feedback_comment',
      'feedback_followup_required',
    ];

    for (const field of fields) {
      if (body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(newStatus);
    }

    updates.push('updated_at = datetime("now")');
    values.push(id);

    await db.prepare(`UPDATE trips SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    if (oldStatus !== newStatus) {
      await logStatusChange(
        Number(id),
        trip.customer_id,
        session,
        oldStatus,
        newStatus,
        body.internal_notes || undefined
      );
    }

    await logActivity({
      trip_id: Number(id),
      customer_id: trip.customer_id,
      user: session,
      activity_type: 'lead_created',
      description: 'Trip details updated',
      metadata: { trip_id: Number(id), fields: updates.filter(u => !u.includes('updated_at') && !u.includes('status')) },
    });

    const updated = await db.prepare('SELECT * FROM trips WHERE id = ?').get(id);

    return NextResponse.json({
      ok: true,
      trip: updated,
    });
  } catch (error) {
    console.error('Update trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    await db.prepare('UPDATE trips SET archived = 1, updated_at = datetime("now") WHERE id = ?').run(id);

    return NextResponse.json({
      ok: true,
      message: 'Trip archived',
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
