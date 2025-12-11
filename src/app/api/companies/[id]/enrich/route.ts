import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// POST /api/companies/[id]/enrich
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await context.params;
    
    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }

    if (!company.website) {
      return NextResponse.json(
        { error: "Company has no website to analyze" },
        { status: 400 }
      );
    }

    // Fetch website content
    let websiteContent = "";
    try {
      const response = await fetch(company.website, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; NukleoBot/1.0)",
        },
      });
      websiteContent = await response.text();
    } catch (error) {
      console.error("Error fetching website:", error);
    }

    // Extract basic info from HTML
    const titleMatch = websiteContent.match(/<title[^>]*>([^<]+)<\/title>/i);
    const descriptionMatch = websiteContent.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    ) || websiteContent.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i
    );

    // Try to get favicon/logo
    let logoUrl = company.logoUrl;
    if (!logoUrl) {
      const domain = new URL(company.website).hostname;
      logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }

    // Simple industry detection based on keywords
    const contentLower = websiteContent.toLowerCase();
    let industry = company.industry;
    if (!industry) {
      const industryKeywords: Record<string, string[]> = {
        "Technology": ["software", "tech", "digital", "app", "platform", "saas"],
        "Marketing": ["marketing", "advertising", "brand", "campaign", "media"],
        "Finance": ["finance", "banking", "investment", "insurance", "fintech"],
        "Healthcare": ["health", "medical", "pharma", "hospital", "clinic"],
        "Education": ["education", "learning", "school", "university", "training"],
        "E-commerce": ["shop", "store", "ecommerce", "retail", "products"],
        "Consulting": ["consulting", "advisory", "strategy", "management"],
        "Design": ["design", "creative", "studio", "agency", "branding"],
      };

      for (const [ind, keywords] of Object.entries(industryKeywords)) {
        if (keywords.some((kw) => contentLower.includes(kw))) {
          industry = ind;
          break;
        }
      }
    }

    // Generate insights based on content
    const insights: string[] = [];
    if (contentLower.includes("hiring") || contentLower.includes("careers") || contentLower.includes("jobs")) {
      insights.push("Entreprise en croissance (recrutement actif)");
    }
    if (contentLower.includes("award") || contentLower.includes("recognition")) {
      insights.push("Entreprise reconnue dans son secteur");
    }
    if (contentLower.includes("international") || contentLower.includes("global")) {
      insights.push("Présence internationale");
    }
    if (contentLower.includes("innovation") || contentLower.includes("r&d")) {
      insights.push("Focus sur l'innovation");
    }

    const insight = insights.length > 0 ? insights.join(". ") : company.insight;

    // Update company with enriched data
    const updatedCompany = await prisma.company.update({
      where: { id },
      data: {
        logoUrl: logoUrl || company.logoUrl,
        description: descriptionMatch?.[1] || company.description,
        industry: industry || company.industry,
        insight: insight || company.insight,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: "enriched",
        description: "Organisation enrichie automatiquement",
        entityType: "company",
        entityId: id,
        userName: "Système",
      },
    });

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Error enriching company:", error);
    return NextResponse.json(
      { error: "Failed to enrich company" },
      { status: 500 }
    );
  }
}
