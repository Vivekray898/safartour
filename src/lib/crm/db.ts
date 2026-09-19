import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

const DB_PATH = process.env.CRM_DB_PATH || join(process.cwd(), 'crm-data.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const schemaPath = join(process.cwd(), 'src', 'lib', 'crm', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  _db = db;
  return db;
}

export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

export function resetDb(): void {
  closeDb();
  const db = getDb();
  db.exec('DELETE FROM activities');
  db.exec('DELETE FROM communications');
  db.exec('DELETE FROM documents');
  db.exec('DELETE FROM followups');
  db.exec('DELETE FROM itinerary_days');
  db.exec('DELETE FROM payments');
  db.exec('DELETE FROM quotation_items');
  db.exec('DELETE FROM quotations');
  db.exec('DELETE FROM tasks');
  db.exec('DELETE FROM trips');
  db.exec('DELETE FROM customers');
  db.exec('DELETE FROM drivers');
  db.exec('DELETE FROM hotels');
  db.exec('DELETE FROM suppliers');
  db.exec('DELETE FROM audit_logs');
  db.exec('DELETE FROM sessions');
  db.exec('DELETE FROM users');
  initializeDefaultData(db);
}

function initializeDefaultData(db: Database.Database): void {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('admin123', 10);

  db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, role) VALUES
    ('Admin User', 'admin@safartour.crm', '+919876543210', ?, 'admin'),
    ('Rajesh Kumar', 'rajesh@safartour.crm', '+919876543211', ?, 'employee')
  `).run(hash, hash);

  db.prepare(`
    INSERT INTO customers (name, phone, whatsapp, email, city, preferred_contact, trip_count, is_repeat_customer, first_trip_at, last_trip_at) VALUES
    ('Rohan Sharma', '+919876543212', '+919876543212', 'rohan@email.com', 'Darjeeling', 'whatsapp', 2, 1, '2026-01-15', '2026-06-20'),
    ('Priya Singh', '+919876543213', '+919876543213', 'priya@email.com', 'Kolkata', 'phone', 1, 0, '2026-03-10', '2026-03-10'),
    ('Amit Verma', '+919876543214', '+919876543214', 'amit@email.com', 'Delhi', 'email', 0, 0, NULL, NULL)
  `).run();

  const now = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  db.prepare(`
    INSERT INTO trips (reference, customer_id, assigned_employee_id, status, priority, lead_source, destination, trip_type, group_type, start_date, end_date, total_pax, adults, budget_min, budget_max, budget_type, customer_facing_notes, internal_notes, next_followup_date, created_by, created_at, updated_at) VALUES
    ('ST-2026-00001', 1, 1, 'booked', 'high', 'website', 'Darjeeling|Sikkim', 'package', 'family', '2026-09-25', '2026-09-30', 4, 2, 45000, 55000, 'total_trip', 'Family trip, need child friendly hotels', 'VIP customer, follow up personally', '${nextWeek}', 1, '${lastMonth}', '${lastMonth}'),
    ('ST-2026-00002', 2, 2, 'quotation_sent', 'medium', 'whatsapp', 'Sikkim', 'package', 'couple', '2026-10-10', '2026-10-15', 2, 2, 35000, 40000, 'total_trip', 'Honeymoon trip', 'Check hotel availability in Gangtok', '${nextWeek}', 2, '${lastMonth}', '${lastMonth}'),
    ('ST-2026-00003', 3, 1, 'new', 'low', 'call', 'Kalimpong', 'custom_trip', 'friends', '2026-11-01', '2026-11-05', 3, 3, 20000, 30000, 'total_trip', NULL, NULL, '${nextWeek}', 1, '${lastMonth}', '${lastMonth}'),
    ('ST-2026-00004', 1, 2, 'completed', 'medium', 'referral', 'Darjeeling', 'package', 'family', '2026-06-15', '2026-06-20', 4, 2, 40000, 45000, 'total_trip', 'Summer vacation', NULL, NULL, NULL, 2, '${lastMonth}', '${lastMonth}'),
    ('ST-2026-00005', 2, 1, 'negotiation', 'high', 'google', 'Meghalaya', 'package', 'couple', '2026-10-20', '2026-10-25', 2, 2, 50000, 60000, 'total_trip', 'Want luxury stay', 'Customer comparing with other agencies', '${nextWeek}', 1, '${lastMonth}', '${lastMonth}')
  `).run();

  db.prepare(`
    INSERT INTO quotations (reference, trip_id, version, status, quotation_date, valid_until, prepared_by, subtotal, discount, tax, final_amount, notes, terms, sent_via) VALUES
    ('QT-2026-00001', 1, 'V1', 'accepted', '2026-08-01', '2026-09-01', 1, 50000, 5000, 0, 45000, 'Family package with all inclusions', 'Payment to be made 7 days before travel', 'whatsapp'),
    ('QT-2026-00002', 2, 'V1', 'sent', '2026-08-15', '2026-09-15', 2, 42000, 2000, 0, 40000, 'Honeymoon special package', 'Valid until stated date', 'email'),
    ('QT-2026-00003', 5, 'V1', 'sent', '2026-08-20', '2026-09-20', 1, 55000, 5000, 0, 50000, 'Premium Meghalaya experience', 'Negotiating on price', 'whatsapp')
  `).run();

  db.prepare(`
    INSERT INTO quotation_items (quotation_id, category, description, details, quantity, amount) VALUES
    (1, 'hotel', 'Hotel Night Stay', '2 Double Rooms, 3 Nights', 6, 24000),
    (1, 'transport', 'Innova Crysta', '6 Days with driver', 6, 15000),
    (1, 'sightseeing', 'Darjeeling Local Sightseeing', 'Full day', 1, 3000),
    (1, 'other', 'Guide Services', 'Optional', 1, 3000),
    (2, 'hotel', 'Luxury Hotel in Gangtok', '1 Deluxe Room, 5 Nights', 5, 20000),
    (2, 'transport', 'SUV', '5 Days', 5, 10000),
    (2, 'sightseeing', 'Tsomgo Lake Excursion', 'Day trip', 1, 2000),
    (3, 'hotel', 'Resort in Shillong', '1 Premium Room, 5 Nights', 5, 25000),
    (3, 'transport', 'Innova Crysta', '5 Days', 5, 12000),
    (3, 'sightseeing', 'Living Root Bridge Tour', 'Full day', 1, 3000)
  `).run();

  db.prepare(`
    INSERT INTO payments (trip_id, amount, payment_date, payment_method, transaction_id, note, recorded_by) VALUES
    (1, 20000, '2026-08-05', 'upi', 'UPI123456', 'Advance payment', 1),
    (1, 25000, '2026-09-15', 'bank_transfer', 'BT789012', 'Final payment', 1),
    (4, 15000, '2026-06-10', 'cash', NULL, 'Advance', 2),
    (4, 25000, '2026-06-14', 'upi', 'UPI789012', 'Balance payment', 2)
  `).run();

  db.prepare(`
    INSERT INTO followups (trip_id, scheduled_date, scheduled_time, followup_type, assigned_to, note, status) VALUES
    (2, '${nextWeek}', '10:00', 'whatsapp', 2, 'Follow up on quotation', 'pending'),
    (3, '${nextWeek}', '14:00', 'call', 1, 'Call to understand requirements', 'pending'),
    (5, '2026-09-18', '11:00', 'email', 1, 'Send revised quotation', 'pending'),
    (1, '2026-09-15', '09:00', 'call', 1, 'Pre-trip confirmation call', 'completed', '2026-09-15', 1)
  `).run();

  db.prepare(`
    INSERT INTO tasks (trip_id, title, description, assigned_to, priority, status, due_date) VALUES
    (1, 'Confirm hotel booking', 'Book 2 double rooms in Darjeeling', 1, 'high', 'completed', '2026-09-20'),
    (2, 'Check vehicle availability', 'Ensure Innova available for October', 2, 'medium', 'pending', '${nextWeek}'),
    (5, 'Prepare revised quotation', 'Include additional sightseeing options', 1, 'high', 'pending', '2026-09-17')
  `).run();

  db.prepare(`
    INSERT INTO activities (trip_id, customer_id, user_id, activity_type, description, metadata, created_at) VALUES
    (1, 1, 1, 'lead_created', 'Lead created from website enquiry', '{"source":"website","page":"/packages/darjeeling"}', '${lastMonth}'),
    (1, 1, 1, 'status_changed', 'Status changed from new to contacted', '{"from":"new","to":"contacted"}', '${lastMonth}'),
    (1, 1, 1, 'quotation_created', 'Quotation QT-2026-00001 created', '{"quotation_ref":"QT-2026-00001","amount":45000}', '2026-08-01'),
    (1, 1, 1, 'quotation_accepted', 'Customer accepted quotation', '{"quotation_ref":"QT-2026-00001"}', '2026-08-10'),
    (1, 1, 1, 'payment_received', 'Payment of 20000 received via UPI', '{"amount":20000,"method":"upi"}', '2026-08-05'),
    (1, 1, 1, 'payment_received', 'Payment of 25000 received via Bank Transfer', '{"amount":25000,"method":"bank_transfer"}', '2026-09-15'),
    (1, 1, 1, 'status_changed', 'Status changed from booking_pending to booked', '{"from":"booking_pending","to":"booked"}', '2026-09-20'),
    (2, 2, 2, 'lead_created', 'Lead created from WhatsApp enquiry', '{"source":"whatsapp"}', '${lastMonth}'),
    (2, 2, 2, 'quotation_created', 'Quotation QT-2026-00002 created', '{"quotation_ref":"QT-2026-00002","amount":40000}', '2026-08-15'),
    (4, 1, 2, 'trip_completed', 'Trip completed successfully', '{"feedback":"Great experience"}', '${lastMonth}')
  `).run();

  db.prepare(`
    INSERT INTO hotels (name, destination, category, contact_phone, contact_email, address, room_types, meal_plans, notes, is_active) VALUES
    ('Darjeeling Monarch', 'Darjeeling', '3 Star Deluxe', '+919876543220', 'info@monarch.com', 'Mall Road, Darjeeling', '["Single","Double","Triple"]', '["CP","MAP"]', 'Good views, family rooms available', 1),
    ('Glenburn Tea Estate', 'Darjeeling', '5 Star', '+919876543221', 'reservations@glenburn.com', 'Senchu, Darjeeling', '["Deluxe","Suite"]', '["CP","MAP","AP"]', 'Luxury tea estate experience', 1),
    ('Mayfair Himalayan', 'Gangtok', '4 Star Deluxe', '+919876543222', 'info@mayfair.com', 'Gangtok, Sikkim', '["Double","Triple","Family"]', '["CP","MAP"]', 'Central location, good for families', 1),
    ('Wildflower Hall', 'Gangtok', '5 Star', '+919876543223', 'reservations@wildflower.com', 'Ranka, Sikkim', '["Suite","Villa"]', '["CP","MAP","AP"]', 'Premium property with mountain views', 1),
    ('Nivedita House', 'Kalimpong', '2 Star Deluxe', '+919876543224', 'info@nivedita.com', 'Kalimpong Town', '["Single","Double"]', '["CP"]', 'Budget friendly, clean rooms', 1)
  `).run();

  db.prepare(`
    INSERT INTO suppliers (name, type, phone, whatsapp, email, location, notes, internal_rating, status) VALUES
    ('Sikkim Tours & Travels', 'local_agent', '+919876543230', '+919876543230', 'info@sikkimtours.com', 'Gangtok, Sikkim', 'Reliable local agent for Sikkim permits', 4, 'active'),
    ('Eastern Car Rentals', 'transport_company', '+919876543231', '+919876543231', 'bookings@easterncars.com', 'Siliguri', 'Good fleet, reasonable rates', 4, 'active'),
    ('Royal Drivers Association', 'driver', '+919876543232', '+919876543232', NULL, 'Darjeeling', 'Experienced hill drivers', 5, 'active')
  `).run();

  db.prepare(`
    INSERT INTO drivers (name, phone, vehicle_type, vehicle_number, destination_route, availability, notes) VALUES
    ('Krishna Chettri', '+919876543240', 'Innova Crysta', 'WB01AB1234', 'Siliguri-Darjeeling-Gangtok', 'available', '10 years experience, knows all routes'),
    ('Tashi Bhutia', '+919876543241', 'SUV', 'WB02CD5678', 'Bagdogra-Darjeeling', 'available', 'Good with families, speaks English'),
    ('Prem Subba', '+919876543242', 'Tempo Traveller', 'WB03EF9012', 'Siliguri-Gangtok-Nathula', 'booked', 'Available for group tours, 15 years exp')
  `).run();
}
