import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ ok: true, results: [] });
    }

    const db = getDb();
    const searchTerm = `%${q}%`;

    const customers = await db.prepare(`
      SELECT c.id, c.name, c.phone, c.email, c.city,
        (SELECT COUNT(*) FROM trips WHERE customer_id = c.id AND archived = 0) as trip_count,
        'customer' as type
      FROM customers c
      WHERE c.archived = 0
        AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)
      ORDER BY c.name ASC
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm);

    const trips = await db.prepare(`
      SELECT t.id, t.reference, t.destination, t.status, t.priority,
        c.name as customer_name, c.phone as customer_phone,
        'trip' as type
      FROM trips t
      JOIN customers c ON t.customer_id = c.id
      WHERE t.archived = 0
        AND (t.reference LIKE ? OR t.destination LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)
      ORDER BY t.created_at DESC
      LIMIT 10
    `).all(searchTerm, searchTerm, searchTerm, searchTerm);

    const quotations = await db.prepare(`
      SELECT q.id, q.reference, q.status, q.final_amount,
        t.reference as trip_reference,
        c.name as customer_name,
        'quotation' as type
      FROM quotations q
      JOIN trips t ON q.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE q.reference LIKE ?
      ORDER BY q.created_at DESC
      LIMIT 10
    `).all(searchTerm);

    return NextResponse.json({
      ok: true,
      results: {
        customers: customers || [],
        trips: trips || [],
        quotations: quotations || [],
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
