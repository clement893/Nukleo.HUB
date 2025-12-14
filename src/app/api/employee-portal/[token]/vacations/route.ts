import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les demandes de vacances et le solde de l'employé
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Vérifier le portail et récupérer l'employé
    const portal = await prisma.employeePortal.findUnique({
      where: { token },
      include: {
        employee: true,
      },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json(
        { error: "Portail non trouvé ou inactif" },
        { status: 404 }
      );
    }

    const employeeId = portal.employeeId;

    // Récupérer les demandes de vacances
    const vacationRequests = await prisma.vacationRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer ou créer le solde de vacances
    let vacationBalance = await prisma.vacationBalance.findUnique({
      where: { employeeId },
    });

    if (!vacationBalance) {
      vacationBalance = await prisma.vacationBalance.create({
        data: {
          employeeId,
          year: new Date().getFullYear(),
          totalDays: 20,
          usedDays: 0,
          pendingDays: 0,
          carriedOverDays: 0,
          sickDaysUsed: 0,
          sickDaysAllowed: 5,
        },
      });
    }

    // Calculer les jours en attente
    const pendingRequests = vacationRequests.filter(
      (r) => r.status === "pending" && r.type === "vacation"
    );
    const pendingDays = pendingRequests.reduce((sum, r) => sum + r.totalDays, 0);

    return NextResponse.json({
      requests: vacationRequests,
      balance: {
        ...vacationBalance,
        pendingDays,
        availableDays:
          vacationBalance.totalDays +
          vacationBalance.carriedOverDays -
          vacationBalance.usedDays -
          pendingDays,
      },
    });
  } catch (error) {
    console.error("Error fetching vacation requests:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des demandes" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle demande de vacances
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    // Vérifier le portail
    const portal = await prisma.employeePortal.findUnique({
      where: { token },
      include: {
        employee: true,
      },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json(
        { error: "Portail non trouvé ou inactif" },
        { status: 404 }
      );
    }

    const employeeId = portal.employeeId;
    const { type, startDate, endDate, reason } = body;

    // Validation
    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Type, date de début et date de fin sont requis" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        { error: "La date de début doit être avant la date de fin" },
        { status: 400 }
      );
    }

    // Calculer le nombre de jours (excluant weekends)
    let totalDays = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        totalDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    // Vérifier le solde disponible pour les vacances
    if (type === "vacation") {
      const balance = await prisma.vacationBalance.findUnique({
        where: { employeeId },
      });

      if (balance) {
        const pendingRequests = await prisma.vacationRequest.findMany({
          where: {
            employeeId,
            status: "pending",
            type: "vacation",
          },
        });
        const pendingDays = pendingRequests.reduce(
          (sum, r) => sum + r.totalDays,
          0
        );
        const availableDays =
          balance.totalDays +
          balance.carriedOverDays -
          balance.usedDays -
          pendingDays;

        if (totalDays > availableDays) {
          return NextResponse.json(
            {
              error: `Solde insuffisant. Vous avez ${availableDays} jours disponibles.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // Vérifier les chevauchements avec d'autres demandes approuvées ou en attente
    const overlappingRequests = await prisma.vacationRequest.findMany({
      where: {
        employeeId,
        status: { in: ["pending", "approved"] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlappingRequests.length > 0) {
      return NextResponse.json(
        { error: "Une demande existe déjà pour cette période" },
        { status: 400 }
      );
    }

    // Créer la demande
    const vacationRequest = await prisma.vacationRequest.create({
      data: {
        employeeId,
        type,
        startDate: start,
        endDate: end,
        totalDays,
        reason,
        status: "pending",
      },
    });

    return NextResponse.json(vacationRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating vacation request:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la demande" },
      { status: 500 }
    );
  }
}

// DELETE - Annuler une demande de vacances (seulement si en attente)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("id");

    if (!requestId) {
      return NextResponse.json(
        { error: "ID de la demande requis" },
        { status: 400 }
      );
    }

    // Vérifier le portail
    const portal = await prisma.employeePortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json(
        { error: "Portail non trouvé ou inactif" },
        { status: 404 }
      );
    }

    // Vérifier que la demande appartient à l'employé et est en attente
    const vacationRequest = await prisma.vacationRequest.findFirst({
      where: {
        id: requestId,
        employeeId: portal.employeeId,
        status: "pending",
      },
    });

    if (!vacationRequest) {
      return NextResponse.json(
        { error: "Demande non trouvée ou ne peut pas être annulée" },
        { status: 404 }
      );
    }

    // Mettre à jour le statut en "cancelled"
    await prisma.vacationRequest.update({
      where: { id: requestId },
      data: { status: "cancelled" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error cancelling vacation request:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'annulation de la demande" },
      { status: 500 }
    );
  }
}
