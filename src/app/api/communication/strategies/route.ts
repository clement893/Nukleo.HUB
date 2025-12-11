import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET - Récupérer les stratégies
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (type) where.type = type;

    const strategies = await prisma.communicationStrategy.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ strategies });
  } catch (error) {
    console.error("Error fetching strategies:", error);
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
  }
}

// POST - Créer une stratégie
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const {
      clientId,
      title,
      type,
      period,
      swotAnalysis,
      competitorAnalysis,
      audienceInsights,
      visionStatement,
      objectives,
      kpis,
      positioning,
      valueProposition,
      brandPersonality,
      channels,
      contentPillars,
      tacticalPlan,
      budget,
      budgetAllocation,
      timeline,
      keyDates,
      notes,
    } = body;

    if (!clientId || !title || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const strategy = await prisma.communicationStrategy.create({
      data: {
        clientId,
        title,
        type,
        period,
        swotAnalysis: swotAnalysis ? JSON.stringify(swotAnalysis) : null,
        competitorAnalysis: competitorAnalysis ? JSON.stringify(competitorAnalysis) : null,
        audienceInsights: audienceInsights ? JSON.stringify(audienceInsights) : null,
        visionStatement,
        objectives: objectives ? JSON.stringify(objectives) : null,
        kpis: kpis ? JSON.stringify(kpis) : null,
        positioning,
        valueProposition,
        brandPersonality,
        channels: channels ? JSON.stringify(channels) : null,
        contentPillars: contentPillars ? JSON.stringify(contentPillars) : null,
        tacticalPlan: tacticalPlan ? JSON.stringify(tacticalPlan) : null,
        budget,
        budgetAllocation: budgetAllocation ? JSON.stringify(budgetAllocation) : null,
        timeline: timeline ? JSON.stringify(timeline) : null,
        keyDates: keyDates ? JSON.stringify(keyDates) : null,
        notes,
        status: "draft",
      },
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error("Error creating strategy:", error);
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 });
  }
}

// PATCH - Mettre à jour une stratégie
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing strategy ID" }, { status: 400 });
    }

    // Convertir les objets en JSON
    const jsonFields = [
      "swotAnalysis", "competitorAnalysis", "audienceInsights",
      "objectives", "kpis", "channels", "contentPillars",
      "tacticalPlan", "budgetAllocation", "timeline", "keyDates"
    ];
    
    for (const field of jsonFields) {
      if (updates[field] && typeof updates[field] === "object") {
        updates[field] = JSON.stringify(updates[field]);
      }
    }

    const strategy = await prisma.communicationStrategy.update({
      where: { id },
      data: updates,
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    return NextResponse.json({ strategy });
  } catch (error) {
    console.error("Error updating strategy:", error);
    return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 });
  }
}

// DELETE - Supprimer une stratégie
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing strategy ID" }, { status: 400 });
    }

    await prisma.communicationStrategy.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting strategy:", error);
    return NextResponse.json({ error: "Failed to delete strategy" }, { status: 500 });
  }
}
