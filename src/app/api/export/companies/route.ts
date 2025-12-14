import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET /api/export/companies
export async function GET(_request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: "asc" },
    });

    // CSV headers
    const headers = [
      "Nom",
      "Type",
      "Industrie",
      "Site web",
      "Téléphone",
      "Adresse",
      "Contact principal",
      "Email contact",
      "LinkedIn",
      "Facebook",
      "Instagram",
      "Client",
      "Description",
      "Insights",
      "Créé le",
    ];

    // CSV rows
    const rows = companies.map((company) => [
      company.name || "",
      company.type || "",
      company.industry || "",
      company.website || "",
      company.phone || "",
      company.address || "",
      company.mainContactName || "",
      company.mainContactEmail || "",
      company.linkedinUrl || "",
      company.facebookUrl || "",
      company.instagramUrl || "",
      company.isClient ? "Oui" : "Non",
      company.description || "",
      company.insight || "",
      company.createdAt.toISOString().split("T")[0],
    ]);

    // Build CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="entreprises_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting companies:", error);
    return NextResponse.json(
      { error: "Failed to export companies" },
      { status: 500 }
    );
  }
}
