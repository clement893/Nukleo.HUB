import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    
    const opportunity = await prisma.opportunity.update({
      where: { id },
      data,
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
