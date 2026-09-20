import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireApiUser } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logActivity } from '@/lib/crm/activity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { id } = await params;
    const db = getDb();

    const tasks = await db.prepare(`
      SELECT t.*,
        u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.trip_id = ?
      ORDER BY t.due_date ASC, t.created_at DESC
    `).all(id);

    return NextResponse.json({ ok: true, tasks });
  } catch (error) {
    console.error('Get trip tasks error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const { id } = await params;
    const body = await request.json();
    const db = getDb();

    const { title, description, assigned_to, priority, due_date } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const result = await db.prepare(`
      INSERT INTO tasks (trip_id, title, description, assigned_to, priority, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, description || null, assigned_to || session.id, priority || 'medium', due_date || null);

    await logActivity({
      trip_id: Number(id),
      user: session,
      activity_type: 'task_created',
      description: `Task created: ${title}`,
      metadata: { task_title: title, priority, due_date },
    });

    const task = await db.prepare(`
      SELECT t.*,
        u.name as assigned_to_name
      FROM tasks t
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ ok: true, task });
  } catch (error) {
    console.error('Create trip task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const taskId = request.nextUrl.searchParams.get('taskId');
    const db = getDb();

    if (!taskId) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as {
      id: number;
      trip_id: number;
      title: string;
      status: string;
    } | undefined;

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const result = await db.prepare(`
      UPDATE tasks SET status = ?, completed_at = datetime('now'), completed_by = ?
      WHERE id = ?
    `).run('completed', session.id, taskId);

    await logActivity({
      trip_id: task.trip_id,
      user: session,
      activity_type: 'task_completed',
      description: `Task completed: ${task.title}`,
      metadata: { task_id: taskId },
    });

    return NextResponse.json({ ok: true, message: 'Task completed' });
  } catch (error) {
    console.error('Complete trip task error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
