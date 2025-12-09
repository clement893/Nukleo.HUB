import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les données du portail client (accès public avec token)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Récupérer le portail avec le token
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
      include: {
        tickets: {
          orderBy: { createdAt: "desc" },
          include: {
            responses: {
              where: { isInternal: false }, // Ne pas montrer les notes internes
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!portal) {
      return NextResponse.json({ error: "Portal not found" }, { status: 404 });
    }

    if (!portal.isActive) {
      return NextResponse.json({ error: "Portal is inactive" }, { status: 403 });
    }

    // Récupérer les projets liés à ce client (par nom de client)
    const projects = await prisma.project.findMany({
      where: {
        client: {
          contains: portal.clientName,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
        stage: true,
        projectType: true,
        timeline: true,
        description: true,
        _count: {
          select: { tasks: true, milestones: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Récupérer les milestones des projets
    const projectIds = projects.map((p) => p.id);
    const milestones = await prisma.milestone.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      portal: {
        id: portal.id,
        clientName: portal.clientName,
        clientEmail: portal.clientEmail,
        welcomeMessage: portal.welcomeMessage,
      },
      projects: projects.map((p) => ({
        ...p,
        milestones: milestones.filter((m) => m.projectId === p.id),
      })),
      tickets: portal.tickets,
    });
  } catch (error) {
    console.error("Error fetching portal:", error);
    return NextResponse.json({ error: "Failed to fetch portal" }, { status: 500 });
  }
}
