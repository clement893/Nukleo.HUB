import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const featured = searchParams.get("featured");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (featured === "true") where.featured = true;

    const testimonials = await prisma.testimonial.findMany({
      where,
      orderBy: [
        { featured: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientName,
      contactName,
      companyName,
      status,
      textFr,
      textEn,
      titleFr,
      titleEn,
      rating,
      featured,
      companyId,
      contactId,
    } = body;

    if (!clientName) {
      return NextResponse.json(
        { error: "Client name is required" },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        clientName,
        contactName,
        companyName,
        status: status || "received",
        textFr,
        textEn,
        titleFr,
        titleEn,
        rating: rating || 5,
        featured: featured || false,
        companyId,
        contactId,
      },
    });

    return NextResponse.json(testimonial, { status: 201 });
  } catch (error) {
    console.error("Error creating testimonial:", error);
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
