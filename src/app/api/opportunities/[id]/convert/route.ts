import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// POST /api/opportunities/[id]/convert
export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await context.params;
    
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        linkedContact: true,
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }

    // Check if opportunity is in a valid stage for conversion
    const validStages = ["09 - Mandat signé", "Mandat signé"];
    if (!validStages.some(stage => opportunity.stage.includes(stage) || opportunity.stage.includes("signé"))) {
      return NextResponse.json(
        { error: "L'opportunité doit être au stade 'Mandat signé' pour être convertie" },
        { status: 400 }
      );
    }

    // Create project from opportunity
    const project = await prisma.project.create({
      data: {
        name: opportunity.name,
        client: opportunity.company,
        status: "Planification",
        stage: "Planification",
        budget: opportunity.value?.toString(),
        contactName: opportunity.linkedContact?.fullName || opportunity.contact,
        projectType: opportunity.projectType,
        year: new Date().getFullYear().toString(),
        description: `Projet créé à partir de l'opportunité "${opportunity.name}"`,
      },
    });

    // Update opportunity with link to project
    await prisma.opportunity.update({
      where: { id },
      data: {
        stage: "10 - Converti en projet",
      },
    });

    // Log activity on opportunity
    await prisma.activityLog.create({
      data: {
        action: "converted_to_project",
        description: `Opportunité convertie en projet "${project.name}"`,
        entityType: "opportunity",
        entityId: id,
        userName: "Admin",
        newValue: project.id,
      },
    });

    // Log activity on project
    await prisma.activityLog.create({
      data: {
        action: "created_from_opportunity",
        description: `Projet créé à partir de l'opportunité "${opportunity.name}"`,
        entityType: "project",
        entityId: project.id,
        userName: "Admin",
        oldValue: id,
      },
    });

    return NextResponse.json({
      success: true,
      project,
      message: "Opportunité convertie en projet avec succès",
    });
  } catch (error) {
    console.error("Error converting opportunity:", error);
    return NextResponse.json(
      { error: "Failed to convert opportunity" },
      { status: 500 }
    );
  }
}
