-- ==========================================
-- PHASE 5: Logistics & CRM Schema Updates
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create new ENUM types
CREATE TYPE public.medical_status_type AS ENUM ('pending', 'fit', 'unfit');
CREATE TYPE public.visa_status_type AS ENUM ('pending', 'approved', 'denied');

-- 2. Update `applicants` table
ALTER TABLE public.applicants
ADD COLUMN medical_status public.medical_status_type NOT NULL DEFAULT 'pending',
ADD COLUMN pdos_completed BOOLEAN NOT NULL DEFAULT false;

-- 3. Update `deployments` table
ALTER TABLE public.deployments
ADD COLUMN visa_status public.visa_status_type NOT NULL DEFAULT 'pending',
ADD COLUMN oec_number TEXT,
ADD COLUMN flight_airline TEXT,
ADD COLUMN flight_number TEXT,
ADD COLUMN departure_datetime TIMESTAMPTZ;

-- 4. Update `foreign_partners` table for Employer CRM
ALTER TABLE public.foreign_partners
ADD COLUMN access_code TEXT;

-- Generate random 6-character access codes for existing employers
UPDATE public.foreign_partners 
SET access_code = substr(md5(random()::text), 1, 6) 
WHERE access_code IS NULL;

-- Make access_code required for future
ALTER TABLE public.foreign_partners
ALTER COLUMN access_code SET NOT NULL;

-- 5. Force schema cache refresh (just in case)
NOTIFY pgrst, 'reload schema';
