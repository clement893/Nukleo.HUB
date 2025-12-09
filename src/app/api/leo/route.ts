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

// Récupérer le contexte complet de Nukleo avec TOUTES les données
async function getNukleoContext() {
  const [
    projects,
    contacts,
    employees,
    tasks,
    opportunities,
    communicationClients,
    companies,
    policies,
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
        lead: true,
        departments: true,
        stage: true,
        description: true,
      },
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
        linkedinUrl: true,
        tags: true,
      },
    }),
    prisma.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        linkedinUrl: true,
        photoUrl: true,
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
    }),
    prisma.opportunity.findMany({
      select: {
        id: true,
        name: true,
        value: true,
        company: true,
        stage: true,
        contact: true,
        region: true,
        segment: true,
        projectType: true,
      },
    }),
    prisma.communicationClient.findMany({
      select: {
        id: true,
        name: true,
        company: true,
        industry: true,
        status: true,
        monthlyBudget: true,
        email: true,
        phone: true,
      },
    }),
    prisma.company.findMany({
      select: {
        id: true,
        name: true,
        industry: true,
        website: true,
        type: true,
        isClient: true,
        description: true,
      },
    }),
    prisma.policy.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        isActive: true,
      },
      where: { isActive: true },
    }),
  ]);

  return {
    projects,
    contacts,
    employees,
    tasks,
    opportunities,
    communicationClients,
    companies,
    policies,
    stats: {
      totalProjects: projects.length,
      totalContacts: contacts.length,
      totalEmployees: employees.length,
      totalTasks: tasks.length,
      totalOpportunities: opportunities.length,
      totalCommunicationClients: communicationClients.length,
      totalCompanies: companies.length,
    },
  };
}

function buildSystemPrompt(context: Awaited<ReturnType<typeof getNukleoContext>>) {
  return `# LEO - Assistant IA de Nukleo

Tu es Leo, l'assistant IA intelligent de **Nukleo**, une agence de transformation numérique et d'intelligence artificielle basée à Montréal, Québec, Canada.

## À PROPOS DE NUKLEO
Nukleo est une agence spécialisée dans :
- La transformation numérique des entreprises
- L'intégration de l'intelligence artificielle
- Le développement web et mobile
- La communication numérique et le marketing digital
- La stratégie digitale et l'innovation

## TES RESPONSABILITÉS
Tu dois aider les employés de Nukleo avec :
1. **Recherche d'informations** : Trouver des contacts, projets, employés, opportunités
2. **Analyse des données** : Fournir des statistiques et insights
3. **Support opérationnel** : Aider à la gestion des tâches et projets
4. **Conseil stratégique** : Proposer des recommandations basées sur les données
5. **Réponses aux questions** : Répondre à toutes les questions sur l'entreprise

## INSTRUCTIONS IMPORTANTES
- **TOUJOURS répondre en français**
- **Être précis et factuel** : Utilise les données ci-dessous pour répondre
- **Être proactif** : Propose des informations complémentaires pertinentes
- **Être professionnel mais amical** : Tu fais partie de l'équipe
- **Si tu ne trouves pas l'info** : Dis-le clairement et propose des alternatives
- **Formater les réponses** : Utilise le markdown pour une meilleure lisibilité

## DONNÉES COMPLÈTES DE NUKLEO

### 📊 STATISTIQUES GLOBALES
- ${context.stats.totalProjects} projets
- ${context.stats.totalContacts} contacts
- ${context.stats.totalEmployees} employés
- ${context.stats.totalTasks} tâches
- ${context.stats.totalOpportunities} opportunités commerciales
- ${context.stats.totalCommunicationClients} clients communication
- ${context.stats.totalCompanies} entreprises

### 👥 ÉQUIPE NUKLEO (${context.employees.length} membres)
${context.employees.map(e => `- **${e.name}** | Rôle: ${e.role || 'Non défini'} | Département: ${e.department} | Email: ${e.email || 'N/A'} | LinkedIn: ${e.linkedinUrl || 'N/A'}`).join('\n')}

### 📁 TOUS LES PROJETS (${context.projects.length})
${context.projects.map(p => `- **${p.name}** | Client: ${p.client || 'N/A'} | Status: ${p.status || 'En cours'} | Type: ${p.projectType || 'N/A'} | Lead: ${p.lead || 'N/A'} | Budget: ${p.budget ? p.budget + '$' : 'N/A'} | Taux horaire: ${p.hourlyRate ? p.hourlyRate + '$/h' : 'N/A'}`).join('\n')}

### 💼 OPPORTUNITÉS COMMERCIALES (${context.opportunities.length})
${context.opportunities.map(o => `- **${o.name}** | Entreprise: ${o.company || 'N/A'} | Contact: ${o.contact || 'N/A'} | Stage: ${o.stage} | Valeur: ${o.value ? o.value + '$' : 'N/A'} | Région: ${o.region || 'N/A'} | Type: ${o.projectType || 'N/A'}`).join('\n')}

### 📞 TOUS LES CONTACTS (${context.contacts.length})
${context.contacts.map(c => `- **${c.fullName}** | Entreprise: ${c.company || 'N/A'} | Poste: ${c.position || 'N/A'} | Email: ${c.email || 'N/A'} | Téléphone: ${c.phone || 'N/A'} | Région: ${c.region || 'N/A'} | Domaine: ${c.employmentField || 'N/A'} | LinkedIn: ${c.linkedinUrl || 'N/A'} | Tags: ${c.tags || 'Aucun'}`).join('\n')}

### 🏢 ENTREPRISES (${context.companies.length})
${context.companies.map(c => `- **${c.name}** | Industrie: ${c.industry || 'N/A'} | Type: ${c.type || 'N/A'} | Client: ${c.isClient ? 'Oui' : 'Non'} | Site web: ${c.website || 'N/A'}`).join('\n')}

### 📋 TÂCHES EN COURS (${context.tasks.length})
${context.tasks.map(t => `- **${t.title}** | Projet: ${t.project?.name || 'Sans projet'} | Zone: ${t.zone} | Département: ${t.department} | Priorité: ${t.priority} | Assigné à: ${t.assignedEmployee?.name || 'Non assigné'} | Échéance: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString('fr-CA') : 'N/A'}`).join('\n')}

### 🎯 CLIENTS COMMUNICATION (${context.communicationClients.length})
${context.communicationClients.map(c => `- **${c.name}** | Entreprise: ${c.company || 'N/A'} | Industrie: ${c.industry || 'N/A'} | Status: ${c.status} | Budget mensuel: ${c.monthlyBudget ? c.monthlyBudget + '$/mois' : 'N/A'} | Email: ${c.email || 'N/A'}`).join('\n')}

### 📜 POLITIQUES INTERNES
${context.policies.map(p => `- **${p.title}** (${p.category}): ${p.content?.substring(0, 200)}...`).join('\n')}

## EXEMPLES DE QUESTIONS ET RÉPONSES

**Q: Qui est Daly Ann Zogbo ?**
R: Cherche dans les contacts et employés pour trouver cette personne et donne toutes les informations disponibles.

**Q: Quels sont les projets en cours ?**
R: Liste les projets avec leur status, client et responsable.

**Q: Qui travaille sur le projet X ?**
R: Trouve le projet et liste les tâches assignées pour identifier les personnes impliquées.

**Q: Combien d'opportunités avons-nous ?**
R: Donne le nombre total et un résumé par stage du pipeline.

## RAPPEL
Tu as accès à TOUTES les données ci-dessus. Utilise-les pour répondre de manière précise et complète. Si quelqu'un demande "Qui est X ?", cherche dans les contacts ET les employés pour trouver cette personne.`;
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
      max_tokens: 2000,
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
  const searchTerms = lowerMessage.split(/\s+/).filter(t => t.length > 2);

  // Recherche de personne spécifique (contact ou employé)
  const personSearch = searchTerms.some(term => 
    lowerMessage.includes("qui est") || 
    lowerMessage.includes("c'est qui") ||
    lowerMessage.includes("connais-tu") ||
    lowerMessage.includes("trouver")
  );

  if (personSearch) {
    // Chercher dans les contacts
    const matchingContacts = context.contacts.filter(c => 
      searchTerms.some(term => 
        c.fullName?.toLowerCase().includes(term) ||
        c.company?.toLowerCase().includes(term)
      )
    );

    // Chercher dans les employés
    const matchingEmployees = context.employees.filter(e => 
      searchTerms.some(term => 
        e.name?.toLowerCase().includes(term)
      )
    );

    if (matchingContacts.length > 0 || matchingEmployees.length > 0) {
      let response = "🔍 **Résultats de recherche :**\n\n";
      
      if (matchingEmployees.length > 0) {
        response += "**👥 Employés Nukleo :**\n";
        matchingEmployees.forEach(e => {
          response += `\n**${e.name}**\n`;
          response += `- 🏢 Département: ${e.department}\n`;
          response += `- 💼 Rôle: ${e.role || 'Non défini'}\n`;
          response += `- 📧 Email: ${e.email || 'N/A'}\n`;
          if (e.linkedinUrl) response += `- 🔗 LinkedIn: ${e.linkedinUrl}\n`;
        });
      }

      if (matchingContacts.length > 0) {
        response += "\n**📞 Contacts :**\n";
        matchingContacts.forEach(c => {
          response += `\n**${c.fullName}**\n`;
          response += `- 🏢 Entreprise: ${c.company || 'N/A'}\n`;
          response += `- 💼 Poste: ${c.position || 'N/A'}\n`;
          response += `- 📧 Email: ${c.email || 'N/A'}\n`;
          response += `- 📱 Téléphone: ${c.phone || 'N/A'}\n`;
          response += `- 🌍 Région: ${c.region || 'N/A'}\n`;
          response += `- 📝 Domaine: ${c.employmentField || 'N/A'}\n`;
          if (c.linkedinUrl) response += `- 🔗 LinkedIn: ${c.linkedinUrl}\n`;
          if (c.tags) response += `- 🏷️ Tags: ${c.tags}\n`;
        });
      }

      return response;
    } else {
      return `❌ Je n'ai pas trouvé de personne correspondant à votre recherche dans notre base de données.\n\nNous avons **${context.stats.totalContacts} contacts** et **${context.stats.totalEmployees} employés** enregistrés. Pouvez-vous préciser le nom ou l'entreprise ?`;
    }
  }

  // Recherche de projets
  if (lowerMessage.includes("projet") || lowerMessage.includes("project")) {
    const matchingProjects = context.projects.filter(p =>
      searchTerms.some(term =>
        p.name?.toLowerCase().includes(term) ||
        p.client?.toLowerCase().includes(term)
      )
    );

    if (matchingProjects.length > 0 && !lowerMessage.includes("tous") && !lowerMessage.includes("liste")) {
      let response = "📁 **Projets trouvés :**\n\n";
      matchingProjects.forEach(p => {
        response += `**${p.name}**\n`;
        response += `- 🏢 Client: ${p.client || 'N/A'}\n`;
        response += `- 📊 Status: ${p.status || 'En cours'}\n`;
        response += `- 👤 Lead: ${p.lead || 'N/A'}\n`;
        response += `- 💰 Budget: ${p.budget ? p.budget + '$' : 'N/A'}\n`;
        response += `- ⏱️ Taux horaire: ${p.hourlyRate ? p.hourlyRate + '$/h' : 'N/A'}\n\n`;
      });
      return response;
    }

    const projectList = context.projects
      .slice(0, 10)
      .map(p => `• **${p.name}** - ${p.client || 'N/A'} (${p.status || 'En cours'})`)
      .join('\n');
    return `📁 **Projets Nukleo (${context.stats.totalProjects} au total) :**\n\n${projectList}\n\nVoulez-vous plus de détails sur un projet en particulier ?`;
  }

  // Recherche de contacts
  if (lowerMessage.includes("contact") || lowerMessage.includes("client")) {
    const contactList = context.contacts
      .slice(0, 10)
      .map(c => `• **${c.fullName}** - ${c.company || 'N/A'} (${c.position || 'N/A'})`)
      .join('\n');
    return `📞 **Contacts Nukleo (${context.stats.totalContacts} au total) :**\n\n${contactList}\n\nCherchez-vous quelqu'un en particulier ? Donnez-moi un nom ou une entreprise.`;
  }

  // Recherche d'employés
  if (lowerMessage.includes("employé") || lowerMessage.includes("équipe") || lowerMessage.includes("team") || lowerMessage.includes("membre")) {
    const employeeList = context.employees
      .map(e => `• **${e.name}** - ${e.role || 'N/A'} (${e.department})`)
      .join('\n');
    return `👥 **Équipe Nukleo (${context.stats.totalEmployees} membres) :**\n\n${employeeList}\n\nVoulez-vous plus d'informations sur un membre de l'équipe ?`;
  }

  // Recherche de tâches
  if (lowerMessage.includes("tâche") || lowerMessage.includes("task") || lowerMessage.includes("todo")) {
    const taskList = context.tasks
      .slice(0, 10)
      .map(t => `• **${t.title}** - ${t.project?.name || 'Sans projet'} (Assigné: ${t.assignedEmployee?.name || 'Non assigné'})`)
      .join('\n');
    return `📋 **Tâches en cours (${context.stats.totalTasks} au total) :**\n\n${taskList}`;
  }

  // Opportunités
  if (lowerMessage.includes("opportunité") || lowerMessage.includes("vente") || lowerMessage.includes("pipeline")) {
    const oppList = context.opportunities
      .slice(0, 10)
      .map(o => `• **${o.name}** - ${o.company || 'N/A'} - ${o.stage} - ${o.value ? o.value + '$' : 'N/A'}`)
      .join('\n');
    return `💼 **Opportunités commerciales (${context.stats.totalOpportunities} au total) :**\n\n${oppList}`;
  }

  // Statistiques générales
  if (lowerMessage.includes("stat") || lowerMessage.includes("résumé") || lowerMessage.includes("dashboard") || lowerMessage.includes("aperçu")) {
    return `📊 **Tableau de bord Nukleo :**

| Catégorie | Nombre |
|-----------|--------|
| 📁 Projets | ${context.stats.totalProjects} |
| 📞 Contacts | ${context.stats.totalContacts} |
| 👥 Employés | ${context.stats.totalEmployees} |
| 📋 Tâches | ${context.stats.totalTasks} |
| 💼 Opportunités | ${context.stats.totalOpportunities} |
| 🎯 Clients Communication | ${context.stats.totalCommunicationClients} |
| 🏢 Entreprises | ${context.stats.totalCompanies} |

Comment puis-je vous aider aujourd'hui ?`;
  }

  // Réponse par défaut
  return `👋 Bonjour ! Je suis **Leo**, l'assistant IA de Nukleo.

J'ai accès à toutes les données de l'entreprise :
- 📁 **${context.stats.totalProjects}** projets
- 📞 **${context.stats.totalContacts}** contacts
- 👥 **${context.stats.totalEmployees}** employés
- 📋 **${context.stats.totalTasks}** tâches
- 💼 **${context.stats.totalOpportunities}** opportunités

**Exemples de questions :**
- "Qui est [nom d'une personne] ?"
- "Quels sont les projets en cours ?"
- "Montre-moi l'équipe"
- "Quelles sont les opportunités ?"
- "Donne-moi un résumé"

*Note : Pour des réponses plus intelligentes, configurez la clé API OpenAI dans Railway.*`;
}
