import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// Template des phases de transformation numérique
const PHASE_TEMPLATES = [
  { id: "diagnostic", name: "Diagnostic", description: "Audit et analyse de l'existant", order: 1, estimatedHours: 80, hourlyRate: 150 },
  { id: "strategie", name: "Stratégie", description: "Vision et roadmap de transformation", order: 2, estimatedHours: 60, hourlyRate: 175 },
  { id: "design", name: "Design", description: "Conception UX/UI et prototypage", order: 3, estimatedHours: 120, hourlyRate: 150 },
  { id: "developpement", name: "Développement", description: "Implémentation technique", order: 4, estimatedHours: 320, hourlyRate: 140 },
  { id: "ia", name: "Intégration IA", description: "Intelligence artificielle et automatisation", order: 5, estimatedHours: 160, hourlyRate: 175 },
  { id: "formation", name: "Formation", description: "Accompagnement au changement", order: 6, estimatedHours: 60, hourlyRate: 150 },
  { id: "deploiement", name: "Déploiement", description: "Mise en production et lancement", order: 7, estimatedHours: 80, hourlyRate: 150 },
  { id: "suivi", name: "Suivi & Optimisation", description: "Amélioration continue", order: 8, estimatedHours: 40, hourlyRate: 140 },
];

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const templates = searchParams.get("templates");

    // Retourner les templates si demandé
    if (templates === "true") {
      return NextResponse.json(PHASE_TEMPLATES);
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const phases = await prisma.projectPhase.findMany({
      where: { projectId },
      orderBy: { order: "asc" },
    });

    return NextResponse.json(phases);
  } catch (error) {
    console.error("Error fetching project phases:", error);
    return NextResponse.json(
      { error: "Failed to fetch project phases" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { projectId, phaseTemplateIds } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Si on reçoit une liste de templates, créer toutes les phases
    if (phaseTemplateIds && Array.isArray(phaseTemplateIds)) {
      const phasesToCreate = phaseTemplateIds
        .map((templateId: string) => {
          const template = PHASE_TEMPLATES.find((t) => t.id === templateId);
          if (!template) return null;
          return {
            projectId,
            phaseTemplateId: template.id,
            name: template.name,
            description: template.description,
            order: template.order,
            estimatedHours: template.estimatedHours,
            hourlyRate: template.hourlyRate,
            status: "pending",
            progress: 0,
          };
        })
        .filter(Boolean);

      await prisma.projectPhase.createMany({
        data: phasesToCreate as any[],
      });

      const createdPhases = await prisma.projectPhase.findMany({
        where: { projectId },
        orderBy: { order: "asc" },
      });

      return NextResponse.json(createdPhases, { status: 201 });
    }

    // Sinon, créer une seule phase
    const phase = await prisma.projectPhase.create({
      data: body,
    });

    return NextResponse.json(phase, { status: 201 });
  } catch (error) {
    console.error("Error creating project phase:", error);
    return NextResponse.json(
      { error: "Failed to create project phase" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    const phase = await prisma.projectPhase.update({
      where: { id },
      data,
    });

    return NextResponse.json(phase);
  } catch (error) {
    console.error("Error updating project phase:", error);
    return NextResponse.json(
      { error: "Failed to update project phase" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("projectId");

    if (projectId) {
      // Supprimer toutes les phases d'un projet
      await prisma.projectPhase.deleteMany({
        where: { projectId },
      });
      return NextResponse.json({ success: true });
    }

    if (!id) {
      return NextResponse.json(
        { error: "id or projectId is required" },
        { status: 400 }
      );
    }

    await prisma.projectPhase.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project phase:", error);
    return NextResponse.json(
      { error: "Failed to delete project phase" },
      { status: 500 }
    );
  }
}
