-- ============================================================
-- Add Urgency to Chat Messages (20260722_chat_urgency.sql)
-- ============================================================

alter table public.applicant_messages add column if not exists urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high'));
alter table public.employer_messages add column if not exists urgency text not null default 'normal' check (urgency in ('low', 'normal', 'high'));
