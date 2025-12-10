export interface LinkedCompany {
  id: string;
  name: string;
  logoUrl?: string | null;
  isClient: boolean;
}

export interface LinkedContact {
  id: string;
  fullName: string;
  photoUrl?: string | null;
  position?: string | null;
}

export interface Project {
  id: string;
  name: string;
  client: string | null;
  team: string | null;
  status: string | null;
  stage: string | null;
  billing: string | null;
  lead: string | null;
  clientComm: string | null;
  contactName: string | null;
  contactMethod: string | null;
  hourlyRate: number | null;
  proposalUrl: string | null;
  budget: string | null;
  driveUrl: string | null;
  asanaUrl: string | null;
  slackUrl: string | null;
  timeline: string | null;
  projectType: string | null;
  year: string | null;
  description: string | null;
  brief: string | null;
  testimonial: string | null;
  portfolio: string | null;
  report: string | null;
  communication: string | null;
  departments: string | null;
  createdAt: Date;
  updatedAt: Date;
  company?: LinkedCompany | null;
  contact?: LinkedContact | null;
}

export type ProjectCreateInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export const PROJECT_STATUSES = [
  'Not started',
  'En cours',
  'Actif',
  'Optimisation',
  'Retours clients',
  'Demandé',
  'Bloqué',
  'Flag',
  'Done',
] as const;

export const PROJECT_TYPES = [
  'Site web',
  'Design',
  'Gestion comm/mkt',
  'Branding',
  'Vidéo',
  'Photo',
  'Stratégie',
  'Développement',
] as const;
