import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET - Liste toutes les recommandations (admin)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const recommendations = await prisma.recommendation.findMany({
    include: {
      employee: { select: { id: true, name: true, photoUrl: true, department: true } },
      clientPortal: { select: { id: true, clientName: true } },
      votes: true,
    },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ recommendations });
}

// POST - Créer une recommandation (admin)
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const data = await request.json();

  const recommendation = await prisma.recommendation.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category || "general",
      priority: data.priority || "medium",
      status: data.status || "pending",
      sourceType: "admin",
    },
  });

  return NextResponse.json(recommendation, { status: 201 });
}
