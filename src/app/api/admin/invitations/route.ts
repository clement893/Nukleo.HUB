import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { sendEmail, getInvitationEmailHtml, getInvitationEmailText } from "@/lib/email";

const SESSION_COOKIE_NAME = "nukleo_session";
const INVITATION_EXPIRY_DAYS = 7;

// Vérifier si l'utilisateur est admin ou super_admin
async function checkAdminAccess() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) return null;

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date() || !session.user.isActive) {
    return null;
  }

  if (!["admin", "super_admin"].includes(session.user.role)) {
    return null;
  }

  return session.user;
}

// GET - Récupérer toutes les invitations
export async function GET() {
  try {
    const admin = await checkAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer une nouvelle invitation
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = "user" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    // Vérifier le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 });
    }

    // Vérifier que l'email est du domaine autorisé
    const allowedDomains = ["nukleo.com", "nukleo.ca"];
    const emailDomain = email.split("@")[1]?.toLowerCase();
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      return NextResponse.json({ error: "Seuls les emails @nukleo.com sont autorisés" }, { status: 400 });
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Cet utilisateur existe déjà" }, { status: 400 });
    }

    // Vérifier si une invitation existe déjà pour cet email
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvitation) {
      return NextResponse.json({ error: "Une invitation est déjà en cours pour cet email" }, { status: 400 });
    }

    // Seul un super_admin peut inviter un super_admin
    if (role === "super_admin" && admin.role !== "super_admin") {
      return NextResponse.json({ error: "Seul un super admin peut inviter un super admin" }, { status: 403 });
    }

    // Créer l'invitation
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        role,
        invitedBy: admin.id,
        expiresAt,
      },
      include: {
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Construire le lien d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app";
    const invitationLink = `${baseUrl}/invite/${token}`;

    // Envoyer l'email d'invitation
    const emailParams = {
      inviterName: admin.name || admin.email,
      inviteeEmail: email,
      role,
      invitationLink,
      expiresAt,
    };

    const emailSent = await sendEmail({
      to: email,
      subject: `${admin.name || admin.email} vous invite à rejoindre Nukleo.HUB`,
      html: getInvitationEmailHtml(emailParams),
      text: getInvitationEmailText(emailParams),
    });

    return NextResponse.json({ 
      invitation,
      invitationLink,
      emailSent,
      message: emailSent 
        ? `Invitation envoyée à ${email}` 
        : `Invitation créée pour ${email} (email non envoyé - partagez le lien manuellement)`,
    });
  } catch (error) {
    console.error("Error creating invitation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PATCH - Renvoyer une invitation
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const body = await request.json();
    const { invitationId } = body;

    if (!invitationId) {
      return NextResponse.json({ error: "ID d'invitation requis" }, { status: 400 });
    }

    // Récupérer l'invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        inviter: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!invitation) {
      return NextResponse.json({ error: "Invitation non trouvée" }, { status: 404 });
    }

    // Vérifier que l'invitation n'a pas expiré
    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Cette invitation a expiré" }, { status: 400 });
    }

    // Vérifier que l'invitation n'a pas déjà été acceptée
    if (invitation.acceptedAt) {
      return NextResponse.json({ error: "Cette invitation a déjà été acceptée" }, { status: 400 });
    }

    // Construire le lien d'invitation
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app";
    const invitationLink = `${baseUrl}/invite/${invitation.token}`;

    // Envoyer l'email d'invitation
    const emailParams = {
      inviterName: invitation.inviter.name || invitation.inviter.email,
      inviteeEmail: invitation.email,
      role: invitation.role,
      invitationLink,
      expiresAt: invitation.expiresAt,
    };

    const emailSent = await sendEmail({
      to: invitation.email,
      subject: `${invitation.inviter.name || invitation.inviter.email} vous invite à rejoindre Nukleo.HUB`,
      html: getInvitationEmailHtml(emailParams),
      text: getInvitationEmailText(emailParams),
    });

    return NextResponse.json({
      invitation,
      emailSent,
      message: emailSent
        ? `Invitation renvoyée à ${invitation.email}`
        : `Erreur lors de l'envoi de l'email (partagez le lien manuellement)`,
    });
  } catch (error) {
    console.error("Error resending invitation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer/annuler une invitation
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminAccess();
    if (!admin) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("id");

    if (!invitationId) {
      return NextResponse.json({ error: "ID d'invitation requis" }, { status: 400 });
    }

    await prisma.invitation.delete({ where: { id: invitationId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
