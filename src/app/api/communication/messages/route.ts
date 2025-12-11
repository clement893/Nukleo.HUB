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

    const messages = await prisma.clientMessage.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { sentAt: "desc" },
      take: 100,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { clientId, direction, channel, subject, content, sentBy, isImportant, followUpDate, attachments } = body;

    if (!clientId || !direction || !channel || !content) {
      return NextResponse.json({ error: "clientId, direction, channel and content are required" }, { status: 400 });
    }

    const message = await prisma.clientMessage.create({
      data: {
        clientId, direction, channel, subject, content, sentBy, isImportant,
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        attachments: attachments ? JSON.stringify(attachments) : null,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json({ error: "Failed to create message" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    if (data.followUpDate) data.followUpDate = new Date(data.followUpDate);
    if (data.attachments) data.attachments = JSON.stringify(data.attachments);

    const message = await prisma.clientMessage.update({ where: { id }, data });
    return NextResponse.json(message);
  } catch (error) {
    console.error("Error updating message:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    await prisma.clientMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
