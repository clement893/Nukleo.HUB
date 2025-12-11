import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les étapes/milestones du projet
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

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = { 
      portalId: portal.id,
      isVisible: true, // Seules les étapes visibles
    };
    if (projectId) where.projectId = projectId;

    const milestones = await prisma.clientProjectMilestone.findMany({
      where,
      orderBy: { order: "asc" },
    });

    // Calculer la progression
    const total = milestones.length;
    const completed = milestones.filter(m => m.status === "completed").length;
    const inProgress = milestones.filter(m => m.status === "in_progress").length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      milestones,
      progress: {
        total,
        completed,
        inProgress,
        upcoming: total - completed - inProgress,
        percentage: progress,
      },
    });
  } catch (error) {
    console.error("Erreur récupération milestones:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
