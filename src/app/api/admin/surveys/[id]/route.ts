import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

// GET - Détails d'un sondage avec questions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        include: {
          employee: { select: { id: true, name: true, department: true } },
          answers: true,
        },
      },
    },
  });

  if (!survey) {
    return NextResponse.json({ error: "Sondage non trouvé" }, { status: 404 });
  }

  return NextResponse.json(survey);
}

// PUT - Mettre à jour un sondage
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;
  const data = await request.json();

  // Supprimer les anciennes questions
  await prisma.surveyQuestion.deleteMany({
    where: { surveyId: id },
  });

  // Mettre à jour le sondage avec les nouvelles questions
  const survey = await prisma.survey.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      targetType: data.targetType || "all",
      targetDepartment: data.targetDepartment || null,
      isAnonymous: data.isAnonymous || false,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      questions: {
        create: data.questions.map((q: Record<string, unknown>, index: number) => ({
          questionText: q.questionText,
          questionType: q.questionType,
          options: q.options || null,
          isRequired: q.isRequired ?? true,
          order: q.order ?? index,
          scaleMin: q.scaleMin || 1,
          scaleMax: q.scaleMax || 5,
          scaleMinLabel: q.scaleMinLabel || null,
          scaleMaxLabel: q.scaleMaxLabel || null,
        })),
      },
    },
    include: {
      questions: true,
    },
  });

  return NextResponse.json(survey);
}

// DELETE - Supprimer un sondage
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const { id } = await params;

  await prisma.survey.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
