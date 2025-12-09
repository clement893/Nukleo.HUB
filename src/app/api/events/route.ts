import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const type = searchParams.get("type");

    const where: Record<string, unknown> = {};

    // Filter by date range
    if (start && end) {
      where.startDate = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

    // Filter by type
    if (type) {
      where.type = type;
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      type,
      startDate,
      endDate,
      allDay,
      location,
      color,
      contactId,
      opportunityId,
      projectId,
      companyId,
      reminder,
      reminderTime,
    } = body;

    if (!title || !startDate) {
      return NextResponse.json(
        { error: "Title and start date are required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type: type || "meeting",
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        allDay: allDay || false,
        location,
        color: color || "#6366f1",
        contactId,
        opportunityId,
        projectId,
        companyId,
        reminder: reminder || false,
        reminderTime,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
