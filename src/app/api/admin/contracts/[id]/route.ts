import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const updateContractSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["draft", "pending_signature", "active", "expired", "terminated", "cancelled"]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  signatureDeadline: z.string().optional(),
  totalAmount: z.number().optional(),
  currency: z.string().optional(),
  paymentTerms: z.string().optional(),
  content: z.string().optional(),
  terms: z.string().optional(),
  documentUrl: z.string().optional(),
  attachments: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  renewalReminderDays: z.array(z.number()).optional(),
});

// GET - Récupérer un contrat
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        company: true,
        supplier: true,
        template: true,
        signatures: {
          orderBy: { signedAt: "desc" },
        },
        renewals: {
          orderBy: { createdAt: "desc" },
        },
        amendments: {
          orderBy: { createdAt: "desc" },
          include: {
            signatures: true,
          },
        },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrat non trouvé" }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    logger.error("Erreur récupération contrat", error as Error, "GET /api/admin/contracts/[id]");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// PUT - Mettre à jour un contrat
export async function PUT(
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
    const validation = updateContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.renewalDate !== undefined) updateData.renewalDate = data.renewalDate ? new Date(data.renewalDate) : null;
    if (data.signatureDeadline !== undefined) updateData.signatureDeadline = data.signatureDeadline ? new Date(data.signatureDeadline) : null;
    if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.paymentTerms !== undefined) updateData.paymentTerms = data.paymentTerms;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.terms !== undefined) updateData.terms = data.terms;
    if (data.documentUrl !== undefined) updateData.documentUrl = data.documentUrl;
    if (data.attachments !== undefined) updateData.attachments = data.attachments;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.renewalReminderDays !== undefined) updateData.renewalReminderDays = data.renewalReminderDays;

    const contract = await prisma.contract.update({
      where: { id },
      data: updateData,
      include: {
        company: true,
        supplier: true,
        template: true,
        signatures: true,
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    logger.error("Erreur mise à jour contrat", error as Error, "PUT /api/admin/contracts/[id]");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE - Supprimer un contrat
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;

    await prisma.contract.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Erreur suppression contrat", error as Error, "DELETE /api/admin/contracts/[id]");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
