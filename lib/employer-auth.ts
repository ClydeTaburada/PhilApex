import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Use a secure key, fallback for development only
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET_KEY || "phil-apex-super-secret-jwt-key-for-employers"
);

export type EmployerSessionPayload = {
  partner_id: string;
  partner_name: string;
};

const COOKIE_NAME = "phil_apex_employer_token";

export async function createEmployerSession(payload: EmployerSessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function getEmployerSession(): Promise<EmployerSessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as EmployerSessionPayload;
  } catch (err) {
    return null;
  }
}

export async function clearEmployerSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Middleware helper
export async function updateEmployerSession(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return;

  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    const res = NextResponse.next();
    res.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return res;
  } catch {
    return;
  }
}
