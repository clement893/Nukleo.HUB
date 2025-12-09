export interface Company {
  id: string;
  name: string;
  logoUrl: string | null;
  website: string | null;
  address: string | null;
  phone: string | null;
  type: string | null;
  mainContactName: string | null;
  mainContactEmail: string | null;
  description: string | null;
  industry: string | null;
  insight: string | null;
  engagements: string | null;
  linkedinUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  agencyPartners: string | null;
  referralPartners: string | null;
  isClient: boolean;
  testimonials: string | null;
  events: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CompanyCreateInput = Omit<Company, 'id' | 'createdAt' | 'updatedAt'>;

export const COMPANY_TYPES = [
  "Client",
  "Prospect",
  "Partenaire",
  "Fournisseur",
  "Autre",
] as const;

export const INDUSTRIES = [
  "Information Technology",
  "Marketing",
  "Legal Services",
  "Accounting",
  "Art",
  "Finance",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Retail",
  "Real Estate",
  "Media",
  "Consulting",
  "Non-profit",
  "Government",
  "Other",
] as const;
