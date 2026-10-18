import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/crm/db';
import { verifyPassword, createSession } from '@/lib/crm/auth';
import { crmLoginSchema } from '@/lib/validations';
import {
  clearFailedLogins,
  getRequestIp,
  isLoginRateLimited,
  recordFailedLogin,
} from '@/lib/crm/login-rate-limit';

export async function POST(request: NextRequest) {
  const ip = getRequestIp(request);

  try {
    const body = await request.json().catch(() => null);
    const parsed = crmLoginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const rateLimit = isLoginRateLimited(ip);
    if (rateLimit.limited) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const { email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const db = getDb();
    const user = await db.prepare(`
      SELECT id, name, email, phone, password_hash, role, is_active
      FROM users
      WHERE email = ?
    `).get(normalizedEmail) as {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      password_hash: string;
      role: string;
      is_active: number;
    } | undefined;

    if (!user || !user.is_active) {
      recordFailedLogin(ip);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      recordFailedLogin(ip);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await createSession(user.id);
    clearFailedLogins(ip);

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
