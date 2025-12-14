import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des recommandations (pour l'employé)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });

  if (!portal || !portal.isActive) {
    return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
  }

  // Récupérer toutes les recommandations (pour voir et voter)
  const recommendations = await prisma.recommendation.findMany({
    include: {
      employee: { select: { id: true, name: true, photoUrl: true, department: true } },
      clientPortal: { select: { id: true, clientName: true } },
      votes: true,
    },
    orderBy: [{ voteCount: "desc" }, { createdAt: "desc" }],
  });

  // Marquer celles que l'employé a votées
  const recommendationsWithVoteStatus = recommendations.map((rec) => ({
    ...rec,
    hasVoted: rec.votes.some((v) => v.employeeId === portal.employeeId),
    isOwn: rec.employeeId === portal.employeeId,
  }));

  return NextResponse.json({ recommendations: recommendationsWithVoteStatus });
}

// POST - Créer une recommandation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });

  if (!portal || !portal.isActive) {
    return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
  }

  const data = await request.json();

  const recommendation = await prisma.recommendation.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category || "general",
      priority: data.priority || "medium",
      sourceType: "employee",
      employeeId: portal.employeeId,
    },
    include: {
      employee: { select: { id: true, name: true, photoUrl: true, department: true } },
      votes: true,
    },
  });

  return NextResponse.json(recommendation, { status: 201 });
}

// PATCH - Voter pour une recommandation
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });

  if (!portal || !portal.isActive) {
    return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
  }

  const data = await request.json();
  const { recommendationId, action } = data;

  if (action === "vote") {
    // Vérifier si déjà voté
    const existingVote = await prisma.recommendationVote.findFirst({
      where: {
        recommendationId,
        employeeId: portal.employeeId,
      },
    });

    if (existingVote) {
      return NextResponse.json({ error: "Vous avez déjà voté" }, { status: 400 });
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
  } else if (action === "unvote") {
    // Supprimer le vote
    await prisma.recommendationVote.deleteMany({
      where: {
        recommendationId,
        employeeId: portal.employeeId,
      },
    });

    // Mettre à jour le compteur
    await prisma.recommendation.update({
      where: { id: recommendationId },
      data: { voteCount: { decrement: 1 } },
    });

    return NextResponse.json({ success: true, action: "unvoted" });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
