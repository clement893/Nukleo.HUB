import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/export/contacts
export async function GET(request: NextRequest) {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { fullName: "asc" },
    });

    // CSV headers
    const headers = [
      "Nom complet",
      "Prénom",
      "Nom",
      "Email",
      "Téléphone",
      "Poste",
      "Entreprise",
      "Niveau",
      "Région",
      "Domaine",
      "Relation",
      "Cercles",
      "Langue",
      "LinkedIn",
      "Date de naissance",
      "Potentiel vente",
      "Créé le",
    ];

    // CSV rows
    const rows = contacts.map((contact) => [
      contact.fullName || "",
      contact.firstName || "",
      contact.lastName || "",
      contact.email || "",
      contact.phone || "",
      contact.position || "",
      contact.company || "",
      contact.level?.toString() || "",
      contact.region || "",
      contact.employmentField || "",
      contact.relation || "",
      contact.circles || "",
      contact.language || "",
      contact.linkedinUrl || "",
      contact.birthday || "",
      contact.potentialSale ? "Oui" : "Non",
      contact.createdAt.toISOString().split("T")[0],
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
        "Content-Disposition": `attachment; filename="contacts_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting contacts:", error);
    return NextResponse.json(
      { error: "Failed to export contacts" },
      { status: 500 }
    );
  }
}
