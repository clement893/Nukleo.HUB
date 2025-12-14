import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: true,
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Facture non trouvée" }, { status: 404 });
    }

    // Générer le HTML de la facture
    const html = generateInvoiceHTML(invoice);

    // Retourner le HTML pour l'instant (la génération PDF nécessiterait puppeteer ou similaire)
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

function generateInvoiceHTML(invoice: {
  invoiceNumber: string;
  clientName: string;
  clientCompany: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  clientPhone: string | null;
  title: string;
  description: string | null;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  notes: string | null;
  terms: string | null;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }>;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facture ${invoice.invoiceNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e7eb;
    }
    .logo h1 {
      font-size: 28px;
      font-weight: 700;
      color: #6366f1;
      margin-bottom: 4px;
    }
    .logo p {
      color: #6b7280;
      font-size: 12px;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      font-size: 32px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 4px;
    }
    .invoice-title .invoice-number {
      font-size: 16px;
      color: #6b7280;
      font-family: monospace;
    }
    .info-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 40px;
    }
    .info-block h3 {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .info-block p {
      margin-bottom: 2px;
    }
    .info-block .company {
      font-weight: 600;
      font-size: 16px;
      color: #111827;
    }
    .dates {
      text-align: right;
    }
    .dates .date-row {
      margin-bottom: 8px;
    }
    .dates .label {
      color: #6b7280;
      font-size: 12px;
    }
    .dates .value {
      font-weight: 500;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    .items-table th {
      background: #f9fafb;
      padding: 12px 16px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table th:last-child {
      text-align: right;
    }
    .items-table td {
      padding: 16px;
      border-bottom: 1px solid #f3f4f6;
    }
    .items-table td:last-child {
      text-align: right;
      font-weight: 500;
    }
    .items-table .qty,
    .items-table .price {
      text-align: center;
      color: #6b7280;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .totals-table {
      width: 280px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
    }
    .totals-row.subtotal {
      border-bottom: 1px solid #e5e7eb;
    }
    .totals-row.discount {
      color: #dc2626;
    }
    .totals-row.total {
      border-top: 2px solid #111827;
      margin-top: 8px;
      padding-top: 12px;
      font-size: 18px;
      font-weight: 700;
    }
    .totals-row.total .amount {
      color: #6366f1;
    }
    .totals-row.paid {
      color: #16a34a;
    }
    .totals-row.due {
      font-weight: 600;
      color: #ea580c;
    }
    .notes-section {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .notes-section h4 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    .notes-section p {
      color: #374151;
      font-size: 13px;
    }
    .footer {
      text-align: center;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
      color: #9ca3af;
      font-size: 12px;
    }
    @media print {
      body {
        padding: 0;
      }
      .invoice-container {
        max-width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="logo">
        <h1>NUKLEO</h1>
        <p>Agence de transformation digitale</p>
        <p>Montréal, QC</p>
        <p>info@nukleo.ca</p>
      </div>
      <div class="invoice-title">
        <h2>FACTURE</h2>
        <p class="invoice-number">${invoice.invoiceNumber}</p>
      </div>
    </div>

    <div class="info-section">
      <div class="info-block">
        <h3>Facturer à</h3>
        <p class="company">${invoice.clientCompany || invoice.clientName}</p>
        ${invoice.clientCompany ? `<p>${invoice.clientName}</p>` : ""}
        ${invoice.clientEmail ? `<p>${invoice.clientEmail}</p>` : ""}
        ${invoice.clientPhone ? `<p>${invoice.clientPhone}</p>` : ""}
        ${invoice.clientAddress ? `<p>${invoice.clientAddress.replace(/\n/g, "<br>")}</p>` : ""}
      </div>
      <div class="info-block dates">
        <div class="date-row">
          <p class="label">Date d'émission</p>
          <p class="value">${formatDate(invoice.issueDate)}</p>
        </div>
        <div class="date-row">
          <p class="label">Date d'échéance</p>
          <p class="value">${formatDate(invoice.dueDate)}</p>
        </div>
      </div>
    </div>

    ${invoice.title ? `<h3 style="margin-bottom: 20px; font-size: 18px;">${invoice.title}</h3>` : ""}
    ${invoice.description ? `<p style="margin-bottom: 20px; color: #6b7280;">${invoice.description}</p>` : ""}

    <table class="items-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: center;">Quantité</th>
          <th style="text-align: center;">Prix unitaire</th>
          <th>Montant</th>
        </tr>
      </thead>
      <tbody>
        ${invoice.items
          .map(
            (item) => `
          <tr>
            <td>${item.description}</td>
            <td class="qty">${item.quantity}</td>
            <td class="price">${formatCurrency(item.unitPrice)}</td>
            <td>${formatCurrency(item.amount)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-table">
        <div class="totals-row subtotal">
          <span>Sous-total</span>
          <span>${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${
          invoice.discountAmount > 0
            ? `
        <div class="totals-row discount">
          <span>Remise (${invoice.discountPercent}%)</span>
          <span>-${formatCurrency(invoice.discountAmount)}</span>
        </div>
        `
            : ""
        }
        <div class="totals-row">
          <span>Taxes (${(invoice.taxRate * 100).toFixed(3)}%)</span>
          <span>${formatCurrency(invoice.taxAmount)}</span>
        </div>
        <div class="totals-row total">
          <span>Total</span>
          <span class="amount">${formatCurrency(invoice.total)}</span>
        </div>
        ${
          invoice.amountPaid > 0
            ? `
        <div class="totals-row paid">
          <span>Payé</span>
          <span>-${formatCurrency(invoice.amountPaid)}</span>
        </div>
        <div class="totals-row due">
          <span>Solde dû</span>
          <span>${formatCurrency(invoice.amountDue)}</span>
        </div>
        `
            : ""
        }
      </div>
    </div>

    ${
      invoice.notes
        ? `
    <div class="notes-section">
      <h4>Notes</h4>
      <p>${invoice.notes}</p>
    </div>
    `
        : ""
    }

    ${
      invoice.terms
        ? `
    <div class="notes-section">
      <h4>Conditions de paiement</h4>
      <p>${invoice.terms}</p>
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>Merci pour votre confiance!</p>
      <p>Nukleo - Agence de transformation digitale</p>
    </div>
  </div>
</body>
</html>
  `;
}
