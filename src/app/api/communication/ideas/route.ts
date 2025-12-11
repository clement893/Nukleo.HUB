import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les idées
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (category) where.category = category;

    const ideas = await prisma.contentIdea.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: [{ votes: "desc" }, { priority: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ ideas });
  } catch (error) {
    console.error("Error fetching ideas:", error);
    return NextResponse.json({ error: "Failed to fetch ideas" }, { status: 500 });
  }
}

// POST - Créer une idée
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      title,
      description,
      category,
      platform,
      format,
      source,
      references,
      suggestedDate,
      assignedTo,
      notes,
    } = body;

    if (!clientId || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const idea = await prisma.contentIdea.create({
      data: {
        clientId,
        title,
        description,
        category,
        platform,
        format,
        source,
        references: references ? JSON.stringify(references) : null,
        suggestedDate: suggestedDate ? new Date(suggestedDate) : null,
        assignedTo,
        notes,
        status: "idea",
        priority: 0,
        votes: 0,
      },
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    return NextResponse.json({ idea });
  } catch (error) {
    console.error("Error creating idea:", error);
    return NextResponse.json({ error: "Failed to create idea" }, { status: 500 });
  }
}

// PATCH - Mettre à jour une idée (y compris voter)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, vote, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing idea ID" }, { status: 400 });
    }

    // Si c'est un vote
    if (vote !== undefined) {
      const idea = await prisma.contentIdea.update({
        where: { id },
        data: {
          votes: { increment: vote > 0 ? 1 : -1 },
        },
        include: {
          client: {
            select: { id: true, name: true, logoUrl: true },
          },
        },
      });
      return NextResponse.json({ idea });
    }

    // Mise à jour normale
    if (updates.suggestedDate) {
      updates.suggestedDate = new Date(updates.suggestedDate);
    }
    if (updates.references && Array.isArray(updates.references)) {
      updates.references = JSON.stringify(updates.references);
    }

    const idea = await prisma.contentIdea.update({
      where: { id },
      data: updates,
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    return NextResponse.json({ idea });
  } catch (error) {
    console.error("Error updating idea:", error);
    return NextResponse.json({ error: "Failed to update idea" }, { status: 500 });
  }
}

// DELETE - Supprimer une idée
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing idea ID" }, { status: 400 });
    }

    await prisma.contentIdea.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting idea:", error);
    return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 });
  }
}
