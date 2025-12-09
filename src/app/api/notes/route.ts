import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/notes?entityType=contact&entityId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: "entityType and entityId are required" },
        { status: 400 }
      );
    }

    const notes = await prisma.note.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

// POST /api/notes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, entityType, entityId, authorName } = body;

    if (!content || !entityType || !entityId) {
      return NextResponse.json(
        { error: "content, entityType, and entityId are required" },
        { status: 400 }
      );
    }

    const note = await prisma.note.create({
      data: {
        content,
        entityType,
        entityId,
        authorName: authorName || "Admin",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "note_added",
        description: `Note ajoutée`,
        entityType,
        entityId,
        userName: authorName || "Admin",
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
