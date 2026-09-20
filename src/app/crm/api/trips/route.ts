import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireApiUser } from '@/lib/crm/auth';
import { getDb, nextReference } from '@/lib/crm/db';
import { logActivity } from '@/lib/crm/activity';
import { CRM_ACTIVE_STATUSES, calculatePax } from '@/config/crm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const assignedTo = searchParams.get('assignedTo') || '';
    const destination = searchParams.get('destination') || '';
    const source = searchParams.get('source') || '';
    const paymentStatus = searchParams.get('paymentStatus') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getDb();

    let query = `
      SELECT t.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.city as customer_city,
        u.name as assigned_employee_name,
        (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') as quoted_amount,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount
      FROM trips t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.assigned_employee_id = u.id
      WHERE t.archived = 0
    `;

    const params: (string | number)[] = [];

    if (search) {
      const s = `%${search}%`;
      query += `
        AND (
          t.reference LIKE ? OR c.name LIKE ? OR c.phone LIKE ?
          OR c.email LIKE ? OR t.destination LIKE ?
        )
      `;
      params.push(s, s, s, s, s);
    }

    if (status) {
      if (status === 'active') {
        query += ` AND t.status IN (${CRM_ACTIVE_STATUSES.map(() => '?').join(',')})`;
        params.push(...CRM_ACTIVE_STATUSES);
      } else if (status === 'booked') {
        query += ` AND t.status IN ('booked', 'trip_ongoing', 'completed')`;
      } else {
        query += ` AND t.status = ?`;
        params.push(status);
      }
    }

    if (priority) {
      query += ` AND t.priority = ?`;
      params.push(priority);
    }

    if (assignedTo) {
      if (assignedTo === 'me') {
        query += ` AND (t.assigned_employee_id = ? OR t.assigned_employee_id IS NULL)`;
        params.push(session.id);
      } else if (assignedTo === 'unassigned') {
        query += ` AND t.assigned_employee_id IS NULL`;
      } else {
        query += ` AND t.assigned_employee_id = ?`;
        params.push(assignedTo);
      }
    }

    if (destination) {
      query += ` AND t.destination LIKE ?`;
      params.push(`%${destination}%`);
    }

    if (source) {
      query += ` AND t.lead_source = ?`;
      params.push(source);
    }

    if (paymentStatus === 'pending') {
      query += ` AND (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id AND q.status = 'accepted') > (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id)`;
    }

    query += ' ORDER BY t.updated_at DESC';

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const trips = await db.prepare(query).all(...params);

    const countQuery = `
      SELECT COUNT(*) as count FROM trips t
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE t.archived = 0
    `;

    const totalResult = await db.prepare(countQuery).get() as { count: number };

    return NextResponse.json({
      ok: true,
      trips,
      pagination: {
        page,
        limit,
        total: totalResult.count,
        totalPages: Math.ceil(totalResult.count / limit),
      },
    });
  } catch (error) {
    console.error('Get trips error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const body = await request.json();
    const db = getDb();

    const customerId = body.customer_id;
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    const customer = await db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const reference = await nextReference('trips', 'ST');

    const defaults = {
      adults: 0,
      children_below_5: 0,
      children_5_12: 0,
      children_above_12: 0,
      infants: 0,
      total_pax: 0,
      rooms_single: 0,
      rooms_double: 0,
      rooms_triple: 0,
      extra_beds: 0,
      child_with_bed: 0,
      child_without_bed: 0,
    };

    const pax = calculatePax(
      body.adults || defaults.adults,
      body.children_below_5 || defaults.children_below_5,
      body.children_5_12 || defaults.children_5_12,
      body.children_above_12 || defaults.children_above_12,
      body.infants || defaults.infants
    );

    const values = [
      reference,
      customerId,
      body.assigned_employee_id || session.id,
      body.status || 'new',
      body.priority || 'medium',
      body.lead_source || 'website',
      body.campaign || null,
      body.utm_source || null,
      body.utm_medium || null,
      body.utm_campaign || null,
      body.destination || null,
      body.trip_type || null,
      body.group_type || null,
      body.start_date || null,
      body.end_date || null,
      body.flexible_dates ? 1 : 0,
      body.adults || defaults.adults,
      body.children_below_5 || defaults.children_below_5,
      body.children_5_12 || defaults.children_5_12,
      body.children_above_12 || defaults.children_above_12,
      body.infants || defaults.infants,
      pax,
      body.rooms_single || defaults.rooms_single,
      body.rooms_double || defaults.rooms_double,
      body.rooms_triple || defaults.rooms_triple,
      body.extra_beds || defaults.extra_beds,
      body.child_with_bed || defaults.child_with_bed,
      body.child_without_bed || defaults.child_without_bed,
      body.room_note || null,
      body.meal_plan || null,
      body.hotel_category || null,
      body.hotel_location_pref || null,
      body.hotel_view_pref || null,
      body.hotel_property_pref || null,
      body.hotel_special_req || null,
      body.transport_required || 'no',
      body.vehicle_type || null,
      body.pickup_location || null,
      body.pickup_date || null,
      body.pickup_time || null,
      body.drop_location || null,
      body.drop_date || null,
      body.drop_time || null,
      body.local_sightseeing ? 1 : 0,
      body.airport_transfer ? 1 : 0,
      body.njp_transfer ? 1 : 0,
      body.railway_transfer ? 1 : 0,
      body.intercity_transfer ? 1 : 0,
      body.special_honeymoon ? 1 : 0,
      body.special_birthday ? 1 : 0,
      body.special_anniversary ? 1 : 0,
      body.special_child_friendly ? 1 : 0,
      body.special_senior_citizen ? 1 : 0,
      body.special_wheelchair ? 1 : 0,
      body.special_vegetarian ? 1 : 0,
      body.special_early_checkin ? 1 : 0,
      body.special_late_checkout ? 1 : 0,
      body.special_mountain_view ? 1 : 0,
      body.special_driver_pref || null,
      body.special_other_req || null,
      body.budget_min || null,
      body.budget_max || null,
      body.budget_type || 'total_trip',
      body.next_followup_date || null,
      body.next_followup_time || null,
      body.next_followup_type || null,
      body.next_followup_by_employee_id || null,
      body.next_followup_note || null,
      body.customer_facing_notes || null,
      body.internal_notes || null,
      body.lost_reason || null,
      body.lost_note || null,
      body.cancelled_at || null,
      body.cancelled_reason || null,
      body.refund_amount || null,
      body.refund_status || null,
      body.cancellation_note || null,
      body.trip_completed_at || null,
      body.customer_feedback_status || null,
      body.customer_feedback_rating || null,
      body.customer_feedback_comment || null,
      body.feedback_followup_required ? 1 : 0,
      body.page_url || null,
      body.referrer || null,
      body.received_at || null,
      session.id,
    ];

    const result = await db.prepare(`
      INSERT INTO trips (
        reference, customer_id, assigned_employee_id, status, priority, lead_source,
        campaign, utm_source, utm_medium, utm_campaign,
        destination, trip_type, group_type,
        start_date, end_date, flexible_dates,
        adults, children_below_5, children_5_12, children_above_12, infants, total_pax,
        rooms_single, rooms_double, rooms_triple, extra_beds, child_with_bed, child_without_bed,
        room_note, meal_plan, hotel_category,
        hotel_location_pref, hotel_view_pref, hotel_property_pref, hotel_special_req,
        transport_required, vehicle_type,
        pickup_location, pickup_date, pickup_time,
        drop_location, drop_date, drop_time,
        local_sightseeing, airport_transfer, njp_transfer, railway_transfer, intercity_transfer,
        special_honeymoon, special_birthday, special_anniversary, special_child_friendly,
        special_senior_citizen, special_wheelchair, special_vegetarian,
        special_early_checkin, special_late_checkout, special_mountain_view,
        special_driver_pref, special_other_req,
        budget_min, budget_max, budget_type,
        next_followup_date, next_followup_time, next_followup_type, next_followup_by_employee_id, next_followup_note,
        customer_facing_notes, internal_notes,
        lost_reason, lost_note,
        cancelled_at, cancelled_reason, refund_amount, refund_status, cancellation_note,
        trip_completed_at,
        customer_feedback_status, customer_feedback_rating, customer_feedback_comment,
        feedback_followup_required,
        page_url, referrer, received_at,
        created_by
      ) VALUES (${values.map(() => '?').join(', ')})
    `).run(values);

    await db.prepare(`UPDATE customers SET trip_count = trip_count + 1, updated_at = datetime('now') WHERE id = ?`).run(customerId);

    await logActivity({
      trip_id: result.lastInsertRowid,
      customer_id: customerId,
      user: session,
      activity_type: 'lead_created',
      description: `Lead created: ${reference}`,
      metadata: { trip_ref: reference, customer_name: (customer as { name: string }).name, source: body.lead_source || 'website' },
    });

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({
      ok: true,
      trip: { ...trip, quoted_amount: 0, paid_amount: 0 },
    });
  } catch (error) {
    console.error('Create trip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
