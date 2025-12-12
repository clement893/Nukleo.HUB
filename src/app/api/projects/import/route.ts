import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Lire le fichier Excel
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: "Le fichier Excel est vide ou invalide" },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Importer chaque projet
    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i] as Record<string, any>;

        // Valider les champs obligatoires
        if (!row.name) {
          results.errors.push(`Ligne ${i + 2}: Le nom du projet est obligatoire`);
          results.failed++;
          continue;
        }

        // Créer le projet
        await prisma.project.create({
          data: {
            name: row.name,
            client: row.client || null,
            team: row.team || null,
            status: row.status || "pending",
            stage: row.stage || null,
            billing: row.billing || null,
            lead: row.lead || null,
            clientComm: row.clientComm || null,
            contactName: row.contactName || null,
            contactMethod: row.contactMethod || null,
            hourlyRate: row.hourlyRate ? parseFloat(row.hourlyRate) : null,
            proposalUrl: row.proposalUrl || null,
            budget: row.budget || null,
            driveUrl: row.driveUrl || null,
            asanaUrl: row.asanaUrl || null,
            slackUrl: row.slackUrl || null,
            timeline: row.timeline || null,
            projectType: row.projectType || null,
            year: row.year || null,
          },
        });

        results.success++;
      } catch (error) {
        results.errors.push(
          `Ligne ${i + 2}: ${error instanceof Error ? error.message : "Erreur inconnue"}`
        );
        results.failed++;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error importing projects:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'import des projets" },
      { status: 500 }
    );
  }
}
