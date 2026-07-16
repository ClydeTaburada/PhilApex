-- Run this AFTER running supabase/migrations/20260710_init.sql
-- This file avoids UUID placeholders by mapping staff rows from auth.users emails.

-- 1) Check current auth users
select id, email, created_at
from auth.users
order by created_at desc;

-- 2) Insert staff roles by email (edit emails below to your real staff accounts)
insert into public.staff (id, full_name, role)
select u.id, 'Admin User', 'admin'::public.staff_role_type
from auth.users u
where u.email = 'admin@example.com'
on conflict (id) do update
set
  full_name = excluded.full_name,
  role = excluded.role;

insert into public.staff (id, full_name, role)
select u.id, 'Front Desk User', 'front_desk'::public.staff_role_type
from auth.users u
where u.email = 'frontdesk@example.com'
on conflict (id) do update
set
  full_name = excluded.full_name,
  role = excluded.role;

insert into public.staff (id, full_name, role)
select u.id, 'Processing Officer User', 'processing_officer'::public.staff_role_type
from auth.users u
where u.email = 'processor@example.com'
on conflict (id) do update
set
  full_name = excluded.full_name,
  role = excluded.role;

-- 3) Seed sample open job orders
insert into public.job_orders (country, program_name, trade, gender_requirement, slots_total, slots_filled)
values
  ('Japan', 'TITP', 'Welder', 'male', 50, 0),
  ('Japan', 'TITP', 'Fish Processing', 'female', 40, 0),
  ('Japan', 'TITP', 'Scaffolder', 'male', 30, 0)
on conflict do nothing;

-- 4) Verify staff rows
select id, full_name, role, created_at
from public.staff
order by created_at desc;
