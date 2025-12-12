import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { getClientContext, buildSystemPrompt, buildUserPrompt } from "@/lib/leo-service";

interface AssistanceRequest {
  clientId: string;
  contentType: "email" | "social_media" | "blog" | "newsletter" | "brief";
  topic: string;
  tone?: "professional" | "casual" | "friendly" | "formal";
  length?: "short" | "medium" | "long";
  additionalContext?: string;
}

/**
 * Appelle l'API OpenAI pour générer du contenu
 */
async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    // Retourner un contenu généré localement si pas de clé API
    return generateLocalContent(userPrompt);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.statusText);
      return generateLocalContent(userPrompt);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Erreur lors de la génération";
  } catch (error) {
    console.error("Error calling OpenAI:", error);
    return generateLocalContent(userPrompt);
  }
}

/**
 * Génère du contenu localement si l'API OpenAI n'est pas disponible
 */
function generateLocalContent(userPrompt: string): string {
  // Contenu généré localement basé sur le prompt
  const templates: Record<string, string> = {
    email: `Sujet: ${userPrompt}\n\nChère équipe,\n\nJe vous écris pour vous informer de ${userPrompt}.\n\nCordialement,\nLeo`,
    social_media: `📢 ${userPrompt}\n\n✨ Découvrez comment nous pouvons vous aider!\n\n#innovation #communication`,
    blog: `# ${userPrompt}\n\nDans cet article, nous explorons les aspects clés de ${userPrompt}.\n\n## Introduction\n\nLe sujet de ${userPrompt} est crucial pour...\n\n## Conclusion\n\nEn résumé, ${userPrompt} est important pour...`,
    newsletter: `Bonjour,\n\nCette semaine, nous vous parlons de ${userPrompt}.\n\nPoints clés:\n- Aspect 1 de ${userPrompt}\n- Aspect 2 de ${userPrompt}\n- Aspect 3 de ${userPrompt}\n\nÀ bientôt!`,
    brief: `Brief: ${userPrompt}\n\nObjectifs:\n- Communiquer efficacement sur ${userPrompt}\n- Engager l'audience\n- Créer un impact\n\nStratégie:\n- Utiliser un ton professionnel\n- Adapter le message au public cible\n- Mesurer les résultats`,
  };

  return templates[userPrompt.split(" ")[0]] || `Contenu généré pour: ${userPrompt}`;
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
    const content = await callOpenAI(systemPrompt, userPrompt);

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
