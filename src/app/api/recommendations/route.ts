import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, isErrorResponse } from "@/lib/api-auth";

// GET - Liste toutes les recommandations (admin)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const sourceType = searchParams.get("sourceType");
  const category = searchParams.get("category");

  const where: any = {};
  if (status && status !== "all") where.status = status;
  if (sourceType && sourceType !== "all") where.sourceType = sourceType;
  if (category && category !== "all") where.category = category;

  const recommendations = await prisma.recommendation.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true, photoUrl: true, department: true } },
      clientPortal: { select: { id: true, clientName: true, companyId: true } },
      votes: true,
    },
    orderBy: [{ voteCount: "desc" }, { createdAt: "desc" }],
  });

  // Stats
  const stats = await prisma.recommendation.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  return NextResponse.json({
    recommendations,
    stats: stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
  });
}

// POST - Créer une recommandation (admin peut créer pour test)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const data = await request.json();

  const recommendation = await prisma.recommendation.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category || "general",
      priority: data.priority || "medium",
      sourceType: data.sourceType || "employee",
      employeeId: data.employeeId,
      clientPortalId: data.clientPortalId,
    },
  });

  return NextResponse.json(recommendation, { status: 201 });
}
