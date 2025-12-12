import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, isErrorResponse } from "@/lib/api-auth";

// GET - Liste tous les sondages (admin)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) return authResult;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  const where: any = {};
  if (status && status !== "all") where.status = status;

  const surveys = await prisma.survey.findMany({
    where,
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        include: {
          employee: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Ajouter les stats
  const surveysWithStats = surveys.map((survey) => ({
    ...survey,
    responseCount: survey.responses.length,
    questionCount: survey.questions.length,
  }));

  return NextResponse.json(surveysWithStats);
}

// POST - Créer un sondage (admin)
export async function POST(request: NextRequest) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;
  const user = authResult;

  const data = await request.json();

  const survey = await prisma.survey.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status || "draft",
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      targetType: data.targetType || "all",
      targetDepartment: data.targetDepartment,
      isAnonymous: data.isAnonymous || false,
      createdBy: user.name || user.email,
      questions: data.questions
        ? {
            create: data.questions.map((q: any, index: number) => ({
              questionText: q.questionText,
              questionType: q.questionType,
              options: q.options ? JSON.stringify(q.options) : null,
              isRequired: q.isRequired !== false,
              order: index,
              scaleMin: q.scaleMin,
              scaleMax: q.scaleMax,
              scaleMinLabel: q.scaleMinLabel,
              scaleMaxLabel: q.scaleMaxLabel,
            })),
          }
        : undefined,
    },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(survey, { status: 201 });
}
