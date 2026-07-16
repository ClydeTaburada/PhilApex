-- Seed Phase 2 reference data for immediate demo use.

insert into public.programs (id, name, country, standard_duration_years)
values
  ('11111111-1111-1111-1111-111111111111', 'Nurse Visa', 'Czech Republic', null),
  ('22222222-2222-2222-2222-222222222222', 'Working Visa', 'Canada', null),
  ('33333333-3333-3333-3333-333333333333', 'TITP', 'Japan', 3),
  ('44444444-4444-4444-4444-444444444444', 'SSW', 'Japan', 5)
on conflict (id) do nothing;

insert into public.foreign_partners (id, name, partner_type, is_final_employer, parent_partner_id, program_id)
values
  ('51111111-1111-1111-1111-111111111111', 'Egston', 'foreign_employer', true, null, '11111111-1111-1111-1111-111111111111'),
  ('52222222-2222-2222-2222-222222222222', 'ARK', 'foreign_recruitment_agent', false, null, '22222222-2222-2222-2222-222222222222'),
  ('53333333-3333-3333-3333-333333333333', 'Employer A (Jaco)', 'foreign_employer', true, '52222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
  ('54444444-4444-4444-4444-444444444444', 'Employer B', 'foreign_employer', true, '52222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
  ('55555555-5555-5555-5555-555555555555', 'Employer C', 'foreign_employer', true, '52222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
  ('56666666-6666-6666-6666-666666666666', 'Employer D', 'foreign_employer', true, '52222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222'),
  ('57777777-7777-7777-7777-777777777777', 'KJH', 'supervising_org', false, null, '33333333-3333-3333-3333-333333333333'),
  ('58888888-8888-8888-8888-888888888888', 'Shihoku', 'implementing_org', true, '57777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333'),
  ('59999999-9999-9999-9999-999999999999', 'KK Company A', 'implementing_org', true, '57777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333'),
  ('5aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'KK Company B', 'implementing_org', true, '57777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333'),
  ('5bbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'KK Company D', 'implementing_org', true, '57777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333'),
  ('5ccccccc-cccc-cccc-cccc-cccccccccccc', 'Shihoku (SSW)', 'foreign_employer', true, null, '44444444-4444-4444-4444-444444444444')
on conflict (id) do nothing;

insert into public.accreditations (id, accreditation_id_dmw, principal_partner_id, processing_unit, representative, date_issued, date_expiration, status)
values
  ('61111111-1111-1111-1111-111111111111', 'DMW-1001', '51111111-1111-1111-1111-111111111111', 'Processing Unit A', 'Maria Santos', current_date - interval '30 days', current_date + interval '180 days', 'active'),
  ('62222222-2222-2222-2222-222222222222', 'DMW-2001', '57777777-7777-7777-7777-777777777777', 'Processing Unit B', 'Kenji Tanaka', current_date - interval '10 days', current_date + interval '90 days', 'active')
on conflict (id) do nothing;

insert into public.job_orders (id, job_order_number, accreditation_id, foreign_partner_id, position, class, manpower_requested, jo_validity_date, country, program_name, trade, gender_requirement, slots_total, slots_filled, status)
values
  ('71111111-1111-1111-1111-111111111111', 'JO-1001', '61111111-1111-1111-1111-111111111111', '51111111-1111-1111-1111-111111111111', 'Nurse', 'direct', 20, current_date + interval '120 days', 'Czech Republic', 'Nurse Visa', 'Nurse', null, 20, 4, 'open'),
  ('72222222-2222-2222-2222-222222222222', 'JO-2001', '62222222-2222-2222-2222-222222222222', '57777777-7777-7777-7777-777777777777', 'Welder', 'additional', 15, current_date + interval '60 days', 'Japan', 'TITP', 'Welder', 'male', 15, 2, 'open')
on conflict (id) do nothing;
