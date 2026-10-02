import { NextRequest, NextResponse } from "next/server";
import { EmailOtpType } from "@supabase/supabase-js";

import { nameFromOAuthMetadata, oauthErrorMessage } from "@/lib/googleAuth";
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

  // Google (or another OAuth provider) sent the user back with an error
  // instead of a code, for example after they cancelled.
  const providerError = oauthErrorMessage(searchParams);
  if (providerError) return redirectWithError(origin, providerError);

  const supabase = await createClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("Failed to exchange confirmation code for a session", error);
      return redirectWithError(origin, EXPIRED_LINK_MESSAGE);
    }

    // Google sign-ups skip the name field on /login. Use the name from their
    // Google account unless the profile already has one. Best effort: runs as
    // the user, so RLS's "own profile" policy applies.
    const googleName = nameFromOAuthMetadata(data.user?.user_metadata);
    if (data.user && googleName) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", data.user.id)
        .maybeSingle();
      if (!profile?.display_name?.trim()) {
        const { error: nameError } = await supabase
          .from("profiles")
          .upsert({ user_id: data.user.id, display_name: googleName }, { onConflict: "user_id" });
        if (nameError) console.error("Failed to save the Google account name", nameError);
      }
    }

    return NextResponse.redirect(`${origin}/`);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) {
      console.error("Failed to verify confirmation token", error);
      return redirectWithError(origin, EXPIRED_LINK_MESSAGE);
    }
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/auth/reset-password`);
    }
    return NextResponse.redirect(`${origin}/`);
  }

  return redirectWithError(
    origin,
    "That confirmation link looks incomplete. Try signing in below, or request a new confirmation email."
  );
}
