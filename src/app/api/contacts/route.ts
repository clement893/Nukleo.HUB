import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const region = searchParams.get("region") || "";
    const employmentField = searchParams.get("employmentField") || "";
    const circles = searchParams.get("circles") || "";

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (region) {
      where.region = { contains: region, mode: "insensitive" };
    }

    if (employmentField) {
      where.employmentField = { contains: employmentField, mode: "insensitive" };
    }

    if (circles) {
      where.circles = { contains: circles, mode: "insensitive" };
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: { fullName: "asc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const contact = await prisma.contact.create({
      data: body,
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
