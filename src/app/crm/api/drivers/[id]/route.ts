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

    const driver = await db.prepare(`
      SELECT d.*,
        t.reference as assigned_trip_reference,
        c.name as assigned_customer_name
      FROM drivers d
      LEFT JOIN trips t ON d.assigned_trip_id = t.id AND t.archived = 0
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE d.id = ?
    `).get(id);

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, driver });
  } catch (error) {
    console.error('Get driver error:', error);
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

    const existing = await db.prepare('SELECT id FROM drivers WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    const { name, phone, vehicle_type, vehicle_number, destination_route, availability, notes } = body;

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json({ error: 'Driver name cannot be empty' }, { status: 400 });
    }

    await db.prepare(`
      UPDATE drivers SET name = ?, phone = ?, vehicle_type = ?, vehicle_number = ?, destination_route = ?, availability = ?, notes = ?
      WHERE id = ?
    `).run(
      name ?? null, phone ?? null, vehicle_type ?? null, vehicle_number ?? null,
      destination_route ?? null, availability ?? null, notes ?? null,
      id,
    );

    const driver = await db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    return NextResponse.json({ ok: true, driver });
  } catch (error) {
    console.error('Update driver error:', error);
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

    const existing = await db.prepare('SELECT id, name FROM drivers WHERE id = ?').get(id) as { name: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    await db.prepare('UPDATE drivers SET archived = ? WHERE id = ?').run(restore ? 0 : 1, id);

    return NextResponse.json({
      ok: true,
      message: restore ? `Driver ${existing.name} restored` : `Driver ${existing.name} archived`,
    });
  } catch (error) {
    console.error('Delete driver error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
