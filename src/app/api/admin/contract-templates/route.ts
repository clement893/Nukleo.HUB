import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["client", "supplier", "subcontractor", "nda", "service", "other"]),
  content: z.string().min(1),
  variables: z.string().optional(), // JSON array
  isActive: z.boolean().default(true),
});

// GET - Liste des templates
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const isActive = searchParams.get("isActive");

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (isActive !== null) where.isActive = isActive === "true";

    const templates = await prisma.contractTemplate.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    });

    return NextResponse.json(templates);
  } catch (error) {
    logger.error("Erreur récupération templates", error as Error, "GET /api/admin/contract-templates");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un template
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createTemplateSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const template = await prisma.contractTemplate.create({
      data: {
        ...validation.data,
        createdBy: user.id,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    logger.error("Erreur création template", error as Error, "POST /api/admin/contract-templates");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
