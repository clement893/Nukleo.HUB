import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const projectType = searchParams.get("projectType") || "";
    const year = searchParams.get("year") || "";
    const department = searchParams.get("department") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { client: { contains: search, mode: "insensitive" } },
        { lead: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = { equals: status, mode: "insensitive" };
    }

    if (projectType) {
      where.projectType = { contains: projectType, mode: "insensitive" };
    }

    if (year) {
      where.year = { equals: year };
    }

    if (department) {
      where.departments = { contains: department, mode: "insensitive" };
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            isClient: true,
          },
        },
        contact: {
          select: {
            id: true,
            fullName: true,
            photoUrl: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const project = await prisma.project.create({
      data: body,
    });
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
