-- Phil-Apex MVP schema and security baseline
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'gender_type' and typnamespace = 'public'::regnamespace) then
    create type public.gender_type as enum ('male', 'female');
  end if;

  if not exists (select 1 from pg_type where typname = 'source_type' and typnamespace = 'public'::regnamespace) then
    create type public.source_type as enum ('walk_in', 'job_fair', 'lgu_peso');
  end if;

  if not exists (select 1 from pg_type where typname = 'peos_certificate_status_type' and typnamespace = 'public'::regnamespace) then
    create type public.peos_certificate_status_type as enum ('not_started', 'in_progress', 'completed');
  end if;

  if not exists (select 1 from pg_type where typname = 'pipeline_stage_type' and typnamespace = 'public'::regnamespace) then
    create type public.pipeline_stage_type as enum ('registered', 'documents_complete', 'dmw_registered', 'peos_certified', 'matched', 'deployed');
  end if;

  if not exists (select 1 from pg_type where typname = 'document_status_type' and typnamespace = 'public'::regnamespace) then
    create type public.document_status_type as enum ('missing', 'submitted', 'verified');
  end if;

  if not exists (select 1 from pg_type where typname = 'staff_role_type' and typnamespace = 'public'::regnamespace) then
    create type public.staff_role_type as enum ('front_desk', 'processing_officer', 'admin');
  end if;

  if not exists (select 1 from pg_type where typname = 'job_order_status_type' and typnamespace = 'public'::regnamespace) then
    create type public.job_order_status_type as enum ('open', 'closed');
  end if;
end;
$$;

create table if not exists public.staff (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.staff_role_type not null,
  created_at timestamptz not null default now()
);

create table if not exists public.applicants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  date_of_birth date not null,
  gender public.gender_type not null,
  home_address text,
  cellphone_number text not null,
  email text,
  educational_attainment text,
  occupation_applied text,
  has_passport boolean not null default false,
  source public.source_type not null,
  dmw_registration_number text,
  peos_modules_completed integer not null default 0 check (peos_modules_completed >= 0 and peos_modules_completed <= 8),
  peos_certificate_status public.peos_certificate_status_type not null default 'not_started',
  current_pipeline_stage public.pipeline_stage_type not null default 'registered',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cellphone_number ~ '^09[0-9]{9}$'),
  check (email is null or email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

create table if not exists public.document_requirements (
  id bigint generated always as identity primary key,
  doc_name text not null unique,
  requires_file_upload boolean not null default false,
  is_conditional boolean not null default false,
  condition_note text
);

create table if not exists public.applicant_documents (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  document_requirement_id bigint not null references public.document_requirements(id) on delete restrict,
  status public.document_status_type not null default 'missing',
  file_path text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.staff(id) on delete set null,
  unique(applicant_id, document_requirement_id)
);

create table if not exists public.job_orders (
  id uuid primary key default gen_random_uuid(),
  country text not null,
  program_name text not null,
  trade text not null,
  gender_requirement public.gender_type,
  slots_total integer not null check (slots_total >= 0),
  slots_filled integer not null default 0 check (slots_filled >= 0),
  status public.job_order_status_type not null default 'open',
  created_at timestamptz not null default now(),
  check (slots_filled <= slots_total)
);

create table if not exists public.applicant_job_orders (
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  job_order_id uuid not null references public.job_orders(id) on delete cascade,
  applied_at timestamptz not null default now(),
  primary key (applicant_id, job_order_id)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff(id) on delete restrict,
  applicant_id uuid not null references public.applicants(id) on delete cascade,
  action_type text not null,
  field_changed text not null,
  old_value text,
  new_value text,
  timestamp timestamptz not null default now()
);

create table if not exists public.public_registration_rate_limits (
  ip_hash text primary key,
  window_start timestamptz not null,
  request_count integer not null default 0
);

create index if not exists applicants_stage_idx on public.applicants (current_pipeline_stage);
create index if not exists applicants_source_idx on public.applicants (source);
create index if not exists applicants_gender_idx on public.applicants (gender);
create index if not exists applicants_passport_idx on public.applicants (has_passport);
create index if not exists applicants_created_at_idx on public.applicants (created_at desc);
create index if not exists applicants_occupation_idx on public.applicants (occupation_applied);
create index if not exists applicants_full_name_trgm_idx on public.applicants using gin (full_name gin_trgm_ops);
create index if not exists applicant_documents_applicant_status_idx on public.applicant_documents (applicant_id, status);
create index if not exists applicant_documents_requirement_idx on public.applicant_documents (document_requirement_id);
create index if not exists applicant_job_orders_job_order_idx on public.applicant_job_orders (job_order_id);
create index if not exists job_orders_status_trade_idx on public.job_orders (status, trade);

insert into public.document_requirements (doc_name, requires_file_upload, is_conditional, condition_note)
values
  ('Japanese Resume', false, false, null),
  ('Colored Passport Copy w/ Signature', true, false, null),
  ('PSA Birth Certificate', false, false, null),
  ('Marriage Certificate', false, true, 'If married'),
  ('NBI Clearance', false, false, null),
  ('Police Clearance', false, false, null),
  ('Barangay Clearance', false, false, null),
  ('DMW E-Registration', false, false, null),
  ('PEOS Certificate', false, false, null),
  ('TESDA Certificate', true, false, null),
  ('Form 137/TOR', false, false, null),
  ('Diploma', false, false, null),
  ('ALS Docs', false, true, 'ALS graduates only'),
  ('Letter of Recommendation', false, false, null),
  ('DTI/SEC/Mayor''s Permit', false, false, null),
  ('IQ Test', false, false, null),
  ('Vaccination Certificate', false, false, null),
  ('2x2 ID Photo', true, false, null)
on conflict (doc_name) do update
set
  requires_file_upload = excluded.requires_file_upload,
  is_conditional = excluded.is_conditional,
  condition_note = excluded.condition_note;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists applicants_set_updated_at on public.applicants;

create trigger applicants_set_updated_at
before update on public.applicants
for each row
execute function public.set_updated_at();

drop trigger if exists applicant_documents_set_updated_at on public.applicant_documents;

create trigger applicant_documents_set_updated_at
before update on public.applicant_documents
for each row
execute function public.set_updated_at();

create or replace function public.sync_job_order_status()
returns trigger
language plpgsql
as $$
begin
  if new.slots_filled >= new.slots_total then
    new.status := 'closed';
  else
    new.status := 'open';
  end if;
  return new;
end;
$$;

drop trigger if exists job_orders_sync_status on public.job_orders;

create trigger job_orders_sync_status
before insert or update of slots_total, slots_filled on public.job_orders
for each row
execute function public.sync_job_order_status();

create or replace function public.is_staff_member(p_uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.staff s
    where s.id = p_uid
  );
$$;

create or replace function public.get_staff_role(p_uid uuid)
returns public.staff_role_type
language sql
stable
as $$
  select s.role
  from public.staff s
  where s.id = p_uid;
$$;

create or replace function public.register_applicant_with_documents(
  p_full_name text,
  p_date_of_birth date,
  p_gender public.gender_type,
  p_home_address text,
  p_cellphone_number text,
  p_email text,
  p_educational_attainment text,
  p_occupation_applied text,
  p_has_passport boolean,
  p_source public.source_type,
  p_job_order_id uuid,
  p_file_paths jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant_id uuid;
begin
  insert into public.applicants (
    full_name,
    date_of_birth,
    gender,
    home_address,
    cellphone_number,
    email,
    educational_attainment,
    occupation_applied,
    has_passport,
    source
  )
  values (
    p_full_name,
    p_date_of_birth,
    p_gender,
    p_home_address,
    p_cellphone_number,
    p_email,
    p_educational_attainment,
    p_occupation_applied,
    p_has_passport,
    p_source
  )
  returning id into v_applicant_id;

  insert into public.applicant_documents (
    applicant_id,
    document_requirement_id,
    status,
    file_path
  )
  select
    v_applicant_id,
    dr.id,
    case
      when p_file_paths ? dr.doc_name then 'submitted'::public.document_status_type
      else 'missing'::public.document_status_type
    end,
    case
      when p_file_paths ? dr.doc_name then p_file_paths ->> dr.doc_name
      else null
    end
  from public.document_requirements dr;

  if p_job_order_id is not null then
    insert into public.applicant_job_orders (applicant_id, job_order_id)
    values (v_applicant_id, p_job_order_id);
  end if;

  return v_applicant_id;
end;
$$;

revoke all on function public.register_applicant_with_documents(
  text,
  date,
  public.gender_type,
  text,
  text,
  text,
  text,
  text,
  boolean,
  public.source_type,
  uuid,
  jsonb
) from public;

create or replace function public.check_and_increment_registration_rate_limit(
  p_ip text,
  p_max_requests integer default 10,
  p_window_minutes integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip_hash text;
  v_row public.public_registration_rate_limits%rowtype;
  v_now timestamptz := now();
  v_window_start timestamptz := v_now - make_interval(mins => p_window_minutes);
begin
  v_ip_hash := encode(digest(p_ip, 'sha256'), 'hex');

  select *
  into v_row
  from public.public_registration_rate_limits
  where ip_hash = v_ip_hash
  for update;

  if not found then
    insert into public.public_registration_rate_limits (ip_hash, window_start, request_count)
    values (v_ip_hash, v_now, 1);
    return true;
  end if;

  if v_row.window_start < v_window_start then
    update public.public_registration_rate_limits
    set window_start = v_now,
        request_count = 1
    where ip_hash = v_ip_hash;
    return true;
  end if;

  if v_row.request_count >= p_max_requests then
    return false;
  end if;

  update public.public_registration_rate_limits
  set request_count = request_count + 1
  where ip_hash = v_ip_hash;

  return true;
end;
$$;

revoke all on function public.check_and_increment_registration_rate_limit(text, integer, integer) from public;

do $$
begin
  if not exists (
    select 1
    from storage.buckets
    where id = 'applicant-documents'
  ) then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'applicant-documents',
      'applicant-documents',
      false,
      2097152,
      array['image/jpeg', 'image/png', 'application/pdf']::text[]
    );
  end if;
end;
$$;

alter table public.staff enable row level security;
alter table public.applicants enable row level security;
alter table public.document_requirements enable row level security;
alter table public.applicant_documents enable row level security;
alter table public.job_orders enable row level security;
alter table public.applicant_job_orders enable row level security;
alter table public.audit_log enable row level security;
alter table public.public_registration_rate_limits enable row level security;

drop policy if exists staff_self_read on public.staff;
create policy staff_self_read on public.staff
for select
to authenticated
using (id = auth.uid() or public.get_staff_role(auth.uid()) = 'admin');

drop policy if exists staff_admin_manage on public.staff;
create policy staff_admin_manage on public.staff
for all
to authenticated
using (public.get_staff_role(auth.uid()) = 'admin')
with check (public.get_staff_role(auth.uid()) = 'admin');

drop policy if exists applicants_staff_read on public.applicants;
create policy applicants_staff_read on public.applicants
for select
to authenticated
using (public.is_staff_member(auth.uid()));

drop policy if exists applicants_staff_insert on public.applicants;
create policy applicants_staff_insert on public.applicants
for insert
to authenticated
with check (public.is_staff_member(auth.uid()));

drop policy if exists applicants_staff_update on public.applicants;
create policy applicants_staff_update on public.applicants
for update
to authenticated
using (public.is_staff_member(auth.uid()))
with check (public.is_staff_member(auth.uid()));

drop policy if exists document_requirements_staff_read on public.document_requirements;
create policy document_requirements_staff_read on public.document_requirements
for select
to authenticated
using (public.is_staff_member(auth.uid()));

drop policy if exists applicant_documents_staff_read on public.applicant_documents;
create policy applicant_documents_staff_read on public.applicant_documents
for select
to authenticated
using (public.is_staff_member(auth.uid()));

drop policy if exists applicant_documents_staff_insert on public.applicant_documents;
create policy applicant_documents_staff_insert on public.applicant_documents
for insert
to authenticated
with check (public.is_staff_member(auth.uid()));

drop policy if exists applicant_documents_front_desk_update on public.applicant_documents;
create policy applicant_documents_front_desk_update on public.applicant_documents
for update
to authenticated
using (public.get_staff_role(auth.uid()) in ('front_desk', 'processing_officer', 'admin'))
with check (
  public.get_staff_role(auth.uid()) in ('front_desk', 'processing_officer', 'admin')
  and (
    status <> 'verified'
    or public.get_staff_role(auth.uid()) in ('processing_officer', 'admin')
  )
);

drop policy if exists job_orders_public_read on public.job_orders;
create policy job_orders_public_read on public.job_orders
for select
to anon
using (status = 'open');

drop policy if exists job_orders_staff_read on public.job_orders;
create policy job_orders_staff_read on public.job_orders
for select
to authenticated
using (public.is_staff_member(auth.uid()));

drop policy if exists job_orders_staff_manage on public.job_orders;
create policy job_orders_staff_manage on public.job_orders
for all
to authenticated
using (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'))
with check (public.get_staff_role(auth.uid()) in ('processing_officer', 'admin'));

drop policy if exists applicant_job_orders_staff_read on public.applicant_job_orders;
create policy applicant_job_orders_staff_read on public.applicant_job_orders
for select
to authenticated
using (public.is_staff_member(auth.uid()));

drop policy if exists applicant_job_orders_staff_insert on public.applicant_job_orders;
create policy applicant_job_orders_staff_insert on public.applicant_job_orders
for insert
to authenticated
with check (public.is_staff_member(auth.uid()));

drop policy if exists audit_log_staff_read on public.audit_log;
create policy audit_log_staff_read on public.audit_log
for select
to authenticated
using (public.is_staff_member(auth.uid()));

drop policy if exists audit_log_staff_insert on public.audit_log;
create policy audit_log_staff_insert on public.audit_log
for insert
to authenticated
with check (public.is_staff_member(auth.uid()));

-- Deliberately no UPDATE/DELETE policies for audit_log.

drop policy if exists public_registration_rate_limits_service_only on public.public_registration_rate_limits;
create policy public_registration_rate_limits_service_only on public.public_registration_rate_limits
for all
to authenticated
using (false)
with check (false);

drop policy if exists storage_staff_select on storage.objects;
create policy storage_staff_select on storage.objects
for select
to authenticated
using (
  bucket_id = 'applicant-documents'
  and public.is_staff_member(auth.uid())
);

drop policy if exists storage_service_insert on storage.objects;
create policy storage_service_insert on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'applicant-documents'
  and public.is_staff_member(auth.uid())
);

drop policy if exists storage_service_update on storage.objects;
create policy storage_service_update on storage.objects
for update
to authenticated
using (
  bucket_id = 'applicant-documents'
  and public.is_staff_member(auth.uid())
)
with check (
  bucket_id = 'applicant-documents'
  and public.is_staff_member(auth.uid())
);
