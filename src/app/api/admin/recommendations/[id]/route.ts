import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthUser } from "@/lib/api-auth";

// GET - Détails d'une recommandation
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const recommendation = await prisma.recommendation.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, photoUrl: true, department: true } },
      clientPortal: { select: { id: true, clientName: true } },
      votes: true,
    },
  });

  if (!recommendation) {
    return NextResponse.json({ error: "Recommandation non trouvée" }, { status: 404 });
  }

  return NextResponse.json(recommendation);
}

// PATCH - Mettre à jour une recommandation (statut, réponse admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult as AuthUser;

  const { id } = await params;
  const data = await request.json();

  const updateData: Record<string, unknown> = {};
  
  if (data.status) {
    updateData.status = data.status;
  }
  
  if (data.adminResponse !== undefined) {
    updateData.adminResponse = data.adminResponse;
    updateData.respondedAt = new Date();
    updateData.respondedBy = user.name || "Admin";
  }

  if (data.priority) {
    updateData.priority = data.priority;
  }

  const recommendation = await prisma.recommendation.update({
    where: { id },
    data: updateData,
    include: {
      employee: { select: { id: true, name: true, photoUrl: true, department: true } },
      clientPortal: { select: { id: true, clientName: true } },
    },
  });

  return NextResponse.json(recommendation);
}

// DELETE - Supprimer une recommandation
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  await prisma.recommendation.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
