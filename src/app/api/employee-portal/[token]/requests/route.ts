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

    const requests = await prisma.employeeRequest.findMany({
      where: { employeeId: employee.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const employee = await getEmployeeFromToken(token);
    if (!employee) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();

    const newRequest = await prisma.employeeRequest.create({
      data: {
        employeeId: employee.id,
        type: body.type,
        title: body.title,
        description: body.description,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        priority: body.priority || "normal",
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("Error creating request:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
