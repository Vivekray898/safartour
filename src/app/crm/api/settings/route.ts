import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireAuth, requireRole } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { hashPassword } from '@/lib/crm/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    const db = getDb();

    const settings = {
      siteName: 'Safar Tours CRM',
      currency: 'INR',
      currencySymbol: '₹',
      dateFormat: 'DD/MM/YYYY',
      timezone: 'Asia/Kolkata',
      sessionTimeoutDays: 30,
      maxFileSizeMB: 10,
      allowedFileTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      requireLostReason: true,
      requireCancellationReason: true,
      taxApplicable: false,
    };

    const users = await db.prepare(`
      SELECT id, name, email, phone, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    return NextResponse.json({
      ok: true,
      settings,
      users,
      currentUser: session,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(['admin']);
    const body = await request.json();
    const db = getDb();

    const { action, name, email, phone, password, role, is_active } = body;

    if (action === 'createUser') {
      if (!name || !email || !password || !role) {
        return NextResponse.json({ error: 'Name, email, password, and role are required' }, { status: 400 });
      }

      const existing = await db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }

      const hashedPassword = await hashPassword(password);

      const result = await db.prepare(`
        INSERT INTO users (name, email, phone, password_hash, role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(name, email, phone || null, hashedPassword, role || 'employee', is_active !== undefined ? (is_active ? 1 : 0) : 1);

      const user = await db.prepare('SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

      return NextResponse.json({ ok: true, user });
    }

    if (action === 'updateUser') {
      const userId = body.userId;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }

      const updates: string[] = [];
      const values: (string | number | null)[] = [];

      if (name !== undefined) { updates.push('name = ?'); values.push(name); }
      if (email !== undefined) { updates.push('email = ?'); values.push(email); }
      if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
      if (role !== undefined) { updates.push('role = ?'); values.push(role); }
      if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }

      if (updates.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      updates.push('updated_at = datetime("now")');
      values.push(userId);

      await db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

      const user = await db.prepare('SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE id = ?').get(userId);

      return NextResponse.json({ ok: true, user });
    }

    if (action === 'deleteUser') {
      const userId = body.userId;
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
      }

      const current = await getSession();
      if (current && userId === current.id) {
        return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
      }

      await db.prepare('DELETE FROM users WHERE id = ?').run(userId);

      return NextResponse.json({ ok: true, message: 'User deleted' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
