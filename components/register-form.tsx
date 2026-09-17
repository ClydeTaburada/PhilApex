"use client";

import imageCompression from "browser-image-compression";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { applicantRegistrationSchema, type ApplicantRegistrationInput } from "@/lib/schemas";
import {
  Camera,
  FileText,
  Award,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  X,
  ArrowRight,
} from "lucide-react";

type FileField = "photo_2x2_file" | "passport_file" | "birth_certificate_file";

interface FileConfig {
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}

const FILE_FIELD_CONFIG: Record<FileField, FileConfig> = {
  photo_2x2_file: {
    label: "2×2 ID Photo",
    hint: "Recent passport-size photo, plain background",
    icon: Camera,
  },
  passport_file: {
    label: "Colored Passport Copy",
    hint: "Data page with signature, colored copy",
    icon: FileText,
  },
  birth_certificate_file: {
    label: "Birth Certificate",
    hint: "PSA Authenticated Birth Certificate",
    icon: Award,
  },
};

const EDUCATIONAL_OPTIONS = [
  "High School Graduate",
  "Senior High School Graduate",
  "Vocational / TESDA NC Holder",
  "College Level",
  "College Graduate",
  "Other",
] as const;


async function compressIfImage(file: File): Promise<File> {
  if (!file || !file.type.startsWith("image/")) return file;
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 1400,
      useWebWorker: false, // Prevents dynamic Worker Blob loading crashes in Next.js
      initialQuality: 0.8,
    });
    return compressed;
  } catch (err) {
    console.warn("Client-side image compression skipped, using original file:", err);
    return file;
  }
}

function SectionHeader({ step, label }: { step: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
        style={{ background: "var(--navy)" }}
      >
        {step}
      </div>
      <h2 className="font-bold text-base" style={{ color: "var(--navy)" }}>
        {label}
      </h2>
      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
    </div>
  );
}

export function RegisterForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceId, setReferenceId] = useState<string | null>(null);
  const [fileMap, setFileMap] = useState<Partial<Record<FileField, File>>>({});
  const [fileNames, setFileNames] = useState<Partial<Record<FileField, string>>>({});
  const [compressingField, setCompressingField] = useState<FileField | null>(null);
  const [copied, setCopied] = useState(false);
  const [positionOptions, setPositionOptions] = useState<string[]>([]);
  const [programs, setPrograms] = useState<{ id: string; name: string; description: string; country: string }[]>([]);

  useEffect(() => {
    fetch("/api/public/trades", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPositionOptions(data.map(d => d.name));
        }
      })
      .catch(err => console.error("Failed to load trades", err));

    fetch("/api/public/programs", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setPrograms(data);
        }
      })
      .catch(err => console.error("Failed to load programs", err));
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ApplicantRegistrationInput>({
    resolver: zodResolver(applicantRegistrationSchema),
    defaultValues: {
      has_passport: false,
      source: "walk_in",
      gender: "male",
    },
  });

  const selectedGender = watch("gender");
  const selectedSource = watch("source");
  const noMiddleName = watch("no_middle_name");

  // Effect to clear middle_name if no_middle_name is checked
  useEffect(() => {
    if (noMiddleName) {
      setValue("middle_name", "");
    }
  }, [noMiddleName, setValue]);

  const onFileChange = async (field: FileField, file: File | null) => {
    if (!file) {
      setFileMap((p) => {
        const next = { ...p };
        delete next[field];
        return next;
      });
      setFileNames((p) => {
        const next = { ...p };
        delete next[field];
        return next;
      });
      return;
    }

    // Client-side size guard for non-image files (e.g. PDF) that won't be compressed
    if (!file.type.startsWith("image/") && file.size > 2 * 1024 * 1024) {
      setSubmitError(`${FILE_FIELD_CONFIG[field].label} is too large (max 2 MB for PDFs). Please choose a smaller file.`);
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setSubmitError(`${FILE_FIELD_CONFIG[field].label} is too large (max 15 MB). Please choose a smaller file.`);
      return;
    }

    setSubmitError(null);
    setCompressingField(field);

    try {
      const processedFile = await compressIfImage(file);
      setFileMap((p) => ({ ...p, [field]: processedFile }));
      setFileNames((p) => ({ ...p, [field]: file.name }));
    } catch (err) {
      console.error("Error processing file upload:", err);
      // Safe fallback: still store original file if valid
      setFileMap((p) => ({ ...p, [field]: file }));
      setFileNames((p) => ({ ...p, [field]: file.name }));
    } finally {
      setCompressingField(null);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("first_name", values.first_name);
      formData.set("middle_name", values.middle_name ?? "");
      formData.set("no_middle_name", String(values.no_middle_name));
      formData.set("last_name", values.last_name);
      formData.set("name_extension", values.name_extension ?? "");
      formData.set("date_of_birth", values.date_of_birth);
      formData.set("gender", values.gender);
      formData.set("home_address", values.home_address ?? "");
      formData.set("cellphone_number", values.cellphone_number);
      formData.set("email", values.email ?? "");
      formData.set("educational_attainment", values.educational_attainment ?? "");
      formData.set("occupation_applied", values.occupation_applied);
      formData.set("has_passport", String(values.has_passport));
      formData.set("source", values.source);
      if (values.source === "job_fair" && values.job_fair_city) {
        formData.set("job_fair_city", values.job_fair_city);
      }

      for (const [field, file] of Object.entries(fileMap)) {
        if (file) formData.set(field, file);
      }

      const res = await fetch("/api/public/register", { method: "POST", body: formData });
      const payload = (await res.json()) as {
        error?: string;
        data?: { reference_id: string };
      };

      if (!res.ok || !payload.data?.reference_id) {
        setSubmitError(payload.error ?? "Unable to submit registration. Please try again.");
        return;
      }

      setReferenceId(payload.data.reference_id);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  });

  // ── Success screen ──────────────────────────────────────────────
  if (referenceId) {
    return (
      <div className="card rounded-2xl p-8 text-center max-w-lg mx-auto shadow-sm">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-emerald-50 text-emerald-600"
        >
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold" style={{ color: "var(--ink)" }}>
          Registration Submitted!
        </h2>
        <p className="mt-2 text-sm" style={{ color: "var(--ink-muted)" }}>
          Your application has been received. Please keep your reference ID for follow-up
          with Phil-Apex Placement Agency Inc.
        </p>
        <div
          className="mt-5 rounded-xl p-4 border"
          style={{ background: "var(--navy-faint)", borderColor: "rgba(15,27,76,.15)" }}
        >
          <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "var(--navy)" }}>
            Reference ID
          </p>
          <p className="text-2xl font-bold font-mono tracking-wider" style={{ color: "var(--navy)" }}>
            {referenceId}
          </p>
          {/* UX-3: Copy-to-clipboard button */}
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-3 w-full flex items-center justify-center gap-1.5"
            onClick={() => {
              void navigator.clipboard.writeText(referenceId).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }).catch(() => {
                // Fallback for older mobile browsers
                const el = document.createElement("textarea");
                el.value = referenceId;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Copied Reference ID!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Reference ID</span>
              </>
            )}
          </button>
          <a
            href={`/applicant/login?ref=${encodeURIComponent(referenceId)}`}
            className="btn btn-crimson btn-md mt-2 w-full flex items-center justify-center gap-2 text-decoration-none text-xs font-bold"
          >
            <span>Access Applicant Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--ink-faint)" }}>
          Screenshot or copy this reference ID. You will need it to check your status and submit documents.
        </p>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* No-fee notice */}
      <div className="alert alert-warning flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong>No Placement Fee:</strong> Phil-Apex Placement Agency Inc. does not collect
          placement fees from applicants. Beware of unauthorized fee collectors.
        </div>
      </div>

      {/* ── Section 1: Personal Info ── */}
      <div className="card rounded-xl p-5">
        <SectionHeader step={1} label="Personal Information" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="form-field">
            <label className="form-label" htmlFor="reg-first-name">First Name <span style={{ color: "var(--crimson)" }}>*</span></label>
            <input id="reg-first-name" {...register("first_name")} className="form-input" placeholder="Juan" />
            {errors.first_name && <span className="form-error">{errors.first_name.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label flex items-center justify-between" htmlFor="reg-mi">
              <span>Middle Name</span>
              <label className="flex items-center gap-1 cursor-pointer text-[10px] text-ink-muted">
                <input type="checkbox" {...register("no_middle_name")} className="rounded text-brand-primary" />
                I don't have a middle name
              </label>
            </label>
            <input 
              id="reg-mi" 
              {...register("middle_name")} 
              placeholder={noMiddleName ? "N/A" : "Your full middle name"} 
              className="form-input" 
              disabled={noMiddleName}
              style={{ backgroundColor: noMiddleName ? "var(--surface)" : "var(--white)" }}
            />
            {errors.middle_name && <span className="form-error">{errors.middle_name.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-last-name">Last Name <span style={{ color: "var(--crimson)" }}>*</span></label>
            <input id="reg-last-name" {...register("last_name")} className="form-input" placeholder="Dela Cruz" />
            {errors.last_name && <span className="form-error">{errors.last_name.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-ext">Name Extension <span style={{ color: "var(--ink-faint)", fontWeight: "normal", fontSize: "11px" }}>(leave blank if not applicable)</span></label>
            <input id="reg-ext" {...register("name_extension")} placeholder="Jr., Sr., III" className="form-input" />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-dob">Date of Birth <span style={{ color: "var(--crimson)" }}>*</span></label>
            <input id="reg-dob" type="date" {...register("date_of_birth")} className="form-input" />
            {errors.date_of_birth && <span className="form-error">{errors.date_of_birth.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-gender">Gender <span style={{ color: "var(--crimson)" }}>*</span></label>
            <select id="reg-gender" {...register("gender")} className="form-select">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Section 2: Contact ── */}
      <div className="card rounded-xl p-5">
        <SectionHeader step={2} label="Contact & Background" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="form-field">
            <label className="form-label" htmlFor="reg-phone">Cellphone Number <span style={{ color: "var(--crimson)" }}>*</span></label>
            <input id="reg-phone" {...register("cellphone_number")} placeholder="09XXXXXXXXX" className="form-input" />
            {errors.cellphone_number && <span className="form-error">{errors.cellphone_number.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-email">Email Address</label>
            <input id="reg-email" type="email" {...register("email")} placeholder="juan@email.com" className="form-input" />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-field sm:col-span-2">
            <label className="form-label" htmlFor="reg-address">Home Address</label>
            <input id="reg-address" {...register("home_address")} className="form-input" placeholder="Street, Barangay, City, Province" />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-edu">Educational Attainment</label>
            <select id="reg-edu" {...register("educational_attainment")} defaultValue="" className="form-select">
              <option value="">Select education level</option>
              {EDUCATIONAL_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-source">How did you find us? <span style={{ color: "var(--crimson)" }}>*</span></label>
            <select id="reg-source" {...register("source")} className="form-select">
              <option value="walk_in">Walk-in</option>
              <option value="job_fair">Job Fair</option>
              <option value="lgu_peso">LGU/PESO</option>
            </select>
          </div>

          {selectedSource === "job_fair" && (
            <div className="form-field animate-fade-in sm:col-span-2">
              <label className="form-label" htmlFor="reg-job-fair-city">Job Fair City <span style={{ color: "var(--crimson)" }}>*</span></label>
              <input id="reg-job-fair-city" {...register("job_fair_city")} placeholder="City where the job fair was held" className="form-input" />
              {errors.job_fair_city && <span className="form-error">{errors.job_fair_city.message}</span>}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 3: Position ── */}
      <div className="card rounded-xl p-5">
        <SectionHeader step={3} label="Position & Application" />
        
        {programs.length > 0 && (
          <div className="mb-6 p-4 rounded-xl border bg-slate-50">
            <h3 className="font-bold text-sm mb-3">Available Programs</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {programs.map(p => (
                <div key={p.id} className="bg-white p-3 rounded border shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm">{p.name}</span>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-ink-muted">{p.country}</span>
                  </div>
                  {p.description && <span className="text-xs text-ink-muted mt-1 leading-relaxed">{p.description}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="form-field">
            <label className="form-label" htmlFor="reg-position">Preferred Trade / Position <span style={{ color: "var(--crimson)" }}>*</span></label>
            {positionOptions.length > 0 ? (
              <select id="reg-position" {...register("occupation_applied")} defaultValue="" className="form-select">
                <option value="">Select preferred position</option>
                {positionOptions.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input
                id="reg-position"
                type="text"
                {...register("occupation_applied")}
                placeholder="Enter preferred position (e.g. Caregiver, Welder...)"
                className="form-input"
              />
            )}
            {errors.occupation_applied && <span className="form-error">{errors.occupation_applied.message}</span>}
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="reg-passport">Has Passport?</label>
            <select
              id="reg-passport"
              onChange={(e) => setValue("has_passport", e.target.value === "true")}
              defaultValue="false"
              className="form-select"
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>

        </div>

        {/* Qualifications notice */}
        <div className="alert alert-success mt-4 text-sm">
          <p className="font-semibold mb-1">Qualifications for all positions</p>
          <ul className="list-disc pl-5 space-y-0.5">
            <li>At least a high school graduate with a TESDA National Certificate related to the position</li>
            <li>Must have at least one year of work experience related to the industry</li>
          </ul>
        </div>
      </div>

      {/* ── Section 4: Documents ── */}
      <div className="card rounded-xl p-5">
        <SectionHeader step={4} label="Upload Documents" />
        <p className="text-xs mb-4" style={{ color: "var(--ink-muted)" }}>
          Images are automatically optimized client-side to under 500 KB. Accepted: JPG, PNG, PDF.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(FILE_FIELD_CONFIG) as FileField[]).map((field) => {
            const config = FILE_FIELD_CONFIG[field];
            const Icon = config.icon;
            const hasFile = Boolean(fileNames[field]);
            const isProcessing = compressingField === field;

            return (
              <div key={field} className="relative">
                <input
                  id={`file-${field}`}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="sr-only"
                  disabled={isProcessing}
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0] ?? null;
                    void onFileChange(field, file);
                    e.currentTarget.value = "";
                  }}
                />
                <label
                  htmlFor={`file-${field}`}
                  className={`block rounded-xl border-2 border-dashed p-4 transition-all duration-150 cursor-pointer select-none text-left ${
                    isProcessing ? "opacity-70 pointer-events-none" : "hover:border-slate-400"
                  }`}
                  style={{
                    borderColor: hasFile ? "#10b981" : "var(--border)",
                    background: hasFile ? "#f0fdf4" : "var(--surface)",
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        hasFile ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin text-slate-600" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    {hasFile && !isProcessing && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selected
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold" style={{ color: hasFile ? "#065f46" : "var(--ink)" }}>
                    {config.label}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--ink-muted)" }} title={fileNames[field] || config.hint}>
                    {isProcessing
                      ? "Optimizing file…"
                      : hasFile
                      ? fileNames[field]
                      : config.hint}
                  </p>
                </label>
                {hasFile && !isProcessing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void onFileChange(field, null);
                    }}
                    className="mt-1.5 text-[11px] text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors px-1"
                  >
                    <X className="w-3 h-3" />
                    <span>Remove file</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {submitError ? (
        <div className="alert alert-error" role="alert">
          {submitError}
        </div>
      ) : null}

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          id="register-submit"
          type="submit"
          disabled={isSubmitting}
          className="btn btn-crimson btn-lg"
        >
          {isSubmitting ? (
            <>
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(255,255,255,.4)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  animation: "spin .6s linear infinite",
                }}
              />
              Submitting…
            </>
          ) : (
            "Submit Registration →"
          )}
        </button>
        <p className="text-xs" style={{ color: "var(--ink-faint)" }}>
          By submitting, you confirm all information is accurate.
        </p>
      </div>

    </form>
  );
}
