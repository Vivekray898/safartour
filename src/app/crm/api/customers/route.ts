import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/crm/auth';
import { getDb } from '@/lib/crm/db';
import { logActivity } from '@/lib/crm/activity';

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const db = getDb();
    const offset = (page - 1) * limit;
    
    let query = `SELECT c.*, u.name as assigned_employee_name FROM customers c LEFT JOIN users u ON c.assigned_employee_id = u.id WHERE c.archived = 0`;
    const filterParams: (string | number)[] = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)`;
      const s = `%${search}%`;
      filterParams.push(s, s, s);
    }

    query += ' ORDER BY c.updated_at DESC LIMIT ? OFFSET ?';
    filterParams.push(limit, offset);

    const customers = await db.prepare(query).all(...filterParams);
    const totalResult = await db.prepare('SELECT COUNT(*) as count FROM customers WHERE archived = 0').get() as { count: number };

    return NextResponse.json({ ok: true, customers, pagination: { page, limit, total: totalResult.count } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const db = getDb();

    const { name, phone, whatsapp, email, city, alt_phone, preferred_contact, company, company_contact_person, assigned_employee_id, existing_customer_id } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    if (existing_customer_id) {
      const existing = await db.prepare('SELECT * FROM customers WHERE id = ?').get(existing_customer_id);
      if (!existing) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

      await db.prepare(`UPDATE customers SET name=?, phone=?, whatsapp=?, email=?, city=?, alt_phone=?, preferred_contact=?, company=?, company_contact_person=?, assigned_employee_id=?, updated_at=datetime('now'), is_repeat_customer=1 WHERE id=?`).run(
        name || (existing as { name: string }).name,
        phone || (existing as { phone: string }).phone,
        whatsapp || (existing as { phone: string }).phone,
        email || (existing as { email: string | null }).email,
        city || (existing as { city: string | null }).city,
        alt_phone || (existing as { alt_phone: string | null }).alt_phone,
        preferred_contact || (existing as { preferred_contact: string | null }).preferred_contact,
        company || (existing as { company: string | null }).company,
        company_contact_person || (existing as { company_contact_person: string | null }).company_contact_person,
        assigned_employee_id || (existing as { assigned_employee_id: number | null }).assigned_employee_id,
        existing_customer_id
      );

      await logActivity({ customer_id: existing_customer_id, user: session, activity_type: 'customer_updated', description: 'Customer details updated' });

      return NextResponse.json({ ok: true, customer: { id: existing_customer_id, name, phone, whatsapp, email, city, alt_phone, preferred_contact, company, company_contact_person, assigned_employee_id, is_repeat_customer: 1 } });
    }

    const existingPhone = await db.prepare('SELECT id FROM customers WHERE phone = ? AND archived = 0').get(phone);
    if (existingPhone) {
      return NextResponse.json({ ok: false, duplicate: true, duplicate_phone: (existingPhone as { id: number }).id, message: 'Customer with this phone exists' });
    }

    const result = await db.prepare(`INSERT INTO customers (name, phone, whatsapp, email, city, alt_phone, preferred_contact, company, company_contact_person, assigned_employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      name, phone, whatsapp || phone, email || null, city || null, alt_phone || null, preferred_contact || null, company || null, company_contact_person || null, assigned_employee_id || null
    );

    await logActivity({ customer_id: Number(result.lastInsertRowid), user: session, activity_type: 'customer_created', description: `Customer created: ${name}` });

    return NextResponse.json({ ok: true, customer: { id: result.lastInsertRowid, name, phone, whatsapp: whatsapp || phone } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
