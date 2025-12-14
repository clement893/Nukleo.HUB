import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des relances pour une facture
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const reminders = await prisma.paymentReminder.findMany({
      where: { invoiceId: id },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Envoyer une nouvelle relance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type = "email", message } = body;

    // Récupérer la facture
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        reminders: {
          orderBy: { level: "desc" },
          take: 1,
        },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    // Vérifier que la facture peut recevoir une relance
    if (invoice.status === "paid" || invoice.status === "cancelled" || invoice.status === "draft") {
      return NextResponse.json(
        { error: "Cette facture ne peut pas recevoir de relance" },
        { status: 400 }
      );
    }

    // Calculer le niveau de relance
    const lastReminder = invoice.reminders[0];
    const newLevel = lastReminder ? lastReminder.level + 1 : 1;

    // Générer le message par défaut selon le niveau
    const defaultMessages: Record<number, string> = {
      1: `Rappel amical : Votre facture ${invoice.invoiceNumber} d'un montant de ${formatCurrency(invoice.amountDue)} est arrivée à échéance. Merci de procéder au règlement dans les meilleurs délais.`,
      2: `Second rappel : Nous n'avons pas encore reçu le paiement de la facture ${invoice.invoiceNumber}. Le montant dû est de ${formatCurrency(invoice.amountDue)}. Merci de régulariser cette situation rapidement.`,
      3: `Dernier rappel avant mise en demeure : La facture ${invoice.invoiceNumber} reste impayée. Sans règlement sous 7 jours, nous serons contraints d'engager des procédures de recouvrement.`,
    };

    const reminderMessage = message || defaultMessages[newLevel] || defaultMessages[3];

    // Créer la relance
    const reminder = await prisma.paymentReminder.create({
      data: {
        invoiceId: id,
        type,
        level: newLevel,
        message: reminderMessage,
        sentAt: new Date(),
      },
    });

    // Mettre à jour le statut de la facture si nécessaire
    if (invoice.status !== "overdue") {
      await prisma.invoice.update({
        where: { id },
        data: { status: "overdue" },
      });
    }

    // TODO: Envoyer l'email de relance si type === "email"
    // await sendReminderEmail(invoice, reminderMessage);

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Error creating reminder:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
  }).format(amount);
}
