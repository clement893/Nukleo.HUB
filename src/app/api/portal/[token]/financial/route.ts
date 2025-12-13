import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET - Vue financière complète (factures, paiements, solde)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    // Récupérer les factures
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { clientEmail: portal.clientEmail },
          { clientName: portal.clientName },
          { clientCompany: portal.clientName },
        ],
      },
      orderBy: { issueDate: "desc" },
      include: {
        items: true,
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    // Récupérer tous les paiements
    const allPayments = invoices.flatMap(inv => inv.payments || []);

    // Calculer les totaux
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = allPayments.reduce((sum, pay) => sum + pay.amount, 0);
    const totalDue = totalInvoiced - totalPaid;

    // Factures en retard
    const today = new Date();
    const overdueInvoices = invoices.filter(inv => {
      if (inv.status === "paid" || inv.status === "cancelled") return false;
      if (!inv.dueDate) return false;
      return new Date(inv.dueDate) < today;
    });
    const overdueAmount = overdueInvoices.reduce((sum, inv) => {
      const paid = (inv.payments || []).reduce((pSum, pay) => pSum + pay.amount, 0);
      return sum + (inv.total - paid);
    }, 0);

    // Factures par statut
    const invoicesByStatus = {
      draft: invoices.filter(inv => inv.status === "draft").length,
      sent: invoices.filter(inv => inv.status === "sent").length,
      viewed: invoices.filter(inv => inv.status === "viewed").length,
      paid: invoices.filter(inv => inv.status === "paid").length,
      partial: invoices.filter(inv => inv.status === "partial").length,
      overdue: overdueInvoices.length,
    };

    return NextResponse.json({
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        title: inv.title,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        status: inv.status,
        subtotal: inv.subtotal,
        taxAmount: inv.taxAmount,
        total: inv.total,
        amountPaid: inv.amountPaid,
        amountDue: inv.amountDue,
        currency: inv.currency,
        projectId: inv.projectId,
        items: inv.items,
        payments: inv.payments,
        isOverdue: overdueInvoices.some(ov => ov.id === inv.id),
      })),
      payments: allPayments.map(pay => ({
        id: pay.id,
        invoiceId: pay.invoiceId,
        invoiceNumber: invoices.find(inv => inv.id === pay.invoiceId)?.invoiceNumber,
        amount: pay.amount,
        paymentDate: pay.paymentDate,
        paymentMethod: pay.paymentMethod,
        reference: pay.reference,
        notes: pay.notes,
      })),
      summary: {
        totalInvoiced,
        totalPaid,
        totalDue,
        overdueAmount,
        currency: invoices[0]?.currency || "CAD",
        invoicesByStatus,
        totalInvoices: invoices.length,
        totalPayments: allPayments.length,
      },
    });
  } catch (error) {
    logger.error("Erreur récupération vue financière", error as Error, "GET /api/portal/[token]/financial");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
