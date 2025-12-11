import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// POST - Reconnaître une politique
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { employeeId, policyId } = body;

    if (!employeeId || !policyId) {
      return NextResponse.json({ error: "employeeId et policyId requis" }, { status: 400 });
    }

    // Récupérer l'IP (pour audit)
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : "unknown";

    // Créer l'acknowledgment
    const acknowledgment = await prisma.policyAcknowledgment.upsert({
      where: {
        employeeId_policyId: { employeeId, policyId }
      },
      update: {
        acknowledgedAt: new Date(),
        ipAddress
      },
      create: {
        employeeId,
        policyId,
        ipAddress
      }
    });

    return NextResponse.json(acknowledgment);
  } catch (error) {
    console.error("Erreur acknowledge POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
