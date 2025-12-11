import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET - Récupérer les documents d'une tâche
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");

    if (!taskId) {
      return NextResponse.json(
        { error: "taskId is required" },
        { status: 400 }
      );
    }

    const taskDocuments = await prisma.taskDocument.findMany({
      where: { taskId },
      include: { document: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(taskDocuments);
  } catch (error) {
    console.error("Error fetching task documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch task documents" },
      { status: 500 }
    );
  }
}

// POST - Attacher un document existant à une tâche
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { taskId, documentId, addedBy } = body;

    if (!taskId || !documentId) {
      return NextResponse.json(
        { error: "taskId and documentId are required" },
        { status: 400 }
      );
    }

    // Vérifier si la relation existe déjà
    const existing = await prisma.taskDocument.findUnique({
      where: {
        taskId_documentId: { taskId, documentId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Document already attached to this task" },
        { status: 400 }
      );
    }

    const taskDocument = await prisma.taskDocument.create({
      data: {
        taskId,
        documentId,
        addedBy: addedBy || null,
      },
      include: { document: true },
    });

    return NextResponse.json(taskDocument, { status: 201 });
  } catch (error) {
    console.error("Error attaching document to task:", error);
    return NextResponse.json(
      { error: "Failed to attach document to task" },
      { status: 500 }
    );
  }
}

// DELETE - Détacher un document d'une tâche
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get("taskId");
    const documentId = searchParams.get("documentId");

    if (!taskId || !documentId) {
      return NextResponse.json(
        { error: "taskId and documentId are required" },
        { status: 400 }
      );
    }

    await prisma.taskDocument.delete({
      where: {
        taskId_documentId: { taskId, documentId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error detaching document from task:", error);
    return NextResponse.json(
      { error: "Failed to detach document from task" },
      { status: 500 }
    );
  }
}
