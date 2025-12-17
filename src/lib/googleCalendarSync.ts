import { prisma } from "@/lib/prisma";
import { decrypt, isEncrypted } from "@/lib/encryption";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

interface Employee {
  id: string;
  googleCalendarId: string | null;
  googleAccessToken: string | null;
  googleRefreshToken: string | null;
  googleTokenExpiry: Date | null;
}

// Obtenir un token valide (avec refresh si nécessaire)
async function getValidAccessToken(employee: Employee): Promise<string | null> {
  if (!employee.googleAccessToken) return null;

  // Déchiffrer le token si nécessaire
  let accessToken: string;
  if (isEncrypted(employee.googleAccessToken)) {
    try {
      accessToken = decrypt(employee.googleAccessToken);
    } catch (error) {
      console.error("Error decrypting access token:", error);
      return null;
    }
  } else {
    // Migration: si le token n'est pas chiffré, le déchiffrer et le mettre à jour
    accessToken = employee.googleAccessToken;
  }

  const now = new Date();
  const expiry = employee.googleTokenExpiry;
  
  if (expiry && expiry.getTime() > now.getTime() + 5 * 60 * 1000) {
    return accessToken;
  }

  if (!employee.googleRefreshToken || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
    return null;
  }

  try {
    // Déchiffrer le refresh token si nécessaire
    let refreshToken: string;
    if (isEncrypted(employee.googleRefreshToken)) {
      try {
        refreshToken = decrypt(employee.googleRefreshToken);
      } catch (error) {
        console.error("Error decrypting refresh token:", error);
        return null;
      }
    } else {
      refreshToken = employee.googleRefreshToken;
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!response.ok) return null;

    const tokens = await response.json();
    const newExpiry = new Date(Date.now() + tokens.expires_in * 1000);

    // Chiffrer le nouveau token avant stockage
    const { encrypt } = await import("@/lib/encryption");
    const encryptedAccessToken = encrypt(tokens.access_token);

    await prisma.employee.update({
      where: { id: employee.id },
      data: {
        googleAccessToken: encryptedAccessToken,
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
export async function createGoogleCalendarEvent(
  employeeId: string,
  event: {
    title: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    allDay?: boolean;
  }
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  try {
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        googleCalendarId: true,
        googleAccessToken: true,
        googleRefreshToken: true,
        googleTokenExpiry: true,
      },
    });

    if (!employee || !employee.googleAccessToken) {
      return { success: false, error: "Google Calendar non connecté" };
    }

    const accessToken = await getValidAccessToken(employee);
    if (!accessToken) {
      return { success: false, error: "Session Google expirée" };
    }

    const calendarId = encodeURIComponent(employee.googleCalendarId || "primary");
    
    const googleEvent: any = {
      summary: event.title,
      description: event.description || undefined,
    };

    if (event.allDay) {
      googleEvent.start = { date: event.startDateTime.split("T")[0] };
      googleEvent.end = { date: event.endDateTime.split("T")[0] };
    } else {
      googleEvent.start = { dateTime: event.startDateTime, timeZone: "America/Toronto" };
      googleEvent.end = { dateTime: event.endDateTime, timeZone: "America/Toronto" };
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.error?.message || "Erreur création" };
    }

    const createdEvent = await response.json();
    return { success: true, eventId: createdEvent.id };
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return { success: false, error: "Erreur serveur" };
  }
}

// Synchroniser une tâche vers Google Calendar
export async function syncTaskToGoogleCalendar(
  taskId: string,
  action: "create" | "update" | "delete"
): Promise<{ success: boolean; error?: string }> {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignedEmployee: {
          select: {
            id: true,
            googleCalendarId: true,
            googleAccessToken: true,
            googleRefreshToken: true,
            googleTokenExpiry: true,
            googleCalendarSync: true,
          },
        },
        project: {
          select: { name: true },
        },
      },
    });

    if (!task || !task.assignedEmployee) {
      return { success: false, error: "Tâche ou employé non trouvé" };
    }

    if (!task.assignedEmployee.googleCalendarSync || !task.assignedEmployee.googleAccessToken) {
      return { success: true }; // Pas de sync configurée, on ignore silencieusement
    }

    const employee = task.assignedEmployee;
    const accessToken = await getValidAccessToken(employee);
    if (!accessToken) {
      return { success: false, error: "Session Google expirée" };
    }

    const calendarId = encodeURIComponent(employee.googleCalendarId || "primary");

    if (action === "delete" && task.googleEventId) {
      // Supprimer l'événement
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${task.googleEventId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      
      await prisma.task.update({
        where: { id: taskId },
        data: { googleEventId: null },
      });
      
      return { success: true };
    }

    // Créer ou mettre à jour l'événement
    const dueDate = task.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const eventData = {
      summary: `[Tâche] ${task.title}`,
      description: `${task.description || ""}\n\nProjet: ${task.project?.name || "N/A"}\nPriorité: ${task.priority || "Normal"}\nStatut: ${task.status}`,
      start: { date: dueDate.toISOString().split("T")[0] },
      end: { date: dueDate.toISOString().split("T")[0] },
    };

    if (action === "update" && task.googleEventId) {
      // Mettre à jour
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${task.googleEventId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        }
      );

      if (!response.ok) {
        // Si l'événement n'existe plus, le recréer
        const createResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(eventData),
          }
        );

        if (createResponse.ok) {
          const createdEvent = await createResponse.json();
          await prisma.task.update({
            where: { id: taskId },
            data: { googleEventId: createdEvent.id },
          });
        }
      }
    } else {
      // Créer
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        }
      );

      if (response.ok) {
        const createdEvent = await response.json();
        await prisma.task.update({
          where: { id: taskId },
          data: { googleEventId: createdEvent.id },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing task to Google Calendar:", error);
    return { success: false, error: "Erreur serveur" };
  }
}

// Synchroniser un milestone vers Google Calendar
export async function syncMilestoneToGoogleCalendar(
  milestoneId: string,
  employeeIds: string[],
  _action: "create" | "update" | "delete"
): Promise<{ success: boolean; error?: string }> {
  try {
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        project: {
          select: { name: true },
        },
      },
    });

    if (!milestone) {
      return { success: false, error: "Milestone non trouvé" };
    }

    // Synchroniser pour chaque employé concerné
    for (const employeeId of employeeIds) {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          googleCalendarId: true,
          googleAccessToken: true,
          googleRefreshToken: true,
          googleTokenExpiry: true,
          googleCalendarSync: true,
        },
      });

      if (!employee || !employee.googleCalendarSync || !employee.googleAccessToken) {
        continue;
      }

      const accessToken = await getValidAccessToken(employee);
      if (!accessToken) continue;

      const calendarId = encodeURIComponent(employee.googleCalendarId || "primary");
      const dueDate = milestone.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const eventData = {
        summary: `[Milestone] ${milestone.title}`,
        description: `${milestone.description || ""}\n\nProjet: ${milestone.project?.name || "N/A"}\nStatut: ${milestone.status}`,
        start: { date: dueDate.toISOString().split("T")[0] },
        end: { date: dueDate.toISOString().split("T")[0] },
        colorId: "11", // Rouge pour les milestones importants
      };

      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        }
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing milestone to Google Calendar:", error);
    return { success: false, error: "Erreur serveur" };
  }
}
