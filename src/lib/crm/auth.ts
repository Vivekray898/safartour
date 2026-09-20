import { cookies } from 'next/headers';
import { getDb } from './db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const SESSION_COOKIE = 'crm_session';
const SESSION_DURATION_DAYS = 30;

export type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: 'admin' | 'employee';
  is_active: number;
  created_at: string;
};

export type SessionUser = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'employee';
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return randomUUID();
}

export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  const token = generateSessionToken();
  // Same TEXT format the queries compare against ('YYYY-MM-DD HH:MM:SS').
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 86400000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');

  await db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(userId, token, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_DAYS * 86400,
    path: '/crm',
  });

  return token;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const db = getDb();
  const row = await db.prepare(`
    SELECT s.user_id, u.name, u.email, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
    AND u.is_active = 1
  `).get(token) as { user_id: number; name: string; email: string; role: string } | undefined;

  if (!row) return null;

  return {
    id: row.user_id,
    name: row.name,
    email: row.email,
    role: row.role as 'admin' | 'employee',
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = getDb();
    await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden');
  }
  return session;
}

export function canAccessAllLeads(role: string): boolean {
  return role === 'admin';
}

export function canManageUsers(role: string): boolean {
  return role === 'admin';
}

export function canManageHotels(role: string): boolean {
  return role === 'admin';
}

export function canManageSuppliers(role: string): boolean {
  return role === 'admin';
}

export function canManageDrivers(role: string): boolean {
  return role === 'admin';
}

export function canViewReports(role: string): boolean {
  return role === 'admin';
}

export function canManageSettings(role: string): boolean {
  return role === 'admin';
}

export function canArchiveRecords(role: string): boolean {
  return role === 'admin';
}
