import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { z } from "zod";

// Schémas de validation
const createPortalSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(255),
  clientEmail: z.string().email("Invalid email").optional().nullable(),
  companyId: z.string().optional().nullable(),
  welcomeMessage: z.string().max(5000).optional().nullable(),
});

const updatePortalSchema = createPortalSchema.partial().extend({
  id: z.string().min(1, "Portal ID is required"),
});

// GET - Liste des portails clients
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

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
    return NextResponse.json(
      { error: "Failed to fetch portals" },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau portail client
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();

    // Valider les données
    const validation = createPortalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { clientName, clientEmail, companyId, welcomeMessage } = validation.data;

    // Définir une expiration par défaut (1 an) si non fournie
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);

    const portal = await prisma.clientPortal.create({
      data: {
        clientName,
        clientEmail,
        companyId,
        welcomeMessage,
        expiresAt, // Expiration obligatoire
      },
    });

    return NextResponse.json(portal, { status: 201 });
  } catch (error) {
    console.error("Error creating client portal:", error);
    return NextResponse.json(
      { error: "Failed to create portal" },
      { status: 500 }
    );
  }
}

// PATCH - Mettre à jour un portail
export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();

    // Valider les données
    const validation = updatePortalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { id, ...data } = validation.data;

    const portal = await prisma.clientPortal.update({
      where: { id },
      data,
    });

    return NextResponse.json(portal);
  } catch (error) {
    console.error("Error updating client portal:", error);
    return NextResponse.json(
      { error: "Failed to update portal" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un portail
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Portal ID is required" },
        { status: 400 }
      );
    }

    await prisma.clientPortal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting client portal:", error);
    return NextResponse.json(
      { error: "Failed to delete portal" },
      { status: 500 }
    );
  }
}
