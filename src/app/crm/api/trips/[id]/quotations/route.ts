import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const db = getDb();

    const quotations = db.prepare(`
      SELECT q.*,
        u.name as prepared_by_name,
        (SELECT COUNT(*) FROM quotation_items qi WHERE qi.quotation_id = q.id) as items_count
      FROM quotations q
      LEFT JOIN users u ON q.prepared_by = u.id
      WHERE q.trip_id = ?
      ORDER BY q.created_at DESC
    `).all(id);

    return NextResponse.json({ ok: true, quotations });
  } catch (error) {
    console.error('Get trip quotations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
