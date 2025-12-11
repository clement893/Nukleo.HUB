import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les briefs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const status = searchParams.get("status");
    const projectType = searchParams.get("projectType");

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;
    if (status) where.status = status;
    if (projectType) where.projectType = projectType;

    const briefs = await prisma.communicationBrief.findMany({
      where,
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ briefs });
  } catch (error) {
    console.error("Error fetching briefs:", error);
    return NextResponse.json({ error: "Failed to fetch briefs" }, { status: 500 });
  }
}

// POST - Créer un brief
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      title,
      projectType,
      priority,
      background,
      objectives,
      targetAudience,
      keyMessages,
      toneOfVoice,
      deliverables,
      startDate,
      deadline,
      milestones,
      budget,
      budgetDetails,
      teamMembers,
      competitors,
      inspiration,
      brandGuidelines,
      clientContact,
      approvalProcess,
      notes,
    } = body;

    if (!clientId || !title || !projectType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const brief = await prisma.communicationBrief.create({
      data: {
        clientId,
        title,
        projectType,
        priority: priority || "medium",
        background,
        objectives,
        targetAudience,
        keyMessages,
        toneOfVoice,
        deliverables: deliverables ? JSON.stringify(deliverables) : null,
        startDate: startDate ? new Date(startDate) : null,
        deadline: deadline ? new Date(deadline) : null,
        milestones: milestones ? JSON.stringify(milestones) : null,
        budget,
        budgetDetails: budgetDetails ? JSON.stringify(budgetDetails) : null,
        teamMembers: teamMembers ? JSON.stringify(teamMembers) : null,
        competitors,
        inspiration: inspiration ? JSON.stringify(inspiration) : null,
        brandGuidelines,
        clientContact,
        approvalProcess,
        notes,
        status: "draft",
      },
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    return NextResponse.json({ brief });
  } catch (error) {
    console.error("Error creating brief:", error);
    return NextResponse.json({ error: "Failed to create brief" }, { status: 500 });
  }
}

// PATCH - Mettre à jour un brief
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing brief ID" }, { status: 400 });
    }

    // Convertir les dates et JSON si présents
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.deadline) updates.deadline = new Date(updates.deadline);
    if (updates.deliverables && Array.isArray(updates.deliverables)) {
      updates.deliverables = JSON.stringify(updates.deliverables);
    }
    if (updates.milestones && Array.isArray(updates.milestones)) {
      updates.milestones = JSON.stringify(updates.milestones);
    }
    if (updates.budgetDetails && typeof updates.budgetDetails === "object") {
      updates.budgetDetails = JSON.stringify(updates.budgetDetails);
    }
    if (updates.teamMembers && Array.isArray(updates.teamMembers)) {
      updates.teamMembers = JSON.stringify(updates.teamMembers);
    }
    if (updates.inspiration && Array.isArray(updates.inspiration)) {
      updates.inspiration = JSON.stringify(updates.inspiration);
    }

    const brief = await prisma.communicationBrief.update({
      where: { id },
      data: updates,
      include: {
        client: {
          select: { id: true, name: true, logoUrl: true },
        },
      },
    });

    return NextResponse.json({ brief });
  } catch (error) {
    console.error("Error updating brief:", error);
    return NextResponse.json({ error: "Failed to update brief" }, { status: 500 });
  }
}

// DELETE - Supprimer un brief
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing brief ID" }, { status: 400 });
    }

    await prisma.communicationBrief.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brief:", error);
    return NextResponse.json({ error: "Failed to delete brief" }, { status: 500 });
  }
}
