import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, requireAdminApi } from '@/lib/crm/auth';
import { getDb, parseId } from '@/lib/crm/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    const db = getDb();

    const hotel = await db.prepare(`
      SELECT h.*, s.name as supplier_name
      FROM hotels h LEFT JOIN suppliers s ON h.supplier_id = s.id
      WHERE h.id = ?
    `).get(id);

    if (!hotel) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, hotel });
  } catch (error) {
    console.error('Get hotel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    const body = await request.json();
    const db = getDb();

    const existing = await db.prepare('SELECT id FROM hotels WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    const { name, destination, category, address, contact_phone, contact_email, room_types, meal_plans, notes, supplier_id, is_active } = body;

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json({ error: 'Hotel name cannot be empty' }, { status: 400 });
    }
    if (destination !== undefined && !String(destination).trim()) {
      return NextResponse.json({ error: 'Destination cannot be empty' }, { status: 400 });
    }
    if (supplier_id) {
      const supplier = await db.prepare('SELECT id FROM suppliers WHERE id = ?').get(supplier_id);
      if (!supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 400 });
      }
    }

    await db.prepare(`
      UPDATE hotels SET
        name = ?, destination = ?, category = ?, address = ?,
        contact_phone = ?, contact_email = ?, room_types = ?, meal_plans = ?,
        notes = ?, supplier_id = ?, is_active = ?
      WHERE id = ?
    `).run(
      name ?? null, destination ?? null, category ?? null, address ?? null,
      contact_phone ?? null, contact_email ?? null, room_types ?? null, meal_plans ?? null,
      notes ?? null, supplier_id ?? null, is_active === undefined ? 1 : (is_active ? 1 : 0),
      id,
    );

    const hotel = await db.prepare(`
      SELECT h.*, s.name as supplier_name FROM hotels h
      LEFT JOIN suppliers s ON h.supplier_id = s.id
      WHERE h.id = ?
    `).get(id);

    return NextResponse.json({ ok: true, hotel });
  } catch (error) {
    console.error('Update hotel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }
    const db = getDb();
    const restore = request.nextUrl.searchParams.get('restore') === '1';

    const existing = await db.prepare('SELECT id, name FROM hotels WHERE id = ?').get(id) as { name: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }

    await db.prepare('UPDATE hotels SET archived = ? WHERE id = ?').run(restore ? 0 : 1, id);

    return NextResponse.json({
      ok: true,
      message: restore ? `Hotel ${existing.name} restored` : `Hotel ${existing.name} archived`,
    });
  } catch (error) {
    console.error('Delete hotel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
