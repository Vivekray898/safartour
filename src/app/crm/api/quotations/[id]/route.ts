import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logActivity, logQuotationAction } from '@/lib/crm/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const quotation = await db.prepare(`
      SELECT q.*,
        t.reference as trip_reference,
        c.name as customer_name, c.phone as customer_phone, c.email as customer_email,
        c.city as customer_city,
        t.destination as trip_destination, t.start_date as trip_start_date, t.end_date as trip_end_date,
        t.total_pax as trip_pax, t.adults as trip_adults,
        u.name as prepared_by_name,
        (SELECT COUNT(*) FROM quotation_items qi WHERE qi.quotation_id = q.id) as items_count
      FROM quotations q
      JOIN trips t ON q.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON q.prepared_by = u.id
      WHERE q.id = ?
    `).get(id);

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const items = await db.prepare(`
      SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC
    `).all(id);

    return NextResponse.json({
      ok: true,
      quotation: { ...quotation, items },
    });
  } catch (error) {
    console.error('Get quotation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const quotation = await db.prepare(`
      SELECT q.*,
        t.customer_id, t.reference as trip_reference
      FROM quotations q
      JOIN trips t ON q.trip_id = t.id
      WHERE q.id = ?
    `).get(id) as {
      id: number;
      trip_id: number;
      reference: string;
      status: string;
      final_amount: number;
      customer_id: number;
      trip_reference: string;
    } | undefined;

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const updates = new Map<string, unknown>();
    const metadata: Record<string, unknown> = {};

    if (body.status !== undefined) {
      const oldStatus = quotation.status;
      updates.set('status', body.status);

      if (body.status === 'sent' && oldStatus === 'draft') {
        metadata.sent_via = body.sent_via || 'manual';
      }
      if (body.status === 'viewed') {
        metadata.viewed_at = new Date().toISOString();
      }
      if (body.status === 'accepted') {
        metadata.accepted_at = new Date().toISOString();
      }
      if (body.status === 'rejected') {
        metadata.rejected_at = new Date().toISOString();
      }
    }

    if (body.notes !== undefined) {
      updates.set('notes', body.notes);
      metadata.notes = body.notes;
    }

    if (body.terms !== undefined) {
      updates.set('terms', body.terms);
      metadata.terms = body.terms;
    }

    if (body.valid_until !== undefined) {
      updates.set('valid_until', body.valid_until);
      metadata.valid_until = body.valid_until;
    }

    if (body.discount !== undefined) {
      updates.set('discount', body.discount);
      metadata.discount = body.discount;
    }

    if (body.tax !== undefined) {
      updates.set('tax', body.tax);
      metadata.tax = body.tax;
    }

    const newFinalAmount = calculateFinalAmount(
      quotation.subtotal,
      body.discount !== undefined ? body.discount : quotation.discount,
      body.tax !== undefined ? body.tax : quotation.tax
    );

    if (newFinalAmount !== quotation.final_amount) {
      updates.set('final_amount', newFinalAmount);
      metadata.final_amount = newFinalAmount;
    }

    if (updates.size === 0) {
      return NextResponse.json({ ok: true, quotation });
    }

    const setClause = Array.from(updates.keys()).map(k => `${k} = ?`).join(', ');
    const values = Array.from(updates.values());

    if (body.status === 'revised' || body.status === 'sent') {
      const existingRevisions = await db.prepare('SELECT COUNT(*) as count FROM quotations WHERE trip_id = (SELECT trip_id FROM quotations WHERE id = ?)').get(id) as { count: number };

      if (body.status === 'revised') {
        const newVersion = `V${existingRevisions.count + 1}`;
        const newRef = generateQuotationReference();

        await db.prepare(`
          INSERT INTO quotations (reference, trip_id, version, status, quotation_date, valid_until, prepared_by, subtotal, discount, tax, final_amount, notes, terms)
          SELECT ?, t.id, ?, 'draft', datetime('now'), q.valid_until, q.prepared_by, q.subtotal, q.discount, q.tax, q.final_amount, q.notes, q.terms
          FROM quotations q JOIN trips t ON q.trip_id = t.id WHERE q.id = ?
        `).run(newRef, newVersion, id);

        await logActivity({
          trip_id: quotation.trip_id,
          customer_id: quotation.customer_id,
          user: session,
          activity_type: 'quotation_revised',
          description: `Quotation revised: ${newRef}`,
          metadata: { original_ref: quotation.reference, new_ref: newRef, amount: newFinalAmount },
        });
      }
    }

    await db.prepare(`UPDATE quotations SET ${setClause}, updated_at = datetime('now') WHERE id = ?`).run(...values, id);

    await logQuotationAction(
      quotation.trip_id,
      quotation.customer_id,
      session,
      body.status === 'revised' ? 'revised' :
      body.status === 'sent' ? 'sent' :
      body.status === 'viewed' ? 'viewed' :
      body.status === 'accepted' ? 'accepted' :
      body.status === 'rejected' ? 'rejected' : 'created',
      quotation.reference,
      newFinalAmount,
      body.status ? undefined : body.notes
    );

    if (body.status === 'sent') {
      await logActivity({
        trip_id: quotation.trip_id,
        customer_id: quotation.customer_id,
        user: session,
        activity_type: 'quotation_sent',
        description: `Quotation ${quotation.reference} sent`,
        metadata: { quotation_ref: quotation.reference, amount: newFinalAmount, sent_via: body.sent_via },
      });
    }

    const updated = await db.prepare(`
      SELECT q.*,
        t.reference as trip_reference,
        c.name as customer_name,
        u.name as prepared_by_name
      FROM quotations q
      JOIN trips t ON q.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON q.prepared_by = u.id
      WHERE q.id = ?
    `).get(id);

    return NextResponse.json({ ok: true, quotation: updated });
  } catch (error) {
    console.error('Update quotation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateFinalAmount(subtotal: number, discount: number, tax: number): number {
  return Math.max(0, subtotal - discount + tax);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const quotation = await db.prepare('SELECT * FROM quotations WHERE id = ?').get(id);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    await db.prepare('DELETE FROM quotations WHERE id = ?').run(id);

    return NextResponse.json({ ok: true, message: 'Quotation deleted' });
  } catch (error) {
    console.error('Delete quotation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
