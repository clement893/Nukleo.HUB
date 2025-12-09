import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");
    const id = searchParams.get("id");

    if (id) {
      const quote = await prisma.quote.findUnique({
        where: { id },
      });
      return NextResponse.json(quote);
    }

    const where: Record<string, unknown> = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (status) {
      where.status = status;
    }

    const quotes = await prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(quotes);
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phases, ...quoteData } = body;

    // Calculer les totaux à partir des phases
    let subtotal = 0;
    if (phases && Array.isArray(phases)) {
      subtotal = phases.reduce((acc: number, phase: { estimatedHours: number; hourlyRate: number; selected: boolean }) => {
        if (phase.selected) {
          return acc + (phase.estimatedHours * phase.hourlyRate);
        }
        return acc;
      }, 0);
    }

    const taxRate = quoteData.taxRate || 0.14975; // TPS 5% + TVQ 9.975%
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    const quote = await prisma.quote.create({
      data: {
        ...quoteData,
        phases: phases ? JSON.stringify(phases) : null,
        subtotal,
        taxRate,
        taxAmount,
        total,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, phases, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Recalculer les totaux si les phases sont mises à jour
    let updateData: Record<string, unknown> = { ...data };
    
    if (phases && Array.isArray(phases)) {
      const subtotal = phases.reduce((acc: number, phase: { estimatedHours: number; hourlyRate: number; selected: boolean }) => {
        if (phase.selected) {
          return acc + (phase.estimatedHours * phase.hourlyRate);
        }
        return acc;
      }, 0);

      const taxRate = data.taxRate || 0.14975;
      const taxAmount = subtotal * taxRate;
      const total = subtotal + taxAmount;

      updateData = {
        ...updateData,
        phases: JSON.stringify(phases),
        subtotal,
        taxAmount,
        total,
      };
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    await prisma.quote.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { error: "Failed to delete quote" },
      { status: 500 }
    );
  }
}
