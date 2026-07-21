-- ============================================================
-- Fix infinite recursion in staff RLS policies
-- ============================================================

-- Make is_staff_member run as security definer to bypass RLS and avoid infinite recursion
create or replace function public.is_staff_member(p_uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff s
    where s.id = p_uid and s.is_active = true
  );
$$;

-- Make get_staff_role run as security definer to avoid infinite recursion
create or replace function public.get_staff_role(p_uid uuid)
returns public.staff_role_type
language sql
security definer
set search_path = public
as $$
  select s.role
  from public.staff s
  where s.id = p_uid;
$$;
