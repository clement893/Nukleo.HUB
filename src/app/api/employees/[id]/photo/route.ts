import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Upload photo for employee
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("photo") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 5MB." },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3 using the storage helper
    const { storagePut } = await import("@/lib/storage");
    const extension = file.type.split("/")[1];
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const fileKey = `employees/${id}/photo-${timestamp}-${randomSuffix}.${extension}`;

    const { url } = await storagePut(fileKey, buffer, file.type);

    // Update employee with photo URL
    const employee = await prisma.employee.update({
      where: { id },
      data: { photoUrl: url },
    });

    return NextResponse.json({ photoUrl: url, employee });
  } catch (error) {
    console.error("Error uploading photo:", error);
    return NextResponse.json(
      { error: "Failed to upload photo" },
      { status: 500 }
    );
  }
}

// Delete photo for employee
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Update employee to remove photo URL
    const employee = await prisma.employee.update({
      where: { id },
      data: { photoUrl: null },
    });

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return NextResponse.json(
      { error: "Failed to delete photo" },
      { status: 500 }
    );
  }
}
