import { NextResponse } from "next/server";

/**
 * Dev helper for Google Error 400 redirect_uri_mismatch: shows the exact callback URL
 * this app sends. Add that string to the same OAuth client as AUTH_GOOGLE_ID.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  const raw = process.env.AUTH_URL?.trim() ?? process.env.NEXTAUTH_URL?.trim() ?? null;
  let authUrlMisconfigured: string | null = null;
  let origin: string | null = null;
  if (raw) {
    try {
      const u = new URL(raw);
      origin = u.origin;
      const p = u.pathname.replace(/\/$/, "") || "/";
      if (p !== "/" && p !== "/api/auth") {
        authUrlMisconfigured =
          "AUTH_URL should be only the site origin (e.g. http://localhost:3000), not a path. A long pathname can make NextAuth build the wrong callback URL.";
      }
    } catch {
      authUrlMisconfigured = "AUTH_URL / NEXTAUTH_URL is not a valid URL.";
    }
  }

  const redirectUri = origin ? `${origin}/api/auth/callback/google` : null;

  return NextResponse.json({
    authUrlEnv: raw,
    oauthOriginUsed: origin,
    addExactlyThisToGoogleAuthorizedRedirectUris: redirectUri,
    googleClientIdPrefix: process.env.AUTH_GOOGLE_ID?.slice(0, 12) ?? null,
    authUrlMisconfigured,
    afterClickingContinueWithGoogle:
      "Watch the terminal running `npm run dev` for a line like [auth][debug]: authorization url is ready — open the logged URL and decode redirect_uri=…; Google must list that value exactly.",
    checklist: [
      "Google Cloud → APIs & Services → Credentials → open the Web client whose Client ID matches AUTH_GOOGLE_ID.",
      "Application type must be Web application (not Desktop / iOS / Android).",
      "Authorized redirect URIs must include the URL above (no trailing slash).",
      "If Google’s error page shows a different redirect_uri, add that exact value instead.",
    ],
  });
}
