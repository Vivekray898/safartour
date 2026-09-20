import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getDb } from '@/lib/crm/db';

const SESSION_COOKIE = 'crm_session';
const SESSION_DURATION_DAYS = 30;
export const SESSION_DURATION_SECONDS = SESSION_DURATION_DAYS * 86400;

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
  const bcrypt = (await import('bcryptjs')).default;
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = (await import('bcryptjs')).default;
  return bcrypt.compare(password, hash);
}

export function generateSessionToken(): string {
  return crypto.randomUUID();
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
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });

  return token;
}

/** SQLite `datetime('now')` equivalent in Postgres, as TEXT. */
const NOW_TEXT = "to_char((now() AT TIME ZONE 'utc'), 'YYYY-MM-DD HH24:MI:SS')";

/**
 * Next.js uses thrown errors with a `digest` marker as control flow (e.g.
 * "this route must render dynamically" when cookies() runs during a static
 * prerender pass, and redirects). Those must always propagate untouched —
 * catching them and rethrowing something else breaks route classification.
 */
function isNextControlFlowError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const digest = (error as unknown as { digest?: unknown }).digest;
  if (typeof digest !== 'string') return false;
  return ['DYNAMIC_SERVER_USAGE', 'NEXT_STATIC_GEN_BAILOUT', 'NEXT_REDIRECT', 'NEXT_NOT_FOUND'].includes(digest);
}

/** Delete expired sessions so the table does not grow forever. */
async function pruneExpiredSessions(db: ReturnType<typeof getDb>): Promise<void> {
  try {
    await db.prepare(`DELETE FROM sessions WHERE expires_at <= ${NOW_TEXT}`).run();
  } catch {
    // Housekeeping only — never block authentication on this.
  }
}

/**
 * Resolve the current CRM session from the request cookies.
 *
 * Returns null when there is no session cookie, the token is unknown, or the
 * session has expired — that is "not logged in", nothing more. Database
 * failures are surfaced separately by requireAuth/requireRole so a Supabase
 * outage is never misreported as "unauthorized".
 */
export const getSession = cache(async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) return null;

  const db = getDb();
  const row = await db.prepare(`
    SELECT s.user_id, u.name, u.email, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ${NOW_TEXT}
    AND u.is_active = 1
  `).get(token) as { user_id: number; name: string; email: string; role: string } | undefined;

  if (!row) return null;

  return {
    id: Number(row.user_id),
    name: row.name,
    email: row.email,
    role: row.role as 'admin' | 'employee',
  };
});

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    const db = getDb();
    await db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }

  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Require a signed-in CRM user inside a **page / layout** (React Server
 * Component). Redirects to /crm/login when there is no valid session —
 * the correct server-side behavior for navigation. Throws for other cases
 * so genuine failures are not disguised as redirects.
 */
export async function requireAuth(): Promise<SessionUser> {
  let session: SessionUser | null;
  try {
    session = await getSession();
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    console.error('[crm-auth] session lookup failed (database error):', error);
    throw new Error('Database error while checking your session. Please try again.');
  }

  if (!session) {
    redirect('/crm/login');
  }

  return session;
}

/**
 * Require a signed-in CRM user with one of the given roles. Throws on
 * missing role (rendered by the CRM error boundary as a 403-style message)
 * rather than redirecting, so an employee hitting an admin-only page sees
 * "insufficient permissions" instead of a confusing login loop.
 */
export async function requireRole(allowedRoles: string[]): Promise<SessionUser> {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden — insufficient permissions');
  }

  return session;
}

/**
 * Non-redirecting guard for **API route handlers**. Route handlers cannot
 * redirect the browser usefully; they must return a status code. Returns
 * null instead of throwing so callers can respond with 401.
 */
export async function requireApiUser(): Promise<SessionUser | null> {
  try {
    return await getSession();
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    console.error('[crm-auth] API session lookup failed (database error):', error);
    return null;
  }
}

/**
 * Admin-only variant for API route handlers. Returns the session when the
 * caller is an admin, otherwise null (callers respond 401/403).
 */
export async function requireAdminApi(): Promise<SessionUser | null> {
  const session = await requireApiUser();
  if (!session || session.role !== 'admin') return null;
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
