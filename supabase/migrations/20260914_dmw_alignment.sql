-- ==============================================================================
-- PART A: DMW Alignment & Enhancements Migration
-- Apply this file to restructure Job Orders, Accreditations, and more.
-- ==============================================================================

-- 1. Create Job Order Positions Table
CREATE TABLE IF NOT EXISTS public.job_order_positions (
    id uuid primary key default gen_random_uuid(),
    job_order_id uuid not null references public.job_orders(id) on delete cascade,
    position text not null,
    position_code text,
    needed integer not null check (needed >= 0),
    processed integer not null default 0 check (processed >= 0),
    salary_amount numeric,
    salary_currency text,
    salary_period text,
    wage_type text,
    created_at timestamptz not null default now()
);

-- RLS for Job Order Positions
ALTER TABLE public.job_order_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY job_order_positions_public_read ON public.job_order_positions 
    FOR SELECT USING (true);
CREATE POLICY job_order_positions_staff_manage ON public.job_order_positions 
    FOR ALL TO authenticated USING (public.get_staff_role(auth.uid()) IN ('processing_officer', 'admin')) 
    WITH CHECK (public.get_staff_role(auth.uid()) IN ('processing_officer', 'admin'));

-- Migrate existing job_orders position data BEFORE dropping columns
INSERT INTO public.job_order_positions (job_order_id, position, needed, processed)
SELECT 
    id, 
    position, 
    COALESCE(manpower_requested, slots_total, 0), 
    slots_filled
FROM public.job_orders
WHERE position IS NOT NULL;


-- 2. Alter Job Orders Table
-- We must first drop the constraints that depend on the columns we are modifying.
ALTER TABLE public.job_orders DROP CONSTRAINT IF EXISTS job_orders_class_check;

ALTER TABLE public.job_orders 
    RENAME COLUMN jo_validity_date TO valid_until;

ALTER TABLE public.job_orders 
    ADD COLUMN date_approved date,
    ADD COLUMN status_text text default 'Active',
    ADD COLUMN category text,
    ADD COLUMN reference_number text,
    ADD COLUMN parent_job_order_id uuid references public.job_orders(id) on delete set null;

-- Drop legacy columns and their dependent triggers
DROP TRIGGER IF EXISTS job_orders_sync_status ON public.job_orders;
DROP FUNCTION IF EXISTS public.sync_job_order_status();

ALTER TABLE public.job_orders 
    DROP COLUMN position,
    DROP COLUMN manpower_requested,
    DROP COLUMN slots_total,
    DROP COLUMN slots_filled;


-- 3. Create Job Order Attachments Table
CREATE TABLE IF NOT EXISTS public.job_order_attachments (
    id uuid primary key default gen_random_uuid(),
    job_order_id uuid not null references public.job_orders(id) on delete cascade,
    file_path text not null,
    file_name text not null,
    uploaded_by uuid references public.staff(id) on delete set null,
    uploaded_at timestamptz not null default now()
);

-- RLS for Job Order Attachments
ALTER TABLE public.job_order_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY job_order_attachments_staff_manage ON public.job_order_attachments 
    FOR ALL TO authenticated USING (public.get_staff_role(auth.uid()) IN ('processing_officer', 'admin')) 
    WITH CHECK (public.get_staff_role(auth.uid()) IN ('processing_officer', 'admin'));
CREATE POLICY job_order_attachments_staff_read ON public.job_order_attachments 
    FOR SELECT TO authenticated USING (public.is_staff_member(auth.uid()));


-- 4. Alter Accreditations
ALTER TABLE public.accreditations
    ADD COLUMN crn_business_license text,
    ADD COLUMN arrangement text;


-- 5. Alter Applicants
ALTER TABLE public.applicants
    ADD COLUMN middle_name text,
    ADD COLUMN no_middle_name boolean not null default false,
    ADD COLUMN job_fair_city text;


-- 6. Alter Programs
ALTER TABLE public.programs
    ADD COLUMN description text;


-- 7. Alter Applicant Documents
ALTER TABLE public.applicant_documents
    ADD COLUMN remarks text;


-- 8. Notifications System
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid primary key default gen_random_uuid(),
    notification_type text not null,
    entity_id uuid not null,
    title text not null,
    message text not null,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

-- RLS for Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_staff_read ON public.notifications 
    FOR SELECT TO authenticated USING (public.is_staff_member(auth.uid()));
CREATE POLICY notifications_staff_update ON public.notifications 
    FOR UPDATE TO authenticated USING (public.is_staff_member(auth.uid())) 
    WITH CHECK (public.is_staff_member(auth.uid()));


-- 9. Insurance Records System
CREATE TABLE IF NOT EXISTS public.insurance_records (
    id uuid primary key default gen_random_uuid(),
    applicant_id uuid not null references public.applicants(id) on delete cascade,
    insurance_type text not null,
    policy_number text,
    provider text,
    coverage_start_date date,
    coverage_end_date date,
    created_at timestamptz not null default now()
);

-- RLS for Insurance Records
ALTER TABLE public.insurance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_records_staff_manage ON public.insurance_records 
    FOR ALL TO authenticated USING (public.get_staff_role(auth.uid()) IN ('processing_officer', 'admin')) 
    WITH CHECK (public.get_staff_role(auth.uid()) IN ('processing_officer', 'admin'));
CREATE POLICY insurance_records_staff_read ON public.insurance_records 
    FOR SELECT TO authenticated USING (public.is_staff_member(auth.uid()));
CREATE POLICY insurance_records_applicant_read ON public.insurance_records 
    FOR SELECT TO authenticated USING (auth.uid() IN (SELECT id FROM public.applicants WHERE id = insurance_records.applicant_id));


-- 10. Seed Data Updates
-- Make Birth Certificate uploadable
UPDATE public.document_requirements
SET requires_file_upload = true
WHERE doc_name = 'Birth Certificate';

-- Make TESDA Certificate status-only
UPDATE public.document_requirements
SET requires_file_upload = false
WHERE doc_name = 'TESDA Certificate';
