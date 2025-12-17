import { prisma } from "@/lib/prisma";

interface LeoAssistanceRequest {
  clientId: string;
  contentType: "email" | "social_media" | "blog" | "newsletter" | "brief";
  topic: string;
  tone?: "professional" | "casual" | "friendly" | "formal";
  length?: "short" | "medium" | "long";
  additionalContext?: string;
}

/**
 * Récupère le contexte client pour Leo
 */
export async function getClientContext(clientId: string): Promise<string> {
  try {
    const client = await prisma.communicationClient.findUnique({
      where: { id: clientId },
      include: {
        contextDocuments: {
          select: {
            title: true,
            description: true,
            documentType: true,
            extractedText: true,
          },
          orderBy: { uploadedAt: "desc" },
          take: 5, // Limiter aux 5 documents les plus récents
        },
      },
    });

    if (!client) {
      return "";
    }

    let contextText = `Client: ${client.name}\n`;
    if (client.description) {
      contextText += `Description: ${client.description}\n`;
    }
    if (client.industry) {
      contextText += `Industrie: ${client.industry}\n`;
    }
    if (client.website) {
      contextText += `Site web: ${client.website}\n`;
    }

    // Ajouter le contenu des documents de contexte
    if (client.contextDocuments.length > 0) {
      contextText += "\n--- Documents de contexte ---\n";
      for (const doc of client.contextDocuments) {
        contextText += `\n[${doc.documentType}] ${doc.title}\n`;
        if (doc.description) {
          contextText += `${doc.description}\n`;
        }
        if (doc.extractedText) {
          // Limiter la longueur du texte extrait
          const truncated =
            doc.extractedText.length > 1000
              ? doc.extractedText.substring(0, 1000) + "..."
              : doc.extractedText;
          contextText += `${truncated}\n`;
        }
      }
    }

    return contextText;
  } catch (error) {
    console.error("Error getting client context:", error);
    return "";
  }
}

/**
 * Construit le prompt système basé sur le type de contenu
 */
export function buildSystemPrompt(
  contentType: string,
  clientContext: string
): string {
  const basePrompt = `Tu es Leo, un assistant IA spécialisé dans la rédaction de contenu de communication pour les clients.

Contexte du client:
${clientContext}

Tu dois générer un contenu de haute qualité adapté au client, en utilisant les informations fournies dans le contexte.`;

  const typeSpecificPrompts: Record<string, string> = {
    email: `\nTu génères des emails professionnels et persuasifs. Assure-toi que le contenu est clair, concis et orienté vers l'action.`,
    social_media: `\nTu génères du contenu pour les réseaux sociaux. Le contenu doit être engageant, concis et adapté à la plateforme.`,
    blog: `\nTu génères des articles de blog informatifs et bien structurés. Assure-toi que le contenu est SEO-friendly et facile à lire.`,
    newsletter: `\nTu génères du contenu pour les newsletters. Le contenu doit être engageant et pertinent pour les abonnés.`,
    brief: `\nTu génères des briefs de communication clairs et structurés. Assure-toi que tous les éléments clés sont couverts.`,
  };

  return basePrompt + (typeSpecificPrompts[contentType] || "");
}

/**
 * Construit le prompt utilisateur
 */
export function buildUserPrompt(request: LeoAssistanceRequest): string {
  let prompt = `Génère un contenu de type "${request.contentType}" sur le sujet: "${request.topic}"`;

  if (request.tone) {
    prompt += `\nTon: ${request.tone}`;
  }

  if (request.length) {
    const lengthMap: Record<string, string> = {
      short: "court (moins de 100 mots)",
      medium: "moyen (100-300 mots)",
      long: "long (plus de 300 mots)",
    };
    prompt += `\nLongueur: ${lengthMap[request.length]}`;
  }

  if (request.additionalContext) {
    prompt += `\n\nContexte supplémentaire:\n${request.additionalContext}`;
  }

  return prompt;
}
