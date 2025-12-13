import { Contact } from "./contact";

export interface Opportunity {
  id: string;
  name: string;
  value: number | null;
  company: string | null;
  referredBy: string | null;
  leadSourceType: string | null;
  contact: string | null;
  contactId: string | null;
  linkedContact?: Contact | null;
  completedAt: Date | null;
  stage: string;
  proposal: string | null;
  assignee: string | null;
  closedDate: Date | null;
  openDate: Date | null;
  region: string | null;
  segment: string | null;
  proposalSentDate: Date | null;
  projectType: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const PIPELINE_STAGES = [
  { id: "00 - Idées de contact", name: "Idées de contact", color: "#6366f1" },
  { id: "00 - Idées de projet", name: "Idées de projet", color: "#8b5cf6" },
  { id: "01 - Suivi /Emails", name: "Suivi / Emails", color: "#a855f7" },
  { id: "02 - Rencontre booké", name: "Rencontre bookée", color: "#d946ef" },
  { id: "03 - En discussion", name: "En discussion", color: "#ec4899" },
  { id: "04 - Proposal to do", name: "Proposition à faire", color: "#f43f5e" },
  { id: "05 - Proposal sent", name: "Proposition envoyée", color: "#f97316" },
  { id: "06 - Contract to do", name: "Contrat à faire", color: "#eab308" },
  { id: "07 - En attente ou Silence radio", name: "En attente", color: "#a1a1aa" },
  { id: "08 - Renouvellement à venir", name: "Renouvellement à venir", color: "#22c55e" },
  { id: "09 - Renouvellements potentiels", name: "Renouvellements potentiels", color: "#14b8a6" },
  { id: "10 - Closed Won", name: "Gagné", color: "#10b981" },
  { id: "11 - Closed Lost", name: "Perdu", color: "#ef4444" },
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number]["id"];

export const REGIONS = ["QC", "NS", "ROC", "EU", "USA"] as const;
export type Region = typeof REGIONS[number];

export const SEGMENTS = [
  "Startups",
  "PMEs",
  "Grande entreprise",
  "OBNL'S",
  "Culture",
  "Institutions",
] as const;
export type Segment = typeof SEGMENTS[number];
