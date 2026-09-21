import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireApiUser } from '@/lib/crm/auth';
import { getActivitiesForTrip } from '@/lib/crm/activity';
import { parseId } from '@/lib/crm/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { id: idParam } = await params;
    const id = parseId(idParam);
    if (id === null) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const activities = await getActivitiesForTrip(id, 100);

    return NextResponse.json({ ok: true, activities });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
