import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Construire REDIRECT_URI depuis les variables d'environnement uniquement
function getRedirectUri(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is required");
  }
  return `${baseUrl}/api/auth/google/callback`;
}

const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");

  if (!employeeId) {
    return NextResponse.json(
      { error: "employeeId requis" },
      { status: 400 }
    );
  }

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID non configuré" },
      { status: 500 }
    );
  }

  // Créer l'URL d'autorisation Google
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", getRedirectUri());
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", employeeId); // Passer l'employeeId dans le state

  return NextResponse.redirect(authUrl.toString());
}
