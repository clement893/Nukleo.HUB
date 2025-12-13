import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { validateUploadedFile, sanitizeFileName, ALLOWED_FILE_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZES } from "@/lib/upload-validation";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { scanFile } from "@/lib/virus-scanner";
import { logger } from "@/lib/logger";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ca-central-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// GET /api/documents?projectId=xxx or ?taskId=xxx or ?companyId=xxx etc.
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const contactId = searchParams.get("contactId");
    const projectId = searchParams.get("projectId");
    const opportunityId = searchParams.get("opportunityId");
    const taskId = searchParams.get("taskId");
    const category = searchParams.get("category");

    // Si taskId, récupérer les documents attachés à la tâche
    if (taskId) {
      const taskDocuments = await prisma.taskDocument.findMany({
        where: { taskId },
        include: { document: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(taskDocuments.map(td => td.document));
    }

    const where: Record<string, unknown> = {};
    if (companyId) where.companyId = companyId;
    if (contactId) where.contactId = contactId;
    if (projectId) where.projectId = projectId;
    if (opportunityId) where.opportunityId = opportunityId;
    if (category) where.category = category;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        taskDocuments: true,
      },
    });

      return NextResponse.json(documents);
  } catch (error) {
    logger.error("Error fetching documents", error as Error, "DOCUMENTS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des documents."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/documents - Créer un document ou uploader un fichier
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      // Upload de fichier
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const projectId = formData.get("projectId") as string;
      const category = formData.get("category") as string;
      const description = formData.get("description") as string;
      const taskId = formData.get("taskId") as string;
      const uploadedBy = formData.get("uploadedBy") as string;

      if (!file || !projectId) {
        return NextResponse.json(
          { error: "file and projectId are required" },
          { status: 400 }
        );
      }

      // Rate limiting pour les uploads
      const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.upload);
      if (rateLimitError) return rateLimitError;

      // Valider le fichier
      const validation = validateUploadedFile(file, {
        allowedTypes: [...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.documents, ...ALLOWED_FILE_TYPES.archives],
        allowedExtensions: [...ALLOWED_EXTENSIONS.images, ...ALLOWED_EXTENSIONS.documents, ...ALLOWED_EXTENSIONS.archives],
        maxSize: MAX_FILE_SIZES.documents,
      });
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error },
          { status: 400 }
        );
      }

      // Scanner le fichier pour détecter les malwares
      const scanResult = await scanFile(file);
      if (!scanResult.isClean) {
        logger.warn("Malware detected in file upload", "SECURITY", {
          fileName: file.name,
          fileSize: file.size,
          threats: scanResult.threats,
          userId: auth.id,
        });
        return NextResponse.json(
          { error: "Fichier malveillant détecté. Upload refusé." },
          { status: 400 }
        );
      }

      // Sanitiser le nom du fichier
      const safeFileName = sanitizeFileName(file.name);

      // Générer une clé unique pour S3
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const fileKey = `projects/${projectId}/documents/${timestamp}-${randomSuffix}-${safeFileName}`;

      // Upload vers S3
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET || "nukleo-hub",
          Key: fileKey,
          Body: buffer,
          ContentType: file.type,
        })
      );

      const fileUrl = `https://${process.env.AWS_S3_BUCKET || "nukleo-hub"}.s3.${process.env.AWS_REGION || "ca-central-1"}.amazonaws.com/${fileKey}`;

      // Créer le document dans la base de données
      const document = await prisma.document.create({
        data: {
          projectId,
          name: file.name,
          type: "file",
          url: fileUrl,
          fileKey,
          mimeType: file.type,
          size: file.size,
          category: category || "general",
          description: description || null,
          uploadedBy: uploadedBy || "Admin",
        },
      });

      // Si un taskId est fourni, attacher le document à la tâche
      if (taskId) {
        await prisma.taskDocument.create({
          data: {
            taskId,
            documentId: document.id,
            addedBy: uploadedBy || null,
          },
        });
      }

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: "document_uploaded",
          description: `Fichier "${file.name}" uploadé`,
          entityType: "project",
          entityId: projectId,
          userName: uploadedBy || "Admin",
        },
      });

      return NextResponse.json(document, { status: 201 });
    } else {
      // Création d'un lien
      const body = await request.json();
      const { name, url, type, size, companyId, contactId, projectId, opportunityId, uploadedBy, category, description, taskId } = body;

      if (!name || !url) {
        return NextResponse.json(
          { error: "name and url are required" },
          { status: 400 }
        );
      }

      const document = await prisma.document.create({
        data: {
          name,
          url,
          type: type || "link",
          size,
          companyId,
          contactId,
          projectId,
          opportunityId,
          category: category || "general",
          description: description || null,
          uploadedBy: uploadedBy || "Admin",
        },
      });

      // Si un taskId est fourni, attacher le document à la tâche
      if (taskId) {
        await prisma.taskDocument.create({
          data: {
            taskId,
            documentId: document.id,
            addedBy: uploadedBy || null,
          },
        });
      }

      // Log activity
      const entityType = companyId ? "company" : contactId ? "contact" : projectId ? "project" : "opportunity";
      const entityId = companyId || contactId || projectId || opportunityId;
      
      if (entityId) {
        await prisma.activityLog.create({
          data: {
            action: "document_uploaded",
            description: `Document "${name}" ajouté`,
            entityType,
            entityId,
            userName: uploadedBy || "Admin",
          },
        });
      }

      return NextResponse.json(document, { status: 201 });
    }
  } catch (error) {
    logger.error("Error creating document", error as Error, "DOCUMENTS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création du document."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE /api/documents?id=xxx
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    // Supprimer d'abord les relations avec les tâches
    await prisma.taskDocument.deleteMany({
      where: { documentId: id },
    });

    // Supprimer le document
    await prisma.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error deleting document", error as Error, "DOCUMENTS_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la suppression du document."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
