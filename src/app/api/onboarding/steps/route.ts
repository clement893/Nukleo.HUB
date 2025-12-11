import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET - Récupérer toutes les étapes d'onboarding
export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const steps = await prisma.onboardingStep.findMany({
      orderBy: { order: "asc" }
    });

    return NextResponse.json(steps);
  } catch (error) {
    console.error("Erreur steps GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une nouvelle étape
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { title, description, content, type, order, role, isRequired, duration } = body;

    if (!title || !description || !content) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    // Récupérer le dernier ordre si non spécifié
    let stepOrder = order;
    if (stepOrder === undefined) {
      const lastStep = await prisma.onboardingStep.findFirst({
        orderBy: { order: "desc" }
      });
      stepOrder = (lastStep?.order || 0) + 1;
    }

    const step = await prisma.onboardingStep.create({
      data: {
        title,
        description,
        content,
        type: type || "info",
        order: stepOrder,
        role: role || null,
        isRequired: isRequired ?? true,
        duration: duration || 5
      }
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error("Erreur steps POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour une étape
export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const step = await prisma.onboardingStep.update({
      where: { id },
      data
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error("Erreur steps PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer une étape
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    await prisma.onboardingStep.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur steps DELETE:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
