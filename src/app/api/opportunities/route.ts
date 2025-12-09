import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        linkedContact: true,
      },
    });
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Error fetching opportunities:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const opportunity = await prisma.opportunity.create({
      data,
      include: {
        linkedContact: true,
      },
    });
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Error creating opportunity:", error);
    return NextResponse.json(
      { error: "Failed to create opportunity" },
      { status: 500 }
    );
  }
}
