import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// PATCH - Changer le statut d'un sondage
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const data = await request.json();

  if (!["draft", "active", "closed"].includes(data.status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const survey = await prisma.survey.update({
    where: { id },
    data: { status: data.status },
  });

  return NextResponse.json(survey);
}
