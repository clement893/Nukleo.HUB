import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/auth";

// GET - Rediriger vers Google pour l'authentification
export async function GET() {
  try {
    const authUrl = getGoogleAuthUrl();
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Error initiating Google auth:", error);
    return NextResponse.redirect("/login?error=config");
  }
}
