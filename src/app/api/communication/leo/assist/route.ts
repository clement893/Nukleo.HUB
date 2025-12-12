import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { getClientContext, buildSystemPrompt, buildUserPrompt } from "@/lib/leo-service";
import { invokeLLM } from "@/server/_core/llm";

interface AssistanceRequest {
  clientId: string;
  contentType: "email" | "social_media" | "blog" | "newsletter" | "brief";
  topic: string;
  tone?: "professional" | "casual" | "friendly" | "formal";
  length?: "short" | "medium" | "long";
  additionalContext?: string;
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = (await request.json()) as AssistanceRequest;
    const { clientId, contentType, topic, tone, length, additionalContext } = body;

    if (!clientId || !contentType || !topic) {
      return NextResponse.json(
        { error: "clientId, contentType et topic sont requis" },
        { status: 400 }
      );
    }

    // Récupérer le contexte client
    const clientContext = await getClientContext(clientId);

    // Construire les prompts
    const systemPrompt = buildSystemPrompt(contentType, clientContext);
    const userPrompt = buildUserPrompt({
      clientId,
      contentType,
      topic,
      tone: tone as any,
      length: length as any,
      additionalContext,
    });

    // Générer le contenu avec Leo
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content || "Erreur lors de la génération";

    return NextResponse.json({
      content,
      metadata: {
        contentType,
        wordCount: content.split(/\s+/).length,
      },
    });
  } catch (error) {
    console.error("Error in Leo assist API:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du contenu" },
      { status: 500 }
    );
  }
}
