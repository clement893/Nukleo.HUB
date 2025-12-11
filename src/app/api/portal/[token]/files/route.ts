import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Récupérer les fichiers du client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    const portal = await prisma.clientPortal.findUnique({
      where: { token },
    });

    if (!portal || !portal.isActive) {
      return NextResponse.json({ error: "Portail non trouvé" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const category = searchParams.get("category");
    const fileType = searchParams.get("fileType");

    const where: Record<string, unknown> = { 
      portalId: portal.id,
      isPublic: true, // Seuls les fichiers publics sont visibles
    };
    if (projectId) where.projectId = projectId;
    if (category) where.category = category;
    if (fileType) where.fileType = fileType;

    const files = await prisma.clientFile.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Grouper par catégorie
    const grouped = files.reduce((acc: Record<string, typeof files>, file) => {
      const cat = file.category || "other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(file);
      return acc;
    }, {});

    return NextResponse.json({ files, grouped });
  } catch (error) {
    console.error("Erreur récupération fichiers:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
