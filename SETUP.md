# Phil-Apex MVP Setup Guide

## 1. Prerequisites

- Node.js 20+
- A Supabase Cloud project
- A Vercel account

## 2. Create Supabase Project

1. Create a new Supabase project.
2. In Supabase Dashboard, copy these values:
   - Project URL
   - anon public key
   - service_role key

## 3. Run Database Schema

1. Open Supabase SQL Editor.
2. Run the SQL migration in:
   - `supabase/migrations/20260710_init.sql`
3. Confirm these tables exist:
   - `applicants`
   - `document_requirements`
   - `applicant_documents`
   - `job_orders`
   - `applicant_job_orders`
   - `staff`
   - `audit_log`
   - `public_registration_rate_limits`
4. Confirm RLS is enabled on all tables.
5. Confirm storage bucket `applicant-documents` is private.

## 4. Create Staff Accounts

1. In Supabase Auth, create users (email/password) for staff members.
2. Run `supabase/manual_setup.sql` in Supabase SQL Editor.
3. Edit the emails in that script to match your real Auth users before running.

## 5. Configure Environment

1. Copy `.env.example` to `.env.local`.
2. Fill values:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## 6. Local Development

```bash
npm install
npm run dev
```

Open:
- Public registration: `/register`
- Staff login: `/staff/login`

## 7. Deploy to Vercel

1. Push the repository to GitHub.
2. Import repo in Vercel.
3. Add environment variables from `.env.example` in Vercel Project Settings.
4. Deploy.

## 8. Post-Deploy Validation

- Test public registration (including file uploads)
- Confirm applicant row + 18 applicant_documents rows are created
- Confirm rate limit triggers after repeated submissions
- Confirm staff role restrictions (front_desk cannot verify documents)
- Confirm signed URL access works and expires
- Confirm audit_log records updates for document/pipeline/PEOS/DMW changes
