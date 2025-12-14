import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET - Métriques de performance d'un projet
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  try {
    const { token, id } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    const project = await prisma.project.findFirst({
      where: {
        id,
        client: portal.clientName,
      },
      include: {
        milestones: {
          select: {
            id: true,
            status: true,
            startDate: true,
            dueDate: true,
            progress: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Récupérer les livrables du portail pour ce projet
    const deliverables = await prisma.clientDeliverable.findMany({
      where: {
        portalId: portal.id,
        projectId: id,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        approvedAt: true,
      },
    });

    // Récupérer le budget du portail pour ce projet
    const budget = await prisma.projectBudgetTracking.findFirst({
      where: {
        portalId: portal.id,
        projectId: id,
      },
    });

    // Calculer les métriques
    const totalMilestones = project.milestones.length;
    const completedMilestones = project.milestones.filter((m: any) => m.status === "completed").length;
    const milestoneCompletionRate = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

    const totalDeliverables = deliverables.length;
    const approvedDeliverables = deliverables.filter((d: any) => d.status === "approved").length;
    const deliverablesApprovalRate = totalDeliverables > 0 ? (approvedDeliverables / totalDeliverables) * 100 : 0;

    // Milestones en retard
    const today = new Date();
    const overdueMilestones = project.milestones.filter((m: any) => {
      if (m.status === "completed") return false;
      if (!m.dueDate) return false;
      return new Date(m.dueDate) < today;
    }).length;

    // Budget
    const budgetUsed = budget ? (budget.spentAmount / budget.totalBudget) * 100 : 0;
    const budgetRemaining = budget ? budget.totalBudget - budget.spentAmount : 0;

    // Progression globale (moyenne pondérée)
    const overallProgress = totalMilestones > 0
      ? project.milestones.reduce((sum: number, m: any) => sum + (m.progress || 0), 0) / totalMilestones
      : milestoneCompletionRate;

    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      overallProgress: Math.round(overallProgress * 10) / 10,
      milestones: {
        total: totalMilestones,
        completed: completedMilestones,
        overdue: overdueMilestones,
        completionRate: Math.round(milestoneCompletionRate * 10) / 10,
      },
      deliverables: {
        total: totalDeliverables,
        approved: approvedDeliverables,
        approvalRate: Math.round(deliverablesApprovalRate * 10) / 10,
      },
      budget: budget ? {
        total: budget.totalBudget,
        spent: budget.spentAmount,
        remaining: budgetRemaining,
        usageRate: Math.round(budgetUsed * 10) / 10,
      } : null,
      health: {
        status: overdueMilestones === 0 && overallProgress >= 80 ? "excellent" :
                overdueMilestones === 0 && overallProgress >= 60 ? "good" :
                overdueMilestones <= 2 && overallProgress >= 40 ? "fair" : "needs_attention",
        score: Math.max(0, Math.min(100, overallProgress - (overdueMilestones * 10))),
      },
    });
  } catch (error) {
    logger.error("Erreur récupération métriques projet", error as Error, "GET /api/portal/[token]/projects/[id]/metrics");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
