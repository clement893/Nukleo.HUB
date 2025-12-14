import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Voter pour une recommandation
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const { token, id: recommendationId } = await params;

  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });

  if (!portal || !portal.isActive) {
    return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
  }

  // Vérifier que la recommandation existe
  const recommendation = await prisma.recommendation.findUnique({
    where: { id: recommendationId },
  });

  if (!recommendation) {
    return NextResponse.json({ error: "Recommandation non trouvée" }, { status: 404 });
  }

  // Vérifier si c'est sa propre recommandation
  if (recommendation.employeeId === portal.employeeId) {
    return NextResponse.json({ error: "Vous ne pouvez pas voter pour votre propre recommandation" }, { status: 400 });
  }

  // Vérifier si déjà voté
  const existingVote = await prisma.recommendationVote.findFirst({
    where: {
      recommendationId,
      employeeId: portal.employeeId,
    },
  });

  if (existingVote) {
    // Toggle: supprimer le vote existant
    await prisma.recommendationVote.delete({
      where: { id: existingVote.id },
    });

    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { voteCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true, action: "unvoted" });
  }

  // Créer le vote
  await prisma.recommendationVote.create({
    data: {
      recommendationId,
      voterType: "employee",
      employeeId: portal.employeeId,
    },
  });

  // Mettre à jour le compteur
  await prisma.recommendation.update({
    where: { id: recommendationId },
    data: { voteCount: { increment: 1 } },
  });

  return NextResponse.json({ success: true, action: "voted" });
}
