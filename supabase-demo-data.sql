-- ═══════════════════════════════════════════════════════════════════
-- SARVOTAM CONSTRUCTION · demo data + ready logins (run AFTER the main
-- schema SQL). Paste in Supabase → SQL Editor → New query → Run.
-- Skips safely if you run it twice. Business tables should be empty
-- (if you already pressed "Publish sample data", run the TRUNCATE block
-- at the bottom first — it is commented out).
-- ⚠ After first login, change each password in Settings → Change password.
-- v3: all relations resolved BY NAME/position — immune to sequence gaps
--     from earlier rolled-back runs (no hardcoded ids anywhere).
-- ═══════════════════════════════════════════════════════════════════

-- ── 1 · CLIENTS ──────────────────────────────────────────────────────
insert into public.clients (name, phone, email, address, type, gst)
select * from (values
  ('Ramesh Sharma', '+91 98250 11111', 'ramesh.sharma@gmail.com', 'B/h Bus Stand, Dahegam, Gandhinagar 382305', 'Individual', null),
  ('Shree Developers', '+91 98240 44444', 'contact@shreedev.in', 'S.G. Highway, Ahmedabad 380015', 'Company', '24ABCDE1234F1Z5'),
  ('Patel Family', '+91 97260 55555', 'patel.family@gmail.com', 'Motipura, Dahegam 382305', 'Individual', null)
) v(name, phone, email, address, type, gst)
where not exists (select 1 from public.clients);

-- ── 2 · PROJECTS (client looked up by name — no hardcoded ids) ─────────
insert into public.projects (name, client_id, location, budget, start_date, end_date, status, progress, description)
select v.name,
       (select c.id from public.clients c where c.name = v.client_name limit 1),
       v.location, v.budget, v.start_date, v.end_date, v.status, v.progress, v.description
from (values
  ('Sharma Duplex Home', 'Ramesh Sharma', 'Dahegam — Sector 5', 4850000::numeric, current_date - 120, current_date + 140, 'Active', 46, 'G+1 duplex, 2400 sqft. Structure complete, finishing running.'),
  ('City Plaza Shops',   'Shree Developers', 'SG Highway, Ahmedabad', 12400000, current_date - 210, current_date + 240, 'Active', 61, 'Ground + first retail blocks, 14 shops.'),
  ('Patel Bungalow Renovation', 'Patel Family', 'Motipura, Dahegam', 1750000, current_date - 40, current_date + 65, 'Active', 28, 'Old bungalow — slab strengthening, new façade, plumbing & wiring.')
) v(name, client_name, location, budget, start_date, end_date, status, progress, description)
where not exists (select 1 from public.projects);

-- ── 3 · WORKERS ──────────────────────────────────────────────────────
insert into public.workers (name, phone, role, daily_rate, aadhaar, address)
select * from (values
  ('Ramesh Kumar',   '+91 97230 22222', 'Mason',     850::numeric, 'XXXX-XXXX-4412', 'Vasna, Dahegam'),
  ('Suresh Patel',   '+91 97231 33111', 'Mason',     900,          'XXXX-XXXX-7781', 'Koth'),
  ('Amit Vishwakarma','+91 98700 12345','Carpenter', 800,          'XXXX-XXXX-9025', 'Dahegam'),
  ('Vijay Rabari',   '+91 99099 55667', 'Helper',    550,          'XXXX-XXXX-1170', 'Delro'),
  ('Kiran Solanki',  '+91 97272 88990', 'Electrician', 750,        'XXXX-XXXX-3344', 'Serota'),
  ('Devu Bhai',      '+91 95107 22334', 'Plumber',   780,          'XXXX-XXXX-5566', 'Dahegam'),
  ('Mukesh Tailor',  '+91 96012 77889', 'Tile & Marble', 950,      'XXXX-XXXX-8899', 'Gandhinagar'),
  ('Jagdish Rathod', '+91 93280 44556', 'Painter',   650,          'XXXX-XXXX-2233', 'Bakad')
) v(name, phone, role, daily_rate, aadhaar, address)
where not exists (select 1 from public.workers);

-- ── 4 · ATTENDANCE — last 21 days × all workers (projects by position) ─
insert into public.attendance (worker_id, project_id, date, status, advance, marked_by)
select w.id, pj.id, current_date - g,
       case ((g + w.id) % 10)
         when 0 then 'Absent'
         when 5 then 'Half Day'
         when 8 then 'Holiday'
         else 'Present'
       end,
       case when (g * 3 + w.id) % 17 = 4 then 1500 else 0 end,
       'Owner (seed)'
from public.workers w
cross join generate_series(1, 21) g
join lateral (
  select id from public.projects order by id
  offset ((w.id % (select greatest(1, count(*))::bigint from public.projects))::int)
  limit 1
) pj on true
where not exists (select 1 from public.attendance);

-- ── 5 · MATERIALS ──────────────────────────────────────────────────────
insert into public.materials (date, name, vendor, project_id, qty, unit, rate, stock_remaining, paid, bill_number)
select current_date - (g % 14),
       (array['Cement OPC 53','River Sand','Crushed Stone 20mm','Red Bricks','TMT Bar 8mm','TMT Bar 12mm','Vitrified Tiles','PVC Pipe 4in','Asian Paints Exterior','Jali Block'])[ (g % 10) + 1 ],
       (array['Shree Merchants','Dahegam Suppliers','Gandhi Hardware'])[ (g % 3) + 1 ],
       pj.id,
       (5 + (g * 37) % 90)::numeric,
       (array['Bag','Truck','Nos','Nos','Kg','Kg','Box','Nos','Bucket','Nos'])[ (g % 10) + 1 ],
       (85 + (g * 53) % 340)::numeric,
       (g * 11 % 40)::numeric,
       (g % 4 <> 0),
       'BL-' || (2400 + g)
from generate_series(1, 18) g
join lateral (select id from public.projects order by id offset (g % (select greatest(1, count(*))::bigint from public.projects))::int limit 1) pj on true
where not exists (select 1 from public.materials);

-- ── 6 · INCOME (project by name; client taken from that project) ───────
insert into public.income (date, client_id, project_id, work, amount, mode, reference)
select v.date, p.client_id, p.id, v.work, v.amount, v.mode, v.reference
from (values
  (current_date - 2,  'Sharma Duplex Home', 'Stage 4 — plastering', 1250000::numeric, 'NEFT',   'HDFC-88412'),
  (current_date - 16, 'City Plaza Shops',   'Stage 2 — structure',  3800000,          'Cheque', 'CHQ-55120'),
  (current_date - 30, 'Patel Bungalow Renovation', 'Advance — 30%',  525000,           'UPI',    'UPI-DAYAM'),
  (current_date - 47, 'Sharma Duplex Home', 'Stage 3 — slab',       1500000,          'NEFT',   'HDFC-87990'),
  (current_date - 66, 'City Plaza Shops',   'Stage 1 — foundation', 2600000,          'RTGS',   'ICICI-2201')
) v(date, project_name, work, amount, mode, reference)
join public.projects p on p.name = v.project_name
where not exists (select 1 from public.income);

-- ── 7 · EXPENSES (project by name) ─────────────────────────────────────
insert into public.expenses (date, description, category, project_id, amount, mode)
select v.date, v.description, v.category, p.id, v.amount, v.mode
from (values
  (current_date - 1,  'Diesel — JCB site work',      'Fuel',          'Sharma Duplex Home',      4200::numeric, 'Cash'),
  (current_date - 3,  'Scaffolding rent',            'Equipment',     'City Plaza Shops',        9500,          'UPI'),
  (current_date - 5,  'Labour tea & snacks week 41', 'Food',          'Sharma Duplex Home',      6400,          'Cash'),
  (current_date - 8,  'Crane 1 day for first floor', 'Transport',     'City Plaza Shops',        15500,         'Cheque'),
  (current_date - 12, 'Safety nets & helmets',       'Safety',        'Sharma Duplex Home',      7800,          'UPI'),
  (current_date - 15, 'Municipal permission fees',   'Tax',           'Patel Bungalow Renovation', 12500,       'Cash'),
  (current_date - 21, 'Water tanker charges',        'Miscellaneous', 'City Plaza Shops',        3800,          'Cash'),
  (current_date - 27, 'Truck rent — stone transfer', 'Transport',     'Patel Bungalow Renovation', 5600,        'UPI'),
  (current_date - 34, 'Generator fuel',              'Fuel',          'City Plaza Shops',        5100,          'Cash'),
  (current_date - 41, 'Site office tent & cot',      'Overhead',      'Sharma Duplex Home',      8900,          'Cash')
) v(date, description, category, project_name, amount, mode)
join public.projects p on p.name = v.project_name
where not exists (select 1 from public.expenses);

-- ── 8 · VEHICLES + LOGS ────────────────────────────────────────────────
insert into public.vehicles (name, vehicle_number, type, owner_type, rate_per_hour)
select * from (values
  ('JCB 4CX',        'GJ01 AB 4521', 'JCB',   'Owned', 850::numeric),
  ('Tata Truck 31',  'GJ05 CD 7788', 'Truck', 'Hired', 550),
  ('RMC Mixer 7cum', 'GJ01 EF 9034', 'Mixer', 'Hired', 1200)
) v(name, vehicle_number, type, owner_type, rate_per_hour)
where not exists (select 1 from public.vehicles);

insert into public.vehicle_logs (vehicle_id, project_id, date, hours, diesel_litres, diesel_rate, work, operator_name)
select v.id, pj.id, current_date - (g % 19),
       (4 + g % 7)::numeric, (12 + (g * 5) % 45)::numeric, 96,
       (array['Slab pour support','Material shift','Earth filling','Debris removal','Column concrete pour'])[ (g % 5) + 1 ],
       (array['Jagdish','Ramsingh','Patel ji'])[ (g % 3) + 1 ]
from generate_series(1, 15) g
join lateral (select id from public.vehicles  order by id offset (g % (select greatest(1, count(*))::bigint from public.vehicles))::int  limit 1) v  on true
join lateral (select id from public.projects  order by id offset (g % (select greatest(1, count(*))::bigint from public.projects))::int  limit 1) pj on true
where not exists (select 1 from public.vehicle_logs);

-- ── 9 · DEMO LOGINS · one-time passwords — change after first login ──
-- (created directly in Auth; bcrypt via crypt(). Safe to re-run.)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, is_sso_user)
select gen_random_uuid(), null, 'authenticated', 'authenticated', e.mail,
       crypt(e.pw, gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}',
       jsonb_build_object('name', e.nm, 'phone', e.ph, 'role', e.rl),
       false
from (values
  ('owner@sarvotam.com',      'Sarvotam@079', 'Sarvotam Owner',  '+91 98765 43210', 'admin'),
  ('ramesh.sharma@gmail.com', 'Client@079',   'Ramesh Sharma',   '+91 98250 11111', 'client'),
  ('ramesh.kumar@gmail.com',  'Worker@079',   'Ramesh Kumar',    '+91 97230 22222', 'worker'),
  ('supervisor@sarvotam.com', 'Super@079',    'Site Supervisor', '+91 98980 33333', 'supervisor')
) as e(mail, pw, nm, ph, rl)
where not exists (select 1 from auth.users u where u.email = e.mail);

-- profiles: the signup trigger auto-created rows; here we activate + link them
alter table public.profiles disable trigger guard_profile_update;

update public.profiles set status = 'active', role = 'admin'
  where email = 'owner@sarvotam.com';

update public.profiles p set status = 'active',
  linked_client_id = (select id from public.clients where name = 'Ramesh Sharma' limit 1)
  where p.email = 'ramesh.sharma@gmail.com';

update public.profiles p set status = 'active',
  linked_worker_id = (select id from public.workers where name = 'Ramesh Kumar' limit 1)
  where p.email = 'ramesh.kumar@gmail.com';

update public.profiles set status = 'active', role = 'supervisor'
  where email = 'supervisor@sarvotam.com';

alter table public.profiles enable trigger guard_profile_update;

select '✅ Done! Projects: ' || (select count(*) from public.projects) || ' · Workers: ' || (select count(*) from public.workers)
    || ' · Attendance: ' || (select count(*) from public.attendance)
    || ' · Accounts: ' || (select count(*) from public.profiles) || ' (all active)' as result;

-- ── (optional) if you earlier pressed "Publish sample data" and want a
--    clean re-seed, UNCOMMENT once, run, then comment again:
-- truncate public.attendance, public.materials, public.income, public.expenses,
--         public.vehicle_logs, public.vehicles, public.projects, public.clients restart identity cascade;
