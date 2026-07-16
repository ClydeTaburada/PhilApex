-- ============================================================
-- Phil-Apex Phase 2: Deployment & Monitoring System
-- Additive migration — does NOT drop or modify existing Phase 1 data.
-- ============================================================

-- ── programs ─────────────────────────────────────────────────
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null,
  standard_duration_years integer,
  created_at timestamptz not null default now()
);

-- ── foreign_partners (self-referencing hierarchy) ─────────────
create table if not exists public.foreign_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  partner_type text not null,        -- free text, no enum — staff can type anything
  is_final_employer boolean not null default false,
  parent_partner_id uuid references public.foreign_partners(id) on delete set null,
  program_id uuid references public.programs(id) on delete set null,
  contact_name text,
  contact_phone text,
  contact_email text,
  contact_address text,
  created_at timestamptz not null default now()
);

-- ── accreditations ────────────────────────────────────────────
create table if not exists public.accreditations (
  id uuid primary key default gen_random_uuid(),
  accreditation_id_dmw text not null,
  principal_partner_id uuid not null references public.foreign_partners(id) on delete restrict,
  processing_unit text,
  representative text,
  date_issued date not null,
  date_expiration date not null,
  status text not null default 'active'
    check (status in ('active', 'renewed', 'expired_unconfirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Renewal history — does NOT remove the old record, just logs prior expiry dates
create table if not exists public.accreditation_history (
  id uuid primary key default gen_random_uuid(),
  accreditation_id uuid not null references public.accreditations(id) on delete cascade,
  old_date_issued date not null,
  old_date_expiration date not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references public.staff(id) on delete set null
);

-- ── Extend job_orders (additive only) ────────────────────────
-- Keep all existing Phase 1 columns; new columns are nullable.
alter table public.job_orders
  add column if not exists job_order_number text,
  add column if not exists accreditation_id uuid references public.accreditations(id) on delete set null,
  add column if not exists foreign_partner_id uuid references public.foreign_partners(id) on delete set null,
  add column if not exists position text,
  add column if not exists class text check (class is null or class in ('direct', 'additional')),
  add column if not exists manpower_requested integer check (manpower_requested is null or manpower_requested >= 0),
  add column if not exists jo_validity_date date;

-- ── batches ───────────────────────────────────────────────────
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  job_order_id uuid not null references public.job_orders(id) on delete cascade,
  batch_label text not null,
  created_at timestamptz not null default now()
);

-- ── deployments ───────────────────────────────────────────────
create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete restrict,
  batch_id uuid not null references public.batches(id) on delete cascade,
  hired_date date not null,
  entry_date date,
  deployment_end_date date,
  document_status text not null default 'on_process'
    check (document_status in ('on_process', 'dispatched')),
  dispatched_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(applicant_id, batch_id)
);

-- ── Extend audit_log for accreditation overrides ──────────────
-- Make applicant_id nullable so we can log non-applicant events.
alter table public.audit_log
  alter column applicant_id drop not null,
  add column if not exists accreditation_id uuid references public.accreditations(id) on delete set null;

-- ── Triggers for updated_at ───────────────────────────────────
drop trigger if exists accreditations_set_updated_at on public.accreditations;
create trigger accreditations_set_updated_at
  before update on public.accreditations
  for each row execute function public.set_updated_at();

drop trigger if exists deployments_set_updated_at on public.deployments;
create trigger deployments_set_updated_at
  before update on public.deployments
  for each row execute function public.set_updated_at();

-- ── Indexes ───────────────────────────────────────────────────
create index if not exists foreign_partners_program_idx on public.foreign_partners(program_id);
create index if not exists foreign_partners_parent_idx on public.foreign_partners(parent_partner_id);
create index if not exists foreign_partners_is_final_employer_idx on public.foreign_partners(is_final_employer);
create index if not exists accreditations_partner_idx on public.accreditations(principal_partner_id);
create index if not exists accreditations_expiry_idx on public.accreditations(date_expiration);
create index if not exists job_orders_accreditation_idx on public.job_orders(accreditation_id);
create index if not exists job_orders_partner_idx on public.job_orders(foreign_partner_id);
create index if not exists job_orders_validity_idx on public.job_orders(jo_validity_date);
create index if not exists batches_job_order_idx on public.batches(job_order_id);
create index if not exists deployments_batch_idx on public.deployments(batch_id);
create index if not exists deployments_applicant_idx on public.deployments(applicant_id);
create index if not exists deployments_entry_date_idx on public.deployments(entry_date);
create index if not exists deployments_end_date_idx on public.deployments(deployment_end_date);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.programs enable row level security;
alter table public.foreign_partners enable row level security;
alter table public.accreditations enable row level security;
alter table public.accreditation_history enable row level security;
alter table public.batches enable row level security;
alter table public.deployments enable row level security;

-- programs
drop policy if exists programs_staff_read on public.programs;
create policy programs_staff_read on public.programs
  for select to authenticated
  using (public.is_staff_member(auth.uid()));

drop policy if exists programs_staff_manage on public.programs;
create policy programs_staff_manage on public.programs
  for all to authenticated
  using (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'))
  with check (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'));

-- foreign_partners
drop policy if exists foreign_partners_staff_read on public.foreign_partners;
create policy foreign_partners_staff_read on public.foreign_partners
  for select to authenticated
  using (public.is_staff_member(auth.uid()));

drop policy if exists foreign_partners_staff_manage on public.foreign_partners;
create policy foreign_partners_staff_manage on public.foreign_partners
  for all to authenticated
  using (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'))
  with check (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'));

-- accreditations
drop policy if exists accreditations_staff_read on public.accreditations;
create policy accreditations_staff_read on public.accreditations
  for select to authenticated
  using (public.is_staff_member(auth.uid()));

drop policy if exists accreditations_staff_manage on public.accreditations;
create policy accreditations_staff_manage on public.accreditations
  for all to authenticated
  using (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'))
  with check (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'));

-- accreditation_history
drop policy if exists accreditation_history_staff_read on public.accreditation_history;
create policy accreditation_history_staff_read on public.accreditation_history
  for select to authenticated
  using (public.is_staff_member(auth.uid()));

drop policy if exists accreditation_history_staff_insert on public.accreditation_history;
create policy accreditation_history_staff_insert on public.accreditation_history
  for insert to authenticated
  with check (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'));

-- batches
drop policy if exists batches_staff_read on public.batches;
create policy batches_staff_read on public.batches
  for select to authenticated
  using (public.is_staff_member(auth.uid()));

drop policy if exists batches_staff_manage on public.batches;
create policy batches_staff_manage on public.batches
  for all to authenticated
  using (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'))
  with check (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'));

-- deployments
drop policy if exists deployments_staff_read on public.deployments;
create policy deployments_staff_read on public.deployments
  for select to authenticated
  using (public.is_staff_member(auth.uid()));

drop policy if exists deployments_staff_manage on public.deployments;
create policy deployments_staff_manage on public.deployments
  for all to authenticated
  using (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'))
  with check (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'));
