import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

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
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

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
