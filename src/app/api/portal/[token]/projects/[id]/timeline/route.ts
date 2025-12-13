import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET - Timeline complète d'un projet
export async function GET(
  request: NextRequest,
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
          orderBy: { startDate: "asc" },
        },
      },
    });

    // Récupérer les livrables du portail pour ce projet
    const deliverables = await prisma.clientDeliverable.findMany({
      where: {
        portalId: portal.id,
        projectId: id,
      },
      orderBy: { createdAt: "asc" },
    });

    if (!project) {
      return NextResponse.json({ error: "Projet non trouvé" }, { status: 404 });
    }

    // Créer une timeline unifiée
    const timeline: Array<{
      id: string;
      type: "milestone" | "task" | "deliverable" | "project_start" | "project_end";
      title: string;
      description?: string;
      date: Date;
      status?: string;
      metadata?: Record<string, unknown>;
    }> = [];

    // Date de début du projet (utiliser createdAt si pas de startDate)
    const projectStartDate = project.createdAt;
    timeline.push({
      id: `project-start-${project.id}`,
      type: "project_start",
      title: "Début du projet",
      description: project.name,
      date: projectStartDate,
      status: "completed",
    });

    // Milestones
    project.milestones.forEach(milestone => {
      timeline.push({
        id: milestone.id,
        type: "milestone",
        title: milestone.title,
        description: milestone.description || undefined,
        date: milestone.startDate || milestone.createdAt,
        status: milestone.status,
        metadata: {
          progress: milestone.progress,
          dueDate: milestone.dueDate,
        },
      });
    });

    // Livrables
    deliverables.forEach((deliverable: any) => {
      timeline.push({
        id: deliverable.id,
        type: "deliverable",
        title: deliverable.title,
        date: deliverable.approvedAt || deliverable.createdAt,
        status: deliverable.status,
        metadata: {
          type: deliverable.type,
        },
      });
    });

    // Date de fin du projet (utiliser updatedAt si terminé, sinon null)
    if (project.status === "completed") {
      timeline.push({
        id: `project-end-${project.id}`,
        type: "project_end",
        title: "Fin du projet",
        description: project.name,
        date: project.updatedAt,
        status: "completed",
      });
    }

    // Trier par date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      projectId: project.id,
      projectName: project.name,
      timeline,
      summary: {
        totalEvents: timeline.length,
        milestones: project.milestones.length,
        deliverables: deliverables.length,
      },
    });
  } catch (error) {
    logger.error("Erreur récupération timeline projet", error as Error, "GET /api/portal/[token]/projects/[id]/timeline");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
