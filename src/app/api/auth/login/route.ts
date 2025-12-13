import { NextRequest, NextResponse } from "next/server";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logFailedAuth } from "@/lib/logger";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// GET - Rediriger vers Google pour l'authentification (login)
export async function GET(request: NextRequest) {
  // Rate limiting sur l'authentification
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.auth);
  if (rateLimitError) {
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    await logFailedAuth("rate_limit_exceeded", ipAddress);
    return rateLimitError;
  }

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.redirect("/login?error=config");
  }

  const { searchParams } = new URL(request.url);
  const redirectAfterLogin = searchParams.get("redirect") || "/";

  const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login/callback`
    : "https://nukleohub-production.up.railway.app/api/auth/login/callback";

  // Encoder le redirect dans le state pour le récupérer après le callback
  const state = JSON.stringify({ redirect: redirectAfterLogin });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state: Buffer.from(state).toString("base64"),
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
