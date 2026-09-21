import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireApiUser } from '@/lib/crm/auth';
import { getDb, nextReference } from '@/lib/crm/db';
import { logActivity, logQuotationAction } from '@/lib/crm/activity';

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

    const { trip_id, items, notes, terms, valid_until, discount = 0, tax = 0, tax_rate = 0 } = body;

    // Duplicate an existing quotation: copy header + items under a new
    // reference, back to draft. (Requirement: duplicate quotation.)
    if (body.duplicateOf) {
      const sourceId = Number(body.duplicateOf);
      if (!Number.isInteger(sourceId) || sourceId <= 0) {
        return NextResponse.json({ error: 'Invalid quotation to duplicate' }, { status: 400 });
      }
      const source = await db.prepare(`
        SELECT q.*, t.customer_id FROM quotations q
        JOIN trips t ON q.trip_id = t.id
        WHERE q.id = ?
      `).get(sourceId) as {
        id: number; trip_id: number; customer_id: number; reference: string;
        valid_until: string | null; subtotal: number; discount: number;
        tax: number; tax_rate: number; final_amount: number;
        notes: string | null; terms: string | null;
      } | undefined;
      if (!source) {
        return NextResponse.json({ error: 'Quotation to duplicate not found' }, { status: 404 });
      }

      const sourceItems = await db.prepare(
        'SELECT category, description, details, quantity, amount FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC'
      ).all(sourceId);

      const newRef = await nextReference('quotations', 'QT');
      const versionCount = await db.prepare('SELECT COUNT(*) as count FROM quotations WHERE trip_id = ?').get(source.trip_id) as { count: number };
      const newVersion = `V${versionCount.count + 1}`;

      const dupResult = await db.prepare(`
        INSERT INTO quotations (reference, trip_id, version, status, quotation_date, valid_until, prepared_by, subtotal, discount, tax, tax_rate, final_amount, notes, terms)
        VALUES (?, ?, ?, 'draft', datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newRef, source.trip_id, newVersion, source.valid_until, session.id,
        source.subtotal, source.discount, source.tax, source.tax_rate ?? 0, source.final_amount,
        source.notes, source.terms,
      );

      if (sourceItems.length > 0) {
        const insertItem = await db.prepare(`
          INSERT INTO quotation_items (quotation_id, category, description, details, quantity, amount)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const item of sourceItems) {
          await insertItem.run(dupResult.lastInsertRowid, item.category, item.description, item.details, item.quantity, item.amount);
        }
      }

      await logActivity({
        trip_id: source.trip_id,
        customer_id: source.customer_id,
        user: session,
        activity_type: 'quotation_created',
        description: `Quotation ${newRef} created (duplicate of ${source.reference})`,
        metadata: { quotation_ref: newRef, duplicated_from: source.reference, amount: source.final_amount },
      });

      const quotation = await db.prepare(`
        SELECT q.*, t.reference as trip_reference, c.name as customer_name, u.name as prepared_by_name
        FROM quotations q
        JOIN trips t ON q.trip_id = t.id
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN users u ON q.prepared_by = u.id
        WHERE q.id = ?
      `).get(dupResult.lastInsertRowid);

      return NextResponse.json({ ok: true, quotation }, { status: 201 });
    }

    if (!trip_id) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 });
    }

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ? AND archived = 0').get(trip_id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const reference = await nextReference('quotations', 'QT');
    const existingQuotations = await db.prepare('SELECT COUNT(*) as count FROM quotations WHERE trip_id = ?').get(trip_id) as { count: number };
    const version = `V${existingQuotations.count + 1}`;

    let subtotal = 0;
    if (items && items.length > 0) {
      for (const item of items) {
        subtotal += (item.amount || 0) * (item.quantity || 1);
      }
    }

    // GST snapshot: when a rate is supplied, tax is derived from it so the
    // PDF always shows "GST @ N%" consistent with the stored amount.
    const taxAmount = tax_rate > 0
      ? Math.round(Math.max(0, subtotal - discount) * tax_rate / 100)
      : tax;
    const final_amount = Math.max(0, subtotal - discount + taxAmount);

    const result = await db.prepare(`
      INSERT INTO quotations (reference, trip_id, version, status, quotation_date, valid_until, prepared_by, subtotal, discount, tax, tax_rate, final_amount, notes, terms)
      VALUES (?, ?, ?, 'draft', datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(reference, trip_id, version, valid_until || null, session.id, subtotal, discount, taxAmount, tax_rate, final_amount, notes || null, terms || null);

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
        await insertItem.run(result.lastInsertRowid, item.category || 'other', item.description, item.details || null, item.quantity || 1, item.amount || 0);
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
