-- ============================================================
-- Safar Tours CRM — Supabase PostgreSQL seed data
-- ============================================================
-- Run AFTER supabase/schema.sql. Mirrors the demo dataset the previous
-- SQLite engine auto-created: two users (password: admin123), three
-- customers, five trips, quotations, payments, follow-ups, tasks,
-- activities, hotels, suppliers and drivers.
--
-- Default logins (change these after first login):
--   admin@safartour.crm / admin123   (admin)
--   rajesh@safartour.crm / admin123  (employee)

-- ---------- users ----------
INSERT INTO users (id, name, email, phone, password_hash, role, is_active) VALUES
  (1, 'Admin User', 'enquiry@safartour.in', '+919876543210',
   '$2b$10$Xc7KV6v7wJcI9j1hjmj31uE4ho.ykzZj5w.XCoV1.orwedAIONuT6', 'admin', 1),
  (2, 'Rajesh Kumar', 'rajesh@safartour.crm', '+919876543211',
   '$2b$10$Xc7KV6v7wJcI9j1hjmj31uE4ho.ykzZj5w.XCoV1.orwedAIONuT6', 'employee', 1)
ON CONFLICT (id) DO NOTHING;

-- ---------- customers ----------
INSERT INTO customers (id, name, phone, whatsapp, email, city, preferred_contact, trip_count, is_repeat_customer, first_trip_at, last_trip_at) VALUES
  (1, 'Rohan Sharma', '+919876543212', '+919876543212', 'rohan@email.com', 'Darjeeling', 'whatsapp', 2, 1, '2026-01-15', '2026-06-20'),
  (2, 'Priya Singh', '+919876543213', '+919876543213', 'priya@email.com', 'Kolkata', 'phone', 1, 0, '2026-03-10', '2026-03-10'),
  (3, 'Amit Verma', '+919876543214', '+919876543214', 'amit@email.com', 'Delhi', 'email', 0, 0, NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------- trips ----------
INSERT INTO trips (id, reference, customer_id, assigned_employee_id, status, priority, lead_source, destination, trip_type, group_type, start_date, end_date, total_pax, adults, budget_min, budget_max, budget_type, customer_facing_notes, internal_notes, next_followup_date, created_by, created_at, updated_at) VALUES
  (1, 'ST-2026-00001', 1, 1, 'booked', 'high', 'website', 'Darjeeling|Sikkim', 'package', 'family', '2026-09-25', '2026-09-30', 4, 2, 45000, 55000, 'total_trip', 'Family trip, need child friendly hotels', 'VIP customer, follow up personally', to_char(now() + interval '7 days', 'YYYY-MM-DD'), 1, to_char(now() - interval '30 days', 'YYYY-MM-DD'), to_char(now() - interval '30 days', 'YYYY-MM-DD')),
  (2, 'ST-2026-00002', 2, 2, 'quotation_sent', 'medium', 'whatsapp', 'Sikkim', 'package', 'couple', '2026-10-10', '2026-10-15', 2, 2, 35000, 40000, 'total_trip', 'Honeymoon trip', 'Check hotel availability in Gangtok', to_char(now() + interval '7 days', 'YYYY-MM-DD'), 2, to_char(now() - interval '30 days', 'YYYY-MM-DD'), to_char(now() - interval '30 days', 'YYYY-MM-DD')),
  (3, 'ST-2026-00003', 3, 1, 'new', 'low', 'call', 'Kalimpong', 'custom_trip', 'friends', '2026-11-01', '2026-11-05', 3, 3, 20000, 30000, 'total_trip', NULL, NULL, to_char(now() + interval '7 days', 'YYYY-MM-DD'), 1, to_char(now() - interval '30 days', 'YYYY-MM-DD'), to_char(now() - interval '30 days', 'YYYY-MM-DD')),
  (4, 'ST-2026-00004', 1, 2, 'completed', 'medium', 'referral', 'Darjeeling', 'package', 'family', '2026-06-15', '2026-06-20', 4, 2, 40000, 45000, 'total_trip', 'Summer vacation', NULL, NULL, 2, to_char(now() - interval '30 days', 'YYYY-MM-DD'), to_char(now() - interval '30 days', 'YYYY-MM-DD')),
  (5, 'ST-2026-00005', 2, 1, 'negotiation', 'high', 'google', 'Meghalaya', 'package', 'couple', '2026-10-20', '2026-10-25', 2, 2, 50000, 60000, 'total_trip', 'Want luxury stay', 'Customer comparing with other agencies', to_char(now() + interval '7 days', 'YYYY-MM-DD'), 1, to_char(now() - interval '30 days', 'YYYY-MM-DD'), to_char(now() - interval '30 days', 'YYYY-MM-DD'))
ON CONFLICT (id) DO NOTHING;

-- ---------- quotations ----------
INSERT INTO quotations (id, reference, trip_id, version, status, quotation_date, valid_until, prepared_by, subtotal, discount, tax, final_amount, notes, terms, sent_via) VALUES
  (1, 'QT-2026-00001', 1, 'V1', 'accepted', '2026-08-01', '2026-09-01', 1, 50000, 5000, 0, 45000, 'Family package with all inclusions', 'Payment to be made 7 days before travel', 'whatsapp'),
  (2, 'QT-2026-00002', 2, 'V1', 'sent', '2026-08-15', '2026-09-15', 2, 42000, 2000, 0, 40000, 'Honeymoon special package', 'Valid until stated date', 'email'),
  (3, 'QT-2026-00003', 5, 'V1', 'sent', '2026-08-20', '2026-09-20', 1, 55000, 5000, 0, 50000, 'Premium Meghalaya experience', 'Negotiating on price', 'whatsapp')
ON CONFLICT (id) DO NOTHING;

INSERT INTO quotation_items (id, quotation_id, category, description, details, quantity, amount) VALUES
  (1, 1, 'hotel', 'Hotel Night Stay', '2 Double Rooms, 3 Nights', 6, 24000),
  (2, 1, 'transport', 'Innova Crysta', '6 Days with driver', 6, 15000),
  (3, 1, 'sightseeing', 'Darjeeling Local Sightseeing', 'Full day', 1, 3000),
  (4, 1, 'other', 'Guide Services', 'Optional', 1, 3000),
  (5, 2, 'hotel', 'Luxury Hotel in Gangtok', '1 Deluxe Room, 5 Nights', 5, 20000),
  (6, 2, 'transport', 'SUV', '5 Days', 5, 10000),
  (7, 2, 'sightseeing', 'Tsomgo Lake Excursion', 'Day trip', 1, 2000),
  (8, 3, 'hotel', 'Resort in Shillong', '1 Premium Room, 5 Nights', 5, 25000),
  (9, 3, 'transport', 'Innova Crysta', '5 Days', 5, 12000),
  (10, 3, 'sightseeing', 'Living Root Bridge Tour', 'Full day', 1, 3000)
ON CONFLICT (id) DO NOTHING;

-- ---------- payments ----------
INSERT INTO payments (id, trip_id, amount, payment_date, payment_method, transaction_id, note, recorded_by) VALUES
  (1, 1, 20000, '2026-08-05', 'upi', 'UPI123456', 'Advance payment', 1),
  (2, 1, 25000, '2026-09-15', 'bank_transfer', 'BT789012', 'Final payment', 1),
  (3, 4, 15000, '2026-06-10', 'cash', NULL, 'Advance', 2),
  (4, 4, 25000, '2026-06-14', 'upi', 'UPI789012', 'Balance payment', 2)
ON CONFLICT (id) DO NOTHING;

-- ---------- followups ----------
INSERT INTO followups (id, trip_id, scheduled_date, scheduled_time, followup_type, assigned_to, note, status, completed_at, completed_by) VALUES
  (1, 2, to_char(now() + interval '7 days', 'YYYY-MM-DD'), '10:00', 'whatsapp', 2, 'Follow up on quotation', 'pending', NULL, NULL),
  (2, 3, to_char(now() + interval '7 days', 'YYYY-MM-DD'), '14:00', 'call', 1, 'Call to understand requirements', 'pending', NULL, NULL),
  (3, 5, '2026-09-18', '11:00', 'email', 1, 'Send revised quotation', 'pending', NULL, NULL),
  (4, 1, '2026-09-15', '09:00', 'call', 1, 'Pre-trip confirmation call', 'completed', '2026-09-15', 1)
ON CONFLICT (id) DO NOTHING;

-- ---------- tasks ----------
INSERT INTO tasks (id, trip_id, title, description, assigned_to, priority, status, due_date) VALUES
  (1, 1, 'Confirm hotel booking', 'Book 2 double rooms in Darjeeling', 1, 'high', 'completed', '2026-09-20'),
  (2, 2, 'Check vehicle availability', 'Ensure Innova available for October', 2, 'medium', 'pending', to_char(now() + interval '7 days', 'YYYY-MM-DD')),
  (3, 5, 'Prepare revised quotation', 'Include additional sightseeing options', 1, 'high', 'pending', '2026-09-17')
ON CONFLICT (id) DO NOTHING;

-- ---------- activities ----------
INSERT INTO activities (id, trip_id, customer_id, user_id, activity_type, description, metadata, created_at) VALUES
  (1, 1, 1, 1, 'lead_created', 'Lead created from website enquiry', '{"source":"website","page":"/packages/darjeeling"}', to_char(now() - interval '30 days', 'YYYY-MM-DD')),
  (2, 1, 1, 1, 'status_changed', 'Status changed from new to contacted', '{"from":"new","to":"contacted"}', to_char(now() - interval '30 days', 'YYYY-MM-DD')),
  (3, 1, 1, 1, 'quotation_created', 'Quotation QT-2026-00001 created', '{"quotation_ref":"QT-2026-00001","amount":45000}', '2026-08-01'),
  (4, 1, 1, 1, 'quotation_accepted', 'Customer accepted quotation', '{"quotation_ref":"QT-2026-00001"}', '2026-08-10'),
  (5, 1, 1, 1, 'payment_received', 'Payment of 20000 received via UPI', '{"amount":20000,"method":"upi"}', '2026-08-05'),
  (6, 1, 1, 1, 'payment_received', 'Payment of 25000 received via Bank Transfer', '{"amount":25000,"method":"bank_transfer"}', '2026-09-15'),
  (7, 1, 1, 1, 'status_changed', 'Status changed from booking_pending to booked', '{"from":"booking_pending","to":"booked"}', '2026-09-20'),
  (8, 2, 2, 2, 'lead_created', 'Lead created from WhatsApp enquiry', '{"source":"whatsapp"}', to_char(now() - interval '30 days', 'YYYY-MM-DD')),
  (9, 2, 2, 2, 'quotation_created', 'Quotation QT-2026-00002 created', '{"quotation_ref":"QT-2026-00002","amount":40000}', '2026-08-15'),
  (10, 4, 1, 2, 'trip_completed', 'Trip completed successfully', '{"feedback":"Great experience"}', to_char(now() - interval '30 days', 'YYYY-MM-DD'))
ON CONFLICT (id) DO NOTHING;

-- ---------- hotels / suppliers / drivers ----------
INSERT INTO suppliers (id, name, type, phone, whatsapp, email, location, notes, internal_rating, status) VALUES
  (1, 'Sikkim Tours & Travels', 'local_agent', '+919876543230', '+919876543230', 'info@sikkimtours.com', 'Gangtok, Sikkim', 'Reliable local agent for Sikkim permits', 4, 'active'),
  (2, 'Eastern Car Rentals', 'transport_company', '+919876543231', '+919876543231', 'bookings@easterncars.com', 'Siliguri', 'Good fleet, reasonable rates', 4, 'active'),
  (3, 'Royal Drivers Association', 'driver', '+919876543232', '+919876543232', NULL, 'Darjeeling', 'Experienced hill drivers', 5, 'active')
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotels (id, name, destination, category, contact_phone, contact_email, address, room_types, meal_plans, notes, is_active) VALUES
  (1, 'Darjeeling Monarch', 'Darjeeling', '3 Star Deluxe', '+919876543220', 'info@monarch.com', 'Mall Road, Darjeeling', '["Single","Double","Triple"]', '["CP","MAP"]', 'Good views, family rooms available', 1),
  (2, 'Glenburn Tea Estate', 'Darjeeling', '5 Star', '+919876543221', 'reservations@glenburn.com', 'Senchu, Darjeeling', '["Deluxe","Suite"]', '["CP","MAP","AP"]', 'Luxury tea estate experience', 1),
  (3, 'Mayfair Himalayan', 'Gangtok', '4 Star Deluxe', '+919876543222', 'info@mayfair.com', 'Gangtok, Sikkim', '["Double","Triple","Family"]', '["CP","MAP"]', 'Central location, good for families', 1),
  (4, 'Wildflower Hall', 'Gangtok', '5 Star', '+919876543223', 'reservations@wildflower.com', 'Ranka, Sikkim', '["Suite","Villa"]', '["CP","MAP","AP"]', 'Premium property with mountain views', 1),
  (5, 'Nivedita House', 'Kalimpong', '2 Star Deluxe', '+919876543224', 'info@nivedita.com', 'Kalimpong Town', '["Single","Double"]', '["CP"]', 'Budget friendly, clean rooms', 1)
ON CONFLICT (id) DO NOTHING;

INSERT INTO drivers (id, name, phone, vehicle_type, vehicle_number, destination_route, availability, notes) VALUES
  (1, 'Krishna Chettri', '+919876543240', 'Innova Crysta', 'WB01AB1234', 'Siliguri-Darjeeling-Gangtok', 'available', '10 years experience, knows all routes'),
  (2, 'Tashi Bhutia', '+919876543241', 'SUV', 'WB02CD5678', 'Bagdogra-Darjeeling', 'available', 'Good with families, speaks English'),
  (3, 'Prem Subba', '+919876543242', 'Tempo Traveller', 'WB03EF9012', 'Siliguri-Gangtok-Nathula', 'booked', 'Available for group tours, 15 years exp')
ON CONFLICT (id) DO NOTHING;

-- Keep identity sequences ahead of the seeded rows.
SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM users), false);
SELECT setval(pg_get_serial_sequence('customers', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM customers), false);
SELECT setval(pg_get_serial_sequence('trips', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM trips), false);
SELECT setval(pg_get_serial_sequence('quotations', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM quotations), false);
SELECT setval(pg_get_serial_sequence('quotation_items', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM quotation_items), false);
SELECT setval(pg_get_serial_sequence('payments', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM payments), false);
SELECT setval(pg_get_serial_sequence('followups', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM followups), false);
SELECT setval(pg_get_serial_sequence('tasks', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM tasks), false);
SELECT setval(pg_get_serial_sequence('activities', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM activities), false);
SELECT setval(pg_get_serial_sequence('suppliers', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM suppliers), false);
SELECT setval(pg_get_serial_sequence('hotels', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM hotels), false);
SELECT setval(pg_get_serial_sequence('drivers', 'id'), (SELECT COALESCE(MAX(id), 0) + 1 FROM drivers), false);
