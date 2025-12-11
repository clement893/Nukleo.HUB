import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer le calendrier éditorial
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    
    if (clientId) where.clientId = clientId;
    if (platform) where.platform = platform;
    if (status) where.status = status;
    
    if (startDate && endDate) {
      where.scheduledDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const entries = await prisma.contentCalendar.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: { scheduledDate: "asc" },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Error fetching calendar:", error);
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 });
  }
}

// POST - Créer une entrée de calendrier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      title,
      description,
      contentType,
      platform,
      scheduledDate,
      content,
      mediaUrls,
      hashtags,
      caption,
      link,
      assignedTo,
      notes,
    } = body;

    if (!clientId || !title || !contentType || !platform || !scheduledDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const entry = await prisma.contentCalendar.create({
      data: {
        clientId,
        title,
        description,
        contentType,
        platform,
        scheduledDate: new Date(scheduledDate),
        content,
        mediaUrls: mediaUrls ? JSON.stringify(mediaUrls) : null,
        hashtags,
        caption,
        link,
        assignedTo,
        notes,
        status: "draft",
      },
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error creating calendar entry:", error);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

// PATCH - Mettre à jour une entrée
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing entry ID" }, { status: 400 });
    }

    // Convertir les dates si présentes
    if (updates.scheduledDate) {
      updates.scheduledDate = new Date(updates.scheduledDate);
    }
    if (updates.publishedDate) {
      updates.publishedDate = new Date(updates.publishedDate);
    }
    if (updates.approvedAt) {
      updates.approvedAt = new Date(updates.approvedAt);
    }
    if (updates.mediaUrls && Array.isArray(updates.mediaUrls)) {
      updates.mediaUrls = JSON.stringify(updates.mediaUrls);
    }

    const entry = await prisma.contentCalendar.update({
      where: { id },
      data: updates,
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error updating calendar entry:", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

// DELETE - Supprimer une entrée
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing entry ID" }, { status: 400 });
    }

    await prisma.contentCalendar.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting calendar entry:", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
