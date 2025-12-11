import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const where: Record<string, unknown> = {};
    if (clientId) where.clientId = clientId;

    const accesses = await prisma.clientAccess.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { type: "asc" },
    });

    return NextResponse.json(accesses);
  } catch (error) {
    console.error("Error fetching accesses:", error);
    return NextResponse.json({ error: "Failed to fetch accesses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { clientId, name, type, url, username, password, email, apiKey, expiryDate, notes } = body;

    if (!clientId || !name || !type) {
      return NextResponse.json({ error: "clientId, name and type are required" }, { status: 400 });
    }

    const access = await prisma.clientAccess.create({
      data: {
        clientId, name, type, url, username, password, email, apiKey,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes,
      },
    });

    return NextResponse.json(access, { status: 201 });
  } catch (error) {
    console.error("Error creating access:", error);
    return NextResponse.json({ error: "Failed to create access" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);

    const access = await prisma.clientAccess.update({ where: { id }, data });
    return NextResponse.json(access);
  } catch (error) {
    console.error("Error updating access:", error);
    return NextResponse.json({ error: "Failed to update access" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await prisma.clientAccess.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting access:", error);
    return NextResponse.json({ error: "Failed to delete access" }, { status: 500 });
  }
}
