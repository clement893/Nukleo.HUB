import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si l'employé existe
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Chercher ou créer le portail
    let portal = await prisma.employeePortal.findUnique({
      where: { employeeId: id },
    });

    if (!portal) {
      portal = await prisma.employeePortal.create({
        data: {
          employeeId: id,
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app";
    const portalUrl = `${baseUrl}/employee-portal/${portal.token}`;

    return NextResponse.json({
      portal,
      url: portalUrl,
    });
  } catch (error) {
    console.error("Error getting employee portal:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Vérifier si l'employé existe
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employé non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer l'ancien portail s'il existe
    await prisma.employeePortal.deleteMany({
      where: { employeeId: id },
    });

    // Créer un nouveau portail avec un nouveau token
    const portal = await prisma.employeePortal.create({
      data: {
        employeeId: id,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app";
    const portalUrl = `${baseUrl}/employee-portal/${portal.token}`;

    return NextResponse.json({
      portal,
      url: portalUrl,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating employee portal:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.employeePortal.deleteMany({
      where: { employeeId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee portal:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
