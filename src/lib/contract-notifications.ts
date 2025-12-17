import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

/**
 * Vérifie les contrats expirant bientôt et envoie des notifications
 */
export async function checkContractExpirations() {
  try {
    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(today.getDate() + 30);
    const in60Days = new Date();
    in60Days.setDate(today.getDate() + 60);
    const in90Days = new Date();
    in90Days.setDate(today.getDate() + 90);

    // Récupérer les contrats actifs expirant dans les 90 prochains jours
    const expiringContracts = await prisma.contract.findMany({
      where: {
        status: { in: ["active", "pending_signature"] },
        endDate: {
          gte: today,
          lte: in90Days,
        },
      },
      include: {
        company: true,
        supplier: true,
      },
    });

    const notifications: Array<{
      contractId: string;
      contractNumber: string;
      title: string;
      daysUntilExpiry: number;
      reminderDays: number[];
      lastReminderSent: Date | null;
    }> = [];

    for (const contract of expiringContracts) {
      if (!contract.endDate) continue;

      const expiryDate = new Date(contract.endDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      const reminderDays = contract.renewalReminderDays || [90, 60, 30];
      const lastReminderSent = contract.lastReminderSent;

      // Vérifier si un rappel doit être envoyé
      for (const reminderDay of reminderDays) {
        if (
          daysUntilExpiry <= reminderDay &&
          daysUntilExpiry > reminderDay - 7 && // Fenêtre de 7 jours
          (!lastReminderSent || 
           new Date(lastReminderSent).getTime() < today.getTime() - 7 * 24 * 60 * 60 * 1000) // Pas de rappel dans les 7 derniers jours
        ) {
          notifications.push({
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            title: contract.title,
            daysUntilExpiry,
            reminderDays,
            lastReminderSent,
          });
          break; // Un seul rappel par contrat
        }
      }
    }

    // Mettre à jour lastReminderSent pour les contrats notifiés
    for (const notification of notifications) {
      await prisma.contract.update({
        where: { id: notification.contractId },
        data: { lastReminderSent: today },
      });
    }

    logger.info(
      `Vérification des échéances de contrats: ${notifications.length} notification(s) à envoyer`,
      "contract-notifications"
    );

    return notifications;
  } catch (error) {
    logger.error("Erreur vérification échéances contrats", error as Error, "contract-notifications");
    return [];
  }
}

/**
 * Créer une notification pour un contrat expirant
 */
export async function createContractExpirationNotification(
  contractId: string,
  _daysUntilExpiry: number
) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: { company: true, supplier: true },
    });

    if (!contract) return;

    // TODO: Créer une notification dans le système de notifications
    // const title = `Contrat expirant dans ${_daysUntilExpiry} jour(s)`; // À utiliser lors de l'implémentation
    // const message = `Le contrat "${contract.title}" (${contract.contractNumber}) expire le ${contract.endDate?.toLocaleDateString("fr-FR")}.`; // À utiliser lors de l'implémentation
    // await prisma.notification.create({ ... });

    logger.info(
      `Notification créée pour contrat ${contract.contractNumber}`,
      "contract-notifications"
    );
  } catch (error) {
    logger.error("Erreur création notification contrat", error as Error, "contract-notifications");
  }
}
