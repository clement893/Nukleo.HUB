import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin, isErrorResponse } from "@/lib/api-auth";

// GET - Détail d'un sondage avec résultats
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;

  const survey = await prisma.survey.findUnique({
    where: { id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: {
          answers: true,
        },
      },
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

  // Calculer les statistiques par question
  const questionsWithStats = survey.questions.map((question) => {
    const answers = question.answers;
    let stats: any = { totalAnswers: answers.length };

    if (question.questionType === "single_choice" || question.questionType === "multiple_choice") {
      const options = question.options ? JSON.parse(question.options) : [];
      const choiceCounts: Record<string, number> = {};
      options.forEach((opt: string) => (choiceCounts[opt] = 0));

      answers.forEach((answer) => {
        if (question.questionType === "single_choice" && answer.choiceAnswer) {
          choiceCounts[answer.choiceAnswer] = (choiceCounts[answer.choiceAnswer] || 0) + 1;
        } else if (question.questionType === "multiple_choice" && answer.choicesAnswer) {
          const choices = JSON.parse(answer.choicesAnswer);
          choices.forEach((choice: string) => {
            choiceCounts[choice] = (choiceCounts[choice] || 0) + 1;
          });
        }
      });

      stats.choiceCounts = choiceCounts;
    } else if (question.questionType === "scale" || question.questionType === "rating") {
      const values = answers.map((a) => a.scaleAnswer).filter((v) => v !== null) as number[];
      if (values.length > 0) {
        stats.average = values.reduce((a, b) => a + b, 0) / values.length;
        stats.min = Math.min(...values);
        stats.max = Math.max(...values);
        stats.distribution = values.reduce((acc, val) => {
          acc[val] = (acc[val] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);
      }
    } else if (question.questionType === "text") {
      stats.textAnswers = answers.map((a) => a.textAnswer).filter(Boolean);
    }

    return { ...question, stats };
  });

  return NextResponse.json({
    ...survey,
    questions: questionsWithStats,
    responseCount: survey.responses.length,
  });
}

// PATCH - Mettre à jour un sondage (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;
  const data = await request.json();

  const updateData: any = {};
  if (data.title) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status) updateData.status = data.status;
  if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
  if (data.targetType) updateData.targetType = data.targetType;
  if (data.targetDepartment !== undefined) updateData.targetDepartment = data.targetDepartment;
  if (data.isAnonymous !== undefined) updateData.isAnonymous = data.isAnonymous;

  const survey = await prisma.survey.update({
    where: { id },
    data: updateData,
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(survey);
}

// DELETE - Supprimer un sondage (admin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin();
  if (isErrorResponse(authResult)) return authResult;

  const { id } = await params;

  await prisma.survey.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
