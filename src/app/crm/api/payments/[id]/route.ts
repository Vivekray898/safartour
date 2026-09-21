import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/crm/auth';
import { getDb, parseId } from '@/lib/crm/db';

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

    const existing = await db.prepare(`
      SELECT p.id, p.amount, p.payment_date, t.reference as trip_reference
      FROM payments p JOIN trips t ON p.trip_id = t.id
      WHERE p.id = ?
    `).get(id) as { id: number; amount: number; payment_date: string; trip_reference: string } | undefined;

    if (!existing) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    await db.prepare('DELETE FROM payments WHERE id = ?').run(id);

    return NextResponse.json({ ok: true, message: 'Payment deleted' });
  } catch (error) {
    console.error('Delete payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
