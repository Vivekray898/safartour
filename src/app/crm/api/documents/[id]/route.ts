import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { readFile } from 'fs/promises';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const db = getDb();

    const doc = await db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as {
      id: number;
      file_path: string;
      file_name: string;
      mime_type: string | null;
      file_size: number | null;
    } | undefined;

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const fullPath = join(process.cwd(), doc.file_path);
    const content = await readFile(fullPath);

    return new NextResponse(content, {
      headers: {
        'Content-Type': doc.mime_type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${doc.file_name}"`,
        'Content-Length': String(doc.file_size || content.length),
      },
    });
  } catch (error) {
    console.error('Download document error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
