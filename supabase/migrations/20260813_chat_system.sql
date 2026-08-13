-- ============================================================
-- Add Chat System Tables
-- ============================================================

-- ── ENUMS ─────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'message_urgency_type' and typnamespace = 'public'::regnamespace) then
    create type public.message_urgency_type as enum ('low', 'normal', 'high');
  end if;
  if not exists (select 1 from pg_type where typname = 'sender_type_enum' and typnamespace = 'public'::regnamespace) then
    create type public.sender_type_enum as enum ('applicant', 'employer', 'staff');
  end if;
end;
$$;

-- ── applicant_messages ────────────────────────────────────────
create table if not exists public.applicant_messages (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  sender_type public.sender_type_enum not null,
  content text not null,
  urgency public.message_urgency_type not null default 'normal',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- ── employer_messages ─────────────────────────────────────────
create table if not exists public.employer_messages (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.foreign_partners(id) on delete cascade,
  sender_type public.sender_type_enum not null,
  content text not null,
  urgency public.message_urgency_type not null default 'normal',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

-- ── INDEXES ───────────────────────────────────────────────────
create index if not exists applicant_messages_applicant_id_idx on public.applicant_messages(applicant_id);
create index if not exists employer_messages_partner_id_idx on public.employer_messages(partner_id);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.applicant_messages enable row level security;
alter table public.employer_messages enable row level security;

drop policy if exists applicant_messages_staff_all on public.applicant_messages;
create policy applicant_messages_staff_all on public.applicant_messages
  for all to authenticated
  using (public.is_staff_member(auth.uid()))
  with check (public.is_staff_member(auth.uid()));

drop policy if exists applicant_messages_anon_read on public.applicant_messages;
create policy applicant_messages_anon_read on public.applicant_messages
  for select to anon
  using (true);

drop policy if exists applicant_messages_anon_insert on public.applicant_messages;
create policy applicant_messages_anon_insert on public.applicant_messages
  for insert to anon
  with check (true);


drop policy if exists employer_messages_staff_all on public.employer_messages;
create policy employer_messages_staff_all on public.employer_messages
  for all to authenticated
  using (public.is_staff_member(auth.uid()))
  with check (public.is_staff_member(auth.uid()));

drop policy if exists employer_messages_anon_read on public.employer_messages;
create policy employer_messages_anon_read on public.employer_messages
  for select to anon
  using (true);

drop policy if exists employer_messages_anon_insert on public.employer_messages;
create policy employer_messages_anon_insert on public.employer_messages
  for insert to anon
  with check (true);

-- ── REALTIME ──────────────────────────────────────────────────
-- Enable realtime for the new tables
begin;
  -- Add to publication directly
  alter publication supabase_realtime add table public.applicant_messages;
  alter publication supabase_realtime add table public.employer_messages;
commit;
