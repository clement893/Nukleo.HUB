import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des recommandations (pour le client)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const portal = await prisma.clientPortal.findUnique({
    where: { token },
  });

  if (!portal || !portal.isActive) {
    return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
  }

  // Récupérer toutes les recommandations publiques
  const recommendations = await prisma.recommendation.findMany({
    where: {
      status: { in: ["pending", "reviewing", "planned", "in_progress", "completed"] },
    },
    include: {
      employee: { select: { id: true, name: true, photoUrl: true } },
      clientPortal: { select: { id: true, clientName: true } },
      votes: true,
    },
    orderBy: [{ voteCount: "desc" }, { createdAt: "desc" }],
  });

  // Marquer celles que le client a votées
  const recommendationsWithVoteStatus = recommendations.map((rec) => ({
    ...rec,
    hasVoted: rec.votes.some((v) => v.clientPortalId === portal.id),
    isOwn: rec.clientPortalId === portal.id,
  }));

  return NextResponse.json(recommendationsWithVoteStatus);
}

// POST - Créer une recommandation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const portal = await prisma.clientPortal.findUnique({
    where: { token },
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
      sourceType: "client",
      clientPortalId: portal.id,
    },
    include: {
      clientPortal: { select: { id: true, clientName: true } },
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

  const portal = await prisma.clientPortal.findUnique({
    where: { token },
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
        clientPortalId: portal.id,
      },
    });

    if (existingVote) {
      return NextResponse.json({ error: "Vous avez déjà voté" }, { status: 400 });
    }

    // Créer le vote
    await prisma.recommendationVote.create({
      data: {
        recommendationId,
        voterType: "client",
        clientPortalId: portal.id,
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
        clientPortalId: portal.id,
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
