import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";

const SESSION_COOKIE_NAME = "nukleo_session";
const SESSION_DURATION_DAYS = 7; // Réduit de 30 à 7 jours
const SESSION_SLIDING_WINDOW = true; // Renouveler à chaque activité

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  role: string;
}

// Générer un token de session
export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Créer une session pour un utilisateur
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  // Mettre à jour la date de dernière connexion
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });

  return token;
}

// Définir le cookie de session
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

// Récupérer l'utilisateur à partir du cookie de session
export async function getCurrentUser(): Promise<AuthUser | null> {
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
      // Session expirée ou invalide
      if (session) {
        await prisma.session.delete({ where: { id: session.id } });
      }
      return null;
    }

    if (!session.user.isActive) {
      return null;
    }

    // Sliding window: renouveler la session à chaque activité
    if (SESSION_SLIDING_WINDOW) {
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + SESSION_DURATION_DAYS);
      
      // Mettre à jour la date d'expiration sans bloquer la réponse
      prisma.session.update({
        where: { id: session.id },
        data: { expiresAt: newExpiresAt },
      }).catch(error => {
        console.error("Error refreshing session:", error);
      });
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      photoUrl: session.user.photoUrl,
      role: session.user.role,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Supprimer la session (déconnexion)
export async function deleteSession() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      await prisma.session.deleteMany({ where: { token: sessionToken } });
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Error deleting session:", error);
  }
}

// Vérifier si l'utilisateur est admin
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

// Configuration Google OAuth
export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured");
  }

  return { clientId, clientSecret, redirectUri };
}

// Générer l'URL d'autorisation Google
export function getGoogleAuthUrl(): string {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Échanger le code contre des tokens
export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code: ${error}`);
  }

  return response.json();
}

// Récupérer les informations de l'utilisateur Google
export async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error("Failed to get user info from Google");
  }

  const userInfo = await response.json();
  
  // Validation renforcée du domaine email
  const ALLOWED_DOMAINS = ["@nukleo.com", "@nukleo.ca"];
  const email = userInfo.email || "";
  const isValidDomain = ALLOWED_DOMAINS.some(domain => email.endsWith(domain));
  
  if (!isValidDomain) {
    throw new Error("Email domain not authorized");
  }

  return userInfo;
}
