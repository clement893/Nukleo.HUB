import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Liste des sondages actifs pour l'employé
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });

  if (!portal || !portal.isActive) {
    return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
  }

  const now = new Date();

  // Récupérer les sondages actifs pour cet employé
  const surveys = await prisma.survey.findMany({
    where: {
      status: "active",
      AND: [
        {
          OR: [
            { startDate: null },
            { startDate: { lte: now } },
          ],
        },
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
        {
          OR: [
            { targetType: "all" },
            { targetType: "department", targetDepartment: portal.employee.department },
          ],
        },
      ],
    },
    include: {
      questions: { orderBy: { order: "asc" } },
      responses: {
        where: { employeeId: portal.employeeId },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Marquer les sondages déjà complétés
  const surveysWithStatus = surveys.map((survey) => ({
    ...survey,
    hasResponded: survey.responses.length > 0,
    questionCount: survey.questions.length,
  }));

  return NextResponse.json({ surveys: surveysWithStatus });
}

// POST - Soumettre une réponse à un sondage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });

  if (!portal || !portal.isActive) {
    return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
  }

  const data = await request.json();
  const { surveyId, answers } = data;

  // Vérifier que le sondage existe et est actif
  const survey = await prisma.survey.findUnique({
    where: { id: surveyId },
    include: { questions: true },
  });

  if (!survey || survey.status !== "active") {
    return NextResponse.json({ error: "Sondage non disponible" }, { status: 404 });
  }

  // Vérifier si l'employé a déjà répondu
  const existingResponse = await prisma.surveyResponse.findFirst({
    where: {
      surveyId,
      employeeId: portal.employeeId,
    },
  });

  if (existingResponse) {
    return NextResponse.json({ error: "Vous avez déjà répondu à ce sondage" }, { status: 400 });
  }

  // Créer la réponse
  const response = await prisma.surveyResponse.create({
    data: {
      surveyId,
      employeeId: survey.isAnonymous ? null : portal.employeeId,
      answers: {
        create: answers.map((answer: any) => ({
          questionId: answer.questionId,
          textAnswer: answer.textAnswer,
          choiceAnswer: answer.choiceAnswer,
          choicesAnswer: answer.choicesAnswer ? JSON.stringify(answer.choicesAnswer) : null,
          scaleAnswer: answer.scaleAnswer,
        })),
      },
    },
    include: {
      answers: true,
    },
  });

  return NextResponse.json(response, { status: 201 });
}
