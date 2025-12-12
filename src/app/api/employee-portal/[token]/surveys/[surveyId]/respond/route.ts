import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Soumettre une réponse à un sondage
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string; surveyId: string }> }
) {
  const { token, surveyId } = await params;

  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });

  if (!portal || !portal.isActive) {
    return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
  }

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

  const data = await request.json();
  const { answers } = data;

  // Transformer les réponses du format frontend au format backend
  const answersArray = Object.entries(answers).map(([questionId, answer]) => {
    const question = survey.questions.find(q => q.id === questionId);
    
    if (!question) {
      return null;
    }

    let answerData: any = {
      questionId,
      textAnswer: null,
      choiceAnswer: null,
      choicesAnswer: null,
      scaleAnswer: null,
    };

    switch (question.questionType) {
      case "text":
        answerData.textAnswer = String(answer);
        break;
      case "multiple_choice":
      case "yes_no":
        answerData.choiceAnswer = String(answer);
        break;
      case "checkbox":
        answerData.choicesAnswer = Array.isArray(answer) ? JSON.stringify(answer) : null;
        break;
      case "rating":
        answerData.scaleAnswer = typeof answer === "number" ? answer : parseInt(String(answer), 10);
        break;
      default:
        answerData.textAnswer = String(answer);
    }

    return answerData;
  }).filter(Boolean);

  // Créer la réponse
  const response = await prisma.surveyResponse.create({
    data: {
      surveyId,
      employeeId: survey.isAnonymous ? null : portal.employeeId,
      answers: {
        create: answersArray,
      },
    },
    include: {
      answers: true,
    },
  });

  return NextResponse.json(response, { status: 201 });
}
