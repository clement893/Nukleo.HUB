import { NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// GET - Rediriger vers Google pour l'authentification (login)
export async function GET() {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.redirect("/login?error=config");
  }

  const redirectUri = process.env.NEXT_PUBLIC_APP_URL 
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login/callback`
    : "https://nukleohub-production.up.railway.app/api/auth/login/callback";

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
    state: "login", // Pour distinguer du callback de calendrier
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
