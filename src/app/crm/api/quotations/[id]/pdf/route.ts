import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { generateQuotationPDF } from '@/lib/crm/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    const { id } = await params;
    const db = getDb();

    const quotation = db.prepare(`
      SELECT q.*,
        t.reference as trip_reference,
        t.destination as trip_destination,
        t.start_date as trip_start_date,
        t.end_date as trip_end_date,
        t.total_pax as trip_total_pax,
        t.adults as trip_adults,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.city as customer_city,
        u.name as prepared_by_name
      FROM quotations q
      JOIN trips t ON q.trip_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON q.prepared_by = u.id
      WHERE q.id = ?
    `).get(id) as {
      id: number;
      reference: string;
      quotation_date: string;
      valid_until: string | null;
      subtotal: number;
      discount: number;
      tax: number;
      final_amount: number;
      notes: string | null;
      terms: string | null;
      prepared_by: number | null;
      prepared_by_name: string | null;
      trip_reference: string;
      trip_destination: string | null;
      trip_start_date: string | null;
      trip_end_date: string | null;
      trip_total_pax: number | null;
      trip_adults: number | null;
      customer_name: string;
      customer_phone: string | null;
      customer_email: string | null;
      customer_city: string | null;
    } | undefined;

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    const items = db.prepare(`
      SELECT * FROM quotation_items WHERE quotation_id = ? ORDER BY id ASC
    `).all(id);

    const itemsWithCategoryIcon = items.map((item: {
      category: string;
      description: string;
      details: string | null;
      quantity: number;
      amount: number;
    }) => ({
      ...item,
    }));

    const site = {
      name: 'Safar Tours',
      phone: '+91 98765 43210',
      email: 'info@safartour.in',
      address: 'Mall Road, Darjeeling, West Bengal',
    };

    const pdfBuffer = await generateQuotationPDF({
      reference: quotation.reference,
      date: quotation.quotation_date,
      validUntil: quotation.valid_until,
      customer: {
        name: quotation.customer_name,
        phone: quotation.customer_phone,
        email: quotation.customer_email,
        city: quotation.customer_city,
      },
      trip: {
        reference: quotation.trip_reference,
        destination: quotation.trip_destination,
        start_date: quotation.trip_start_date,
        end_date: quotation.trip_end_date,
        total_pax: quotation.trip_total_pax,
        adults: quotation.trip_adults,
      },
      items: itemsWithCategoryIcon as Array<{
        category: string;
        description: string;
        details: string | null;
        quantity: number;
        amount: number;
      }>,
      subtotal: quotation.subtotal,
      discount: quotation.discount,
      tax: quotation.tax,
      finalAmount: quotation.final_amount,
      notes: quotation.notes,
      terms: quotation.terms,
      prepared_by: quotation.prepared_by_name,
      company: site,
    });

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${quotation.reference}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Generate PDF error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
