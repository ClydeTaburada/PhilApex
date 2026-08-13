-- ============================================================
-- Phil-Apex: MASTER SEED DATA (For Live Presentation)
-- Run this AFTER clean_data.sql to populate a realistic system
-- ============================================================

DO $$
DECLARE
  -- Programs
  v_prog_japan uuid := 'e1d4b6ca-1c25-4b5b-9d48-3a213554b79c';
  v_prog_me uuid := 'd2a3c7bd-2d36-5c6c-ae59-4b324665c8ad';
  
  -- Partners
  v_partner_global uuid := 'b22787e9-7c85-4c07-b2e4-e0c3a2f8b5e4';
  v_partner_desert uuid := 'c33898fa-8d96-5d18-c3f5-f1d4b309c6f5';
  
  -- Accreditations
  v_accred_global uuid := '9b4c0535-7798-4221-a585-64d4b1a45a34';
  v_accred_desert uuid := 'a05d1646-8809-5332-b696-75e5c2b56b45';
  
  -- Job Orders
  v_jo_machine uuid := '21cfbfab-f4eb-48b4-a28d-1c32729e8bc1';
  v_jo_welder uuid := '32d0c0bc-05fc-59c5-b39e-2d43830f9cd2';
  
  -- Applicants
  v_app_juan uuid := 'a23a310c-5197-4b6d-a7fa-531a788bbdfa';
  v_app_maria uuid := 'b34b421d-6208-5c7e-b80b-642b899cce0b';
  v_app_pedro uuid := 'c45c532e-7319-6d8f-c91c-753c900ddf1c';
  
  -- Batch
  v_batch_1 uuid := 'f67f643f-8420-7e90-da2d-864da11ee02d';
BEGIN

  -- 1) Create Programs
  INSERT INTO public.programs (id, name, country, standard_duration_years)
  VALUES 
    (v_prog_japan, 'Technical Intern Training Program (TITP)', 'Japan', 3),
    (v_prog_me, 'Skilled Workers Deployment', 'Saudi Arabia', 2)
  ON CONFLICT (id) DO NOTHING;

  -- 2) Create Foreign Partners
  INSERT INTO public.foreign_partners (id, name, partner_type, is_final_employer, program_id, contact_name, contact_email)
  VALUES 
    (v_partner_global, 'Global Tech Manufacturing Ltd.', 'company', true, v_prog_japan, 'Hiroshi Tanaka', 'hr@globaltech.jp'),
    (v_partner_desert, 'Desert Oasis Construction', 'agency', false, v_prog_me, 'Ahmed Al-Fayed', 'jobs@desertoasis.sa')
  ON CONFLICT (id) DO NOTHING;

  -- 3) Create Accreditations
  INSERT INTO public.accreditations (id, accreditation_id_dmw, principal_partner_id, date_issued, date_expiration, status)
  VALUES 
    (v_accred_global, 'DMW-ACCRED-2026-001', v_partner_global, CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '2 years', 'active'),
    (v_accred_desert, 'DMW-ACCRED-2026-002', v_partner_desert, CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE + INTERVAL '1 year', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- 4) Create Job Orders
  INSERT INTO public.job_orders (id, country, program_name, trade, slots_total, slots_filled, status, accreditation_id, foreign_partner_id, position)
  VALUES 
    (v_jo_machine, 'Japan', 'TITP', 'Machine Operator', 50, 2, 'open', v_accred_global, v_partner_global, 'Machine Operator'),
    (v_jo_welder, 'Saudi Arabia', 'Skilled Workers', 'Welder', 20, 0, 'open', v_accred_desert, v_partner_desert, 'Senior Welder')
  ON CONFLICT (id) DO NOTHING;

  -- 5) Create Applicants in Various Stages
  INSERT INTO public.applicants (id, full_name, date_of_birth, gender, cellphone_number, email, educational_attainment, occupation_applied, has_passport, source, current_pipeline_stage)
  VALUES 
    (v_app_juan, 'Juan Dela Cruz', '1995-05-15', 'male', '09123456789', 'juan@example.com', 'High School Graduate', 'Machine Operator', true, 'walk_in', 'registered'),
    (v_app_maria, 'Maria Santos', '1998-10-20', 'female', '09222222222', 'maria@example.com', 'College Graduate', 'Quality Control', false, 'job_fair', 'documents_complete'),
    (v_app_pedro, 'Pedro Penduko', '1990-01-01', 'male', '09333333333', 'pedro@example.com', 'Vocational', 'Welder', true, 'lgu_peso', 'deployed')
  ON CONFLICT (id) DO NOTHING;

  -- 6) Link Applicants to Job Orders
  INSERT INTO public.applicant_job_orders (applicant_id, job_order_id)
  VALUES 
    (v_app_juan, v_jo_machine),
    (v_app_pedro, v_jo_welder)
  ON CONFLICT DO NOTHING;

  -- 7) Pre-fill some documents for Maria to show Documents Complete stage
  INSERT INTO public.applicant_documents (applicant_id, document_requirement_id, status)
  SELECT v_app_maria, id, 'verified'::public.document_status_type
  FROM public.document_requirements
  WHERE doc_name IN ('PSA Birth Certificate', 'NBI Clearance')
  ON CONFLICT DO NOTHING;

  -- 8) Create a Deployment Batch for Pedro
  INSERT INTO public.batches (id, job_order_id, batch_label)
  VALUES (v_batch_1, v_jo_welder, 'Batch 1 - Saudi Welders')
  ON CONFLICT (id) DO NOTHING;

  -- 9) Deploy Pedro
  INSERT INTO public.deployments (applicant_id, batch_id, hired_date, document_status)
  VALUES (v_app_pedro, v_batch_1, CURRENT_DATE - INTERVAL '10 days', 'dispatched')
  ON CONFLICT DO NOTHING;

  -- 10) Chat Widget Messages for Presentation
  -- Juan asking a question
  INSERT INTO public.applicant_messages (applicant_id, sender_type, content, urgency)
  VALUES (v_app_juan, 'applicant', 'Hello sir/maam, I submitted my application for Machine Operator. What is the next step?', 'normal');
  
  -- Employer asking for an update
  INSERT INTO public.employer_messages (partner_id, sender_type, content, urgency)
  VALUES (v_partner_global, 'employer', 'We urgently need the first batch of Machine Operators. Please prioritize processing.', 'high');

END $$;
