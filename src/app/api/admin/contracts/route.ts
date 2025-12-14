import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

const createContractSchema = z.object({
  templateId: z.string().optional(),
  companyId: z.string().optional(),
  supplierId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["client", "supplier", "subcontractor", "nda", "service", "other"]),
  type: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  renewalDate: z.string().optional(),
  signatureDeadline: z.string().optional(),
  totalAmount: z.number().optional(),
  currency: z.string().default("CAD"),
  paymentTerms: z.string().optional(),
  content: z.string().min(1),
  terms: z.string().optional(),
  documentUrl: z.string().optional(),
  attachments: z.string().optional(),
  requiresSignature: z.boolean().default(true),
  renewalReminderDays: z.array(z.number()).default([90, 60, 30]),
  notes: z.string().optional(),
  tags: z.string().optional(),
});

// GET - Liste des contrats
export async function GET(_request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const companyId = searchParams.get("companyId");
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (category) where.category = category;
    if (companyId) where.companyId = companyId;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { contractNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        company: {
          select: { id: true, name: true, logoUrl: true },
        },
        supplier: {
          select: { id: true, name: true, type: true },
        },
        template: {
          select: { id: true, name: true, category: true },
        },
        signatures: {
          orderBy: { signedAt: "desc" },
          take: 1,
        },
        _count: {
          select: {
            signatures: true,
            renewals: true,
            amendments: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(contracts);
  } catch (error) {
    logger.error("Erreur récupération contrats", error as Error, "GET /api/admin/contracts");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST - Créer un contrat
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Données invalides", details: validation.error.issues },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Générer le numéro de contrat
    const lastContract = await prisma.contract.findFirst({
      orderBy: { contractNumber: "desc" },
      where: {
        contractNumber: {
          startsWith: `CONTRACT-${new Date().getFullYear()}-`,
        },
      },
    });

    let contractNumber = `CONTRACT-${new Date().getFullYear()}-0001`;
    if (lastContract) {
      const lastNumber = parseInt(lastContract.contractNumber.split("-")[2] || "0");
      contractNumber = `CONTRACT-${new Date().getFullYear()}-${String(lastNumber + 1).padStart(4, "0")}`;
    }

    // Remplacer les variables si template utilisé
    let content = data.content;
    if (data.templateId) {
      const template = await prisma.contractTemplate.findUnique({
        where: { id: data.templateId },
      });
      if (template) {
        // Remplacer les variables communes
        content = template.content
          .replace(/\{\{CONTRACT_NUMBER\}\}/g, contractNumber)
          .replace(/\{\{DATE\}\}/g, new Date().toLocaleDateString("fr-FR"))
          .replace(/\{\{YEAR\}\}/g, new Date().getFullYear().toString());
        
        // Remplacer les variables spécifiques si companyId ou supplierId
        if (data.companyId) {
          const company = await prisma.company.findUnique({
            where: { id: data.companyId },
          });
          if (company) {
            content = content
              .replace(/\{\{CLIENT_NAME\}\}/g, company.name)
              .replace(/\{\{CLIENT_ADDRESS\}\}/g, company.address || "")
              .replace(/\{\{CLIENT_EMAIL\}\}/g, company.mainContactEmail || "");
          }
        }
        if (data.supplierId) {
          const supplier = await prisma.supplier.findUnique({
            where: { id: data.supplierId },
          });
          if (supplier) {
            content = content
              .replace(/\{\{SUPPLIER_NAME\}\}/g, supplier.name)
              .replace(/\{\{SUPPLIER_ADDRESS\}\}/g, supplier.address || "")
              .replace(/\{\{SUPPLIER_EMAIL\}\}/g, supplier.email || "");
          }
        }
      }
    }

    const contract = await prisma.contract.create({
      data: {
        contractNumber,
        templateId: data.templateId,
        companyId: data.companyId,
        supplierId: data.supplierId,
        title: data.title,
        description: data.description,
        category: data.category,
        type: data.type,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
        signatureDeadline: data.signatureDeadline ? new Date(data.signatureDeadline) : null,
        totalAmount: data.totalAmount,
        currency: data.currency,
        paymentTerms: data.paymentTerms,
        content,
        terms: data.terms,
        documentUrl: data.documentUrl,
        attachments: data.attachments,
        requiresSignature: data.requiresSignature,
        renewalReminderDays: data.renewalReminderDays,
        notes: data.notes,
        tags: data.tags,
        status: "draft",
        createdBy: user.id,
      },
      include: {
        company: true,
        supplier: true,
        template: true,
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    logger.error("Erreur création contrat", error as Error, "POST /api/admin/contracts");
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
