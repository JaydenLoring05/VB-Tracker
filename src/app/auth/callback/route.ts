import { NextRequest, NextResponse } from "next/server";
import { EmailOtpType } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

const EXPIRED_LINK_MESSAGE =
  "That confirmation link has expired, was already used, or was opened in a different browser than the one you signed up in. Try signing in below, or request a new confirmation email.";

function redirectWithError(origin: string, message: string) {
  return NextResponse.redirect(`${origin}/login?authError=${encodeURIComponent(message)}`);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Failed to exchange confirmation code for a session", error);
      return redirectWithError(origin, EXPIRED_LINK_MESSAGE);
    }
    return NextResponse.redirect(`${origin}/`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("Failed to verify confirmation token", error);
      return redirectWithError(origin, EXPIRED_LINK_MESSAGE);
    }
    return NextResponse.redirect(`${origin}/`);
  }

  return redirectWithError(
    origin,
    "That confirmation link looks incomplete. Try signing in below, or request a new confirmation email."
  );
}
