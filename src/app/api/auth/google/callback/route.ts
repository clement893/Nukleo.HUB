import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { logSecurityEvent, logFailedAuth } from "@/lib/logger";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL 
  ? `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  : "https://nukleohub-production.up.railway.app/api/auth/google/callback";

export async function GET(request: NextRequest) {
  // Rate limiting sur l'authentification
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.auth);
  if (rateLimitError) return rateLimitError;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // employeeId
  const error = searchParams.get("error");
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

  if (error) {
    await logFailedAuth(`google_oauth_${state || "unknown"}`, ipAddress);
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

    // Chiffrer les tokens avant stockage
    const encryptedAccessToken = encrypt(access_token);
    const encryptedRefreshToken = refresh_token ? encrypt(refresh_token) : null;

    // Mettre à jour l'employé avec les tokens chiffrés
    await prisma.employee.update({
      where: { id: state },
      data: {
        googleAccessToken: encryptedAccessToken,
        googleRefreshToken: encryptedRefreshToken,
        googleTokenExpiry: expiryDate,
        googleCalendarId: calendarId,
        googleCalendarSync: true,
      },
    });

    // Logger l'événement de sécurité
    await logSecurityEvent("google_oauth_connected", state, {
      calendarId,
      ipAddress,
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
