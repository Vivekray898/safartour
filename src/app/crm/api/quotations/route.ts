import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireApiUser } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logActivity, logQuotationAction } from '@/lib/crm/activity';
import { generateQuotationReference } from '@/config/crm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const tripId = searchParams.get('tripId') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getDb();

    let query = `
      SELECT q.*,
        t.reference as trip_reference,
        c.name as customer_name,
        u.name as prepared_by_name,
        (SELECT COUNT(*) FROM quotation_items qi WHERE qi.quotation_id = q.id) as items_count
      FROM quotations q
      JOIN trips t ON q.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON q.prepared_by = u.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (tripId) {
      query += ` AND q.trip_id = ?`;
      params.push(tripId);
    }

    if (status) {
      query += ` AND q.status = ?`;
      params.push(status);
    }

    query += ' ORDER BY q.created_at DESC';

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const quotations = await db.prepare(query).all(...params);

    return NextResponse.json({
      ok: true,
      quotations,
      pagination: {
        page,
        limit,
        total: quotations.length,
      },
    });
  } catch (error) {
    console.error('Get quotations error:', error);
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

    const { trip_id, items, notes, terms, valid_until, discount = 0, tax = 0 } = body;

    if (!trip_id) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ? AND archived = 0').get(trip_id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const reference = generateQuotationReference();
    const existingQuotations = await db.prepare('SELECT COUNT(*) as count FROM quotations WHERE trip_id = ?').get(trip_id) as { count: number };
    const version = `V${existingQuotations.count + 1}`;

    let subtotal = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        subtotal += (item.amount || 0) * (item.quantity || 1);
      }
    }

    const final_amount = Math.max(0, subtotal - discount + tax);

    const result = await db.prepare(`
      INSERT INTO quotations (reference, trip_id, version, status, quotation_date, valid_until, prepared_by, subtotal, discount, tax, final_amount, notes, terms)
      VALUES (?, ?, ?, 'draft', datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(reference, trip_id, version, valid_until || null, session.id, subtotal, discount, tax, final_amount, notes || null, terms || null);

    await logQuotationAction(
      Number(trip_id),
      (trip as { customer_id: number }).customer_id,
      session,
      'created',
      reference,
      final_amount,
      notes
    );

    await logActivity({
      trip_id: Number(trip_id),
      customer_id: (trip as { customer_id: number }).customer_id,
      user: session,
      activity_type: 'quotation_created',
      description: `Quotation ${reference} created`,
      metadata: { quotation_ref: reference, amount: final_amount, version },
    });

    if (items && items.length > 0) {
      const insertItem = await db.prepare(`
        INSERT INTO quotation_items (quotation_id, category, description, details, quantity, amount)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const item of items) {
        await insertItem.run(result.lastInsertRowid, item.category, item.description, item.details || null, item.quantity || 1, item.amount || 0);
      }
    }

    const quotation = await db.prepare(`
      SELECT q.*,
        t.reference as trip_reference,
        c.name as customer_name,
        u.name as prepared_by_name
      FROM quotations q
      JOIN trips t ON q.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON q.prepared_by = u.id
      WHERE q.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({
      ok: true,
      quotation,
    });
  } catch (error) {
    console.error('Create quotation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
