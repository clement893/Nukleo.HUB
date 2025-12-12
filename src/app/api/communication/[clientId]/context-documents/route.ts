import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { storagePut } from "@/lib/storage";

// GET - Récupérer les documents de contexte d'un client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { clientId } = await params;

    // Vérifier l'accès au client
    const client = await prisma.communicationClient.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    const documents = await prisma.communicationContextDocument.findMany({
      where: { clientId },
      orderBy: { uploadedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedBy: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error fetching context documents:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Uploader un document de contexte
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { clientId } = await params;
    const formData = await request.formData();

    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const documentType = formData.get("documentType") as string;

    if (!file || !title || !documentType) {
      return NextResponse.json(
        { error: "Fichier, titre et type de document requis" },
        { status: 400 }
      );
    }

    // Vérifier l'accès au client
    const client = await prisma.communicationClient.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: "Client non trouvé" }, { status: 404 });
    }

    // Uploader le fichier sur S3
    const fileBuffer = await file.arrayBuffer();
    const fileKey = `communication/${clientId}/context-documents/${Date.now()}-${file.name}`;
    const { url } = await storagePut(fileKey, Buffer.from(fileBuffer), file.type);

    // Extraire le texte du fichier (simplifié - dans un vrai cas, utiliser une librairie)
    let extractedText = "";
    if (file.type === "text/plain") {
      extractedText = await file.text();
    } else if (file.type === "application/pdf") {
      // Pour les PDFs, vous devriez utiliser une librairie comme pdf-parse
      extractedText = `[PDF Document: ${file.name}]`;
    }

    // Créer le document dans la base de données
    const document = await prisma.communicationContextDocument.create({
      data: {
        clientId,
        title,
        description: description || null,
        documentType,
        fileUrl: url,
        fileKey,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        extractedText: extractedText || null,
        uploadedBy: auth.email,
      },
      select: {
        id: true,
        title: true,
        description: true,
        documentType: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        uploadedBy: true,
        uploadedAt: true,
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error uploading context document:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un document de contexte
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json({ error: "ID document requis" }, { status: 400 });
    }

    const document = await prisma.communicationContextDocument.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 });
    }

    // Supprimer le document de la base de données
    await prisma.communicationContextDocument.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting context document:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
