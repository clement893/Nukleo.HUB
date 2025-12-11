import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId } = body;

    if (!employeeId) {
      return NextResponse.json(
        { error: "employeeId requis" },
        { status: 400 }
      );
    }

    // Révoquer le token Google si possible
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { googleAccessToken: true },
    });

    if (employee?.googleAccessToken) {
      try {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${employee.googleAccessToken}`,
          { method: "POST" }
        );
      } catch (e) {
        // Ignorer les erreurs de révocation
        console.error("Token revocation error:", e);
      }
    }

    // Supprimer les tokens de l'employé
    await prisma.employee.update({
      where: { id: employeeId },
      data: {
        googleAccessToken: null,
        googleRefreshToken: null,
        googleTokenExpiry: null,
        googleCalendarId: null,
        googleCalendarSync: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Disconnect error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
