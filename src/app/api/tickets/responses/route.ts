import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Ajouter une réponse à un ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      ticketId,
      content,
      isInternal,
      authorType,
      authorName,
      authorId,
      portalToken, // Pour vérifier l'accès client
    } = body;

    if (!ticketId || !content) {
      return NextResponse.json({ error: "Ticket ID and content are required" }, { status: 400 });
    }

    // Vérifier l'accès au ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { portal: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Si c'est un client, vérifier le token
    if (authorType === "client" && portalToken) {
      if (ticket.portal.token !== portalToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
      }
    }

    const response = await prisma.ticketResponse.create({
      data: {
        ticketId,
        content,
        isInternal: isInternal || false,
        authorType: authorType || "employee",
        authorName,
        authorId,
      },
    });

    // Mettre à jour le statut du ticket si nécessaire
    if (authorType === "employee" && ticket.status === "open") {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "in_progress" },
      });
    } else if (authorType === "client" && ticket.status === "waiting") {
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "in_progress" },
      });
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket response:", error);
    return NextResponse.json({ error: "Failed to create response" }, { status: 500 });
  }
}

// DELETE - Supprimer une réponse (admin seulement)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Response ID is required" }, { status: 400 });
    }

    await prisma.ticketResponse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket response:", error);
    return NextResponse.json({ error: "Failed to delete response" }, { status: 500 });
  }
}
