import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";

// GET /api/export/opportunities
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const opportunities = await prisma.opportunity.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        linkedContact: {
          select: { fullName: true },
        },
      },
    });

    // CSV headers
    const headers = [
      "Nom",
      "Valeur",
      "Entreprise",
      "Étape",
      "Responsable",
      "Contact",
      "Région",
      "Segment",
      "Type de projet",
      "Source du lead",
      "Référé par",
      "Date d'ouverture",
      "Date de clôture",
      "Date proposition envoyée",
      "Créé le",
    ];

    // CSV rows
    const rows = opportunities.map((opp) => [
      opp.name || "",
      opp.value?.toString() || "",
      opp.company || "",
      opp.stage || "",
      opp.assignee || "",
      opp.linkedContact?.fullName || opp.contact || "",
      opp.region || "",
      opp.segment || "",
      opp.projectType || "",
      opp.leadSourceType || "",
      opp.referredBy || "",
      opp.openDate?.toISOString().split("T")[0] || "",
      opp.closedDate?.toISOString().split("T")[0] || "",
      opp.proposalSentDate?.toISOString().split("T")[0] || "",
      opp.createdAt.toISOString().split("T")[0],
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
        "Content-Disposition": `attachment; filename="opportunites_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting opportunities:", error);
    return NextResponse.json(
      { error: "Failed to export opportunities" },
      { status: 500 }
    );
  }
}
