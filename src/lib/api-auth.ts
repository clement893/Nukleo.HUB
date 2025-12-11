import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "nukleo_session";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  role: string;
}

/**
 * Récupère l'utilisateur authentifié à partir du cookie de session
 * @returns L'utilisateur authentifié ou null
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return null;
    }

    const session = await prisma.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      }
      return null;
    }

    if (!session.user.isActive) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      photoUrl: session.user.photoUrl,
      role: session.user.role,
    };
  } catch (error) {
    console.error("Error getting auth user:", error);
    return null;
  }
}

/**
 * Vérifie que l'utilisateur est authentifié
 * @returns L'utilisateur ou une réponse d'erreur 401
 */
export async function requireAuth(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorisé. Veuillez vous connecter." },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Vérifie que l'utilisateur est admin ou super_admin
 * @returns L'utilisateur admin ou une réponse d'erreur
 */
export async function requireAdmin(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorisé. Veuillez vous connecter." },
      { status: 401 }
    );
  }
  if (!["admin", "super_admin"].includes(user.role)) {
    return NextResponse.json(
      { error: "Accès refusé. Droits administrateur requis." },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Vérifie que l'utilisateur est super_admin
 * @returns L'utilisateur super_admin ou une réponse d'erreur
 */
export async function requireSuperAdmin(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { error: "Non autorisé. Veuillez vous connecter." },
      { status: 401 }
    );
  }
  if (user.role !== "super_admin") {
    return NextResponse.json(
      { error: "Accès refusé. Droits super administrateur requis." },
      { status: 403 }
    );
  }
  return user;
}

/**
 * Helper pour vérifier si le résultat est une réponse d'erreur
 */
export function isErrorResponse(result: AuthUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}
