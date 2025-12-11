import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// Configuration OpenAI (utiliser la clé depuis les variables d'environnement)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

// Contexte système pour l'assistant Nukleo
const SYSTEM_CONTEXT = `Tu es l'assistant IA de Nukleo, une agence de transformation numérique et d'intelligence artificielle basée au Québec.

Tu aides les employés de Nukleo à:
- Trouver des informations sur les politiques internes
- Comprendre les processus et procédures de l'entreprise
- Répondre aux questions sur les outils et technologies utilisés
- Guider dans l'utilisation de la plateforme Nukleo Hub
- Fournir des conseils sur les meilleures pratiques

Informations sur Nukleo:
- Équipes: Lab (développement), Bureau (commercial/admin), Studio (design/création), Admin
- Services: Transformation numérique, développement web/mobile, IA, design UX/UI, marketing digital
- Valeurs: Innovation, collaboration, excellence, agilité

Réponds toujours en français, de manière professionnelle mais amicale.
Si tu ne connais pas la réponse, suggère de contacter le responsable approprié.
Garde tes réponses concises et utiles.`;

// POST - Envoyer un message au chat IA
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { employeeId, message, conversationHistory = [] } = body;

    if (!message) {
      return NextResponse.json({ error: "Message requis" }, { status: 400 });
    }

    // Récupérer les politiques actives pour le contexte
    const policies = await prisma.policy.findMany({
      where: { isActive: true },
      select: { title: true, content: true, category: true }
    });

    // Construire le contexte avec les politiques
    const policiesContext = policies.length > 0
      ? `\n\nPolitiques internes disponibles:\n${policies.map(p => 
          `- ${p.title} (${p.category}): ${p.content.substring(0, 200)}...`
        ).join("\n")}`
      : "";

    // Construire les messages pour l'API
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_CONTEXT + policiesContext },
      ...conversationHistory.map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      })),
      { role: "user", content: message }
    ];

    // Sauvegarder le message utilisateur si employeeId fourni
    if (employeeId) {
      await prisma.chatMessage.create({
        data: {
          employeeId,
          role: "user",
          content: message
        }
      });
    }

    // Appeler l'API OpenAI
    let assistantMessage = "";
    
    if (process.env.OPENAI_API_KEY) {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      assistantMessage = completion.choices[0]?.message?.content || "Désolé, je n'ai pas pu générer de réponse.";
    } else {
      // Mode fallback sans clé API
      assistantMessage = generateFallbackResponse(message, policies);
    }

    // Sauvegarder la réponse de l'assistant
    if (employeeId) {
      await prisma.chatMessage.create({
        data: {
          employeeId,
          role: "assistant",
          content: assistantMessage
        }
      });
    }

    return NextResponse.json({
      message: assistantMessage,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erreur chat IA:", error);
    return NextResponse.json({ 
      message: "Je suis temporairement indisponible. Veuillez réessayer dans quelques instants ou contacter votre responsable.",
      error: true 
    }, { status: 200 });
  }
}

// GET - Récupérer l'historique des conversations
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId requis" }, { status: 400 });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return NextResponse.json(messages.reverse());
  } catch (error) {
    console.error("Erreur chat GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// Fonction de réponse fallback sans API OpenAI
function generateFallbackResponse(message: string, policies: { title: string; content: string; category: string }[]): string {
  const lowerMessage = message.toLowerCase();

  // Recherche dans les politiques
  const matchingPolicy = policies.find(p => 
    lowerMessage.includes(p.title.toLowerCase()) ||
    lowerMessage.includes(p.category.toLowerCase())
  );

  if (matchingPolicy) {
    return `📋 **${matchingPolicy.title}**\n\n${matchingPolicy.content.substring(0, 500)}${matchingPolicy.content.length > 500 ? "..." : ""}\n\nPour plus de détails, consultez la section Politiques dans votre espace employé.`;
  }

  // Réponses prédéfinies
  if (lowerMessage.includes("bonjour") || lowerMessage.includes("salut") || lowerMessage.includes("hello")) {
    return "Bonjour! 👋 Je suis l'assistant Nukleo. Comment puis-je vous aider aujourd'hui?";
  }

  if (lowerMessage.includes("équipe") || lowerMessage.includes("département")) {
    return "Nukleo est organisé en 4 équipes:\n\n• **Lab** - Développement et innovation technologique\n• **Bureau** - Commercial, administration et gestion de projets\n• **Studio** - Design, création et production visuelle\n• **Admin** - Support et opérations\n\nChaque équipe a ses propres processus et outils. Avez-vous une question spécifique sur une équipe?";
  }

  if (lowerMessage.includes("outil") || lowerMessage.includes("plateforme") || lowerMessage.includes("hub")) {
    return "Le Nukleo Hub est votre plateforme centrale pour:\n\n• Gérer vos tâches et projets\n• Suivre votre temps de travail\n• Accéder aux informations clients\n• Consulter les politiques internes\n• Communiquer avec l'équipe\n\nQue souhaitez-vous savoir de plus?";
  }

  if (lowerMessage.includes("congé") || lowerMessage.includes("vacance") || lowerMessage.includes("absence")) {
    return "Pour les demandes de congés et absences, veuillez:\n\n1. Consulter la politique RH dans la section Politiques\n2. Soumettre votre demande via le système de gestion\n3. Informer votre responsable d'équipe\n\nLes délais de préavis varient selon le type de congé.";
  }

  if (lowerMessage.includes("aide") || lowerMessage.includes("help")) {
    return "Je peux vous aider avec:\n\n• 📋 Questions sur les politiques internes\n• 🏢 Informations sur l'organisation\n• 🛠️ Utilisation de la plateforme\n• 📅 Processus et procédures\n• 💡 Conseils et bonnes pratiques\n\nPosez-moi votre question!";
  }

  return "Je comprends votre question. Pour le moment, je n'ai pas d'information spécifique à ce sujet dans ma base de connaissances.\n\nJe vous suggère de:\n• Consulter la section Politiques du Hub\n• Contacter votre responsable d'équipe\n• Envoyer un email à admin@nukleo.ca\n\nPuis-je vous aider avec autre chose?";
}
