import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";

    const where: Record<string, unknown> = {};
    if (category) {
      where.category = category;
    }

    const settings = await prisma.systemSettings.findMany({
      where,
      orderBy: [{ category: "asc" }, { key: "asc" }],
    });

    // Grouper par catégorie
    const grouped = settings.reduce((acc, setting) => {
      const cat = setting.category || "general";
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push(setting);
      return acc;
    }, {} as Record<string, typeof settings>);

    return NextResponse.json({ settings, grouped });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    
    const setting = await prisma.systemSettings.upsert({
      where: { key: body.key },
      update: {
        value: body.value,
        description: body.description,
        category: body.category,
        updatedBy: body.updatedBy,
      },
      create: {
        key: body.key,
        value: body.value,
        description: body.description,
        category: body.category,
        updatedBy: body.updatedBy,
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error saving setting:", error);
    return NextResponse.json(
      { error: "Failed to save setting" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    
    // Mise à jour en batch
    const updates = body.settings as Array<{
      key: string;
      value: string;
      description?: string;
      category?: string;
      updatedBy?: string;
    }>;

    const results = await Promise.all(
      updates.map((setting) =>
        prisma.systemSettings.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            description: setting.description,
            category: setting.category,
            updatedBy: setting.updatedBy,
          },
          create: {
            key: setting.key,
            value: setting.value,
            description: setting.description,
            category: setting.category,
            updatedBy: setting.updatedBy,
          },
        })
      )
    );

    return NextResponse.json({ updated: results.length, settings: results });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
