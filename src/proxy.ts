import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { isDeadSessionError } from "@/lib/authErrors";

// Signed-in users are sent to the dashboard from these (marketing + sign-in).
const AUTH_PAGES = ["/", "/login"];
// Reachable without a session, and never bounced for a signed-in user: legal
// pages, and the email-link callback (a signed-in user opening a password reset
// or confirmation link must still be able to finish it).
const ALWAYS_PUBLIC = ["/privacy", "/terms", "/auth/callback"];

function clearSupabaseCookies(request: NextRequest, response: NextResponse) {
  request.cookies
    .getAll()
    .filter(({ name }) => name.startsWith("sb-"))
    .forEach(({ name }) => response.cookies.set(name, "", { path: "/", maxAge: 0 }));
}

function redirectTo(
  request: NextRequest,
  pathname: string,
  from: NextResponse,
  { clearSession = false }: { clearSession?: boolean } = {}
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);

  // Carry over any cookies the Supabase client refreshed during this request.
  // Dropping them would strand the rotated refresh token and cause
  // "Invalid Refresh Token: Already Used" on the very next request.
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));

  if (clearSession) clearSupabaseCookies(request, redirect);
  return redirect;
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  let user: User | null = null;
  let deadSession = false;

  try {
    const { data, error } = await supabase.auth.getUser();
    user = data.user;
    deadSession = isDeadSessionError(error);
  } catch (error) {
    // A transient failure talking to Supabase must not crash every page;
    // treat it as signed out but leave the cookies alone so the session
    // recovers on the next request.
    console.error("Session check failed in proxy", error);
  }

  const pathname = request.nextUrl.pathname;
  const isAuthPage = AUTH_PAGES.includes(pathname);
  const isPublic = isAuthPage || ALWAYS_PUBLIC.includes(pathname);

  if (!user && !isPublic) {
    return redirectTo(request, "/login", response, { clearSession: deadSession });
  }

  if (user && isAuthPage) {
    return redirectTo(request, "/dashboard", response);
  }

  // Signed out on a public page with a dead session: drop the stale cookies so
  // the browser stops retrying a refresh token that can never work again.
  if (!user && deadSession) {
    clearSupabaseCookies(request, response);
  }

  return response;
}

export const config = {
  // Skip Next internals and static/metadata files (robots.txt, sitemap.xml,
  // icons, images). Without this they were redirected to /login for signed-out
  // visitors, which broke robots.txt and any public asset.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|js|map)$).*)"
  ]
};
