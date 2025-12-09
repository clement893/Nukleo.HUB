import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer toutes les politiques
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") === "true";

    const policies = await prisma.policy.findMany({
      where: {
        ...(category && { category }),
        ...(activeOnly && { isActive: true })
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("Erreur policies GET:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une nouvelle politique
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, version, requiresAck } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const policy = await prisma.policy.create({
      data: {
        title,
        content,
        category,
        version: version || "1.0",
        requiresAck: requiresAck ?? true
      }
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Erreur policies POST:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour une politique
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const policy = await prisma.policy.update({
      where: { id },
      data
    });

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Erreur policies PUT:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
