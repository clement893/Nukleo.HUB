import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

// Initialiser OpenAI seulement si la clé est disponible
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Récupérer le contexte complet de Nukleo
async function getNukleoContext() {
  const [
    projects,
    contacts,
    employees,
    tasks,
    opportunities,
    communicationClients,
  ] = await Promise.all([
    prisma.project.findMany({
      select: {
        id: true,
        name: true,
        client: true,
        status: true,
        timeline: true,
        budget: true,
        hourlyRate: true,
        projectType: true,
      },
      take: 50,
    }),
    prisma.contact.findMany({
      select: {
        id: true,
        fullName: true,
        company: true,
        position: true,
        email: true,
        phone: true,
        region: true,
        employmentField: true,
      },
      take: 100,
    }),
    prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
      },
    }),
    prisma.task.findMany({
      select: {
        id: true,
        title: true,
        zone: true,
        department: true,
        status: true,
        priority: true,
        dueDate: true,
        project: {
          select: { name: true },
        },
        assignedEmployee: {
          select: { name: true },
        },
      },
      take: 50,
    }),
    prisma.opportunity.findMany({
      select: {
        id: true,
        name: true,
        value: true,
        company: true,
        stage: true,
        contact: true,
      },
      take: 50,
    }),
    prisma.communicationClient.findMany({
      select: {
        id: true,
        name: true,
        company: true,
        industry: true,
        status: true,
        monthlyBudget: true,
      },
      take: 30,
    }),
  ]);

  return {
    projects,
    contacts,
    employees,
    tasks,
    opportunities,
    communicationClients,
    stats: {
      totalProjects: projects.length,
      totalContacts: contacts.length,
      totalEmployees: employees.length,
      totalTasks: tasks.length,
      totalOpportunities: opportunities.length,
      totalCommunicationClients: communicationClients.length,
    },
  };
}

function buildSystemPrompt(context: Awaited<ReturnType<typeof getNukleoContext>>) {
  return `Tu es Leo, l'assistant IA de Nukleo, une agence de transformation numérique et d'intelligence artificielle basée à Montréal.

Tu as accès à toutes les données de l'entreprise et tu peux aider les équipes avec :
- La gestion des projets et des tâches
- La recherche de contacts et d'opportunités
- L'analyse des performances et des statistiques
- Les recommandations stratégiques
- La coordination entre les équipes

DONNÉES ACTUELLES DE NUKLEO :

📊 STATISTIQUES :
- ${context.stats.totalProjects} projets
- ${context.stats.totalContacts} contacts
- ${context.stats.totalEmployees} employés
- ${context.stats.totalTasks} tâches
- ${context.stats.totalOpportunities} opportunités commerciales
- ${context.stats.totalCommunicationClients} clients communication

👥 ÉQUIPES :
${context.employees.map(e => `- ${e.name} (${e.role || 'Non défini'}) - ${e.department}`).join('\n')}

📁 PROJETS ACTIFS :
${context.projects.map(p => `- ${p.name} (${p.client || 'Client non défini'}) - Status: ${p.status || 'En cours'} - Budget: ${p.budget ? p.budget + '$' : 'Non défini'}`).join('\n')}

💼 OPPORTUNITÉS :
${context.opportunities.slice(0, 10).map(o => `- ${o.name} (${o.company || 'N/A'}) - ${o.stage} - Valeur: ${o.value ? o.value + '$' : 'Non définie'}`).join('\n')}

📞 CONTACTS RÉCENTS :
${context.contacts.slice(0, 15).map(c => `- ${c.fullName} (${c.company || 'N/A'}) - ${c.position || 'N/A'} - ${c.region || 'N/A'}`).join('\n')}

📋 TÂCHES EN COURS :
${context.tasks.slice(0, 10).map(t => `- ${t.title} (${t.project?.name || 'Sans projet'}) - ${t.zone} - Assigné: ${t.assignedEmployee?.name || 'Non assigné'}`).join('\n')}

🎯 CLIENTS COMMUNICATION :
${context.communicationClients.map(c => `- ${c.name} (${c.company || 'N/A'}) - ${c.industry || 'N/A'} - Budget: ${c.monthlyBudget ? c.monthlyBudget + '$/mois' : 'Non défini'}`).join('\n')}

INSTRUCTIONS :
- Réponds toujours en français
- Sois professionnel mais amical
- Utilise les données ci-dessus pour répondre aux questions
- Si tu ne trouves pas l'information, dis-le clairement
- Propose des actions concrètes quand c'est pertinent
- Tu peux suggérer des recherches dans les contacts, projets, etc.
- Aide à la prise de décision avec des analyses basées sur les données`;
}

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Récupérer le contexte Nukleo
    const context = await getNukleoContext();

    // Obtenir le client OpenAI
    const openai = getOpenAIClient();

    // Si pas de clé OpenAI, utiliser des réponses intelligentes basées sur les données
    if (!openai) {
      const fallbackResponse = generateFallbackResponse(message, context);
      return NextResponse.json({
        response: fallbackResponse,
        context: context.stats,
      });
    }

    // Construire les messages pour OpenAI
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: buildSystemPrompt(context) },
      ...conversationHistory.slice(-10).map((msg: { role: string; content: string }) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || "Je n'ai pas pu générer une réponse.";

    return NextResponse.json({
      response,
      context: context.stats,
    });
  } catch (error) {
    console.error("Error in Leo API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

function generateFallbackResponse(
  message: string,
  context: Awaited<ReturnType<typeof getNukleoContext>>
): string {
  const lowerMessage = message.toLowerCase();

  // Recherche de projets
  if (lowerMessage.includes("projet") || lowerMessage.includes("project")) {
    const projectList = context.projects
      .slice(0, 5)
      .map(p => `• **${p.name}** - ${p.client || 'Client non défini'} (${p.status || 'En cours'})`)
      .join('\n');
    return `📁 **Voici les projets actuels :**\n\n${projectList}\n\nNous avons **${context.stats.totalProjects} projets** au total. Voulez-vous plus de détails sur un projet en particulier ?`;
  }

  // Recherche de contacts
  if (lowerMessage.includes("contact") || lowerMessage.includes("client")) {
    const contactList = context.contacts
      .slice(0, 5)
      .map(c => `• **${c.fullName}** - ${c.company || 'N/A'} (${c.position || 'N/A'})`)
      .join('\n');
    return `📞 **Voici quelques contacts :**\n\n${contactList}\n\nNous avons **${context.stats.totalContacts} contacts** dans notre base. Cherchez-vous quelqu'un en particulier ?`;
  }

  // Recherche d'employés
  if (lowerMessage.includes("employé") || lowerMessage.includes("équipe") || lowerMessage.includes("team")) {
    const employeeList = context.employees
      .map(e => `• **${e.name}** - ${e.role || 'Rôle non défini'} (${e.department})`)
      .join('\n');
    return `👥 **Notre équipe Nukleo :**\n\n${employeeList}\n\nNous sommes **${context.stats.totalEmployees} personnes** au total !`;
  }

  // Recherche de tâches
  if (lowerMessage.includes("tâche") || lowerMessage.includes("task") || lowerMessage.includes("todo")) {
    const taskList = context.tasks
      .slice(0, 5)
      .map(t => `• **${t.title}** - ${t.project?.name || 'Sans projet'} (${t.zone})`)
      .join('\n');
    return `📋 **Tâches en cours :**\n\n${taskList}\n\nNous avons **${context.stats.totalTasks} tâches** au total.`;
  }

  // Opportunités
  if (lowerMessage.includes("opportunité") || lowerMessage.includes("vente") || lowerMessage.includes("pipeline")) {
    const oppList = context.opportunities
      .slice(0, 5)
      .map(o => `• **${o.name}** - ${o.company || 'N/A'} - ${o.stage}`)
      .join('\n');
    return `💼 **Opportunités commerciales :**\n\n${oppList}\n\nNous avons **${context.stats.totalOpportunities} opportunités** dans le pipeline.`;
  }

  // Statistiques générales
  if (lowerMessage.includes("stat") || lowerMessage.includes("résumé") || lowerMessage.includes("dashboard")) {
    return `📊 **Résumé Nukleo :**

• **${context.stats.totalProjects}** projets actifs
• **${context.stats.totalContacts}** contacts dans la base
• **${context.stats.totalEmployees}** membres dans l'équipe
• **${context.stats.totalTasks}** tâches en cours
• **${context.stats.totalOpportunities}** opportunités commerciales
• **${context.stats.totalCommunicationClients}** clients communication

Comment puis-je vous aider aujourd'hui ?`;
  }

  // Réponse par défaut
  return `👋 Bonjour ! Je suis **Leo**, l'assistant IA de Nukleo.

J'ai accès à toutes les données de l'entreprise :
• **${context.stats.totalProjects}** projets
• **${context.stats.totalContacts}** contacts
• **${context.stats.totalEmployees}** employés
• **${context.stats.totalTasks}** tâches
• **${context.stats.totalOpportunities}** opportunités

Posez-moi des questions sur les projets, contacts, équipes, tâches ou opportunités !

*Note : Pour des réponses plus avancées, configurez la clé API OpenAI.*`;
}
