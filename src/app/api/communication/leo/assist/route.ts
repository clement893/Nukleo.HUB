import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { generateWritingAssistance } from "@/lib/leo-service";

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { clientId, contentType, topic, tone, length, additionalContext } = body;

    if (!clientId || !contentType || !topic) {
      return NextResponse.json(
        { error: "clientId, contentType et topic sont requis" },
        { status: 400 }
      );
    }

    const response = await generateWritingAssistance({
      clientId,
      contentType,
      topic,
      tone: tone || "professional",
      length: length || "medium",
      additionalContext,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in Leo assist API:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du contenu" },
      { status: 500 }
    );
  }
}
