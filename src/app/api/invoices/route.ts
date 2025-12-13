import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, isErrorResponse } from "@/lib/api-auth";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Générer le prochain numéro de facture
async function generateInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;
  
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      invoiceNumber: "desc",
    },
  });
  
  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ""), 10);
    nextNumber = lastNumber + 1;
  }
  
  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
}

// GET - Liste des factures
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.read);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const clientEmail = searchParams.get("clientEmail");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status && status !== "all") {
      where.status = status;
    }

    if (clientEmail) {
      where.clientEmail = clientEmail;
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        (where.issueDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.issueDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { clientName: { contains: search } },
        { clientCompany: { contains: search } },
        { title: { contains: search } },
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        items: true,
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        _count: {
          select: { reminders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Mettre à jour le statut des factures en retard
    const now = new Date();
    for (const invoice of invoices) {
      if (
        invoice.status === "sent" &&
        invoice.dueDate < now &&
        invoice.amountDue > 0
      ) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: "overdue" },
        });
        invoice.status = "overdue";
      }
    }

    return NextResponse.json(invoices);
  } catch (error) {
    logger.error("Error fetching invoices", error as Error, "INVOICES_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la récupération des factures."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle facture
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitError = rateLimitMiddleware(request, RATE_LIMITS.write);
  if (rateLimitError) return rateLimitError;

  const auth = await requireAuth();
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await request.json();
    const {
      quoteId,
      projectId,
      clientName,
      clientEmail,
      clientCompany,
      clientAddress,
      clientPhone,
      title,
      description,
      dueDate,
      items = [],
      discountPercent = 0,
      taxRate = 0.14975,
      notes,
      terms,
      footerNote,
    } = body;

    // Générer le numéro de facture
    const invoiceNumber = await generateInvoiceNumber();

    // Calculer les montants
    let subtotal = 0;
    const processedItems = items.map((item: {
      description: string;
      quantity: number;
      unitPrice: number;
      unit?: string;
      projectId?: string;
      phaseId?: string;
      sortOrder?: number;
    }, index: number) => {
      const amount = item.quantity * item.unitPrice;
      subtotal += amount;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unit: item.unit || "unité",
        amount,
        projectId: item.projectId,
        phaseId: item.phaseId,
        sortOrder: item.sortOrder || index,
      };
    });

    const discountAmount = subtotal * (discountPercent / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * taxRate;
    const total = taxableAmount + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        quoteId,
        projectId,
        clientName,
        clientEmail,
        clientCompany,
        clientAddress,
        clientPhone,
        title,
        description,
        issueDate: new Date(),
        dueDate: new Date(dueDate),
        subtotal,
        discountPercent,
        discountAmount,
        taxRate,
        taxAmount,
        total,
        amountPaid: 0,
        amountDue: total,
        notes,
        terms,
        footerNote,
        createdBy: auth.id,
        items: {
          create: processedItems,
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    logger.error("Error creating invoice", error as Error, "INVOICES_API");
    const errorMessage = process.env.NODE_ENV === "production"
      ? "Une erreur est survenue lors de la création de la facture."
      : (error as Error).message;
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
