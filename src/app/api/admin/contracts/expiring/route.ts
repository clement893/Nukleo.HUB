import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/auth";

// GET - Contrats expirant bientôt
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const contracts = await prisma.contract.findMany({
      where: {
        status: { in: ["active", "pending_signature"] },
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
      },
      include: {
        company: {
          select: { id: true, name: true },
        },
        supplier: {
          select: { id: true, name: true },
        },
      },
      orderBy: { endDate: "asc" },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    logger.error("Erreur récupération contrats expirants", error as Error, "GET /api/admin/contracts/expiring");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
