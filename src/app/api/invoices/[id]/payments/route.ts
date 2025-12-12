import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// POST - Enregistrer un paiement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, paymentDate, paymentMethod, reference, notes } = body;

    // Vérifier que la facture existe
    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      );
    }

    // Vérifier que le montant ne dépasse pas le montant dû
    if (amount > invoice.amountDue) {
      return NextResponse.json(
        { error: "Le montant du paiement dépasse le montant dû" },
        { status: 400 }
      );
    }

    // Créer le paiement
    const payment = await prisma.payment.create({
      data: {
        invoiceId: id,
        amount,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        paymentMethod: paymentMethod || "virement",
        reference,
        notes,
        recordedBy: auth.user.id,
      },
    });

    // Mettre à jour la facture
    const newAmountPaid = invoice.amountPaid + amount;
    const newAmountDue = invoice.total - newAmountPaid;
    const newStatus = newAmountDue <= 0 ? "paid" : newAmountDue < invoice.total ? "partial" : invoice.status;

    await prisma.invoice.update({
      where: { id },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        paidAt: newStatus === "paid" ? new Date() : invoice.paidAt,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du paiement" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un paiement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id: invoiceId } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "ID du paiement requis" },
        { status: 400 }
      );
    }

    // Vérifier que le paiement existe
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { invoice: true },
    });

    if (!payment || payment.invoiceId !== invoiceId) {
      return NextResponse.json(
        { error: "Paiement non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le paiement
    await prisma.payment.delete({
      where: { id: paymentId },
    });

    // Mettre à jour la facture
    const newAmountPaid = payment.invoice.amountPaid - payment.amount;
    const newAmountDue = payment.invoice.total - newAmountPaid;
    const newStatus = newAmountDue >= payment.invoice.total ? "sent" : "partial";

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        amountPaid: newAmountPaid,
        amountDue: newAmountDue,
        status: newStatus,
        paidAt: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression du paiement" },
      { status: 500 }
    );
  }
}
