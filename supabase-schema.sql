-- ═══════════════════════════════════════════════════════════════════
-- SARVOTAM CONSTRUCTION · full setup (run ONCE, top to bottom)
-- Supabase Dashboard → project afcgjxndrtwifgghlhwx → SQL Editor →
-- New query → paste everything → RUN.  Takes ~10 seconds.
-- Safe to re-run if something fails midway.
-- After this: sign up in the app → FIRST account = Owner automatically.
-- ═══════════════════════════════════════════════════════════════════

-- ── 1 · PROFILES (extends Supabase Auth) ─────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  phone text,
  email text not null,
  role text not null default 'client',      -- admin | staff | client | worker | supervisor
  status text not null default 'pending',   -- pending | active | rejected
  linked_worker_id bigint,
  linked_client_id bigint,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- team join codes (owner generates; staff/supervisor sign up with one)
create table if not exists public.join_codes (
  code text primary key,
  role text not null default 'staff',
  max_uses int not null default 1,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

-- ── 2 · BUSINESS TABLES ──────────────────────────────────────────────
create table if not exists public.clients (
  id bigserial primary key,
  name text not null,
  phone text, email text, address text, gst text,
  type text not null default 'Individual',   -- Individual | Company | Government
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id bigserial primary key,
  name text not null,
  client_id bigint references public.clients (id) on delete set null,
  location text,
  budget numeric not null default 0,
  start_date date, end_date date,
  status text not null default 'Active',     -- Planning | Active | On Hold | Completed
  description text,
  progress int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.workers (
  id bigserial primary key,
  name text not null,
  phone text,
  role text not null default 'Helper',       -- skill/role at site
  address text, aadhaar text,
  daily_rate numeric not null default 0,
  status text not null default 'Active',     -- Active | Inactive
  bank_account text, ifsc text, emergency_contact text, photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id bigserial primary key,
  worker_id bigint not null references public.workers (id) on delete cascade,
  project_id bigint references public.projects (id) on delete set null,
  date date not null default current_date,
  status text not null default 'Present',    -- Present | Half Day | Absent | Holiday
  advance numeric not null default 0,
  note text,
  marked_by text,
  created_at timestamptz not null default now(),
  unique (worker_id, date)                   -- no double-marking, ever
);

create table if not exists public.materials (
  id bigserial primary key,
  date date not null default current_date,
  name text not null,
  vendor text,
  project_id bigint references public.projects (id) on delete set null,
  qty numeric not null default 0,
  unit text not null default 'Nos',
  rate numeric not null default 0,
  stock_remaining numeric not null default 0,
  bill_number text,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.income (
  id bigserial primary key,
  date date not null default current_date,
  client_id bigint references public.clients (id) on delete set null,
  project_id bigint references public.projects (id) on delete set null,
  work text,
  amount numeric not null default 0,
  mode text not null default 'Cash',
  reference text, note text,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id bigserial primary key,
  date date not null default current_date,
  description text not null,
  category text not null default 'Miscellaneous',
  project_id bigint references public.projects (id) on delete set null,
  amount numeric not null default 0,
  mode text not null default 'Cash',
  created_at timestamptz not null default now()
);

create table if not exists public.vehicles (
  id bigserial primary key,
  name text not null,
  vehicle_number text,
  type text not null default 'JCB',
  owner_type text not null default 'Owned',
  rate_per_hour numeric not null default 0,
  status text not null default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.vehicle_logs (
  id bigserial primary key,
  vehicle_id bigint references public.vehicles (id) on delete cascade,
  project_id bigint references public.projects (id) on delete set null,
  date date not null default current_date,
  hours numeric not null default 0,
  diesel_litres numeric not null default 0,
  diesel_rate numeric not null default 96,
  work text, operator_name text,
  created_at timestamptz not null default now()
);

-- proof-of-work site photos (image files live in the Storage bucket, step 6)
create table if not exists public.site_photos (
  id bigserial primary key,
  project_id bigint references public.projects (id) on delete cascade,
  title text,
  note text,
  date date not null default current_date,
  file_path text not null,
  file_url text,
  uploader_id uuid references public.profiles (id) on delete set null,
  uploader_name text,
  created_at timestamptz not null default now()
);

-- ── 3 · ROLE HELPERS USED BY POLICIES ────────────────────────────────
create or replace function public.app_role()
returns text language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()), '')
$$;

create or replace function public.app_is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select status = 'active' from profiles where id = auth.uid()), false)
$$;

create or replace function public.app_is_manager()   -- admin or staff
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('admin','staff') and status = 'active' from profiles where id = auth.uid()), false)
$$;

-- ── 4 · SIGNUP TRIGGER · first user = Owner · codes · approvals ──────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_first   boolean;
  v_code    text := new.raw_user_meta_data ->> 'join_code';
  v_role    text := coalesce(new.raw_user_meta_data ->> 'role', 'client');
  v_status  text := 'pending';
  jc        record;
begin
  select count(*) = 0 into v_first from profiles;

  if v_first then
    v_role := 'admin'; v_status := 'active';          -- owner self-bootstraps
  elsif v_code is not null and v_code <> '' then
    select * into jc from join_codes
      where code = v_code and used_count < max_uses for update;
    if found then
      v_role := jc.role; v_status := 'active';
      update join_codes set used_count = used_count + 1 where code = v_code;
    end if;
  end if;

  if v_role not in ('client','worker','supervisor','staff','admin') then
    v_role := 'client';
  end if;
  -- nobody can self-assign a manager role without a valid code
  if v_status = 'pending' and v_role in ('admin','staff') then
    v_role := 'client';
  end if;

  insert into profiles (id, name, phone, email, role, status)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), 'New user'),
    new.raw_user_meta_data ->> 'phone',
    new.email,
    v_role, v_status
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- clients cannot edit their own role/status — only managers can
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.app_is_manager() then
    new.role             := old.role;
    new.status           := old.status;
    new.linked_worker_id := old.linked_worker_id;
    new.linked_client_id := old.linked_client_id;
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ── 5 · ROW LEVEL SECURITY ───────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'clients','projects','workers','attendance','materials',
    'income','expenses','vehicles','vehicle_logs','site_photos'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "read active" on %I', t);
    execute format('drop policy if exists "write manager" on %I', t);
    execute format('create policy "read active" on %I for select to authenticated using ( public.app_is_active() )', t);
    execute format('create policy "write manager" on %I for all to authenticated using ( public.app_is_manager() ) with check ( public.app_is_manager() )', t);
  end loop;

  -- supervisors may also mark attendance and record materials
  foreach t in array array['attendance','materials'] loop
    execute format('drop policy if exists "write supervisor" on %I', t);
    execute format('create policy "write supervisor" on %I for all to authenticated using ( public.app_role() = ''supervisor'' and public.app_is_active() ) with check ( public.app_role() = ''supervisor'' and public.app_is_active() )', t);
  end loop;

  -- join codes: managers only — never readable by clients/workers
  execute 'alter table public.join_codes enable row level security';
  execute 'drop policy if exists "read active" on public.join_codes';
  execute 'drop policy if exists "write manager" on public.join_codes';
  execute 'drop policy if exists "join codes manager" on public.join_codes';
  execute 'create policy "join codes manager" on public.join_codes for all to authenticated using ( public.app_is_manager() ) with check ( public.app_is_manager() )';

  -- any active user may post a site photo (they own the row); managers delete any
  execute 'drop policy if exists "photos insert" on public.site_photos';
  execute 'create policy "photos insert" on public.site_photos for insert to authenticated with check ( public.app_is_active() )';
end $$;

-- profiles: own row read/update, managers manage everything
alter table public.profiles enable row level security;
drop policy if exists "profile self read" on public.profiles;
create policy "profile self read" on public.profiles
  for select to authenticated using ( id = auth.uid() or public.app_is_manager() );
drop policy if exists "profile self update" on public.profiles;
create policy "profile self update" on public.profiles
  for update to authenticated using ( id = auth.uid() or public.app_is_manager() )
  with check ( id = auth.uid() or public.app_is_manager() );
drop policy if exists "profile insert self" on public.profiles;
create policy "profile insert self" on public.profiles
  for insert to authenticated with check ( id = auth.uid() );

-- ── 6 · STORAGE · site-progress-photos bucket ───────────────────────
insert into storage.buckets (id, name, public)
values ('site-progress-photos', 'site-progress-photos', true)
on conflict (id) do nothing;

drop policy if exists "photos public read" on storage.objects;
create policy "photos public read" on storage.objects
  for select using ( bucket_id = 'site-progress-photos' );
drop policy if exists "photos auth upload" on storage.objects;
create policy "photos auth upload" on storage.objects
  for insert to authenticated
  with check ( bucket_id = 'site-progress-photos'
               and (storage.foldername(name))[1] in ('photos','avatars') );
drop policy if exists "photos owner delete" on storage.objects;
create policy "photos owner delete" on storage.objects
  for delete to authenticated
  using ( bucket_id = 'site-progress-photos'
          and ( owner = auth.uid() or public.app_is_manager() ) );

-- ── 7 · REALTIME (other devices update within ~1 second) ─────────────
do $$
declare t text;
begin
  foreach t in array array[
    'clients','projects','workers','attendance','materials',
    'income','expenses','vehicles','vehicle_logs','site_photos'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ── 8 · INDEXES ──────────────────────────────────────────────────────
create index if not exists idx_attendance_date    on attendance (date);
create index if not exists idx_attendance_worker  on attendance (worker_id);
create index if not exists idx_materials_project  on materials (project_id);
create index if not exists idx_income_project     on income (project_id);
create index if not exists idx_expenses_project   on expenses (project_id);
create index if not exists idx_logs_project       on vehicle_logs (project_id);
create index if not exists idx_photos_project     on site_photos (project_id, date desc);

-- ✅ DONE. Now in the app:
--   1. Supabase → Authentication → Sign In / Providers → Email →
--      turn OFF "Confirm email" (for instant logins).
--   2. Open the app → /signup → register → the FIRST account becomes
--      the Owner (Admin) automatically.
--   3. Settings → "Publish sample data to Supabase" (optional demo data).
--   4. Users → Team join codes → generate for staff/supervisor.
