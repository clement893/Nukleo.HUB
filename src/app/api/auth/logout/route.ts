import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "nukleo_session";

// POST - Déconnexion
export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      // Supprimer la session de la base de données
      await prisma.session.deleteMany({ where: { token: sessionToken } });
    }

    // Supprimer le cookie
    cookieStore.delete(SESSION_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json({ error: "Erreur lors de la déconnexion" }, { status: 500 });
  }
}

// GET - Déconnexion avec redirection
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      await prisma.session.deleteMany({ where: { token: sessionToken } });
    }

    cookieStore.delete(SESSION_COOKIE_NAME);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app";
    return NextResponse.redirect(`${baseUrl}/login`);
  } catch (error) {
    console.error("Error during logout:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app";
    return NextResponse.redirect(`${baseUrl}/login`);
  }
}
