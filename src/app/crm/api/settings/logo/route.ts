import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { uploadLogo, removeLogoObjects, storageConfigured } from '@/lib/crm/storage';

export async function GET() {
  const ok = await requireAdminApi();
  if (!ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const db = getDb();
  const row = await db.prepare('SELECT logo_url FROM company_settings WHERE id = 1').get() as { logo_url: string | null } | undefined;
  return NextResponse.json({ ok: true, logo_url: row?.logo_url ?? null, storageConfigured: storageConfigured() });
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const action = request.nextUrl.searchParams.get('action');

    if (action === 'remove') {
      await removeLogoObjects();
      const db = getDb();
      await db.prepare('UPDATE company_settings SET logo_url = NULL, updated_at = datetime(\'now\') WHERE id = 1').run();
      return NextResponse.json({ ok: true, logo_url: null });
    }

    // Default: upload (multipart/form-data with a `file` field).
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const logoUrl = await uploadLogo(file);

    const db = getDb();
    await db.prepare('UPDATE company_settings SET logo_url = ?, updated_at = datetime(\'now\') WHERE id = 1').run(logoUrl);

    return NextResponse.json({ ok: true, logo_url: logoUrl });
  } catch (error) {
    console.error('Logo upload error:', error);
    const message = error instanceof Error ? error.message : 'Logo upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
