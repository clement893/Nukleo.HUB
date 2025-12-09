import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des portails clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;

    const portals = await prisma.clientPortal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { tickets: true }
        }
      }
    });

    return NextResponse.json(portals);
  } catch (error) {
    console.error("Error fetching client portals:", error);
    return NextResponse.json({ error: "Failed to fetch portals" }, { status: 500 });
  }
}

// POST - Créer un nouveau portail client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientName, clientEmail, companyId, welcomeMessage } = body;

    if (!clientName) {
      return NextResponse.json({ error: "Client name is required" }, { status: 400 });
    }

    const portal = await prisma.clientPortal.create({
      data: {
        clientName,
        clientEmail,
        companyId,
        welcomeMessage,
      },
    });

    return NextResponse.json(portal, { status: 201 });
  } catch (error) {
    console.error("Error creating client portal:", error);
    return NextResponse.json({ error: "Failed to create portal" }, { status: 500 });
  }
}

// PATCH - Mettre à jour un portail
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Portal ID is required" }, { status: 400 });
    }

    const portal = await prisma.clientPortal.update({
      where: { id },
      data,
    });

    return NextResponse.json(portal);
  } catch (error) {
    console.error("Error updating client portal:", error);
    return NextResponse.json({ error: "Failed to update portal" }, { status: 500 });
  }
}

// DELETE - Supprimer un portail
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Portal ID is required" }, { status: 400 });
    }

    await prisma.clientPortal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client portal:", error);
    return NextResponse.json({ error: "Failed to delete portal" }, { status: 500 });
  }
}
