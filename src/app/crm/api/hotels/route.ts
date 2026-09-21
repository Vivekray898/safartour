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
    const destination = (searchParams.get('destination') || '').trim();
    const includeArchived = searchParams.get('archived') === '1';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    const db = getDb();

    let where = 'WHERE h.archived = ?';
    const params: (string | number)[] = [includeArchived ? 1 : 0];

    if (search) {
      where += ` AND (h.name ILIKE ? OR h.destination ILIKE ? OR h.address ILIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (destination) {
      where += ` AND h.destination ILIKE ?`;
      params.push(`%${destination}%`);
    }

    const hotels = await db.prepare(`
      SELECT h.*, s.name as supplier_name
      FROM hotels h
      LEFT JOIN suppliers s ON h.supplier_id = s.id
      ${where}
      ORDER BY h.name ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = await db.prepare(
      `SELECT COUNT(*) as count FROM hotels h ${where}`
    ).get(...params) as { count: number };

    return NextResponse.json({
      ok: true,
      hotels,
      pagination: { page, limit, total: total.count },
    });
  } catch (error) {
    console.error('Get hotels error:', error);
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

    const { name, destination, category, address, contact_phone, contact_email, room_types, meal_plans, notes, supplier_id, is_active } = body;

    if (!name || !destination) {
      return NextResponse.json({ error: 'Hotel name and destination are required' }, { status: 400 });
    }

    if (supplier_id) {
      const supplier = await db.prepare('SELECT id FROM suppliers WHERE id = ?').get(supplier_id);
      if (!supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 400 });
      }
    }

    const result = await db.prepare(`
      INSERT INTO hotels (name, destination, category, address, contact_phone, contact_email, room_types, meal_plans, notes, supplier_id, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, destination, category || null, address || null,
      contact_phone || null, contact_email || null,
      room_types || null, meal_plans || null, notes || null,
      supplier_id || null, is_active === undefined ? 1 : (is_active ? 1 : 0),
    );

    const hotel = await db.prepare(`
      SELECT h.*, s.name as supplier_name FROM hotels h
      LEFT JOIN suppliers s ON h.supplier_id = s.id
      WHERE h.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ ok: true, hotel }, { status: 201 });
  } catch (error) {
    console.error('Create hotel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
