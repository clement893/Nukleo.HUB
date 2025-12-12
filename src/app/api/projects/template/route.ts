import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // Créer un nouveau classeur
    const workbook = XLSX.utils.book_new();

    // Créer les données du modèle
    const templateData = [
      {
        name: "Exemple de projet",
        client: "Nom du client",
        team: "Nom de l'équipe",
        status: "pending",
        stage: "discovery",
        billing: "fixed",
        lead: "Nom du responsable",
        clientComm: "Email de communication client",
        contactName: "Nom du contact",
        contactMethod: "Email ou téléphone",
        hourlyRate: 75,
        proposalUrl: "https://example.com/proposal",
        budget: "5000€",
        driveUrl: "https://drive.google.com/...",
        asanaUrl: "https://asana.com/...",
        slackUrl: "https://slack.com/...",
        timeline: "3 mois",
        projectType: "Web",
        year: "2025",
      },
    ];

    // Créer une feuille
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Définir les largeurs des colonnes
    const columnWidths = [
      { wch: 25 }, // name
      { wch: 20 }, // client
      { wch: 20 }, // team
      { wch: 12 }, // status
      { wch: 15 }, // stage
      { wch: 12 }, // billing
      { wch: 20 }, // lead
      { wch: 25 }, // clientComm
      { wch: 20 }, // contactName
      { wch: 20 }, // contactMethod
      { wch: 12 }, // hourlyRate
      { wch: 30 }, // proposalUrl
      { wch: 15 }, // budget
      { wch: 30 }, // driveUrl
      { wch: 30 }, // asanaUrl
      { wch: 30 }, // slackUrl
      { wch: 15 }, // timeline
      { wch: 15 }, // projectType
      { wch: 10 }, // year
    ];

    worksheet["!cols"] = columnWidths;

    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projets");

    // Créer une feuille d'instructions
    const instructionsData = [
      {
        "Colonne": "name",
        "Description": "Nom du projet (OBLIGATOIRE)",
        "Exemple": "Site e-commerce",
      },
      {
        "Colonne": "client",
        "Description": "Nom du client",
        "Exemple": "Acme Corp",
      },
      {
        "Colonne": "team",
        "Description": "Nom de l'équipe assignée",
        "Exemple": "Équipe A",
      },
      {
        "Colonne": "status",
        "Description": "Statut du projet (pending, in_progress, completed, on_hold, cancelled)",
        "Exemple": "pending",
      },
      {
        "Colonne": "stage",
        "Description": "Étape du projet (discovery, proposal, design, development, testing, deployment, maintenance)",
        "Exemple": "discovery",
      },
      {
        "Colonne": "billing",
        "Description": "Type de facturation (fixed, hourly, retainer)",
        "Exemple": "fixed",
      },
      {
        "Colonne": "lead",
        "Description": "Responsable du projet",
        "Exemple": "Jean Dupont",
      },
      {
        "Colonne": "clientComm",
        "Description": "Email de communication avec le client",
        "Exemple": "contact@client.com",
      },
      {
        "Colonne": "contactName",
        "Description": "Nom du contact principal chez le client",
        "Exemple": "Marie Martin",
      },
      {
        "Colonne": "contactMethod",
        "Description": "Méthode de contact préférée",
        "Exemple": "Email",
      },
      {
        "Colonne": "hourlyRate",
        "Description": "Taux horaire en euros",
        "Exemple": "75",
      },
      {
        "Colonne": "proposalUrl",
        "Description": "Lien vers la proposition",
        "Exemple": "https://example.com/proposal",
      },
      {
        "Colonne": "budget",
        "Description": "Budget du projet",
        "Exemple": "5000€",
      },
      {
        "Colonne": "driveUrl",
        "Description": "Lien Google Drive du projet",
        "Exemple": "https://drive.google.com/...",
      },
      {
        "Colonne": "asanaUrl",
        "Description": "Lien Asana du projet",
        "Exemple": "https://asana.com/...",
      },
      {
        "Colonne": "slackUrl",
        "Description": "Lien Slack du projet",
        "Exemple": "https://slack.com/...",
      },
      {
        "Colonne": "timeline",
        "Description": "Délai du projet",
        "Exemple": "3 mois",
      },
      {
        "Colonne": "projectType",
        "Description": "Type de projet",
        "Exemple": "Web",
      },
      {
        "Colonne": "year",
        "Description": "Année du projet",
        "Exemple": "2025",
      },
    ];

    const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
    instructionsSheet["!cols"] = [
      { wch: 15 },
      { wch: 50 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

    // Générer le fichier Excel
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Retourner le fichier
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="modele_projets.xlsx"',
      },
    });
  } catch (error) {
    console.error("Error generating template:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération du modèle" },
      { status: 500 }
    );
  }
}
