import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : "https://nukleohub-production.up.railway.app/api/auth/google/callback";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // employeeId
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app"}/teams/employees/${state}?google_error=${error}`
    );
  }

  if (!code || !state) {
    return NextResponse.json(
      { error: "Code ou state manquant" },
      { status: 400 }
    );
  }

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Configuration Google OAuth manquante" },
      { status: 500 }
    );
  }

  try {
    // Échanger le code contre des tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app"}/teams/employees/${state}?google_error=token_exchange_failed`
      );
    }

    const tokens = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Récupérer l'email du calendrier principal
    const calendarResponse = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    let calendarId = "primary";
    if (calendarResponse.ok) {
      const calendarData = await calendarResponse.json();
      calendarId = calendarData.id || "primary";
    }

    // Calculer la date d'expiration
    const expiryDate = new Date(Date.now() + expires_in * 1000);

    // Mettre à jour l'employé avec les tokens
    await prisma.employee.update({
      where: { id: state },
      data: {
        googleAccessToken: access_token,
        googleRefreshToken: refresh_token,
        googleTokenExpiry: expiryDate,
        googleCalendarId: calendarId,
        googleCalendarSync: true,
      },
    });

    // Rediriger vers la page de l'employé avec succès
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app"}/teams/employees/${state}?google_connected=true`
    );
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app"}/teams/employees/${state}?google_error=server_error`
    );
  }
}
