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

  const now = new Date();
  const expiry = employee.googleTokenExpiry;
  
  if (expiry && expiry.getTime() > now.getTime() + 5 * 60 * 1000) {
    return employee.googleAccessToken;
  }

  if (!employee.googleRefreshToken || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: employee.googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) return null;

    const tokens = await response.json();
    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);

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

// Créer un événement dans Google Calendar
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, location, startDateTime, endDateTime, allDay } = body;

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 });
    }

    const accessToken = await getValidAccessToken(employee);
    if (!accessToken) {
      return NextResponse.json({ error: "Session Google expirée" }, { status: 401 });
    }

    const calendarId = encodeURIComponent(employee.googleCalendarId || "primary");
    
    // Construire l'événement
    const event: any = {
      summary: title,
      description: description || undefined,
      location: location || undefined,
    };

    if (allDay) {
      // Événement toute la journée
      event.start = { date: startDateTime.split("T")[0] };
      event.end = { date: endDateTime.split("T")[0] };
    } else {
      // Événement avec heure
      event.start = { dateTime: startDateTime, timeZone: "America/Toronto" };
      event.end = { dateTime: endDateTime, timeZone: "America/Toronto" };
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Calendar create error:", errorData);
      return NextResponse.json(
        { error: errorData.error?.message || "Erreur création événement" },
        { status: response.status }
      );
    }

    const createdEvent = await response.json();
    return NextResponse.json({
      success: true,
      event: {
        id: createdEvent.id,
        title: createdEvent.summary,
        htmlLink: createdEvent.htmlLink,
      },
    });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Supprimer un événement de Google Calendar
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json({ error: "eventId requis" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 });
    }

    const accessToken = await getValidAccessToken(employee);
    if (!accessToken) {
      return NextResponse.json({ error: "Session Google expirée" }, { status: 401 });
    }

    const calendarId = encodeURIComponent(employee.googleCalendarId || "primary");

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error?.message || "Erreur suppression" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Mettre à jour un événement dans Google Calendar
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { eventId, title, description, location, startDateTime, endDateTime, allDay } = body;

    if (!eventId) {
      return NextResponse.json({ error: "eventId requis" }, { status: 400 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id },
      select: {
        id: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Employé non trouvé" }, { status: 404 });
    }

    const accessToken = await getValidAccessToken(employee);
    if (!accessToken) {
      return NextResponse.json({ error: "Session Google expirée" }, { status: 401 });
    }

    const calendarId = encodeURIComponent(employee.googleCalendarId || "primary");
    
    const event: any = {};
    if (title !== undefined) event.summary = title;
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;

    if (startDateTime && endDateTime) {
      if (allDay) {
        event.start = { date: startDateTime.split("T")[0] };
        event.end = { date: endDateTime.split("T")[0] };
      } else {
        event.start = { dateTime: startDateTime, timeZone: "America/Toronto" };
        event.end = { dateTime: endDateTime, timeZone: "America/Toronto" };
      }
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error?.message || "Erreur mise à jour" },
        { status: response.status }
      );
    }

    const updatedEvent = await response.json();
    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        title: updatedEvent.summary,
        htmlLink: updatedEvent.htmlLink,
      },
    });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
