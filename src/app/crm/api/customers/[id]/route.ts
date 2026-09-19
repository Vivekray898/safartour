import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logActivity } from '@/lib/crm/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const db = getDb();

    const customer = db.prepare(`
      SELECT c.*,
        u.name as assigned_employee_name,
        (SELECT COUNT(*) FROM trips WHERE customer_id = c.id AND archived = 0) as active_trips,
        (SELECT COUNT(*) FROM trips WHERE customer_id = c.id AND status = 'completed') as completed_trips,
        (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q
          JOIN trips t ON q.trip_id = t.id
          WHERE t.customer_id = c.id) as total_quoted,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p
          JOIN trips t ON p.trip_id = t.id
          WHERE t.customer_id = c.id) as total_paid
      FROM customers c
      LEFT JOIN users u ON c.assigned_employee_id = u.id
      WHERE c.id = ?
    `).get(id) as {
      id: number;
      name: string;
      phone: string | null;
      whatsapp: string | null;
      email: string | null;
      city: string | null;
      alt_phone: string | null;
      preferred_contact: string | null;
      company: string | null;
      company_contact_person: string | null;
      assigned_employee_id: number | null;
      assigned_employee_name: string | null;
      first_trip_at: string | null;
      last_trip_at: string | null;
      trip_count: number;
      is_repeat_customer: number;
      archived: number;
      created_at: string;
      updated_at: string;
      active_trips: number;
      completed_trips: number;
      total_quoted: number;
      total_paid: number;
    } | undefined;

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const trips = db.prepare(`
      SELECT t.*,
        u.name as assigned_employee_name,
        (SELECT COALESCE(SUM(final_amount), 0) FROM quotations q WHERE q.trip_id = t.id) as quoted_amount,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.trip_id = t.id) as paid_amount
      FROM trips t
      LEFT JOIN users u ON t.assigned_employee_id = u.id
      WHERE t.customer_id = ?
      ORDER BY t.created_at DESC
    `).all(id);

    const pendingAmount = (customer.total_quoted || 0) - (customer.total_paid || 0);

    return NextResponse.json({
      ok: true,
      customer: {
        ...customer,
        pending_amount: pendingAmount,
        trips,
      },
    });
  } catch (error) {
    console.error('Get customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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

    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as {
      id: number;
      name: string;
      phone: string | null;
      email: string | null;
      city: string | null;
      alt_phone: string | null;
      preferred_contact: string | null;
      company: string | null;
      company_contact_person: string | null;
      assigned_employee_id: number | null;
    } | undefined;

    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const {
      name,
      phone,
      whatsapp,
      email,
      city,
      alt_phone,
      preferred_contact,
      company,
      company_contact_person,
      assigned_employee_id,
    } = body;

    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (whatsapp !== undefined) { updates.push('whatsapp = ?'); values.push(whatsapp); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (city !== undefined) { updates.push('city = ?'); values.push(city); }
    if (alt_phone !== undefined) { updates.push('alt_phone = ?'); values.push(alt_phone); }
    if (preferred_contact !== undefined) { updates.push('preferred_contact = ?'); values.push(preferred_contact); }
    if (company !== undefined) { updates.push('company = ?'); values.push(company); }
    if (company_contact_person !== undefined) { updates.push('company_contact_person = ?'); values.push(company_contact_person); }
    if (assigned_employee_id !== undefined) { updates.push('assigned_employee_id = ?'); values.push(assigned_employee_id); }

    if (updates.length === 0) {
      return NextResponse.json({
        ok: true,
        customer: existing,
      });
    }

    updates.push('updated_at = datetime("now")');
    values.push(id);

    db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    logActivity({
      customer_id: id,
      user: session,
      activity_type: 'customer_updated',
      description: 'Customer details updated',
      metadata: { customer_id: id, fields: updates.filter(u => !u.includes('updated_at')) },
    });

    const updated = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);

    return NextResponse.json({
      ok: true,
      customer: updated,
    });
  } catch (error) {
    console.error('Update customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    db.prepare('UPDATE customers SET archived = 1, updated_at = datetime("now") WHERE id = ?').run(id);

    return NextResponse.json({
      ok: true,
      message: 'Customer archived',
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
