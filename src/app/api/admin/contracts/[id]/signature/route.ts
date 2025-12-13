import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const addSignatureSchema = z.object({
  signerType: z.enum(["client", "supplier", "agency", "employee"]),
  signerId: z.string().optional(),
  signerName: z.string().min(1),
  signerEmail: z.string().email().optional(),
  signerTitle: z.string().optional(),
  signatureData: z.string().min(1),
  signatureMethod: z.enum(["draw", "type", "upload"]).default("draw"),
});

// POST - Ajouter une signature à un contrat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = addSignatureSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const contract = await prisma.contract.findUnique({
      where: { id },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrat non trouvé" }, { status: 404 });
    }

    const { signerType, signerName, signerEmail, signerTitle, signatureData, signatureMethod } = validation.data;

    // Récupérer IP et user agent
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Créer la signature
    const signature = await prisma.contractSignature.create({
      data: {
        contractId: id,
        signerType,
        signerId: validation.data.signerId,
        signerName,
        signerEmail,
        signerTitle,
        signatureData,
        signatureMethod,
        ipAddress,
        userAgent,
      },
    });

    // Mettre à jour les flags de signature selon le type
    const updateData: Record<string, unknown> = {};
    if (signerType === "client") {
      updateData.signedByClient = true;
      updateData.clientSignedAt = new Date();
    } else if (signerType === "supplier") {
      updateData.signedBySupplier = true;
      updateData.supplierSignedAt = new Date();
    } else if (signerType === "agency") {
      updateData.signedByAgency = true;
      updateData.agencySignedAt = new Date();
    }

    // Si toutes les signatures requises sont présentes, passer à "active"
    if (contract.requiresSignature) {
      const allSignatures = await prisma.contractSignature.findMany({
        where: { contractId: id },
      });
      
      const hasClientSignature = allSignatures.some(s => s.signerType === "client");
      const hasSupplierSignature = contract.supplierId ? allSignatures.some(s => s.signerType === "supplier") : true;
      const hasAgencySignature = allSignatures.some(s => s.signerType === "agency");

      if (hasClientSignature && hasSupplierSignature && hasAgencySignature && contract.status === "pending_signature") {
        updateData.status = "active";
      } else if (contract.status === "draft") {
        updateData.status = "pending_signature";
      }
    }

    await prisma.contract.update({
      where: { id },
      data: updateData,
    });

    const updatedContract = await prisma.contract.findUnique({
      where: { id },
      include: {
        signatures: {
          orderBy: { signedAt: "desc" },
        },
      },
    });

    return NextResponse.json({ signature, contract: updatedContract });
  } catch (error) {
    logger.error("Erreur ajout signature", error as Error, "POST /api/admin/contracts/[id]/signature");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
