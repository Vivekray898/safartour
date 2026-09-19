import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { CRM_DOCUMENT_TYPES } from '@/config/crm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const db = getDb();

    const documents = db.prepare(`
      SELECT d.*,
        u.name as uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.trip_id = ?
      ORDER BY d.created_at DESC
    `).all(id);

    const checklist = CRM_DOCUMENT_TYPES.filter(t =>
      ['id_proof', 'passport', 'visa', 'permit', 'hotel_voucher', 'payment_receipt', 'quotation', 'itinerary'].includes(t.value)
    ).map(t => {
      const hasDoc = documents.some(d => d.document_type === t.value);
      return {
        type: t.value,
        label: t.label,
        has: hasDoc,
      };
    });

    return NextResponse.json({ ok: true, documents, checklist });
  } catch (error) {
    console.error('Get trip documents error:', error);
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
    const documentId = request.nextUrl.searchParams.get('documentId');
    const db = getDb();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const doc = db.prepare('SELECT * FROM documents WHERE id = ? AND trip_id = ?').get(documentId, id);
    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    db.prepare('DELETE FROM documents WHERE id = ?').run(documentId);

    return NextResponse.json({ ok: true, message: 'Document deleted' });
  } catch (error) {
    console.error('Delete trip document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
