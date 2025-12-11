import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Fonction pour rafraîchir le token si nécessaire
async function getValidAccessToken(employee: {
  id: string;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: Date | null;
}): Promise<string | null> {
  if (!employee.googleAccessToken) return null;

  // Vérifier si le token est encore valide (avec 5 min de marge)
  const now = new Date();
  const expiry = employee.googleTokenExpiry;
  
  if (expiry && expiry.getTime() > now.getTime() + 5 * 60 * 1000) {
    return employee.googleAccessToken;
  }

  // Token expiré, essayer de le rafraîchir
  if (!employee.googleRefreshToken || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: employee.googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) {
      console.error("Token refresh failed");
      return null;
    }

    const tokens = await response.json();
    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Mettre à jour le token dans la base de données
    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: newExpiry,
      },
    });

    return tokens.access_token;
  } catch (error) {
    console.error("Error refreshing token:", error);
    return null;
  }
}

// Récupérer les événements du calendrier Google d'un employé
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get("timeMin") || new Date().toISOString();
    const timeMax = searchParams.get("timeMax") || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        googleCalendarId: true,
        googleCalendarSync: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si OAuth est configuré
    const hasOAuth = employee.googleAccessToken && employee.googleRefreshToken;
    
    if (!hasOAuth) {
      return NextResponse.json({
        events: [],
        message: "Calendrier Google non connecté",
        configured: false,
        needsAuth: true,
      });
    }

    // Obtenir un token valide
    const accessToken = await getValidAccessToken(employee);
    
    if (!accessToken) {
      return NextResponse.json({
        events: [],
        message: "Session Google expirée, veuillez vous reconnecter",
        configured: false,
        needsAuth: true,
      });
    }

    // Récupérer les événements avec OAuth
    const calendarId = encodeURIComponent(employee.googleCalendarId || "primary");
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=50`;

    const response = await fetch(calendarUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Calendar API error:", errorData);
      
      // Si erreur d'authentification, indiquer qu'il faut se reconnecter
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          events: [],
          message: "Session Google expirée, veuillez vous reconnecter",
          configured: false,
          needsAuth: true,
        });
      }
      
      return NextResponse.json({
        events: [],
        message: "Erreur lors de la récupération du calendrier",
        error: errorData.error?.message || "Erreur inconnue",
        configured: true,
      });
    }

    const data = await response.json();

    const events = (data.items || []).map((item: any) => ({
      id: item.id,
      title: item.summary || "Sans titre",
      description: item.description || null,
      location: item.location || null,
      start: item.start?.dateTime || item.start?.date,
      end: item.end?.dateTime || item.end?.date,
      allDay: !item.start?.dateTime,
      status: item.status,
      htmlLink: item.htmlLink,
      source: "google",
    }));

    return NextResponse.json({
      events,
      configured: true,
      calendarId: employee.googleCalendarId,
    });
  } catch (error) {
    console.error("Error fetching calendar:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Configurer le calendrier Google d'un employé (pour changer le calendrier sélectionné)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { googleCalendarId } = body;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        googleCalendarId: googleCalendarId !== undefined ? googleCalendarId : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      googleCalendarId: employee.googleCalendarId,
      googleCalendarSync: employee.googleCalendarSync,
    });
  } catch (error) {
    console.error("Error updating calendar config:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
