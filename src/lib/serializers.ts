/**
 * Utilitaires de sérialisation pour exclure les données sensibles
 * des réponses API
 */

/**
 * Sérialise un utilisateur en excluant les données sensibles
 */
export function serializeUser(user: any) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    photoUrl: user.photoUrl,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // Exclure : googleId, googleAccessToken, googleRefreshToken, googleTokenExpiry
  };
}

/**
 * Sérialise une liste d'utilisateurs
 */
export function serializeUsers(users: any[]) {
  return users.map(serializeUser);
}

/**
 * Sérialise une session en excluant les données sensibles
 */
export function serializeSession(session: any) {
  if (!session) return null;

  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
    // Exclure : token
  };
}

/**
 * Sérialise un employé en excluant les données sensibles
 */
export function serializeEmployee(employee: any) {
  if (!employee) return null;

  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    position: employee.position,
    department: employee.department,
    photoUrl: employee.photoUrl,
    linkedinUrl: employee.linkedinUrl,
    status: employee.status,
    hireDate: employee.hireDate,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
    // Exclure : password, apiKey
  };
}

/**
 * Sérialise une liste d'employés
 */
export function serializeEmployees(employees: any[]) {
  return employees.map(serializeEmployee);
}

/**
 * Sérialise un portail client en excluant les données sensibles
 */
export function serializeClientPortal(portal: any) {
  if (!portal) return null;

  return {
    id: portal.id,
    token: portal.token,
    clientName: portal.clientName,
    clientEmail: portal.clientEmail,
    companyId: portal.companyId,
    isActive: portal.isActive,
    welcomeMessage: portal.welcomeMessage,
    createdAt: portal.createdAt,
    updatedAt: portal.updatedAt,
    _count: portal._count,
    // Les tokens sont inclus car ils sont nécessaires pour accéder au portail
  };
}

/**
 * Sérialise une liste de portails clients
 */
export function serializeClientPortals(portals: any[]) {
  return portals.map(serializeClientPortal);
}

/**
 * Sérialise un ticket en excluant les données sensibles
 */
export function serializeTicket(ticket: any) {
  if (!ticket) return null;

  return {
    id: ticket.id,
    portalId: ticket.portalId,
    projectId: ticket.projectId,
    subject: ticket.subject,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    submittedBy: ticket.submittedBy,
    submittedEmail: ticket.submittedEmail,
    assignedToId: ticket.assignedToId,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
    resolvedAt: ticket.resolvedAt,
  };
}

/**
 * Sérialise une liste de tickets
 */
export function serializeTickets(tickets: any[]) {
  return tickets.map(serializeTicket);
}

/**
 * Sérialise un projet en excluant les données sensibles
 */
export function serializeProject(project: any) {
  if (!project) return null;

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    clientId: project.clientId,
    status: project.status,
    priority: project.priority,
    startDate: project.startDate,
    endDate: project.endDate,
    budget: project.budget,
    managerId: project.managerId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

/**
 * Sérialise une liste de projets
 */
export function serializeProjects(projects: any[]) {
  return projects.map(serializeProject);
}

/**
 * Sérialise un contact en excluant les données sensibles
 */
export function serializeContact(contact: any) {
  if (!contact) return null;

  return {
    id: contact.id,
    fullName: contact.fullName,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    position: contact.position,
    company: contact.company,
    linkedinUrl: contact.linkedinUrl,
    photoUrl: contact.photoUrl,
    tags: contact.tags,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt,
  };
}

/**
 * Sérialise une liste de contacts
 */
export function serializeContacts(contacts: any[]) {
  return contacts.map(serializeContact);
}

/**
 * Fonction générique pour exclure des champs
 */
export function excludeFields<T extends Record<string, any>>(
  obj: T,
  fieldsToExclude: (keyof T)[]
): Partial<T> {
  const result = { ...obj };
  fieldsToExclude.forEach((field) => {
    delete result[field];
  });
  return result;
}

/**
 * Fonction générique pour sélectionner des champs
 */
export function selectFields<T extends Record<string, any>>(
  obj: T,
  fieldsToSelect: (keyof T)[]
): Partial<T> {
  const result: any = {};
  fieldsToSelect.forEach((field) => {
    if (field in obj) {
      result[field] = obj[field];
    }
  });
  return result;
}
