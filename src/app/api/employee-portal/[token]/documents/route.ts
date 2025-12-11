import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getEmployeeFromToken(token: string) {
  const portal = await prisma.employeePortal.findUnique({
    where: { token },
    include: { employee: true },
  });
  if (!portal || !portal.isActive) return null;
  return portal.employee;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const employee = await getEmployeeFromToken(token);
    if (!employee) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where: Record<string, unknown> = { employeeId: employee.id };
    if (category) {
      where.category = category;
    }

    const documents = await prisma.employeeDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Grouper par catégorie
    const categories = await prisma.employeeDocument.groupBy({
      by: ["category"],
      where: { employeeId: employee.id },
      _count: { id: true },
    });

    return NextResponse.json({
      documents,
      categories: categories.map(c => ({
        name: c.category || "Autres",
        count: c._count.id,
      })),
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
