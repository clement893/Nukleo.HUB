import { z } from "zod";

// ============================================
// Contact Schemas
// ============================================
export const contactCreateSchema = z.object({
  fullName: z.string().min(1, "Le nom est requis").max(255),
  email: z.string().email("Email invalide").optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  companyId: z.string().optional().nullable(),
  position: z.string().max(255).optional().nullable(),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  notes: z.string().optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  status: z.enum(["active", "inactive", "lead", "client"]).optional(),
  tags: z.string().optional().nullable(),  // Chaîne séparée par virgules dans Prisma
});

export const contactUpdateSchema = contactCreateSchema.partial();

// ============================================
// Company Schemas
// ============================================
export const companyCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  industry: z.string().max(100).optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  linkedinUrl: z.string().url().optional().nullable().or(z.literal("")),
  size: z.string().max(50).optional().nullable(),
  revenue: z.string().max(100).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable().or(z.literal("")),
  status: z.enum(["prospect", "client", "partner", "inactive"]).optional(),
  tags: z.string().optional().nullable(),  // Chaîne séparée par virgules dans Prisma
});

export const companyUpdateSchema = companyCreateSchema.partial();

// ============================================
// Employee Schemas
// ============================================
export const employeeCreateSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis").max(100),
  lastName: z.string().min(1, "Le nom est requis").max(100),
  email: z.string().email("Email invalide"),
  phone: z.string().max(50).optional().nullable(),
  position: z.string().max(255).optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  hireDate: z.string().optional().nullable(),
  salary: z.number().positive().optional().nullable(),
  status: z.enum(["active", "inactive", "on_leave"]).optional(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const employeeUpdateSchema = employeeCreateSchema.partial();

// ============================================
// Project Schemas
// ============================================
export const projectCreateSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(255),
  description: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  status: z.enum(["planning", "in_progress", "on_hold", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  budget: z.number().nonnegative().optional().nullable(),
  managerId: z.string().optional().nullable(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

// ============================================
// Task Schemas
// ============================================
export const taskCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255),
  description: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  status: z.enum(["todo", "in_progress", "review", "done", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dueDate: z.string().optional().nullable(),
  estimatedHours: z.number().nonnegative().optional().nullable(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

// ============================================
// Opportunity Schemas
// ============================================
export const opportunityCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255),
  description: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  contactId: z.string().optional().nullable(),
  value: z.number().nonnegative().optional().nullable(),
  probability: z.number().min(0).max(100).optional().nullable(),
  stage: z.string().max(50).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  source: z.string().max(100).optional().nullable(),
  assignedTo: z.string().optional().nullable(),
});

export const opportunityUpdateSchema = opportunityCreateSchema.partial();

// ============================================
// Event Schemas
// ============================================
export const eventCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255),
  description: z.string().optional().nullable(),
  startDate: z.string(),
  endDate: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  type: z.enum(["meeting", "call", "task", "reminder", "other"]).optional(),
  attendees: z.array(z.string()).optional(),
  relatedId: z.string().optional().nullable(),
  relatedType: z.string().max(50).optional().nullable(),
});

export const eventUpdateSchema = eventCreateSchema.partial();

// ============================================
// Testimonial Schemas
// ============================================
export const testimonialCreateSchema = z.object({
  clientName: z.string().min(1, "Le nom du client est requis").max(255),
  clientCompany: z.string().max(255).optional().nullable(),
  clientPosition: z.string().max(255).optional().nullable(),
  content: z.string().min(1, "Le contenu est requis"),
  rating: z.number().min(1).max(5).optional(),
  projectId: z.string().optional().nullable(),
  isPublished: z.boolean().optional(),
  photoUrl: z.string().url().optional().nullable().or(z.literal("")),
});

export const testimonialUpdateSchema = testimonialCreateSchema.partial();

// ============================================
// Ticket Schemas
// ============================================
export const ticketCreateSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(255),
  description: z.string().min(1, "La description est requise"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  category: z.string().max(100).optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const ticketUpdateSchema = ticketCreateSchema.partial().extend({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
});

// ============================================
// Vacation Request Schemas
// ============================================
export const vacationRequestCreateSchema = z.object({
  type: z.enum(["vacation", "sick", "personal", "unpaid", "other"]),
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().max(1000).optional().nullable(),
});

export const vacationApprovalSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminComment: z.string().max(1000).optional().nullable(),
});

// ============================================
// User Schemas
// ============================================
export const userUpdateSchema = z.object({
  role: z.enum(["user", "admin", "super_admin"]).optional(),
  isActive: z.boolean().optional(),
  employeeId: z.string().optional().nullable(),
});

// ============================================
// Helper function to validate and parse
// ============================================
export function validateBody<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Zod 4 utilise 'issues' au lieu de 'errors'
      const issues = (error as { issues?: Array<{ path: (string | number)[]; message: string }> }).issues || [];
      const messages = issues.map(e => `${e.path.join(".")}: ${e.message}`).join(", ");
      return { success: false, error: messages || "Validation échouée" };
    }
    return { success: false, error: "Données invalides" };
  }
}

// ============================================
// Client Portal Schemas
// ============================================
export const clientPortalCreateSchema = z.object({
  clientName: z.string().min(1, "Client name is required").max(255),
  clientEmail: z.string().email("Invalid email").optional().nullable(),
  companyId: z.string().optional().nullable(),
  welcomeMessage: z.string().max(5000).optional().nullable(),
});

export const clientPortalUpdateSchema = clientPortalCreateSchema.partial();

// ============================================
// Activity Schemas
// ============================================
export const activityCreateSchema = z.object({
  entityType: z.string().min(1).max(50),
  entityId: z.string().min(1),
  type: z.enum(["created", "updated", "deleted", "commented", "assigned"]),
  description: z.string().max(1000),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ============================================
// Billing Report Schemas
// ============================================
export const billingReportQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  projectId: z.string().optional(),
  employeeId: z.string().optional(),
  groupBy: z.enum(["project", "employee"]).optional(),
});

// ============================================
// Communication Client Schemas
// ============================================
export const communicationClientCreateSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  company: z.string().max(255).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
});

export const communicationClientUpdateSchema = communicationClientCreateSchema.partial();

// ============================================
// Recommendation Schemas
// ============================================
export const recommendationCreateSchema = z.object({
  employeeId: z.string().min(1),
  category: z.enum(["improvement", "bug", "feature", "general"]),
  title: z.string().min(1).max(255),
  description: z.string().min(1).max(5000),
  priority: z.enum(["low", "medium", "high"]).optional(),
});

export const recommendationUpdateSchema = recommendationCreateSchema.partial();

// ============================================
// Invitation Schemas
// ============================================
export const invitationCreateSchema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["user", "admin", "super_admin"]),
  message: z.string().max(1000).optional().nullable(),
});

// ============================================
// Menu Permission Schemas
// ============================================
export const menuPermissionSchema = z.object({
  userId: z.string().min(1),
  menuItem: z.string().min(1).max(100),
  canView: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

// ============================================
// User Access Schemas
// ============================================
export const userAccessUpdateSchema = z.object({
  clientsAccess: z.enum(["all", "specific", "none"]).optional(),
  projectsAccess: z.enum(["all", "specific", "none"]).optional(),
  spacesAccess: z.enum(["all", "specific", "none"]).optional(),
  specificClients: z.array(z.string()).optional(),
  specificProjects: z.array(z.string()).optional(),
  specificSpaces: z.array(z.string()).optional(),
});
