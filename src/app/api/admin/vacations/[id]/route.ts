import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateVacationSchema = z.object({
  type: z.enum(["vacation", "sick", "personal", "unpaid", "other"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reason: z.string().nullable().optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
});

// GET - Récupérer une vacation spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const vacationRequest = await prisma.vacationRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            department: true,
            role: true,
          },
        },
      },
    });

    if (!vacationRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json(vacationRequest);
  } catch (error) {
    console.error("Error fetching vacation request:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la demande" },
      { status: 500 }
    );
  }
}

// PUT - Modifier une vacation
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validation
    const validation = updateVacationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Récupérer la demande existante
    const existingRequest = await prisma.vacationRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    // Calculer les nouveaux jours si les dates changent
    let totalDays = existingRequest.totalDays;
    if (validation.data.startDate || validation.data.endDate) {
      const startDate = validation.data.startDate
        ? new Date(validation.data.startDate)
        : existingRequest.startDate;
      const endDate = validation.data.endDate
        ? new Date(validation.data.endDate)
        : existingRequest.endDate;

      if (endDate < startDate) {
        return NextResponse.json(
          { error: "La date de fin doit être après la date de début" },
          { status: 400 }
        );
      }

      // Calculer la différence en jours
      const diffTime = endDate.getTime() - startDate.getTime();
      totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de début
    }

    // Préparer les données de mise à jour
    const updateData: {
      type?: string;
      startDate?: Date;
      endDate?: Date;
      totalDays?: number;
      reason?: string | null;
      status?: string;
      reviewedBy?: string | null;
      reviewedByName?: string | null;
      reviewedAt?: Date | null;
      reviewComment?: string | null;
    } = {};

    if (validation.data.type) updateData.type = validation.data.type;
    if (validation.data.startDate) updateData.startDate = new Date(validation.data.startDate);
    if (validation.data.endDate) updateData.endDate = new Date(validation.data.endDate);
    if (validation.data.reason !== undefined) updateData.reason = validation.data.reason;
    if (validation.data.status) {
      updateData.status = validation.data.status;
      // Si on change le statut, mettre à jour les champs de révision
      if (validation.data.status !== existingRequest.status) {
        updateData.reviewedBy = user.id;
        updateData.reviewedByName = user.name || user.email;
        updateData.reviewedAt = new Date();
      }
    }

    if (totalDays !== existingRequest.totalDays) {
      updateData.totalDays = totalDays;
    }

    // Déterminer le type final (utiliser le nouveau type si fourni, sinon l'ancien)
    const finalType = validation.data.type || existingRequest.type;
    // Déterminer le statut final (utiliser le nouveau statut si fourni, sinon l'ancien)
    const finalStatus = validation.data.status || existingRequest.status;

    // GESTION DES SOLDES - Cas 1 : La vacation était approuvée
    // On doit d'abord RECRÉDITER les jours à l'employé (annuler l'ancienne déduction)
    if (existingRequest.status === "approved") {
      // Recréditer les jours de l'ancienne vacation (decrement = ajouter au solde disponible)
      if (existingRequest.type === "vacation") {
        await prisma.vacationBalance.updateMany({
          where: { employeeId: existingRequest.employeeId },
          data: {
            usedDays: { decrement: existingRequest.totalDays },
          },
        });
      } else if (existingRequest.type === "sick") {
        await prisma.vacationBalance.updateMany({
          where: { employeeId: existingRequest.employeeId },
          data: {
            sickDaysUsed: { decrement: existingRequest.totalDays },
          },
        });
      }
    }

    // Mettre à jour la demande
    const updatedRequest = await prisma.vacationRequest.update({
      where: { id },
      data: updateData,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            department: true,
            role: true,
          },
        },
      },
    });

    // GESTION DES SOLDES - Cas 2 : La nouvelle vacation est approuvée
    // On doit ensuite DÉDIRE les jours de la nouvelle vacation (si approuvée)
    if (finalStatus === "approved") {
      // Déduire les jours de la nouvelle vacation (increment = retirer du solde disponible)
      if (finalType === "vacation") {
        await prisma.vacationBalance.upsert({
          where: { employeeId: updatedRequest.employeeId },
          update: {
            usedDays: { increment: updatedRequest.totalDays },
          },
          create: {
            employeeId: updatedRequest.employeeId,
            year: new Date().getFullYear(),
            totalDays: 20,
            usedDays: updatedRequest.totalDays,
          },
        });
      } else if (finalType === "sick") {
        await prisma.vacationBalance.upsert({
          where: { employeeId: updatedRequest.employeeId },
          update: {
            sickDaysUsed: { increment: updatedRequest.totalDays },
          },
          create: {
            employeeId: updatedRequest.employeeId,
            year: new Date().getFullYear(),
            totalDays: 20,
            sickDaysUsed: updatedRequest.totalDays,
          },
        });
      }
    }

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error("Error updating vacation request:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la demande" },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une vacation
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    // Récupérer la demande pour vérifier le statut et ajuster le solde si nécessaire
    const vacationRequest = await prisma.vacationRequest.findUnique({
      where: { id },
      include: { employee: true },
    });

    if (!vacationRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    // Si la demande était approuvée, RECRÉDITER les jours à l'employé
    if (vacationRequest.status === "approved") {
      if (vacationRequest.type === "vacation") {
        // Recréditer les jours de vacances utilisés
        await prisma.vacationBalance.updateMany({
          where: { employeeId: vacationRequest.employeeId },
          data: {
            usedDays: { decrement: vacationRequest.totalDays },
          },
        });
      } else if (vacationRequest.type === "sick") {
        // Recréditer les jours de maladie utilisés
        await prisma.vacationBalance.updateMany({
          where: { employeeId: vacationRequest.employeeId },
          data: {
            sickDaysUsed: { decrement: vacationRequest.totalDays },
          },
        });
      }
    }

    // Supprimer la demande
    await prisma.vacationRequest.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Demande supprimée" });
  } catch (error) {
    console.error("Error deleting vacation request:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la demande" },
      { status: 500 }
    );
  }
}
