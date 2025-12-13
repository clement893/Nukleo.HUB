import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET - Historique complet de tous les projets
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

    const projects = await prisma.project.findMany({
      where: {
        client: portal.clientName,
      },
      include: {
        milestones: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer les livrables pour chaque projet
    const deliverablesByProject = await prisma.clientDeliverable.findMany({
      where: {
        portalId: portal.id,
        projectId: { in: projects.map(p => p.id) },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrichir avec les métriques
    const projectsWithMetrics = projects.map((project) => {
      const projectDeliverables = deliverablesByProject.filter((d: any) => d.projectId === project.id);
      
      return {
        ...project,
        deliverables: projectDeliverables.slice(0, 5),
        metrics: {
          totalMilestones: project.milestones.length,
          completedMilestones: project.milestones.filter((m: any) => m.status === "completed").length,
          totalDeliverables: projectDeliverables.length,
          approvedDeliverables: projectDeliverables.filter((d: any) => d.status === "approved").length,
        },
      };
    });

    return NextResponse.json({
      projects: projectsWithMetrics,
      summary: {
        total: projects.length,
        active: projects.filter(p => p.status === "in_progress").length,
        completed: projects.filter(p => p.status === "completed").length,
        onHold: projects.filter(p => p.status === "on_hold").length,
      },
    });
  } catch (error) {
    logger.error("Erreur récupération historique projets", error as Error, "GET /api/portal/[token]/projects/history");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
