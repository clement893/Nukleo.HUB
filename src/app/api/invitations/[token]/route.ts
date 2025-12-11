import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Vérifier si une invitation est valide
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        inviter: {
          select: { name: true, email: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation non trouvée" }, { status: 404 });
    }

    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Cette invitation a déjà été utilisée" }, { status: 400 });
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Cette invitation a expiré" }, { status: 400 });
    }

    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        inviter: invitation.inviter,
        expiresAt: invitation.expiresAt,
      },
    });
  } catch (error) {
    console.error("Error checking invitation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
