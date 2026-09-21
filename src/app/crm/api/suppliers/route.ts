import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, requireAdminApi } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';

const SUPPLIER_TYPES = ['hotel', 'driver', 'vehicle_owner', 'transport_company', 'local_agent', 'activity_provider', 'other'];

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const searchParams = request.nextUrl.searchParams;
    const search = (searchParams.get('search') || '').trim();
    const type = (searchParams.get('type') || '').trim();
    const status = (searchParams.get('status') || '').trim();
    const includeArchived = searchParams.get('archived') === '1';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'));
    const offset = (page - 1) * limit;

    const db = getDb();

    let where = 'WHERE s.archived = ?';
    const params: (string | number)[] = [includeArchived ? 1 : 0];

    if (search) {
      where += ` AND (s.name ILIKE ? OR s.phone ILIKE ? OR s.email ILIKE ? OR s.location ILIKE ?)`;
      const p = `%${search}%`;
      params.push(p, p, p, p);
    }
    if (type) { where += ` AND s.type = ?`; params.push(type); }
    if (status) { where += ` AND s.status = ?`; params.push(status); }

    const suppliers = await db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM hotels h WHERE h.supplier_id = s.id AND h.archived = 0) as hotel_count
      FROM suppliers s
      ${where}
      ORDER BY s.name ASC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const total = await db.prepare(`SELECT COUNT(*) as count FROM suppliers s ${where}`).get(...params) as { count: number };

    return NextResponse.json({
      ok: true,
      suppliers,
      pagination: { page, limit, total: total.count },
    });
  } catch (error) {
    console.error('Get suppliers error:', error);
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

    const { name, type, phone, whatsapp, email, location, notes, status } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 });
    }
    if (type && !SUPPLIER_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid supplier type' }, { status: 400 });
    }

    const result = await db.prepare(`
      INSERT INTO suppliers (name, type, phone, whatsapp, email, location, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, type || null, phone || null, whatsapp || null,
      email || null, location || null, notes || null,
      status === 'inactive' ? 'inactive' : 'active',
    );

    const supplier = await db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ ok: true, supplier }, { status: 201 });
  } catch (error) {
    console.error('Create supplier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
