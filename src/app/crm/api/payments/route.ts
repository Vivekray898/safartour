import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logPayment, logActivity } from '@/lib/crm/activity';
import { CRM_PAYMENT_METHODS } from '@/config/crm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const tripId = searchParams.get('tripId') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getDb();

    let query = `
      SELECT p.*,
        t.reference as trip_reference,
        c.name as customer_name,
        u.name as recorded_by_name
      FROM payments p
      JOIN trips t ON p.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON p.recorded_by = u.id
      WHERE 1=1
    `;

    const params: (string | number)[] = [];

    if (tripId) {
      query += ` AND p.trip_id = ?`;
      params.push(tripId);
    }

    query += ' ORDER BY p.payment_date DESC';

    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const payments = await db.prepare(query).all(...params);

    return NextResponse.json({
      ok: true,
      payments,
      pagination: {
        page,
        limit,
        total: payments.length,
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const db = getDb();

    const { trip_id, amount, payment_date, payment_method, transaction_id, note } = body;

    if (!trip_id || !amount || !payment_date || !payment_method) {
      return NextResponse.json({ error: 'Trip ID, amount, date, and payment method are required' }, { status: 400 });
    }

    const paymentMethodValid = CRM_PAYMENT_METHODS.some(m => m.value === payment_method);
    if (!paymentMethodValid) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 });
    }

    const trip = await db.prepare('SELECT * FROM trips WHERE id = ? AND archived = 0').get(trip_id);
    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const acceptedQuotation = await db.prepare(`
      SELECT q.* FROM quotations q
      WHERE q.trip_id = ? AND q.status = 'accepted'
      ORDER BY q.created_at DESC LIMIT 1
    `).get(trip_id) as { final_amount: number } | undefined;

    const existingPayments = await db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE trip_id = ?
    `).get(trip_id) as { total: number };

    const newTotal = existingPayments.total + amount;

    if (acceptedQuotation && newTotal > acceptedQuotation.final_amount) {
      return NextResponse.json({
        ok: false,
        warning: `Total payments (₹${newTotal.toLocaleString()}) exceed the final amount (₹${acceptedQuotation.final_amount.toLocaleString()})`,
      });
    }

    const result = await db.prepare(`
      INSERT INTO payments (trip_id, amount, payment_date, payment_method, transaction_id, note, recorded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(trip_id, amount, payment_date, payment_method, transaction_id || null, note || null, session.id);

    await logPayment(
      Number(trip_id),
      (trip as { customer_id: number }).customer_id,
      session,
      amount,
      payment_method,
      transaction_id,
      note
    );

    await logActivity({
      trip_id: Number(trip_id),
      customer_id: (trip as { customer_id: number }).customer_id,
      user: session,
      activity_type: 'payment_received',
      description: `Payment of ₹${amount.toLocaleString()} received via ${payment_method}`,
      metadata: { amount, method: payment_method, transaction_id, note },
    });

    const payment = await db.prepare(`
      SELECT p.*,
        t.reference as trip_reference,
        c.name as customer_name,
        u.name as recorded_by_name
      FROM payments p
      JOIN trips t ON p.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON p.recorded_by = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    const totalPaidResult = await db.prepare(`
      SELECT COALESCE(SUM(p.amount), 0) as total FROM payments p
      JOIN trips t ON p.trip_id = t.id
      WHERE t.id = ?
    `).get(trip_id) as { total: number };

    const paidAmount = totalPaidResult.total;

    if (acceptedQuotation) {
      if (paidAmount >= acceptedQuotation.final_amount && acceptedQuotation.final_amount > 0) {
        await logActivity({
          trip_id: Number(trip_id),
          customer_id: (trip as { customer_id: number }).customer_id,
          user: session,
          activity_type: 'payment_received',
          description: 'Full payment received - booking confirmed',
          metadata: { amount: paidAmount, final_amount: acceptedQuotation.final_amount },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      payment,
      totals: {
        paid: paidAmount,
        pending: acceptedQuotation ? Math.max(0, acceptedQuotation.final_amount - paidAmount) : 0,
        final_amount: acceptedQuotation?.final_amount || 0,
      },
    });
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
