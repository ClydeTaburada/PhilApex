import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback_secret_for_development_do_not_use_in_prod";
const key = new TextEncoder().encode(secretKey);

export type ApplicantSessionPayload = {
  applicant_id: string;
  reference_number: string;
  full_name: string;
};

export async function encryptApplicantSession(payload: ApplicantSessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decryptApplicantSession(input: string): Promise<ApplicantSessionPayload> {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ["HS256"],
  });
  return payload as ApplicantSessionPayload;
}

export async function getApplicantSession(): Promise<ApplicantSessionPayload | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("applicant_session")?.value;
  if (!session) return null;
  try {
    return await decryptApplicantSession(session);
  } catch (error) {
    return null;
  }
}