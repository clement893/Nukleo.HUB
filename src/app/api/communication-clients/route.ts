import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { logger } from "@/lib/logger";

/**
 * GET /api/communication-clients
 * Liste tous les clients de communication
 */
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: { status?: string } = {};
    if (status) {
      where.status = status;
    }

    const clients = await prisma.communicationClient.findMany({
      where,
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        phone: true,
        website: true,
        logoUrl: true,
        industry: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    logger.error("Error fetching communication clients", error as Error, "COMMUNICATION_CLIENTS_API");
    return NextResponse.json(
      { error: "Erreur lors de la récupération des clients de communication" },
      { status: 500 }
    );
  }
}

