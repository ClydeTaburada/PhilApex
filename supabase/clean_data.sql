-- ============================================================
-- Phil-Apex: Clean ALL data, keep only staff credentials
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================
-- This preserves:
--   ✅ auth.users (your login accounts)
--   ✅ public.staff (your staff roles)
--   ✅ public.document_requirements (system reference data)
--   ✅ All schema, functions, triggers, RLS policies
--
-- This DELETES:
--   ❌ deployments
--   ❌ batches
--   ❌ applicant_job_orders
--   ❌ applicant_documents
--   ❌ applicants
--   ❌ job_orders
--   ❌ accreditation_history
--   ❌ accreditations
--   ❌ foreign_partners
--   ❌ programs
--   ❌ trades
--   ❌ audit_log
--   ❌ rate_limit records

-- Order matters due to foreign key constraints (delete children first)

-- 1) Deployments (references applicants + batches)
DELETE FROM public.deployments;

-- 2) Batches (references job_orders)
DELETE FROM public.batches;

-- 3) Audit log (references staff + applicants + accreditations)
DELETE FROM public.audit_log;

-- 4) Applicant-Job-Order links
DELETE FROM public.applicant_job_orders;

-- 5) Applicant documents
DELETE FROM public.applicant_documents;

-- 6) Applicants
DELETE FROM public.applicants;

-- 7) Job orders (references accreditations + foreign_partners)
DELETE FROM public.job_orders;

-- 8) Accreditation history (references accreditations)
DELETE FROM public.accreditation_history;

-- 9) Accreditations (references foreign_partners)
DELETE FROM public.accreditations;

-- 10) Foreign partners (self-referencing, delete children first)
DELETE FROM public.foreign_partners WHERE parent_partner_id IS NOT NULL;
DELETE FROM public.foreign_partners;

-- 11) Programs
DELETE FROM public.programs;

-- 12) Trades
DELETE FROM public.trades;

-- 13) Rate limit tracking
DELETE FROM public.public_registration_rate_limits;

-- 14) Reset the applicant reference number sequence
ALTER SEQUENCE applicant_ref_seq RESTART WITH 1;

-- ── Verify what remains ───────────────────────────────────────
SELECT 'auth.users' AS "table", count(*) AS "rows" FROM auth.users
UNION ALL SELECT 'staff', count(*) FROM public.staff
UNION ALL SELECT 'document_requirements', count(*) FROM public.document_requirements
UNION ALL SELECT 'applicants', count(*) FROM public.applicants
UNION ALL SELECT 'applicant_documents', count(*) FROM public.applicant_documents
UNION ALL SELECT 'job_orders', count(*) FROM public.job_orders
UNION ALL SELECT 'accreditations', count(*) FROM public.accreditations
UNION ALL SELECT 'foreign_partners', count(*) FROM public.foreign_partners
UNION ALL SELECT 'programs', count(*) FROM public.programs
UNION ALL SELECT 'deployments', count(*) FROM public.deployments
UNION ALL SELECT 'batches', count(*) FROM public.batches
UNION ALL SELECT 'trades', count(*) FROM public.trades
UNION ALL SELECT 'audit_log', count(*) FROM public.audit_log
ORDER BY 1;
