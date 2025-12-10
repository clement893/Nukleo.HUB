import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les catégories
export async function GET() {
  try {
    const categories = await prisma.clientCategory.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { clients: true },
        },
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle catégorie
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, icon, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    // Trouver le prochain ordre
    const lastCategory = await prisma.clientCategory.findFirst({
      orderBy: { order: "desc" },
    });
    const nextOrder = (lastCategory?.order || 0) + 1;

    const category = await prisma.clientCategory.create({
      data: {
        name,
        color: color || "#6366f1",
        icon,
        description,
        order: nextOrder,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating category:", error);
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json(
        { error: "Une catégorie avec ce nom existe déjà" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}
