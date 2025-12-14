import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// Google Favicon API - returns high quality favicons
function getFaviconUrl(websiteUrl: string): string {
  try {
    const url = new URL(websiteUrl);
    const domain = url.hostname;
    // Using Google's favicon service which is reliable and fast
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return "";
  }
}

// Alternative: DuckDuckGo favicon service (not currently used)
function _getDuckDuckGoFaviconUrl(websiteUrl: string): string {
  try {
    const url = new URL(websiteUrl);
    const domain = url.hostname;
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  } catch {
    return "";
  }
}

export async function POST() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    // Get all companies with a website but no logo or with expired Airtable logos
    const companies = await prisma.company.findMany({
      where: {
        website: { not: null },
      },
      select: {
        id: true,
        name: true,
        website: true,
        logoUrl: true,
      },
    });

    const updates: { id: string; name: string; newLogoUrl: string }[] = [];

    for (const company of companies) {
      if (!company.website) continue;

      // Skip if already has a non-Airtable logo
      if (company.logoUrl && !company.logoUrl.includes("airtableusercontent.com")) {
        continue;
      }

      const faviconUrl = getFaviconUrl(company.website);
      if (faviconUrl) {
        await prisma.company.update({
          where: { id: company.id },
          data: { logoUrl: faviconUrl },
        });
        updates.push({
          id: company.id,
          name: company.name,
          newLogoUrl: faviconUrl,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} company logos`,
      updates,
    });
  } catch (error) {
    console.error("Error updating company logos:", error);
    return NextResponse.json(
      { error: "Failed to update company logos" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    // Get companies that need logo updates
    const companies = await prisma.company.findMany({
      where: {
        website: { not: null },
        OR: [
          { logoUrl: null },
          { logoUrl: { contains: "airtableusercontent.com" } },
        ],
      },
      select: {
        id: true,
        name: true,
        website: true,
        logoUrl: true,
      },
    });

    const companiesWithFavicons = companies.map((company) => ({
      ...company,
      suggestedFaviconUrl: company.website ? getFaviconUrl(company.website) : null,
    }));

    return NextResponse.json({
      count: companies.length,
      companies: companiesWithFavicons,
    });
  } catch (error) {
    console.error("Error fetching companies for logo update:", error);
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 500 }
    );
  }
}
