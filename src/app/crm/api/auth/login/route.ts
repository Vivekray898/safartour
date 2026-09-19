import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/crm/db';
import { verifyPassword, createSession } from '@/lib/crm/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT id, name, email, phone, password_hash, role, is_active
      FROM users
      WHERE email = ?
    `).get(email) as {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      password_hash: string;
      role: string;
      is_active: number;
    } | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is disabled' },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = await createSession(user.id);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
