import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les livrables du client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = { portalId: portal.id };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const deliverables = await prisma.clientDeliverable.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(deliverables);
  } catch (error) {
    console.error("Erreur récupération livrables:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Approuver ou demander une révision d'un livrable
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    const body = await request.json();
    const { deliverableId, action, feedback } = body;

    if (!deliverableId || !action) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const deliverable = await prisma.clientDeliverable.findFirst({
      where: { id: deliverableId, portalId: portal.id },
    });

    if (!deliverable) {
      return NextResponse.json({ error: "Livrable non trouvé" }, { status: 404 });
    }

    let updateData: Record<string, unknown> = {};

    if (action === "approve") {
      updateData = {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: portal.clientName,
        clientFeedback: feedback || null,
      };
    } else if (action === "request_revision") {
      updateData = {
        status: "revision_requested",
        clientFeedback: feedback,
      };
    } else if (action === "reject") {
      updateData = {
        status: "rejected",
        clientFeedback: feedback,
      };
    }

    const updated = await prisma.clientDeliverable.update({
      where: { id: deliverableId },
      data: updateData,
    });

    // Créer une notification pour l'équipe (via le système interne)
    await prisma.clientNotification.create({
      data: {
        portalId: portal.id,
        type: action === "approve" ? "deliverable_approved" : "deliverable_feedback",
        title: action === "approve" ? "Livrable approuvé" : "Feedback sur livrable",
        message: `${portal.clientName} a ${action === "approve" ? "approuvé" : "demandé une révision pour"} le livrable "${deliverable.title}"`,
        link: `/deliverables/${deliverableId}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur mise à jour livrable:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
