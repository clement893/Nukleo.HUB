import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";

// GET - Rediriger vers Google pour l'authentification
export async function GET(request: NextRequest) {
  // Rate limiting sur l'authentification
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.auth);
  if (rateLimitError) return rateLimitError;

  try {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google auth:", error);
    return NextResponse.redirect("/login?error=config");
  }
}
