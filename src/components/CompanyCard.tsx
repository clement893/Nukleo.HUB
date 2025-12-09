"use client";

import { Company } from "@/types/company";
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Facebook,
  Instagram,
  ExternalLink,
  Star,
} from "lucide-react";

interface CompanyCardProps {
  company: Company;
  onClick?: (company: Company) => void;
}

export default function CompanyCard({ company, onClick }: CompanyCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={() => onClick?.(company)}
      className="group glass-card rounded-xl p-5 cursor-pointer hover:border-primary/30 hover:shadow-lg transition-all"
    >
      {/* Header with logo and name */}
      <div className="flex items-start gap-4 mb-4">
        {company.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="w-14 h-14 rounded-lg object-cover bg-muted"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">
              {getInitials(company.name)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {company.name}
            </h3>
            {company.isClient && (
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
            )}
          </div>
          {company.industry && (
            <p className="text-sm text-muted-foreground truncate">
              {company.industry}
            </p>
          )}
          {company.type && (
            <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-secondary/10 text-secondary">
              {company.type}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      {company.description && (
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {company.description}
        </p>
      )}

      {/* Contact info */}
      <div className="space-y-2 mb-4">
        {company.mainContactName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{company.mainContactName}</span>
          </div>
        )}
        {company.mainContactEmail && (
          <a
            href={`mailto:${company.mainContactEmail}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{company.mainContactEmail}</span>
          </a>
        )}
        {company.phone && (
          <a
            href={`tel:${company.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{company.phone}</span>
          </a>
        )}
        {company.address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{company.address}</span>
          </div>
        )}
      </div>

      {/* Social links and website */}
      <div className="flex items-center gap-2 pt-3 border-t border-border">
        {company.website && (
          <a
            href={company.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Site web"
          >
            <Globe className="w-4 h-4" />
          </a>
        )}
        {company.linkedinUrl && (
          <a
            href={company.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-muted-foreground hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 rounded-lg transition-colors"
            title="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
        )}
        {company.facebookUrl && (
          <a
            href={company.facebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-muted-foreground hover:text-[#1877F2] hover:bg-[#1877F2]/10 rounded-lg transition-colors"
            title="Facebook"
          >
            <Facebook className="w-4 h-4" />
          </a>
        )}
        {company.instagramUrl && (
          <a
            href={company.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-2 text-muted-foreground hover:text-[#E4405F] hover:bg-[#E4405F]/10 rounded-lg transition-colors"
            title="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
        )}
        <div className="flex-1" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(company);
          }}
          className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
          title="Voir détails"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
