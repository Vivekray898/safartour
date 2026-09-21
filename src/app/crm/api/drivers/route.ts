import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, requireAdminApi } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const search = (searchParams.get('search') || '').trim();
    const availability = (searchParams.get('availability') || '').trim();
    const includeArchived = searchParams.get('archived') === '1';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    const db = getDb();

    let where = 'WHERE d.archived = ?';
    const params: (string | number)[] = [includeArchived ? 1 : 0];

    if (search) {
      where += ` AND (d.name ILIKE ? OR d.phone ILIKE ? OR d.vehicle_number ILIKE ? OR d.destination_route ILIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (availability) { where += ` AND d.availability = ?`; params.push(availability); }

    const drivers = await db.prepare(`
      SELECT d.*,
        t.reference as assigned_trip_reference,
        c.name as assigned_customer_name
      FROM drivers d
      LEFT JOIN trips t ON d.assigned_trip_id = t.id AND t.archived = 0
      LEFT JOIN customers c ON t.customer_id = c.id
      ${where}
      ORDER BY d.name ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = await db.prepare(`SELECT COUNT(*) as count FROM drivers d ${where}`).get(...params) as { count: number };

    return NextResponse.json({
      ok: true,
      drivers,
      pagination: { page, limit, total: total.count },
    });
  } catch (error) {
    console.error('Get drivers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const db = getDb();

    const { name, phone, vehicle_type, vehicle_number, destination_route, availability, notes } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Driver name is required' }, { status: 400 });
    }

    const result = await db.prepare(`
      INSERT INTO drivers (name, phone, vehicle_type, vehicle_number, destination_route, availability, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, phone || null, vehicle_type || null, vehicle_number || null,
      destination_route || null, availability || null, notes || null,
    );

    const driver = await db.prepare('SELECT * FROM drivers WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ ok: true, driver }, { status: 201 });
  } catch (error) {
    console.error('Create driver error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
