import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer tous les clients (entreprises marquées comme clients)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const industry = searchParams.get("industry") || "";

    // Récupérer les entreprises qui sont des clients
    const companies = await prisma.company.findMany({
      where: {
        isClient: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(industry && { industry }),
      },
      orderBy: { name: "asc" },
    });

    // Pour chaque entreprise, récupérer les projets, contacts et portail
    const clientsWithDetails = await Promise.all(
      companies.map(async (company) => {
        // Projets liés à cette entreprise
        const projects = await prisma.project.findMany({
          where: {
            OR: [
              { clientId: company.id },
              { client: { contains: company.name, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            status: true,
            projectType: true,
            timeline: true,
            budget: true,
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        });

        // Contacts liés à cette entreprise
        const contacts = await prisma.contact.findMany({
          where: {
            OR: [
              { companyId: company.id },
              { company: { contains: company.name, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            position: true,
            photoUrl: true,
          },
          orderBy: { name: "asc" },
          take: 20,
        });

        // Portail client lié
        const portal = await prisma.clientPortal.findFirst({
          where: { companyId: company.id },
          select: {
            id: true,
            token: true,
            isActive: true,
            _count: { select: { tickets: true } },
          },
        });

        // Opportunités liées
        const opportunities = await prisma.opportunity.findMany({
          where: {
            OR: [
              { companyId: company.id },
              { company: { contains: company.name, mode: "insensitive" } },
            ],
          },
          select: {
            id: true,
            name: true,
            value: true,
            stage: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        });

        // Calculer le revenu total des projets
        const totalRevenue = projects.reduce((sum, p) => {
          const budget = parseFloat(p.budget?.replace(/[^0-9.-]/g, "") || "0");
          return sum + budget;
        }, 0);

        return {
          ...company,
          projects,
          contacts,
          portal,
          opportunities,
          stats: {
            projectCount: projects.length,
            contactCount: contacts.length,
            opportunityCount: opportunities.length,
            totalRevenue,
            hasPortal: !!portal,
            openTickets: portal?._count.tickets || 0,
          },
        };
      })
    );

    return NextResponse.json(clientsWithDetails);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

// POST - Créer un nouveau client (marquer une entreprise comme client)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, createPortal, welcomeMessage } = body;

    // Marquer l'entreprise comme client
    const company = await prisma.company.update({
      where: { id: companyId },
      data: { isClient: true },
    });

    // Créer un portail client si demandé
    let portal = null;
    if (createPortal) {
      portal = await prisma.clientPortal.create({
        data: {
          clientName: company.name,
          companyId: company.id,
          welcomeMessage: welcomeMessage || `Bienvenue ${company.name} ! Suivez vos projets et soumettez vos demandes ici.`,
        },
      });
    }

    return NextResponse.json({ company, portal }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}

// PATCH - Mettre à jour un client
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, isClient, createPortal, welcomeMessage } = body;

    if (isClient !== undefined) {
      await prisma.company.update({
        where: { id: companyId },
        data: { isClient },
      });
    }

    // Créer un portail si demandé
    if (createPortal) {
      const company = await prisma.company.findUnique({ where: { id: companyId } });
      if (company) {
        const existingPortal = await prisma.clientPortal.findFirst({
          where: { companyId },
        });

        if (!existingPortal) {
          await prisma.clientPortal.create({
            data: {
              clientName: company.name,
              companyId: company.id,
              welcomeMessage: welcomeMessage || `Bienvenue ${company.name} !`,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}
