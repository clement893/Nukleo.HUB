import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/documents?companyId=xxx or ?contactId=xxx or ?projectId=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    const contactId = searchParams.get("contactId");
    const projectId = searchParams.get("projectId");
    const opportunityId = searchParams.get("opportunityId");

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (contactId) where.contactId = contactId;
    if (projectId) where.projectId = projectId;
    if (opportunityId) where.opportunityId = opportunityId;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}

// POST /api/documents
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, type, size, companyId, contactId, projectId, opportunityId, uploadedBy } = body;

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
        type,
        size,
        companyId,
        contactId,
        projectId,
        opportunityId,
        uploadedBy: uploadedBy || "Admin",
      },
    });

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
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
