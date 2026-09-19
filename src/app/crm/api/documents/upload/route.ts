import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { CRM_DOCUMENT_TYPES } from '@/config/crm';
import { logActivity } from '@/lib/crm/activity';
import type { SessionUser } from '@/lib/crm/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const db = getDb();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tripId = formData.get('tripId') as string;
    const customerId = formData.get('customerId') as string;
    const documentType = formData.get('documentType') as string;
    const notes = formData.get('notes') as string;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!documentType || !CRM_DOCUMENT_TYPES.some(t => t.value === documentType)) {
      return NextResponse.json({ error: 'Valid document type is required' }, { status: 400 });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }

    const uploadDir = join(process.cwd(), 'crm-documents');
    await mkdir(uploadDir, { recursive: true });

    const ext = file.name.split('.').pop() || 'bin';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filepath = join(uploadDir, filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const result = db.prepare(`
      INSERT INTO documents (trip_id, customer_id, document_type, file_name, file_path, file_size, mime_type, notes, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      tripId ? Number(tripId) : null,
      customerId ? Number(customerId) : null,
      documentType,
      file.name,
      `/crm-documents/${filename}`,
      file.size,
      file.type,
      notes || null,
      session.id
    );

    logActivity({
      trip_id: tripId ? Number(tripId) : undefined,
      customer_id: customerId ? Number(customerId) : undefined,
      user: session,
      activity_type: 'document_uploaded',
      description: `Document uploaded: ${documentType}`,
      metadata: { document_type: documentType, file_name: file.name, document_id: result.lastInsertRowid },
    });

    return NextResponse.json({
      ok: true,
      document: {
        id: result.lastInsertRowid,
        trip_id: tripId ? Number(tripId) : null,
        customer_id: customerId ? Number(customerId) : null,
        document_type: documentType,
        file_name: file.name,
        file_path: `/crm-documents/${filename}`,
        file_size: file.size,
        mime_type: file.type,
        notes: notes || null,
        uploaded_by: session.id,
        created_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
