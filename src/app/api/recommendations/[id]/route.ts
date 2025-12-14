import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, isErrorResponse } from "@/lib/api-auth";

// GET - Détail d'une recommandation
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;

  const recommendation = await prisma.recommendation.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, photoUrl: true, department: true } },
      clientPortal: { select: { id: true, clientName: true, companyId: true } },
      votes: true,
    },
  });

  if (!recommendation) {
    return NextResponse.json({ error: "Recommandation non trouvée" }, { status: 404 });
  }

  return NextResponse.json(recommendation);
}

// PATCH - Mettre à jour une recommandation (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;
  const user = authResult;

  const { id } = await params;
  const data = await request.json();

  const updateData: any = {};
  if (data.status) updateData.status = data.status;
  if (data.priority) updateData.priority = data.priority;
  if (data.category) updateData.category = data.category;
  if (data.adminResponse !== undefined) {
    updateData.adminResponse = data.adminResponse;
    updateData.respondedAt = new Date();
    updateData.respondedBy = user.name || user.email;
  }

  const recommendation = await prisma.recommendation.update({
    where: { id },
    data: updateData,
    include: {
      employee: { select: { id: true, name: true, photoUrl: true, department: true } },
      clientPortal: { select: { id: true, clientName: true, companyId: true } },
      votes: true,
    },
  });

  return NextResponse.json(recommendation);
}

// DELETE - Supprimer une recommandation (admin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;

  await prisma.recommendation.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
