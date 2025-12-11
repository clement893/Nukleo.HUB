import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = [
  "/login",
  "/invite", // Page d'acceptation d'invitation
  "/api/auth/login",
  "/api/auth/login/callback",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/google",
  "/api/auth/google/callback",
  "/employee-portal", // Le portail employé a son propre système d'auth par token
  "/portal", // Le portail client a son propre système d'auth par token
];

// Routes API qui ne nécessitent pas d'authentification
const publicApiPrefixes = [
  "/api/auth/",
  "/api/employee-portal/",
  "/api/invitations/", // API de vérification des invitations
  "/api/cron/",
  "/api/portal/", // API du portail client
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les fichiers statiques et les assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") // fichiers avec extension
  ) {
    return NextResponse.next();
  }

  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));
  const isPublicApi = publicApiPrefixes.some(prefix => pathname.startsWith(prefix));

  if (isPublicRoute || isPublicApi) {
    return NextResponse.next();
  }

  // Vérifier le cookie de session
  const sessionToken = request.cookies.get("nukleo_session")?.value;

  if (!sessionToken) {
    // Rediriger vers la page de login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Le token existe, laisser passer (la validation complète se fait côté API)
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
