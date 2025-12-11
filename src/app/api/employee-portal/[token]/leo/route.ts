import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import OpenAI from "openai";

async function getEmployeeFromToken(token: string) {
  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });
  if (!portal || !portal.isActive) return null;
  return portal.employee;
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

interface LeoContext {
  canAccessTasks: boolean;
  canAccessProjects: boolean;
  canAccessClients: boolean;
  canAccessContacts: boolean;
  canAccessFinancials: boolean;
  canAccessTeam: boolean;
  canAccessOpportunities: boolean;
  customInstructions: string | null;
  restrictedTopics: string | null;
}

async function getEmployeeContext(employeeId: string, leoContext: LeoContext | null) {
  // Récupérer les données de base
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      currentTask: {
        include: {
          project: true,
        },
      },
    },
  });

  // Récupérer les données selon les permissions
  const tasks = leoContext?.canAccessTasks !== false ? await prisma.task.findMany({
    where: {
      OR: [
        { assignedEmployee: { id: employeeId } },
        { assignedEmployee: { id: employeeId } },
      ],
    },
    include: {
      project: {
        select: { name: true, client: true },
      },
    },
    orderBy: { dueDate: "asc" },
    take: 20,
  }) : [];

  const timeEntries = await prisma.timeEntry.findMany({
    where: { employeeId },
    orderBy: { startTime: "desc" },
    take: 50,
  });

  const requests = await prisma.employeeRequest.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const events = await prisma.employeeEvent.findMany({
    where: {
      employeeId,
      startDate: { gte: new Date() },
    },
    orderBy: { startDate: "asc" },
    take: 10,
  });

  const projects = leoContext?.canAccessProjects !== false ? await prisma.project.findMany({
    where: {
      OR: [
        { status: "Actif" },
        { status: "En cours" },
      ],
    },
    select: {
      id: true,
      name: true,
      client: true,
      status: true,
      lead: true,
    },
    take: 20,
  }) : [];

  const policies = await prisma.policy.findMany({
    where: { isActive: true },
    select: {
      title: true,
      content: true,
      category: true,
    },
  });

  // Données optionnelles selon les permissions
  const clients = leoContext?.canAccessClients ? await prisma.company.findMany({
    where: { isClient: true },
    select: { name: true, industry: true },
    take: 20,
  }) : [];

  const contacts = leoContext?.canAccessContacts ? await prisma.contact.findMany({
    select: { fullName: true, company: true, position: true },
    take: 30,
  }) : [];

  const team = leoContext?.canAccessTeam ? await prisma.employee.findMany({
    select: { name: true, department: true, role: true },
    take: 30,
  }) : [];

  const opportunities = leoContext?.canAccessOpportunities ? await prisma.opportunity.findMany({
    where: {
      AND: [
        { stage: { not: { contains: "Perdu" } } },
        { stage: { not: { contains: "Gagn" } } },
      ],
    },
    select: { name: true, company: true, value: true, stage: true },
    take: 20,
  }) : [];

  const financials = leoContext?.canAccessFinancials ? {
    invoices: await prisma.invoice.count(),
    quotes: await prisma.quote.count(),
  } : null;

  const totalMinutes = timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

  return {
    employee,
    tasks,
    timeEntries,
    requests,
    events,
    projects,
    policies,
    clients,
    contacts,
    team,
    opportunities,
    financials,
    stats: {
      hoursThisMonth: Math.round(totalMinutes / 60 * 10) / 10,
      tasksInProgress: tasks.filter(t => t.status === "in_progress").length,
      tasksTodo: tasks.filter(t => t.status === "todo").length,
      pendingRequests: requests.filter(r => r.status === "pending").length,
    },
  };
}

function buildEmployeeSystemPrompt(
  context: Awaited<ReturnType<typeof getEmployeeContext>>,
  leoContext: LeoContext | null
) {
  let prompt = `# LEO - Assistant Personnel de ${context.employee?.name || "l'employé"}

Tu es Leo, l'assistant IA personnel de **${context.employee?.name || "l'employé"}** chez Nukleo.

## INFORMATIONS SUR L'EMPLOYÉ
- Nom: ${context.employee?.name}
- Département: ${context.employee?.department}
- Rôle: ${context.employee?.role || "Non défini"}
- Email: ${context.employee?.email || "N/A"}
- Capacité: ${context.employee?.capacityHoursPerWeek}h/semaine

## STATISTIQUES PERSONNELLES
- Heures ce mois: ${context.stats.hoursThisMonth}h
- Tâches en cours: ${context.stats.tasksInProgress}
- Tâches à faire: ${context.stats.tasksTodo}
- Demandes en attente: ${context.stats.pendingRequests}
`;

  // Ajouter les sections selon les permissions
  if (leoContext?.canAccessTasks !== false && context.tasks.length > 0) {
    prompt += `
## TES TÂCHES (${context.tasks.length})
${context.tasks.map(t => `- **${t.title}** | Projet: ${t.project?.name || 'Sans projet'} | Priorité: ${t.priority} | Status: ${t.status} | Échéance: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('fr-CA') : 'N/A'}`).join('\n')}
`;
  }

  if (context.events.length > 0) {
    prompt += `
## TES ÉVÉNEMENTS À VENIR (${context.events.length})
${context.events.map(e => `- **${e.title}** | ${new Date(e.startDate).toLocaleDateString('fr-CA')} ${e.allDay ? '(Journée complète)' : ''} | ${e.type}`).join('\n')}
`;
  }

  if (context.requests.length > 0) {
    prompt += `
## TES DEMANDES (${context.requests.length})
${context.requests.map(r => `- **${r.title}** | Type: ${r.type} | Status: ${r.status} | ${new Date(r.createdAt).toLocaleDateString('fr-CA')}`).join('\n')}
`;
  }

  if (leoContext?.canAccessProjects !== false && context.projects.length > 0) {
    prompt += `
## PROJETS ACTIFS (${context.projects.length})
${context.projects.map(p => `- **${p.name}** | Client: ${p.client || 'N/A'} | Lead: ${p.lead || 'N/A'}`).join('\n')}
`;
  }

  if (leoContext?.canAccessClients && context.clients.length > 0) {
    prompt += `
## CLIENTS (${context.clients.length})
${context.clients.map(c => `- **${c.name}** | Industrie: ${c.industry || 'N/A'}`).join('\n')}
`;
  }

  if (leoContext?.canAccessContacts && context.contacts.length > 0) {
    prompt += `
## CONTACTS (${context.contacts.length})
${context.contacts.map(c => `- **${c.fullName}** | ${c.company || 'N/A'} | ${c.position || 'N/A'}`).join('\n')}
`;
  }

  if (leoContext?.canAccessTeam && context.team.length > 0) {
    prompt += `
## ÉQUIPE (${context.team.length})
${context.team.map(e => `- **${e.name}** | ${e.department} | ${e.role || 'N/A'}`).join('\n')}
`;
  }

  if (leoContext?.canAccessOpportunities && context.opportunities.length > 0) {
    prompt += `
## PIPELINE COMMERCIAL (${context.opportunities.length})
${context.opportunities.map(o => `- **${o.name}** | ${o.company || 'N/A'} | ${o.value ? o.value.toLocaleString() + '$' : 'N/A'} | ${o.stage}`).join('\n')}
`;
  }

  if (leoContext?.canAccessFinancials && context.financials) {
    prompt += `
## FINANCES
- Nombre de factures: ${context.financials.invoices}
- Nombre de devis: ${context.financials.quotes}
`;
  }

  if (context.policies.length > 0) {
    prompt += `
## POLITIQUES INTERNES
${context.policies.map(p => `### ${p.title} (${p.category})\n${p.content?.substring(0, 500)}...`).join('\n\n')}
`;
  }

  prompt += `
## TES RESPONSABILITÉS
1. Aider ${context.employee?.name} avec ses tâches quotidiennes
2. Répondre aux questions sur les projets et l'entreprise
3. Fournir des informations sur les politiques internes
4. Aider à la gestion du temps et des priorités
5. Suggérer des améliorations de productivité

## INSTRUCTIONS
- Réponds toujours en français
- Sois amical et professionnel
- Utilise les données ci-dessus pour personnaliser tes réponses
- Propose des suggestions proactives quand c'est pertinent
- Formate tes réponses en markdown pour une meilleure lisibilité`;

  // Ajouter les instructions personnalisées
  if (leoContext?.customInstructions) {
    prompt += `

## INSTRUCTIONS PERSONNALISÉES
${leoContext.customInstructions}`;
  }

  // Ajouter les sujets restreints
  if (leoContext?.restrictedTopics) {
    prompt += `

## SUJETS INTERDITS
Tu ne dois PAS parler des sujets suivants: ${leoContext.restrictedTopics}
Si l'utilisateur pose des questions sur ces sujets, réponds poliment que tu n'es pas autorisé à discuter de ces sujets.`;
  }

  return prompt;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const employee = await getEmployeeFromToken(token);
    if (!employee) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message requis" },
        { status: 400 }
      );
    }

    // Récupérer le contexte Leo de l'employé
    const leoContextConfig = await prisma.employeeLeoContext.findUnique({
      where: { employeeId: employee.id },
    });

    const context = await getEmployeeContext(employee.id, leoContextConfig);
    const openai = getOpenAIClient();

    if (!openai) {
      return NextResponse.json({
        response: `Bonjour ${employee.name} ! Je suis Leo, ton assistant personnel. Malheureusement, je ne suis pas complètement configuré pour le moment. Voici un résumé de ta situation :\n\n- **${context.stats.tasksInProgress}** tâches en cours\n- **${context.stats.tasksTodo}** tâches à faire\n- **${context.stats.hoursThisMonth}h** travaillées ce mois\n\nContacte l'administrateur pour activer toutes mes fonctionnalités.`,
      });
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: buildEmployeeSystemPrompt(context, leoContextConfig) },
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
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content || "Je n'ai pas pu générer une réponse.";

    return NextResponse.json({
      response,
      stats: context.stats,
    });
  } catch (error) {
    console.error("Error in Leo Employee API:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
