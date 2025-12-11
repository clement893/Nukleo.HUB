import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    if (!employee.googleCalendarId || !employee.googleCalendarSync) {
      return NextResponse.json({
        events: [],
        message: "Calendrier Google non configuré",
        configured: false,
      });
    }

    // Utiliser l'API publique Google Calendar (pour les calendriers publics)
    // ou l'API avec clé API pour les calendriers partagés
    const calendarId = encodeURIComponent(employee.googleCalendarId);
    const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        events: [],
        message: "Clé API Google Calendar non configurée",
        configured: false,
      });
    }

    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(calendarUrl);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Calendar API error:", errorData);
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

// Configurer le calendrier Google d'un employé
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { googleCalendarId, googleCalendarSync } = body;

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        googleCalendarId: googleCalendarId !== undefined ? googleCalendarId : undefined,
        googleCalendarSync: googleCalendarSync !== undefined ? googleCalendarSync : undefined,
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
