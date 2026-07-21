-- ============================================================
-- Milestone 1: In-App Chat System (Office Inbox Model)
-- ============================================================

-- 1. Applicant Messages Table
create table if not exists public.applicant_messages (
    id uuid primary key default gen_random_uuid(),
    applicant_id uuid not null references public.applicants(id) on delete cascade,
    sender_type text not null check (sender_type in ('applicant', 'staff')),
    staff_id uuid references public.staff(id) on delete set null, -- Null if sent by applicant
    content text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.applicant_messages enable row level security;

-- Policies for Applicant Messages
drop policy if exists applicant_messages_applicant_read on public.applicant_messages;
create policy applicant_messages_applicant_read on public.applicant_messages
for select
to anon, authenticated
using (true);

drop policy if exists applicant_messages_applicant_insert on public.applicant_messages;
create policy applicant_messages_applicant_insert on public.applicant_messages
for insert
to authenticated
with check (
    applicant_id = auth.uid() 
    and sender_type = 'applicant'
);

drop policy if exists applicant_messages_staff_manage on public.applicant_messages;
create policy applicant_messages_staff_manage on public.applicant_messages
for all
to authenticated
using (public.is_staff_member(auth.uid()));


-- 2. Employer Messages Table
create table if not exists public.employer_messages (
    id uuid primary key default gen_random_uuid(),
    partner_id uuid not null references public.foreign_partners(id) on delete cascade,
    sender_type text not null check (sender_type in ('employer', 'staff')),
    staff_id uuid references public.staff(id) on delete set null,
    content text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.employer_messages enable row level security;

-- Policies for Employer Messages
drop policy if exists employer_messages_employer_read on public.employer_messages;
create policy employer_messages_employer_read on public.employer_messages
for select
to anon, authenticated
using (true);

drop policy if exists employer_messages_employer_insert on public.employer_messages;
create policy employer_messages_employer_insert on public.employer_messages
for insert
to authenticated
with check (
    partner_id = auth.uid()
    and sender_type = 'employer'
);

drop policy if exists employer_messages_staff_manage on public.employer_messages;
create policy employer_messages_staff_manage on public.employer_messages
for all
to authenticated
using (public.is_staff_member(auth.uid()));

-- 3. Enable Realtime subscriptions
alter publication supabase_realtime add table public.applicant_messages;
alter publication supabase_realtime add table public.employer_messages;
