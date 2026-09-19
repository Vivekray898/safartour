import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getActivitiesForTrip } from '@/lib/crm/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;

    const activities = getActivitiesForTrip(Number(id), 100);

    return NextResponse.json({ ok: true, activities });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
