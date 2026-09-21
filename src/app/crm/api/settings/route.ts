import { NextRequest, NextResponse } from 'next/server';
import { getSession, requireApiUser, requireAdminApi } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { hashPassword } from '@/lib/crm/auth';
import { getCompanySettings } from '@/lib/crm/settings';
import { storageConfigured } from '@/lib/crm/storage';

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiUser();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
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

    const company = await getCompanySettings();

    const users = await db.prepare(`
      SELECT id, name, email, phone, role, is_active, created_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    return NextResponse.json({
      ok: true,
      settings,
      company,
      storageConfigured: storageConfigured(),
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
    const session = await requireAdminApi();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const body = await request.json();
    const db = getDb();

    const { action } = body;

    // ---- company profile (branding / GST / banking / PDF footer) ----
    if (action === 'updateCompany') {
      const db = getDb();
      const allowed = new Set([
        'company_name', 'address', 'phone', 'whatsapp', 'email', 'website',
        'gst_enabled', 'gst_rate', 'gstin', 'gst_legal_name', 'gst_state', 'gst_state_code',
        'bank_name', 'bank_account_name', 'bank_account_number', 'bank_ifsc', 'upi_id',
        'payment_terms', 'cancellation_policy', 'terms_conditions', 'pdf_footer_text',
        'quotation_prefix',
      ]);

      const updates: string[] = [];
      const values: (string | number)[] = [];
      for (const [key, value] of Object.entries(body.values ?? {})) {
        if (!allowed.has(key)) continue;
        if (key === 'gst_enabled') {
          updates.push('gst_enabled = ?');
          values.push(value ? 1 : 0);
        } else if (key === 'gst_rate') {
          const rate = Math.max(0, Math.min(28, Math.round(Number(value) || 0)));
          updates.push('gst_rate = ?');
          values.push(rate);
        } else if (key === 'quotation_prefix') {
          const prefix = String(value).trim().replace(/[^A-Za-z]/g, '').slice(0, 6).toUpperCase() || 'QT';
          updates.push('quotation_prefix = ?');
          values.push(prefix);
        } else {
          updates.push(`${key} = ?`);
          values.push(value === '' || value === null ? null : String(value));
        }
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
      }

      updates.push("updated_at = datetime('now')");
      await db.prepare(`UPDATE company_settings SET ${updates.join(', ')} WHERE id = 1`).run(...values);

      const company = await getCompanySettings();
      return NextResponse.json({ ok: true, company });
    }

    const { name, email, phone, password, role, is_active } = body;

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
