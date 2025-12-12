import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString(), 10);

    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);
    const now = new Date();

    // Statistiques générales
    const [
      totalInvoices,
      paidInvoices,
      overdueInvoices,
      pendingInvoices,
    ] = await Promise.all([
      prisma.invoice.count({
        where: {
          issueDate: { gte: startOfYear, lte: endOfYear },
          status: { not: "cancelled" },
        },
      }),
      prisma.invoice.count({
        where: {
          issueDate: { gte: startOfYear, lte: endOfYear },
          status: "paid",
        },
      }),
      prisma.invoice.count({
        where: {
          issueDate: { gte: startOfYear, lte: endOfYear },
          status: "overdue",
        },
      }),
      prisma.invoice.count({
        where: {
          issueDate: { gte: startOfYear, lte: endOfYear },
          status: { in: ["sent", "viewed", "partial"] },
        },
      }),
    ]);

    // Montants agrégés
    const invoices = await prisma.invoice.findMany({
      where: {
        issueDate: { gte: startOfYear, lte: endOfYear },
        status: { not: "cancelled" },
      },
      select: {
        total: true,
        amountPaid: true,
        amountDue: true,
        status: true,
        issueDate: true,
        dueDate: true,
      },
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const totalDue = invoices.reduce((sum, inv) => sum + inv.amountDue, 0);
    const totalOverdue = invoices
      .filter((inv) => inv.status === "overdue" || (inv.dueDate < now && inv.amountDue > 0))
      .reduce((sum, inv) => sum + inv.amountDue, 0);

    // Revenus par mois
    const revenueByMonth = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleDateString("fr-CA", { month: "short" }),
      invoiced: 0,
      paid: 0,
    }));

    for (const invoice of invoices) {
      const month = invoice.issueDate.getMonth();
      revenueByMonth[month].invoiced += invoice.total;
      revenueByMonth[month].paid += invoice.amountPaid;
    }

    // Top clients
    const clientStats = await prisma.invoice.groupBy({
      by: ["clientName", "clientCompany"],
      where: {
        issueDate: { gte: startOfYear, lte: endOfYear },
        status: { not: "cancelled" },
      },
      _sum: {
        total: true,
        amountPaid: true,
      },
      _count: true,
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: 10,
    });

    const topClients = clientStats.map((client) => ({
      name: client.clientCompany || client.clientName,
      invoiceCount: client._count,
      totalAmount: client._sum.total || 0,
      paidAmount: client._sum.amountPaid || 0,
    }));

    // Factures en retard (détail)
    const overdueInvoicesList = await prisma.invoice.findMany({
      where: {
        OR: [
          { status: "overdue" },
          {
            status: { in: ["sent", "viewed", "partial"] },
            dueDate: { lt: now },
            amountDue: { gt: 0 },
          },
        ],
      },
      select: {
        id: true,
        invoiceNumber: true,
        clientName: true,
        clientCompany: true,
        total: true,
        amountDue: true,
        dueDate: true,
        reminderCount: true,
      },
      orderBy: { dueDate: "asc" },
      take: 10,
    });

    // Taux de recouvrement
    const collectionRate = totalRevenue > 0 ? (totalPaid / totalRevenue) * 100 : 0;

    // Délai moyen de paiement
    const paidInvoicesList = await prisma.invoice.findMany({
      where: {
        issueDate: { gte: startOfYear, lte: endOfYear },
        status: "paid",
        paidAt: { not: null },
      },
      select: {
        issueDate: true,
        paidAt: true,
      },
    });

    let avgPaymentDays = 0;
    if (paidInvoicesList.length > 0) {
      const totalDays = paidInvoicesList.reduce((sum, inv) => {
        if (inv.paidAt) {
          const days = Math.ceil(
            (inv.paidAt.getTime() - inv.issueDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          return sum + days;
        }
        return sum;
      }, 0);
      avgPaymentDays = Math.round(totalDays / paidInvoicesList.length);
    }

    return NextResponse.json({
      year,
      summary: {
        totalInvoices,
        paidInvoices,
        overdueInvoices,
        pendingInvoices,
        totalRevenue,
        totalPaid,
        totalDue,
        totalOverdue,
        collectionRate: Math.round(collectionRate * 100) / 100,
        avgPaymentDays,
      },
      revenueByMonth,
      topClients,
      overdueInvoicesList,
    });
  } catch (error) {
    console.error("Error fetching invoice stats:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
