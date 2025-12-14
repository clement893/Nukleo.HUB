import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET - Récupérer une facture
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        reminders: {
          orderBy: { sentAt: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la facture" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour une facture
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const {
      clientName,
      clientEmail,
      clientCompany,
      clientAddress,
      clientPhone,
      title,
      description,
      dueDate,
      status,
      items,
      discountPercent,
      taxRate,
      notes,
      terms,
      footerNote,
    } = body;

    // Vérifier que la facture existe
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: "Facture non trouvée" },
        { status: 404 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: Record<string, unknown> = {};

    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (clientCompany !== undefined) updateData.clientCompany = clientCompany;
    if (clientAddress !== undefined) updateData.clientAddress = clientAddress;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate);
    if (notes !== undefined) updateData.notes = notes;
    if (terms !== undefined) updateData.terms = terms;
    if (footerNote !== undefined) updateData.footerNote = footerNote;

    // Gestion du statut
    if (status !== undefined) {
      updateData.status = status;
      if (status === "sent" && !existingInvoice.sentAt) {
        updateData.sentAt = new Date();
      }
      if (status === "paid") {
        updateData.paidAt = new Date();
      }
    }

    // Si les items sont fournis, recalculer les montants
    if (items !== undefined) {
      // Supprimer les anciens items
      await prisma.invoiceItem.deleteMany({
        where: { invoiceId: id },
      });

      // Calculer les nouveaux montants
      let subtotal = 0;
      const processedItems = items.map((item: {
        description: string;
        quantity: number;
        unitPrice: number;
        unit?: string;
        projectId?: string;
        phaseId?: string;
        sortOrder?: number;
      }, index: number) => {
        const amount = item.quantity * item.unitPrice;
        subtotal += amount;
        return {
          invoiceId: id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit || "unité",
          amount,
          projectId: item.projectId,
          phaseId: item.phaseId,
          sortOrder: item.sortOrder || index,
        };
      });

      // Créer les nouveaux items
      await prisma.invoiceItem.createMany({
        data: processedItems,
      });

      const discount = discountPercent ?? existingInvoice.discountPercent;
      const tax = taxRate ?? existingInvoice.taxRate;
      const discountAmount = subtotal * (discount / 100);
      const taxableAmount = subtotal - discountAmount;
      const taxAmount = taxableAmount * tax;
      const total = taxableAmount + taxAmount;

      updateData.subtotal = subtotal;
      updateData.discountPercent = discount;
      updateData.discountAmount = discountAmount;
      updateData.taxRate = tax;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
      updateData.amountDue = total - existingInvoice.amountPaid;
    } else if (discountPercent !== undefined || taxRate !== undefined) {
      // Recalculer seulement si discount ou taxe changent
      const discount = discountPercent ?? existingInvoice.discountPercent;
      const tax = taxRate ?? existingInvoice.taxRate;
      const discountAmount = existingInvoice.subtotal * (discount / 100);
      const taxableAmount = existingInvoice.subtotal - discountAmount;
      const taxAmount = taxableAmount * tax;
      const total = taxableAmount + taxAmount;

      updateData.discountPercent = discount;
      updateData.discountAmount = discountAmount;
      updateData.taxRate = tax;
      updateData.taxAmount = taxAmount;
      updateData.total = total;
      updateData.amountDue = total - existingInvoice.amountPaid;
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
        payments: true,
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la facture" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une facture
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;

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

    // Ne pas permettre la suppression d'une facture payée
    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Impossible de supprimer une facture payée" },
        { status: 400 }
      );
    }

    await prisma.invoice.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la facture" },
      { status: 500 }
    );
  }
}
