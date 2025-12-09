import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");

    const where: Record<string, unknown> = {};
    if (clientId) {
      where.clientId = clientId;
    }

    const accounts = await prisma.socialMediaAccount.findMany({
      where,
      include: {
        client: { select: { id: true, name: true } },
      },
      orderBy: { platform: "asc" },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error("Error fetching social accounts:", error);
    return NextResponse.json({ error: "Failed to fetch accounts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId, platform, accountName, accountUrl, username, followers, status, accessEmail, accessPassword, notes, postsPerWeek } = body;

    if (!clientId || !platform || !accountName) {
      return NextResponse.json({ error: "clientId, platform and accountName are required" }, { status: 400 });
    }

    const account = await prisma.socialMediaAccount.create({
      data: { clientId, platform, accountName, accountUrl, username, followers, status, accessEmail, accessPassword, notes, postsPerWeek },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("Error creating social account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const account = await prisma.socialMediaAccount.update({
      where: { id },
      data,
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("Error updating social account:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await prisma.socialMediaAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting social account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
