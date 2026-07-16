"use client";

import imageCompression from "browser-image-compression";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { applicantRegistrationSchema, type ApplicantRegistrationInput } from "@/lib/schemas";

type FileField = "photo_2x2_file" | "passport_file" | "tesda_file";

const FILE_FIELD_CONFIG: Record<FileField, { label: string; hint: string; icon: string }> = {
  photo_2x2_file: {
    label: "2×2 ID Photo",
    hint: "Recent passport-size photo, plain background",
    icon: "🖼️",
  },
  passport_file: {
    label: "Colored Passport Copy",
    hint: "Data page with signature, colored copy",
    icon: "📘",
  },
  tesda_file: {
    label: "TESDA Certificate",
    hint: "NC I / NC II related to position applied",
    icon: "📜",
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
  if (!file.type.startsWith("image/")) return file;
  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1400,
    useWebWorker: true,
    initialQuality: 0.8,
  });
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
  const [positionOptions, setPositionOptions] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/public/trades")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPositionOptions(data.map(d => d.name));
        }
      })
      .catch(err => console.error("Failed to load trades", err));
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

  const onFileChange = async (field: FileField, file: File | null) => {
    if (!file) {
      setFileMap((p) => ({ ...p, [field]: undefined }));
      setFileNames((p) => ({ ...p, [field]: undefined }));
      return;
    }
    // UX-1: Client-side size guard for non-image files (e.g. PDF) that won't be compressed
    if (!file.type.startsWith("image/") && file.size > 2 * 1024 * 1024) {
      setSubmitError(`${FILE_FIELD_CONFIG[field].label} is too large (max 2 MB). Please reduce the file size and try again.`);
      return;
    }
    setSubmitError(null);
    const compressed = await compressIfImage(file);
    setFileMap((p) => ({ ...p, [field]: compressed }));
    setFileNames((p) => ({ ...p, [field]: file.name }));
  };

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("first_name", values.first_name);
      formData.set("middle_initial", values.middle_initial ?? "");
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
      <div className="card rounded-2xl p-8 text-center max-w-lg mx-auto">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ background: "var(--green-lt)" }}
        >
          ✅
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
            className="btn btn-ghost btn-sm mt-3 w-full"
            onClick={() => {
              void navigator.clipboard.writeText(referenceId).catch(() => {
                // Fallback for older mobile browsers
                const el = document.createElement("textarea");
                el.value = referenceId;
                document.body.appendChild(el);
                el.select();
                document.execCommand("copy");
                document.body.removeChild(el);
              });
            }}
          >
            📋 Copy Reference ID
          </button>
        </div>
        <p className="mt-4 text-xs" style={{ color: "var(--ink-faint)" }}>
          Screenshot or write down this reference ID. You may need it to check your application status.
        </p>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* No-fee notice */}
      <div className="alert alert-warning">
        <strong>⚠ No Placement Fee:</strong> Phil-Apex Placement Agency Inc. does not collect
        placement fees from applicants. Beware of unauthorized fee collectors.
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
            <label className="form-label" htmlFor="reg-mi">Middle Name</label>
            <input id="reg-mi" {...register("middle_initial")} placeholder="Your middle name" className="form-input" />
            {errors.middle_initial && <span className="form-error">{errors.middle_initial.message}</span>}
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
        </div>
      </div>

      {/* ── Section 3: Position ── */}
      <div className="card rounded-xl p-5">
        <SectionHeader step={3} label="Position & Application" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="form-field">
            <label className="form-label" htmlFor="reg-position">Preferred Trade / Position <span style={{ color: "var(--crimson)" }}>*</span></label>
            <select id="reg-position" {...register("occupation_applied")} defaultValue="" className="form-select">
              <option value="">Select preferred position</option>
              {positionOptions.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
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
          Images are automatically compressed client-side to under 500 KB. Accepted: JPG, PNG, PDF.
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(FILE_FIELD_CONFIG) as FileField[]).map((field) => {
            const config = FILE_FIELD_CONFIG[field];
            const hasFile = Boolean(fileNames[field]);
            return (
              <label
                key={field}
                htmlFor={`file-${field}`}
                className="block cursor-pointer"
              >
                <div
                  className="rounded-xl border-2 border-dashed p-4 transition-colors duration-150 hover:border-opacity-80"
                  style={{
                    borderColor: hasFile ? "var(--green)" : "var(--border)",
                    background: hasFile ? "var(--green-lt)" : "var(--surface)",
                  }}
                >
                  <div className="text-2xl mb-2">{config.icon}</div>
                  <p className="text-xs font-semibold" style={{ color: hasFile ? "#166534" : "var(--ink)" }}>
                    {config.label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--ink-muted)" }}>
                    {hasFile ? `✓ ${fileNames[field]}` : config.hint}
                  </p>
                </div>
                <input
                  id={`file-${field}`}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0] ?? null;
                    void onFileChange(field, file);
                  }}
                />
              </label>
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
