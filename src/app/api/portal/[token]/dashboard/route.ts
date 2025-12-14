import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET - Dashboard personnalisé du client
export async function GET(
  _request: NextRequest,
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

    // Récupérer les projets (via le nom du client)
    const projects = await prisma.project.findMany({
      where: {
        client: portal.clientName,
      },
      include: {
        milestones: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    // Récupérer les factures
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          { clientEmail: portal.clientEmail },
          { clientName: portal.clientName },
          { clientCompany: portal.clientName },
        ],
      },
      include: {
        payments: true,
      },
    });

    // Récupérer les livrables
    const deliverables = await prisma.clientDeliverable.findMany({
      where: { portalId: portal.id },
      include: {
        workflow: {
          include: {
            steps: true,
          },
        },
      },
    });

    // Récupérer les notifications non lues
    const unreadNotifications = await prisma.clientNotification.count({
      where: {
        portalId: portal.id,
        isRead: false,
      },
    });

    // Récupérer les messages non lus
    const unreadMessages = await prisma.clientChatMessage.count({
      where: {
        portalId: portal.id,
        isRead: false,
        senderType: "employee",
      },
    });

    // Calculer les métriques
    const activeProjects = projects.filter(p => p.status === "in_progress").length;
    const completedProjects = projects.filter(p => p.status === "completed").length;
    
    const pendingDeliverables = deliverables.filter(d => d.status === "in_review" || d.status === "pending").length;
    const approvedDeliverables = deliverables.filter(d => d.status === "approved").length;

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalPaid = invoices.reduce((sum, inv) => {
      const paid = (inv.payments || []).reduce((pSum, pay) => pSum + pay.amount, 0);
      return sum + paid;
    }, 0);
    const totalDue = totalInvoiced - totalPaid;

    // Projets nécessitant attention (en retard ou bloqués)
    const projectsNeedingAttention = projects.filter(p => {
      if (p.status === "on_hold") return true;
      return false;
    }).length;

    return NextResponse.json({
      overview: {
        activeProjects,
        completedProjects,
        totalProjects: projects.length,
        pendingDeliverables,
        approvedDeliverables,
        totalDeliverables: deliverables.length,
        unreadNotifications,
        unreadMessages,
        projectsNeedingAttention,
      },
      financial: {
        totalInvoiced,
        totalPaid,
        totalDue,
        currency: invoices[0]?.currency || "CAD",
        overdueInvoices: invoices.filter(inv => {
          if (inv.status === "paid" || inv.status === "cancelled") return false;
          if (!inv.dueDate) return false;
          return new Date(inv.dueDate) < new Date();
        }).length,
      },
      recentActivity: {
        recentProjects: projects.slice(0, 5).map(p => ({
          id: p.id,
          name: p.name,
          status: p.status,
          updatedAt: p.updatedAt,
        })),
        recentDeliverables: deliverables.slice(0, 5).map(d => ({
          id: d.id,
          title: d.title,
          status: d.status,
          createdAt: d.createdAt,
        })),
      },
    });
  } catch (error) {
    logger.error("Erreur récupération dashboard client", error as Error, "GET /api/portal/[token]/dashboard");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
