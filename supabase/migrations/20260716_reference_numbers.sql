CREATE SEQUENCE IF NOT EXISTS applicant_ref_seq START 1;

ALTER TABLE public.applicants 
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(20) UNIQUE 
DEFAULT (to_char(CURRENT_DATE, 'YYYY') || '-' || LPAD(nextval('applicant_ref_seq')::text, 4, '0') || '-A');

-- Drop the old function because we are changing the return type from uuid to text
DROP FUNCTION IF EXISTS public.register_applicant_with_documents(text, date, public.gender_type, text, text, text, text, text, boolean, public.source_type, uuid, jsonb);

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
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_applicant_id uuid;
  v_reference_number text;
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
  returning id, reference_number into v_applicant_id, v_reference_number;

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

  return v_reference_number;
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

grant execute on function public.register_applicant_with_documents(
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
) to anon, authenticated, service_role;
