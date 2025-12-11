import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        linkedContact: true,
      },
    });
    
    if (!opportunity) {
      return NextResponse.json(
        { error: "Opportunity not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Error fetching opportunity:", error);
    return NextResponse.json(
      { error: "Failed to fetch opportunity" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    const data = await request.json();
    
    // Remove linkedContact from data as it's a relation, not a field
    const { linkedContact, ...updateData } = data;
    
    const opportunity = await prisma.opportunity.update({
      where: { id },
      data: updateData,
      include: {
        linkedContact: true,
      },
    });
    
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Error updating opportunity:", error);
    return NextResponse.json(
      { error: "Failed to update opportunity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await params;
    
    await prisma.opportunity.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting opportunity:", error);
    return NextResponse.json(
      { error: "Failed to delete opportunity" },
      { status: 500 }
    );
  }
}
