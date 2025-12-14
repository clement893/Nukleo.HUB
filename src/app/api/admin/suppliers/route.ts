import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const createSupplierSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["supplier", "subcontractor", "partner"]),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().default(true),
});

// GET - Liste des fournisseurs
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (isActive !== null) where.isActive = isActive === "true";
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { contracts: true },
        },
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    logger.error("Erreur récupération fournisseurs", error as Error, "GET /api/admin/suppliers");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un fournisseur
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createSupplierSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const supplier = await prisma.supplier.create({
      data: validation.data,
    });

    return NextResponse.json(supplier);
  } catch (error) {
    logger.error("Erreur création fournisseur", error as Error, "POST /api/admin/suppliers");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
