import { z } from "zod";

export const genderSchema = z.enum(["male", "female"]);
export const sourceSchema = z.enum(["walk_in", "job_fair", "lgu_peso"]);
export const peosCertificateStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "completed",
]);
export const pipelineStageSchema = z.enum([
  "registered",
  "documents_complete",
  "dmw_registered",
  "peos_certified",
  "matched",
  "deployed",
]);
export const documentStatusSchema = z.enum(["missing", "submitted", "verified"]);
export const staffRoleSchema = z.enum(["front_desk", "processing_officer", "admin"]);
export const jobOrderStatusSchema = z.enum(["open", "closed"]);

const phMobileRegex = /^09\d{9}$/;

export const applicantRegistrationSchema = z.object({
  first_name: z.string().trim().min(2).max(80),
  middle_name: z
    .string()
    .trim()
    .max(80)
    .optional()
    .or(z.literal("")),
  no_middle_name: z.boolean().default(false).optional(),
  last_name: z.string().trim().min(2).max(80),
  name_extension: z.string().trim().max(20).optional().or(z.literal("")),
  date_of_birth: z.string().date(),
  gender: genderSchema,
  home_address: z.string().trim().max(500).optional().or(z.literal("")),
  cellphone_number: z.string().regex(phMobileRegex, "Use PH mobile format 09XXXXXXXXX"),
  email: z.email().max(320).optional().or(z.literal("")),
  educational_attainment: z.string().trim().max(200).optional().or(z.literal("")),
  occupation_applied: z.string().trim().min(2).max(200),
  has_passport: z.boolean(),
  source: sourceSchema,
  job_fair_city: z.string().trim().max(100).optional().or(z.literal("")),
  job_order_id: z.uuid().optional(),
});

export const dashboardFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pipeline_stage: pipelineStageSchema.optional(),
  occupation_applied: z.string().trim().min(1).optional(),
  source: sourceSchema.optional(),
  gender: genderSchema.optional(),
  missing_document: z.string().trim().min(1).optional(),
  date_from: z.string().date().optional(),
  date_to: z.string().date().optional(),
  has_passport: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === "true";
    }),
  search: z.string().trim().max(100).optional(),
});

export const updateDocumentStatusSchema = z.object({
  status: documentStatusSchema.optional(),
  remarks: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const updateApplicantPipelineSchema = z.object({
  current_pipeline_stage: pipelineStageSchema.optional(),
  medical_status: z.enum(["pending", "fit", "unfit"]).optional(),
  pdos_completed: z.boolean().optional(),
});

export const assignJobOrderSchema = z.object({
  job_order_id: z.string().uuid().nullable(),
});

export const updateDmwSchema = z.object({
  dmw_registration_number: z.string().trim().max(100).optional().or(z.literal("")),
});

export const updatePeosSchema = z.object({
  peos_modules_completed: z.number().int().min(0).max(8),
  peos_certificate_status: peosCertificateStatusSchema,
});

export const upsertJobOrderSchema = z
  .object({
    id: z.string().optional(),
    job_order_number: z.string().trim().min(1).max(100).optional(),
    accreditation_id: z.string().uuid().optional().or(z.literal("")),
    foreign_partner_id: z.string().uuid().optional().or(z.literal("")),
    class: z.string().optional(),
    date_approved: z.string().date().optional().or(z.literal("")),
    valid_until: z.string().date().optional().or(z.literal("")),
    status_text: z.string().optional(),
    category: z.string().optional().or(z.literal("")),
    reference_number: z.string().optional().or(z.literal("")),
    parent_job_order_id: z.string().uuid().optional().or(z.literal("")),
    positions: z.array(z.object({
      id: z.string().optional(),
      position: z.string().min(1),
      position_code: z.string().optional().or(z.literal("")),
      needed: z.coerce.number().int().min(1),
      salary_amount: z.coerce.number().optional(),
      salary_currency: z.string().optional().or(z.literal("")),
      salary_period: z.string().optional().or(z.literal("")),
      wage_type: z.string().optional().or(z.literal("")),
    })).optional(),
    country: z.string().trim().min(2).max(100).optional(),
    program_name: z.string().trim().min(2).max(100).optional(),
    trade: z.string().trim().min(2).max(120).optional(),
    gender_requirement: genderSchema.optional(),
  })
  .superRefine((value, ctx) => {
    const usesPhase2 = Boolean(
      value.job_order_number || (value.positions && value.positions.length > 0) || value.class || value.valid_until,
    );
    const usesLegacy = Boolean(value.country || value.program_name || value.trade);

    if (usesPhase2) {
      if (!value.job_order_number) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "JO Number is required.", path: ["job_order_number"] });
      }
      if (!value.positions || value.positions.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "At least one position is required.", path: ["positions"] });
      }
      if (!value.class) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Class is required.", path: ["class"] });
      }
      if (!value.valid_until) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Validity date is required.", path: ["valid_until"] });
      }
      return;
    }

    if (usesLegacy) {
      if (!value.country) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Country is required.", path: ["country"] });
      }
      if (!value.program_name) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Program is required.", path: ["program_name"] });
      }
      if (!value.trade) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Trade is required.", path: ["trade"] });
      }
      return;
    }

    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please provide job order details.", path: ["job_order_number"] });
  });

export type ApplicantRegistrationInput = z.infer<typeof applicantRegistrationSchema>;
export type DashboardFilterInput = z.infer<typeof dashboardFilterSchema>;
export type StaffRole = z.infer<typeof staffRoleSchema>;

// ── Phase 2 Schemas ──────────────────────────────────────────

export const upsertProgramSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(120),
  country: z.string().trim().min(2).max(100),
  standard_duration_years: z.number().int().min(1).max(10).nullable().optional(),
});

export const upsertForeignPartnerSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(2).max(200),
  partner_type: z.string().trim().min(1).max(100),
  is_final_employer: z.boolean().default(false),
  parent_partner_id: z.uuid().nullable().optional(),
  program_id: z.uuid().nullable().optional(),
  contact_name: z.string().trim().max(200).nullable().optional(),
  contact_phone: z.string().trim().max(50).nullable().optional(),
  contact_email: z.string().trim().max(320).nullable().optional(),
  contact_address: z.string().trim().max(500).nullable().optional(),
});

export const upsertAccreditationSchema = z.object({
  id: z.uuid().optional(),
  accreditation_id_dmw: z.string().trim().min(1).max(100),
  principal_partner_id: z.uuid(),
  processing_unit: z.string().trim().max(200).nullable().optional(),
  representative: z.string().trim().max(200).nullable().optional(),
  date_issued: z.string().date(),
  date_expiration: z.string().date(),
  status: z.enum(["active", "renewed", "expired_unconfirmed"]).default("active"),
});

export const renewAccreditationSchema = z.object({
  date_issued: z.string().date(),
  date_expiration: z.string().date(),
});

export const upsertJobOrderV2Schema = z.object({
  id: z.string().optional(),
  job_order_number: z.string().trim().min(1).max(100),
  accreditation_id: z.string().uuid(),
  foreign_partner_id: z.string().uuid(),
  class: z.string(),
  date_approved: z.string().date().optional().or(z.literal("")),
  valid_until: z.string().date(),
  status_text: z.string().default("Active"),
  category: z.string().optional().or(z.literal("")),
  reference_number: z.string().optional().or(z.literal("")),
  parent_job_order_id: z.string().uuid().optional().or(z.literal("")),
  positions: z.array(z.object({
    id: z.string().optional(),
    position: z.string().min(1),
    position_code: z.string().optional().or(z.literal("")),
    needed: z.coerce.number().int().min(1),
    salary_amount: z.coerce.number().optional(),
    salary_currency: z.string().optional().or(z.literal("")),
    salary_period: z.string().optional().or(z.literal("")),
    wage_type: z.string().optional().or(z.literal("")),
  })).min(1),
  // Phase 1 legacy fields kept optional
  country: z.string().trim().min(2).max(100).optional(),
  program_name: z.string().trim().min(2).max(100).optional(),
  trade: z.string().trim().min(2).max(120).optional(),
  gender_requirement: genderSchema.nullable().optional(),
});

export const upsertBatchSchema = z.object({
  id: z.uuid().optional(),
  job_order_id: z.string().trim().min(1),
  batch_label: z.string().trim().min(1).max(50),
});

export const upsertDeploymentSchema = z.object({
  id: z.uuid().optional(),
  applicant_id: z.uuid(),
  batch_id: z.uuid(),
  hired_date: z.string().date(),
  entry_date: z.string().date().nullable().optional(),
  deployment_end_date: z.string().date().nullable().optional(),
  document_status: z.enum(["on_process", "dispatched"]).default("on_process"),
  dispatched_date: z.string().date().nullable().optional(),
});

export const updateDeploymentSchema = z.object({
  hired_date: z.string().date().optional(),
  entry_date: z.string().date().nullable().optional(),
  deployment_end_date: z.string().date().nullable().optional(),
  document_status: z.enum(["on_process", "dispatched"]).optional(),
  dispatched_date: z.string().date().nullable().optional(),
  visa_status: z.enum(["pending", "approved", "denied"]).optional(),
  oec_number: z.string().trim().max(50).nullable().optional(),
  flight_airline: z.string().trim().max(100).nullable().optional(),
  flight_number: z.string().trim().max(50).nullable().optional(),
  departure_datetime: z.string().datetime({ offset: true }).nullable().optional().or(z.string().nullable().optional()),
});

export const deploymentSearchSchema = z.object({
  q: z.string().trim().min(1).max(100),
  page: z.coerce.number().int().min(1).default(1),
});

// ── Portal Schemas ───────────────────────────────────────────

const phMobileRegexPortal = /^09\d{9}$/;

/**
 * Applicants can only update their own contact info — never pipeline stage,
 * document status, or any other staff-controlled field.
 */
export const applicantProfileUpdateSchema = z.object({
  cellphone_number: z.string().regex(phMobileRegexPortal, "Use PH mobile format 09XXXXXXXXX").optional(),
  email: z.string().email().max(320).optional().or(z.literal("")),
  home_address: z.string().trim().max(500).optional().or(z.literal("")),
});

/**
 * Allowed MIME types and max file size for applicant document uploads.
 * Matches the Supabase storage bucket config from init.sql.
 */
export const ALLOWED_DOC_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;
export const MAX_DOC_FILE_SIZE = 5 * 1024 * 1024; // 5MB

