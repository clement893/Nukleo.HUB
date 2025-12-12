import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, AuthUser } from "@/lib/api-auth";

// GET - Liste tous les sondages (admin)
export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;

  const surveys = await prisma.survey.findMany({
    include: {
      _count: {
        select: {
          questions: true,
          responses: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const surveysWithCounts = surveys.map((survey) => ({
    ...survey,
    questionCount: survey._count.questions,
    responseCount: survey._count.responses,
  }));

  return NextResponse.json({ surveys: surveysWithCounts });
}

// POST - Créer un nouveau sondage
export async function POST(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const user = authResult as AuthUser;

  const data = await request.json();

  const survey = await prisma.survey.create({
    data: {
      title: data.title,
      description: data.description || null,
      targetType: data.targetType || "all",
      targetDepartment: data.targetDepartment || null,
      isAnonymous: data.isAnonymous || false,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: "draft",
      createdBy: user.id,
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

  return NextResponse.json(survey, { status: 201 });
}
