import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logActivity } from '@/lib/crm/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();
    const { id } = await params;
    const db = getDb();

    const days = db.prepare(`
      SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY day_number ASC
    `).all(id);

    return NextResponse.json({ ok: true, days });
  } catch (error) {
    console.error('Get trip itinerary error:', error);
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

    const { day_number, date, location, activities, hotel, meals, transport, notes } = body;

    if (!day_number) {
      return NextResponse.json({ error: 'Day number is required' }, { status: 400 });
    }    const existingDay = await db.prepare('SELECT * FROM itinerary_days WHERE trip_id = ? AND day_number = ?').get(id, day_number);
    const isUpdate = !!existingDay;

    if (isUpdate) {
      await db.prepare(`
        UPDATE itinerary_days SET date = ?, location = ?, activities = ?, hotel = ?, meals = ?, transport = ?, notes = ?, created_at = datetime('now')
        WHERE id = ?
      `).run(date || null, location || null, JSON.stringify(activities || []), hotel || null, JSON.stringify(meals || []), transport || null, notes || null, (existingDay as { id: number }).id);
    } else {
      const result = await db.prepare(`
        INSERT INTO itinerary_days (trip_id, day_number, date, location, activities, hotel, meals, transport, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, day_number, date || null, location || null, JSON.stringify(activities || []), hotel || null, JSON.stringify(meals || []), transport || null, notes || null);

      await logActivity({
        trip_id: Number(id),
        user: session,
        activity_type: 'lead_created',
        description: `Itinerary day ${day_number} added`,
        metadata: { day_number, location },
      });
    }

    const days = await db.prepare('SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY day_number ASC').all(id);

    return NextResponse.json({ ok: true, days });
  } catch (error) {
    console.error('Save trip itinerary error:', error);
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
    const dayId = request.nextUrl.searchParams.get('dayId');
    const db = getDb();

    if (!dayId) {
      return NextResponse.json({ error: 'Day ID is required' }, { status: 400 });
    }

    const day = await db.prepare('SELECT * FROM itinerary_days WHERE id = ?').get(dayId) as { id: number; day_number: number } | undefined;
    if (!day) {
      return NextResponse.json({ error: 'Day not found' }, { status: 404 });
    }

    await db.prepare('DELETE FROM itinerary_days WHERE id = ?').run(dayId);

    await db.prepare(`
      UPDATE itinerary_days SET day_number = day_number - 1 WHERE trip_id = ? AND day_number > ?
    `).run(id, day.day_number);

    return NextResponse.json({ ok: true, message: 'Day deleted' });
  } catch (error) {
    console.error('Delete trip itinerary day error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
