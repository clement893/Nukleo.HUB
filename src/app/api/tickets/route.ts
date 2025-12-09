import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des tickets (admin) ou tickets d'un portail (client)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const portalToken = searchParams.get("portalToken");
    const portalId = searchParams.get("portalId");
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");

    const where: Record<string, unknown> = {};

    // Si token fourni, récupérer les tickets du portail
    if (portalToken) {
      const portal = await prisma.clientPortal.findUnique({
        where: { token: portalToken },
      });
      if (!portal || !portal.isActive) {
        return NextResponse.json({ error: "Invalid portal" }, { status: 403 });
      }
      where.portalId = portal.id;
    } else if (portalId) {
      where.portalId = portalId;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        portal: {
          select: { clientName: true, clientEmail: true },
        },
        responses: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { responses: true },
        },
      },
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST - Créer un nouveau ticket (client ou admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      portalToken,
      portalId,
      projectId,
      subject,
      description,
      category,
      priority,
      submittedBy,
      submittedEmail,
    } = body;

    // Vérifier le portail
    let resolvedPortalId = portalId;
    if (portalToken) {
      const portal = await prisma.clientPortal.findUnique({
        where: { token: portalToken },
      });
      if (!portal || !portal.isActive) {
        return NextResponse.json({ error: "Invalid portal" }, { status: 403 });
      }
      resolvedPortalId = portal.id;
    }

    if (!resolvedPortalId) {
      return NextResponse.json({ error: "Portal ID is required" }, { status: 400 });
    }

    if (!subject || !description) {
      return NextResponse.json({ error: "Subject and description are required" }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        portalId: resolvedPortalId,
        projectId,
        subject,
        description,
        category: category || "support",
        priority: priority || "medium",
        submittedBy,
        submittedEmail,
      },
      include: {
        portal: {
          select: { clientName: true },
        },
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}

// PATCH - Mettre à jour un ticket (admin)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    // Si le statut passe à resolved ou closed, ajouter la date
    if (data.status === "resolved" || data.status === "closed") {
      data.resolvedAt = new Date();
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        portal: {
          select: { clientName: true },
        },
        responses: true,
      },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}

// DELETE - Supprimer un ticket (admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    await prisma.ticket.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return NextResponse.json({ error: "Failed to delete ticket" }, { status: 500 });
  }
}
