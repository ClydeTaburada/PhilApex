import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { applicantRegistrationSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { safeErrorResponse } from "@/lib/api";
import { isSupabaseConfigured } from "@/lib/env";
import { toNullableString } from "@/lib/utils";

const uploadFieldMap = [
  {
    field: "passport_file",
    docName: "Colored Passport Copy w/ Signature",
  },
  {
    field: "tesda_file",
    docName: "TESDA Certificate",
  },
  {
    field: "photo_2x2_file",
    docName: "2x2 ID Photo",
  },
] as const;

function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function getBoolean(value: FormDataEntryValue | null): boolean {
  return typeof value === "string" && value.toLowerCase() === "true";
}

function getString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

function getUploadFile(value: FormDataEntryValue | null): File | null {
  if (!(value instanceof File)) {
    return null;
  }

  if (value.size === 0) {
    return null;
  }

  return value;
}

async function checkRateLimitWithFallback(
  supabaseAdmin: ReturnType<typeof getSupabaseAdminClient>,
  rpcClient: {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  },
  ip: string,
): Promise<{ allowed: boolean; hardError: boolean }> {
  const { data: rateAllowed, error: rateLimitError } = await rpcClient.rpc(
    "check_and_increment_registration_rate_limit",
    {
      p_ip: ip,
      p_max_requests: 10,
      p_window_minutes: 60,
    },
  );

  if (!rateLimitError) {
    return { allowed: rateAllowed === true, hardError: false };
  }

  // Fallback limiter to keep registration available when RPC function is missing/broken.
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const now = new Date();
  const windowMinutes = 60;
  const maxRequests = 10;
  const resetCutoff = new Date(now.getTime() - windowMinutes * 60 * 1000);

  const { data: existingRowData, error: existingRowError } = await supabaseAdmin
    .from("public_registration_rate_limits")
    .select("ip_hash, window_start, request_count")
    .eq("ip_hash", ipHash)
    .maybeSingle();

  if (existingRowError) {
    return { allowed: false, hardError: true };
  }

  const existingRow = existingRowData as
    | {
        ip_hash: string;
        window_start: string;
        request_count: number;
      }
    | null;

  if (!existingRow) {
    const { error: insertError } = await supabaseAdmin.from("public_registration_rate_limits").insert({
      ip_hash: ipHash,
      window_start: now.toISOString(),
      request_count: 1,
    } as never);

    return { allowed: !insertError, hardError: Boolean(insertError) };
  }

  const windowStart = new Date(existingRow.window_start);
  if (windowStart < resetCutoff) {
    const { error: resetError } = await supabaseAdmin
      .from("public_registration_rate_limits")
      .update({
        window_start: now.toISOString(),
        request_count: 1,
      } as never)
      .eq("ip_hash", ipHash);

    return { allowed: !resetError, hardError: Boolean(resetError) };
  }

  if (existingRow.request_count >= maxRequests) {
    return { allowed: false, hardError: false };
  }

  const { error: incrementError } = await supabaseAdmin
    .from("public_registration_rate_limits")
    .update({
      request_count: existingRow.request_count + 1,
    } as never)
    .eq("ip_hash", ipHash);

  return { allowed: !incrementError, hardError: Boolean(incrementError) };
}

function buildFullName(input: {
  first_name: string;
  middle_initial?: string;
  last_name: string;
  name_extension?: string;
}): string {
  const middle = input.middle_initial?.trim();
  const extension = input.name_extension?.trim();

  const parts = [input.first_name.trim()];
  if (middle) {
    parts.push(middle);
  }
  parts.push(input.last_name.trim());
  if (extension) {
    parts.push(extension);
  }

  return parts.join(" ");
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      {
        error: "Server is not configured yet. Please set Supabase environment variables.",
      },
      { status: 503 },
    );
  }

  const supabaseAdmin = getSupabaseAdminClient();
  // Supabase RPC typing requires generated function signatures; use a narrow unknown cast for these two RPC calls.
  const rpcClient = supabaseAdmin as unknown as {
    rpc: (
      fn: string,
      args: Record<string, unknown>,
    ) => Promise<{ data: unknown; error: { message: string } | null }>;
  };
  const uploadedPaths: string[] = [];

  try {
    const formData = await request.formData();
    const ip = getRequestIp(request);

    const rateResult = await checkRateLimitWithFallback(supabaseAdmin, rpcClient, ip);

    if (rateResult.hardError) {
      return NextResponse.json({ error: "Unable to validate request rate" }, { status: 500 });
    }

    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 },
      );
    }

    const registrationInput = {
      first_name: getString(formData.get("first_name")),
      middle_initial: getString(formData.get("middle_initial")),
      last_name: getString(formData.get("last_name")),
      name_extension: getString(formData.get("name_extension")),
      date_of_birth: getString(formData.get("date_of_birth")),
      gender: getString(formData.get("gender")),
      home_address: getString(formData.get("home_address")),
      cellphone_number: getString(formData.get("cellphone_number")),
      email: getString(formData.get("email")),
      educational_attainment: getString(formData.get("educational_attainment")),
      occupation_applied: getString(formData.get("occupation_applied")),
      has_passport: getBoolean(formData.get("has_passport")),
      source: getString(formData.get("source")),
      job_order_id: getString(formData.get("job_order_id")) || undefined,
    };

    const parsed = applicantRegistrationSchema.safeParse(registrationInput);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid registration payload",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const fullName = buildFullName({
      first_name: parsed.data.first_name,
      middle_initial: parsed.data.middle_initial,
      last_name: parsed.data.last_name,
      name_extension: parsed.data.name_extension,
    });

    let occupationApplied = parsed.data.occupation_applied;
    if (parsed.data.job_order_id) {
      const { data: jobOrderData, error: jobOrderError } = await supabaseAdmin
        .from("job_orders")
        .select("id, trade, position, status")
        .eq("id", parsed.data.job_order_id)
        .eq("status", "open")
        .maybeSingle();

      const jobOrder = jobOrderData as { id: string; trade: string | null; position: string | null; status: "open" } | null;

      if (jobOrderError || !jobOrder) {
        return NextResponse.json({ error: "Selected job order is not available" }, { status: 400 });
      }

      occupationApplied = jobOrder.position ?? jobOrder.trade ?? occupationApplied;
    }

    const filePathsByDocName: Record<string, string> = {};

    for (const config of uploadFieldMap) {
      const file = getUploadFile(formData.get(config.field));
      if (!file) {
        continue;
      }

      if (file.size > 2 * 1024 * 1024) {
        return NextResponse.json(
          {
            error: `${config.docName} exceeds maximum allowed size`,
          },
          { status: 400 },
        );
      }

      const contentType = file.type || "application/octet-stream";
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!allowedTypes.includes(contentType)) {
        return NextResponse.json(
          {
            error: `${config.docName} file type is not allowed`,
          },
          { status: 400 },
        );
      }

      const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
      const path = `public/${new Date().getUTCFullYear()}/${randomUUID()}.${ext}`;

      const bytes = await file.arrayBuffer();
      const { error: uploadError } = await supabaseAdmin.storage
        .from("applicant-documents")
        .upload(path, bytes, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          {
            error: `Unable to upload ${config.docName}`,
          },
          { status: 500 },
        );
      }

      uploadedPaths.push(path);
      filePathsByDocName[config.docName] = path;
    }

    const { data: applicantId, error: rpcError } = await rpcClient.rpc(
      "register_applicant_with_documents",
      {
        p_full_name: fullName,
        p_date_of_birth: parsed.data.date_of_birth,
        p_gender: parsed.data.gender,
        p_home_address: toNullableString(parsed.data.home_address),
        p_cellphone_number: parsed.data.cellphone_number,
        p_email: toNullableString(parsed.data.email),
        p_educational_attainment: toNullableString(parsed.data.educational_attainment),
        p_occupation_applied: occupationApplied,
        p_has_passport: parsed.data.has_passport,
        p_source: parsed.data.source,
        p_job_order_id: parsed.data.job_order_id ?? null,
        p_file_paths: filePathsByDocName,
      },
    );

    if (rpcError || typeof applicantId !== "string") {
      if (uploadedPaths.length > 0) {
        await supabaseAdmin.storage.from("applicant-documents").remove(uploadedPaths);
      }

      return NextResponse.json({ error: "Unable to register applicant" }, { status: 500 });
    }

    return NextResponse.json(
      {
        data: {
          reference_id: applicantId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabaseAdmin.storage.from("applicant-documents").remove(uploadedPaths);
    }
    return safeErrorResponse(error);
  }
}
