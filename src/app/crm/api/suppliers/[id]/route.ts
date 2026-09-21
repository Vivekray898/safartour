import { NextRequest, NextResponse } from 'next/server';
import { requireApiUser, requireAdminApi } from '@/lib/crm/auth';
import { getDb, parseId } from '@/lib/crm/db';

const SUPPLIER_TYPES = ['hotel', 'driver', 'vehicle_owner', 'transport_company', 'local_agent', 'activity_provider', 'other'];

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

    const supplier = await db.prepare(`
      SELECT s.*,
        (SELECT COUNT(*) FROM hotels h WHERE h.supplier_id = s.id AND h.archived = 0) as hotel_count
      FROM suppliers s WHERE s.id = ?
    `).get(id);

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, supplier });
  } catch (error) {
    console.error('Get supplier error:', error);
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

    const existing = await db.prepare('SELECT id FROM suppliers WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    const { name, type, phone, whatsapp, email, location, notes, status } = body;

    if (name !== undefined && !String(name).trim()) {
      return NextResponse.json({ error: 'Supplier name cannot be empty' }, { status: 400 });
    }
    if (type && !SUPPLIER_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid supplier type' }, { status: 400 });
    }

    await db.prepare(`
      UPDATE suppliers SET name = ?, type = ?, phone = ?, whatsapp = ?, email = ?, location = ?, notes = ?, status = ?
      WHERE id = ?
    `).run(
      name ?? null, type ?? null, phone ?? null, whatsapp ?? null,
      email ?? null, location ?? null, notes ?? null,
      status === 'inactive' ? 'inactive' : 'active',
      id,
    );

    const supplier = await db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    return NextResponse.json({ ok: true, supplier });
  } catch (error) {
    console.error('Update supplier error:', error);
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

    const existing = await db.prepare('SELECT id, name FROM suppliers WHERE id = ?').get(id) as { name: string } | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 });
    }

    if (!restore) {
      // Refuse to archive a supplier that still owns active hotels.
      const linked = await db.prepare(
        'SELECT COUNT(*) as count FROM hotels WHERE supplier_id = ? AND archived = 0'
      ).get(id) as { count: number };
      if (linked.count > 0) {
        return NextResponse.json({
          error: `This supplier has ${linked.count} linked hotel(s). Reassign or archive them first.`,
        }, { status: 409 });
      }
    }

    await db.prepare('UPDATE suppliers SET archived = ? WHERE id = ?').run(restore ? 0 : 1, id);

    return NextResponse.json({
      ok: true,
      message: restore ? `Supplier ${existing.name} restored` : `Supplier ${existing.name} archived`,
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
