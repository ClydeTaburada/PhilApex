import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function hasSupabaseEnv() {
	return (
		typeof process.env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
		process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
		typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === "string" &&
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
	);
}

function isCrossSite(request: NextRequest): boolean {
	const origin = request.headers.get("origin");
	if (!origin) {
		return false;
	}

	const host = request.headers.get("host");
	if (!host) {
		return true;
	}

	const expectedOrigin = `${request.nextUrl.protocol}//${host}`;
	return origin !== expectedOrigin;
}

function shouldApplyCsrf(request: NextRequest): boolean {
	return request.nextUrl.pathname.startsWith("/api/staff/") && MUTATING_METHODS.has(request.method);
}

function shouldRefreshStaffSession(pathname: string): boolean {
	return pathname.startsWith("/staff") || pathname.startsWith("/api/staff/");
}

export async function proxy(request: NextRequest) {
	let response = NextResponse.next({
		request: {
			headers: request.headers,
		},
	});

	if (shouldApplyCsrf(request) && isCrossSite(request)) {
		return NextResponse.json(
			{
				error: "CSRF validation failed",
			},
			{ status: 403 },
		);
	}

	if (!shouldRefreshStaffSession(request.nextUrl.pathname) || !hasSupabaseEnv()) {
		return response;
	}

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL as string,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					for (const cookie of cookiesToSet) {
						response.cookies.set(cookie.name, cookie.value, cookie.options);
					}
				},
			},
		},
	);

	await supabase.auth.getUser();

	return response;
}

export const config = {
	matcher: ["/staff/:path*", "/api/staff/:path*"],
};
