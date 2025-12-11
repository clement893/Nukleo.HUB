import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const SESSION_COOKIE_NAME = "nukleo_session";
const SESSION_DURATION_DAYS = 30;

// GET - Callback de Google OAuth pour login
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const stateParam = searchParams.get("state");
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app";

    // Décoder le state pour récupérer le redirect
    let redirectAfterLogin = "/";
    if (stateParam) {
      try {
        const stateJson = Buffer.from(stateParam, "base64").toString("utf-8");
        const state = JSON.parse(stateJson);
        redirectAfterLogin = state.redirect || "/";
      } catch (e) {
        // Ignorer les erreurs de parsing
      }
    }

    if (error) {
      console.error("Google OAuth error:", error);
      return NextResponse.redirect(`${baseUrl}/login?error=denied`);
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/login?error=no_code`);
    }

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return NextResponse.redirect(`${baseUrl}/login?error=config`);
    }

    const redirectUri = `${baseUrl}/api/auth/login/callback`;

    // Échanger le code contre des tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Token exchange error:", errorData);
      return NextResponse.redirect(`${baseUrl}/login?error=token_exchange`);
    }

    const tokens = await tokenResponse.json();
    
    // Récupérer les informations de l'utilisateur
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/login?error=user_info`);
    }

    const googleUser = await userInfoResponse.json();

    if (!googleUser.email) {
      return NextResponse.redirect(`${baseUrl}/login?error=no_email`);
    }

    // Vérifier que l'email est du domaine @nukleo.com
    const allowedDomains = ["nukleo.com", "nukleo.ca"];
    const emailDomain = googleUser.email.split("@")[1]?.toLowerCase();
    
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      return NextResponse.redirect(`${baseUrl}/login?error=domain_not_allowed`);
    }

    // Chercher ou créer l'utilisateur
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId: googleUser.id },
          { email: googleUser.email },
        ],
      },
    });

    if (user) {
      // Mettre à jour l'utilisateur existant
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleUser.id,
          name: googleUser.name || user.name,
          photoUrl: googleUser.picture || user.photoUrl,
          lastLoginAt: new Date(),
        },
      });
    } else {
      // Créer un nouvel utilisateur
      // clement@nukleo.com est le super admin
      const isSuperAdmin = googleUser.email.toLowerCase() === "clement@nukleo.com";
      
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          googleId: googleUser.id,
          name: googleUser.name,
          photoUrl: googleUser.picture,
          role: isSuperAdmin ? "super_admin" : "user",
          lastLoginAt: new Date(),
        },
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      return NextResponse.redirect(`${baseUrl}/login?error=inactive`);
    }

    // Créer une session
    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        expiresAt,
        userAgent: request.headers.get("user-agent") || undefined,
        ipAddress: request.headers.get("x-forwarded-for")?.split(",")[0] || undefined,
      },
    });

    // Définir le cookie de session
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60,
      path: "/",
    });

    // Rediriger vers la page demandée ou la page d'accueil
    return NextResponse.redirect(`${baseUrl}${redirectAfterLogin}`);
  } catch (error) {
    console.error("Error in Google OAuth callback:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nukleohub-production.up.railway.app";
    return NextResponse.redirect(`${baseUrl}/login?error=server`);
  }
}
