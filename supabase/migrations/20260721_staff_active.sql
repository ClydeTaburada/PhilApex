-- ============================================================
-- Staff Management: Deactivation & Active Status
-- ============================================================

-- Add is_active flag to staff table
alter table public.staff 
add column if not exists is_active boolean not null default true;

-- Update the is_staff_member function to enforce the active status
-- This ensures that deactivated staff instantly lose all RLS access
create or replace function public.is_staff_member(p_uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.staff s
    where s.id = p_uid and s.is_active = true
  );
$$;

-- Ensure staff can read other staff members for management purposes
-- (Previously only self-read and admin-all were allowed, but we might want processing_officers to see names etc)
-- Actually, we'll just allow all staff to read the staff table for dropdowns/UI, but manage is restricted to admin.
drop policy if exists staff_self_read on public.staff;
create policy staff_staff_read on public.staff
for select
to authenticated
using (public.is_staff_member(auth.uid()));
