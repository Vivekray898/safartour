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

    const items = await db.prepare(`
      SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC
    `).all(id);

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error('Get quotation items error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const item = body.item;
    if (!item || !item.description || !item.category) {
      return NextResponse.json({ error: 'Item description and category are required' }, { status: 400 });
    }

    const result = await db.prepare(`
      INSERT INTO quotation_items (quotation_id, category, description, details, quantity, amount)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, item.category, item.description, item.details || null, item.quantity || 1, item.amount || 0);

    const subtotalResult = await db.prepare(`
      SELECT COALESCE(SUM(amount * quantity), 0) as subtotal FROM quotation_items WHERE quotation_id = ?
    `).get(id) as { subtotal: number };

    const quotation = await db.prepare('SELECT * FROM quotations WHERE id = ?').get(id) as {
      id: number;
      subtotal: number;
      discount: number;
      tax: number;
      final_amount: number;
    };

    const newSubtotal = subtotalResult.subtotal;
    const newFinalAmount = Math.max(0, newSubtotal - (body.item?.discount !== undefined ? body.item.discount : quotation.discount) + quotation.tax);

    await db.prepare(`
      UPDATE quotations SET subtotal = ?, final_amount = ?, updated_at = datetime('now') WHERE id = ?
    `).run(newSubtotal, newFinalAmount, id);

    const newItem = await db.prepare('SELECT * FROM quotation_items WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ ok: true, item: newItem });
  } catch (error) {
    console.error('Add quotation item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const itemId = request.nextUrl.searchParams.get('itemId');
    const db = getDb();

    if (!itemId) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 });
    }

    await db.prepare('DELETE FROM quotation_items WHERE id = ? AND quotation_id = ?').run(itemId, id);

    const subtotalResult = await db.prepare(`
      SELECT COALESCE(SUM(amount * quantity), 0) as subtotal FROM quotation_items WHERE quotation_id = ?
    `).get(id) as { subtotal: number };

    await db.prepare(`
      UPDATE quotations SET subtotal = ?, updated_at = datetime('now') WHERE id = ?
    `).run(subtotalResult.subtotal, id);

    return NextResponse.json({ ok: true, message: 'Item deleted' });
  } catch (error) {
    console.error('Delete quotation item error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
