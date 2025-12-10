import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const clients = await prisma.communicationClient.findMany({
      where,
      include: {
        socialAccounts: true,
        newsletters: true,
        campaigns: true,
        accesses: true,
        tasks: {
          where: { status: { not: "done" } },
        },
        _count: {
          select: {
            socialAccounts: true,
            newsletters: true,
            campaigns: true,
            accesses: true,
            messages: true,
            tasks: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching communication clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      company,
      email,
      phone,
      website,
      logoUrl,
      industry,
      description,
      projectId,
      companyId,
      startDate,
      monthlyBudget,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const client = await prisma.communicationClient.create({
      data: {
        name,
        company,
        email,
        phone,
        website,
        logoUrl,
        industry,
        description,
        projectId,
        companyId,
        startDate: startDate ? new Date(startDate) : null,
        monthlyBudget,
        notes,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating communication client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
