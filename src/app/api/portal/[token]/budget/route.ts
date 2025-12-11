import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer le suivi du budget
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

    const where: Record<string, unknown> = { portalId: portal.id };
    if (projectId) where.projectId = projectId;

    const budgets = await prisma.projectBudgetTracking.findMany({
      where,
      orderBy: { lastUpdated: "desc" },
    });

    // Calculer les totaux
    const totalBudget = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return NextResponse.json({
      budgets,
      summary: {
        totalBudget,
        totalSpent,
        remaining: totalBudget - totalSpent,
        percentUsed: Math.round(percentUsed * 10) / 10,
      },
    });
  } catch (error) {
    console.error("Erreur récupération budget:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
