import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const data = await request.json();
    const company = await prisma.company.create({
      data,
    });
    return NextResponse.json(company);
  } catch (error) {
    console.error("Error creating company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 }
    );
  }
}
