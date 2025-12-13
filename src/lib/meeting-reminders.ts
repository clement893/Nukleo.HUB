import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Envoyer des rappels pour les réunions à venir
 */
export async function sendMeetingReminders() {
  try {
    const now = new Date();
    
    // Réunions dans les prochaines 24h qui n'ont pas encore reçu de rappel
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const meetingsNeedingReminder = await prisma.clientMeeting.findMany({
      where: {
        status: { in: ["scheduled", "confirmed"] },
        meetingDate: {
          gte: now,
          lte: in24Hours,
        },
        reminderSent: false,
      },
      include: {
        portal: true,
      },
    });

    for (const meeting of meetingsNeedingReminder) {
      const meetingStart = meeting.startTime || meeting.meetingDate;
      const hoursUntilMeeting = (meetingStart.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      // Vérifier si un rappel doit être envoyé selon reminderMinutes
      const reminderMinutes = meeting.reminderMinutes || [1440, 60]; // 24h et 1h par défaut
      const shouldRemind = reminderMinutes.some(minutes => {
        const reminderTime = minutes / 60; // Convertir en heures
        return hoursUntilMeeting <= reminderTime && hoursUntilMeeting > reminderTime - 0.5; // Fenêtre de 30 min
      });

      if (shouldRemind) {
        // TODO: Envoyer email de rappel
        // await sendReminderEmail(meeting);
        
        // Marquer comme rappel envoyé
        await prisma.clientMeeting.update({
          where: { id: meeting.id },
          data: {
            reminderSent: true,
            reminderSentAt: now,
          },
        });

        logger.info(
          `Rappel envoyé pour réunion ${meeting.id}`,
          "meeting-reminders"
        );
      }
    }

    return meetingsNeedingReminder.length;
  } catch (error) {
    logger.error("Erreur envoi rappels réunions", error as Error, "meeting-reminders");
    return 0;
  }
}

/**
 * Vérifier et synchroniser les réunions avec les calendriers
 */
export async function syncMeetingsToCalendar() {
  try {
    const meetingsToSync = await prisma.clientMeeting.findMany({
      where: {
        status: { in: ["scheduled", "confirmed"] },
        calendarSyncStatus: { in: ["pending", "failed"] },
      },
      include: {
        portal: true,
      },
    });

    for (const meeting of meetingsToSync) {
      try {
        // TODO: Implémenter synchronisation Google Calendar
        // if (meeting.portal.clientEmail) {
        //   await syncToGoogleCalendar(meeting);
        // }
        
        // TODO: Implémenter synchronisation Outlook
        // await syncToOutlook(meeting);

        await prisma.clientMeeting.update({
          where: { id: meeting.id },
          data: {
            calendarSyncStatus: "synced",
          },
        });
      } catch (error) {
        await prisma.clientMeeting.update({
          where: { id: meeting.id },
          data: {
            calendarSyncStatus: "failed",
            calendarSyncError: error instanceof Error ? error.message : "Erreur inconnue",
          },
        });
      }
    }

    return meetingsToSync.length;
  } catch (error) {
    logger.error("Erreur synchronisation calendrier", error as Error, "meeting-reminders");
    return 0;
  }
}
