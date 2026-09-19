import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logPayment } from '@/lib/crm/activity';
import { CRM_PAYMENT_METHODS } from '@/config/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const db = getDb();

    const payments = db.prepare(`
      SELECT p.*,
        u.name as recorded_by_name
      FROM payments p
      LEFT JOIN users u ON p.recorded_by = u.id
      WHERE p.trip_id = ?
      ORDER BY p.payment_date DESC
    `).all(id);

    const totalPaid = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE trip_id = ?
    `).get(id) as { total: number };

    const acceptedQuotation = db.prepare(`
      SELECT q.final_amount FROM quotations q
      WHERE q.trip_id = ? AND q.status = 'accepted'
      ORDER BY q.created_at DESC LIMIT 1
    `).get(id) as { final_amount: number } | undefined;

    const finalAmount = acceptedQuotation?.final_amount || 0;
    const pendingAmount = Math.max(0, finalAmount - totalPaid.total);

    return NextResponse.json({
      ok: true,
      payments,
      totals: {
        paid: totalPaid.total,
        pending: pendingAmount,
        final_amount: finalAmount,
      },
    });
  } catch (error) {
    console.error('Get trip payments error:', error);
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

    const { amount, payment_date, payment_method, transaction_id, note } = body;

    if (!amount || !payment_date || !payment_method) {
      return NextResponse.json({ error: 'Amount, date, and payment method are required' }, { status: 400 });
    }

    const paymentMethodValid = CRM_PAYMENT_METHODS.some(m => m.value === payment_method);
    if (!paymentMethodValid) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND archived = 0').get(id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const existingPayments = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE trip_id = ?
    `).get(id) as { total: number };

    const newTotal = existingPayments.total + amount;

    const acceptedQuotation = db.prepare(`
      SELECT q.* FROM quotations q
      WHERE q.trip_id = ? AND q.status = 'accepted'
      ORDER BY q.created_at DESC LIMIT 1
    `).get(id) as { final_amount: number } | undefined;

    if (acceptedQuotation && newTotal > acceptedQuotation.final_amount) {
      return NextResponse.json({
        ok: false,
        warning: `Total payments would exceed final amount`,
      });
    }

    const result = db.prepare(`
      INSERT INTO payments (trip_id, amount, payment_date, payment_method, transaction_id, note, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, amount, payment_date, payment_method, transaction_id || null, note || null, session.id);

    logPayment(Number(id), null, session, amount, payment_method, transaction_id, note);

    const totalPaid = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE trip_id = ?
    `).get(id) as { total: number };

    return NextResponse.json({
      ok: true,
      payment: {
        id: result.lastInsertRowid,
        trip_id: Number(id),
        amount,
        payment_date,
        payment_method,
        transaction_id: transaction_id || null,
        note: note || null,
        recorded_by: session.id,
        created_at: new Date().toISOString(),
      },
      totals: {
        paid: totalPaid.total,
        pending: acceptedQuotation ? Math.max(0, acceptedQuotation.final_amount - totalPaid.total) : 0,
        final_amount: acceptedQuotation?.final_amount || 0,
      },
    });
  } catch (error) {
    console.error('Create trip payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
