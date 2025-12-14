import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET - Récupérer toutes les demandes de vacances (pour admin)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, approved, rejected, all
    const department = searchParams.get("department");

    const whereClause: Record<string, unknown> = {};
    
    if (status && status !== "all") {
      whereClause.status = status;
    }

    if (department && department !== "all") {
      whereClause.employee = { department };
    }

    const vacationRequests = await prisma.vacationRequest.findMany({
      where: whereClause,
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
      orderBy: [
        { status: "asc" }, // pending first
        { createdAt: "desc" },
      ],
    });

    // Statistiques
    const stats = {
      pending: vacationRequests.filter((r) => r.status === "pending").length,
      approved: vacationRequests.filter((r) => r.status === "approved").length,
      rejected: vacationRequests.filter((r) => r.status === "rejected").length,
      total: vacationRequests.length,
    };

    return NextResponse.json({ requests: vacationRequests, stats });
  } catch (error) {
    console.error("Error fetching vacation requests:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des demandes" },
      { status: 500 }
    );
  }
}

// PATCH - Approuver ou refuser une demande
export async function PATCH(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { requestId, action, comment } = body;

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "ID de demande et action requis" },
        { status: 400 }
      );
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Action invalide. Utilisez 'approve' ou 'reject'" },
        { status: 400 }
      );
    }

    // Récupérer la demande
    const vacationRequest = await prisma.vacationRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });

    if (!vacationRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      );
    }

    if (vacationRequest.status !== "pending") {
      return NextResponse.json(
        { error: "Cette demande a déjà été traitée" },
        { status: 400 }
      );
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Mettre à jour la demande
    const updatedRequest = await prisma.vacationRequest.update({
      where: { id: requestId },
      data: {
        status: newStatus,
        reviewedBy: user.id,
        reviewedByName: user.name || user.email,
        reviewedAt: new Date(),
        reviewComment: comment || null,
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            photoUrl: true,
            department: true,
          },
        },
      },
    });

    // Si approuvé et type vacation, mettre à jour le solde
    if (action === "approve" && vacationRequest.type === "vacation") {
      await prisma.vacationBalance.upsert({
        where: { employeeId: vacationRequest.employeeId },
        update: {
          usedDays: { increment: vacationRequest.totalDays },
        },
        create: {
          employeeId: vacationRequest.employeeId,
          year: new Date().getFullYear(),
          totalDays: 20,
          usedDays: vacationRequest.totalDays,
        },
      });
    }

    // Si approuvé et type sick, mettre à jour les jours maladie
    if (action === "approve" && vacationRequest.type === "sick") {
      await prisma.vacationBalance.upsert({
        where: { employeeId: vacationRequest.employeeId },
        update: {
          sickDaysUsed: { increment: vacationRequest.totalDays },
        },
        create: {
          employeeId: vacationRequest.employeeId,
          year: new Date().getFullYear(),
          totalDays: 20,
          sickDaysUsed: vacationRequest.totalDays,
        },
      });
    }

    // Créer une notification pour l'employé
    try {
      await prisma.employeeNotification.create({
        data: {
          employeeId: vacationRequest.employeeId,
          type: "vacation_response",
          title: newStatus === "approved" ? "Demande approuvée" : "Demande refusée",
          message: newStatus === "approved"
            ? `Votre demande de ${vacationRequest.type === "vacation" ? "vacances" : "congé"} du ${new Date(vacationRequest.startDate).toLocaleDateString("fr-FR")} au ${new Date(vacationRequest.endDate).toLocaleDateString("fr-FR")} a été approuvée.`
            : `Votre demande de ${vacationRequest.type === "vacation" ? "vacances" : "congé"} du ${new Date(vacationRequest.startDate).toLocaleDateString("fr-FR")} au ${new Date(vacationRequest.endDate).toLocaleDateString("fr-FR")} a été refusée.${comment ? ` Raison: ${comment}` : ""}`,
          isRead: false,
        },
      });
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
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

// PUT - Mettre à jour le solde de vacances d'un employé
export async function PUT(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, totalDays, carriedOverDays, sickDaysAllowed } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "ID employé requis" },
        { status: 400 }
      );
    }

    const balance = await prisma.vacationBalance.upsert({
      where: { employeeId },
      update: {
        totalDays: totalDays !== undefined ? totalDays : undefined,
        carriedOverDays: carriedOverDays !== undefined ? carriedOverDays : undefined,
        sickDaysAllowed: sickDaysAllowed !== undefined ? sickDaysAllowed : undefined,
      },
      create: {
        employeeId,
        year: new Date().getFullYear(),
        totalDays: totalDays || 20,
        carriedOverDays: carriedOverDays || 0,
        sickDaysAllowed: sickDaysAllowed || 5,
      },
    });

    return NextResponse.json(balance);
  } catch (error) {
    console.error("Error updating vacation balance:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du solde" },
      { status: 500 }
    );
  }
}
