import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// Jours fériés du Canada (Québec) pour 2024 et 2025
const CANADIAN_HOLIDAYS = [
  // 2024
  { date: "2024-01-01", name: "Jour de l'An", type: "holiday" },
  { date: "2024-03-29", name: "Vendredi saint", type: "holiday" },
  { date: "2024-04-01", name: "Lundi de Pâques", type: "holiday" },
  { date: "2024-05-20", name: "Journée nationale des patriotes", type: "holiday" },
  { date: "2024-06-24", name: "Fête nationale du Québec", type: "holiday" },
  { date: "2024-07-01", name: "Fête du Canada", type: "holiday" },
  { date: "2024-09-02", name: "Fête du Travail", type: "holiday" },
  { date: "2024-10-14", name: "Action de grâce", type: "holiday" },
  { date: "2024-12-25", name: "Noël", type: "holiday" },
  { date: "2024-12-26", name: "Lendemain de Noël", type: "holiday" },
  
  // 2025
  { date: "2025-01-01", name: "Jour de l'An", type: "holiday" },
  { date: "2025-04-18", name: "Vendredi saint", type: "holiday" },
  { date: "2025-04-21", name: "Lundi de Pâques", type: "holiday" },
  { date: "2025-05-19", name: "Journée nationale des patriotes", type: "holiday" },
  { date: "2025-06-24", name: "Fête nationale du Québec", type: "holiday" },
  { date: "2025-07-01", name: "Fête du Canada", type: "holiday" },
  { date: "2025-09-01", name: "Fête du Travail", type: "holiday" },
  { date: "2025-10-13", name: "Action de grâce", type: "holiday" },
  { date: "2025-12-25", name: "Noël", type: "holiday" },
  { date: "2025-12-26", name: "Lendemain de Noël", type: "holiday" },
  
  // 2026
  { date: "2026-01-01", name: "Jour de l'An", type: "holiday" },
  { date: "2026-04-03", name: "Vendredi saint", type: "holiday" },
  { date: "2026-04-06", name: "Lundi de Pâques", type: "holiday" },
  { date: "2026-05-18", name: "Journée nationale des patriotes", type: "holiday" },
  { date: "2026-06-24", name: "Fête nationale du Québec", type: "holiday" },
  { date: "2026-07-01", name: "Fête du Canada", type: "holiday" },
  { date: "2026-09-07", name: "Fête du Travail", type: "holiday" },
  { date: "2026-10-12", name: "Action de grâce", type: "holiday" },
  { date: "2026-12-25", name: "Noël", type: "holiday" },
  { date: "2026-12-26", name: "Lendemain de Noël", type: "holiday" },
];

// Fermetures du bureau
const OFFICE_CLOSURES = [
  // Fermeture des fêtes 2024-2025
  { startDate: "2024-12-24", endDate: "2025-01-01", name: "Fermeture des fêtes", type: "closure" },
  // Fermeture des fêtes 2025-2026
  { startDate: "2025-12-24", endDate: "2026-01-01", name: "Fermeture des fêtes", type: "closure" },
];

interface AgendaEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string | null;
  allDay: boolean;
  type: "vacation" | "holiday" | "closure";
  color: string;
  employeeId?: string;
  employeeName?: string;
  employeePhoto?: string | null;
  status?: string;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const startParam = searchParams.get("start");
    const endParam = searchParams.get("end");

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: "Les paramètres start et end sont requis" },
        { status: 400 }
      );
    }

    const startDate = new Date(startParam);
    const endDate = new Date(endParam);

    const events: AgendaEvent[] = [];

    // 1. Récupérer les vacances approuvées des employés
    const vacations = await prisma.vacationRequest.findMany({
      where: {
        status: "approved",
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            department: true,
          },
        },
      },
    });

    for (const vacation of vacations) {
      const typeLabels: Record<string, string> = {
        vacation: "Vacances",
        sick: "Maladie",
        personal: "Personnel",
        unpaid: "Sans solde",
        other: "Autre",
      };

      events.push({
        id: `vacation-${vacation.id}`,
        title: `${vacation.employee.fullName} - ${typeLabels[vacation.type] || vacation.type}`,
        startDate: vacation.startDate.toISOString(),
        endDate: vacation.endDate.toISOString(),
        allDay: true,
        type: "vacation",
        color: getVacationColor(vacation.type),
        employeeId: vacation.employee.id,
        employeeName: vacation.employee.fullName,
        employeePhoto: vacation.employee.photoUrl,
        status: vacation.status,
      });
    }

    // 2. Ajouter les jours fériés dans la plage de dates
    for (const holiday of CANADIAN_HOLIDAYS) {
      const holidayDate = new Date(holiday.date);
      if (holidayDate >= startDate && holidayDate <= endDate) {
        events.push({
          id: `holiday-${holiday.date}`,
          title: holiday.name,
          startDate: holidayDate.toISOString(),
          endDate: holidayDate.toISOString(),
          allDay: true,
          type: "holiday",
          color: "#dc2626", // Rouge pour les jours fériés
        });
      }
    }

    // 3. Ajouter les fermetures du bureau
    for (const closure of OFFICE_CLOSURES) {
      const closureStart = new Date(closure.startDate);
      const closureEnd = new Date(closure.endDate);
      
      // Vérifier si la fermeture chevauche la plage de dates demandée
      if (closureStart <= endDate && closureEnd >= startDate) {
        events.push({
          id: `closure-${closure.startDate}`,
          title: closure.name,
          startDate: closureStart.toISOString(),
          endDate: closureEnd.toISOString(),
          allDay: true,
          type: "closure",
          color: "#7c3aed", // Violet pour les fermetures
        });
      }
    }

    // Trier par date de début
    events.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching agenda vacations:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des données" },
      { status: 500 }
    );
  }
}

function getVacationColor(type: string): string {
  const colors: Record<string, string> = {
    vacation: "#0ea5e9", // Bleu ciel pour vacances
    sick: "#f97316",     // Orange pour maladie
    personal: "#8b5cf6", // Violet pour personnel
    unpaid: "#6b7280",   // Gris pour sans solde
    other: "#14b8a6",    // Teal pour autre
  };
  return colors[type] || "#6b7280";
}
