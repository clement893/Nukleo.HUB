export interface Contact {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  level: number | null;
  potentialSale: boolean;
  photoUrl: string | null;
  linkedinUrl: string | null;
  position: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  relation: string | null;
  circles: string | null;
  employmentField: string | null;
  lastUpdated: Date | null;
  region: string | null;
  birthday: string | null;
  link: string | null;
  tags: string | null;
  linkedOpportunities: string | null;
  projects: string | null;
  language: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ContactCreateInput = Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>;
