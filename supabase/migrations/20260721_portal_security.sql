-- ============================================================
-- Portal Login Rate Limiting
-- Prevents brute-force attacks on applicant and employer logins.
-- Same pattern as the existing registration rate limiter.
-- ============================================================

create table if not exists public.portal_login_rate_limits (
  ip_hash text not null,
  portal_type text not null check (portal_type in ('applicant', 'employer')),
  window_start timestamptz not null,
  attempt_count integer not null default 0,
  primary key (ip_hash, portal_type)
);

alter table public.portal_login_rate_limits enable row level security;

-- Deny all direct access — only service_role / RPC can touch this table
drop policy if exists portal_login_rate_limits_deny_all on public.portal_login_rate_limits;
create policy portal_login_rate_limits_deny_all on public.portal_login_rate_limits
  for all
  to authenticated, anon
  using (false)
  with check (false);

-- RPC: Check and increment login attempts. Returns TRUE if allowed, FALSE if blocked.
create or replace function public.check_portal_login_rate_limit(
  p_ip text,
  p_portal_type text,
  p_max_attempts integer default 5,
  p_window_minutes integer default 15
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ip_hash text;
  v_row public.portal_login_rate_limits%rowtype;
  v_now timestamptz := now();
  v_window_start timestamptz := v_now - make_interval(mins => p_window_minutes);
begin
  v_ip_hash := encode(digest(p_ip, 'sha256'), 'hex');

  select *
  into v_row
  from public.portal_login_rate_limits
  where ip_hash = v_ip_hash and portal_type = p_portal_type
  for update;

  if not found then
    insert into public.portal_login_rate_limits (ip_hash, portal_type, window_start, attempt_count)
    values (v_ip_hash, p_portal_type, v_now, 1);
    return true;
  end if;

  -- Window has expired, reset
  if v_row.window_start < v_window_start then
    update public.portal_login_rate_limits
    set window_start = v_now,
        attempt_count = 1
    where ip_hash = v_ip_hash and portal_type = p_portal_type;
    return true;
  end if;

  -- Exceeded max attempts
  if v_row.attempt_count >= p_max_attempts then
    return false;
  end if;

  -- Increment
  update public.portal_login_rate_limits
  set attempt_count = attempt_count + 1
  where ip_hash = v_ip_hash and portal_type = p_portal_type;

  return true;
end;
$$;

revoke all on function public.check_portal_login_rate_limit(text, text, integer, integer) from public;
