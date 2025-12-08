"use client";

import { Contact } from "@/types/contact";
import {
  Mail,
  Phone,
  Linkedin,
  MapPin,
  Building2,
  Briefcase,
  Star,
  User,
} from "lucide-react";

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  const initials = contact.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-xl p-5 transition-all hover:border-primary/30 hover:shadow-lg cursor-pointer group"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative">
          {contact.photoUrl ? (
            <img
              src={contact.photoUrl}
              alt={contact.fullName}
              className="w-14 h-14 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center border-2 border-border">
              <span className="text-lg font-semibold text-primary">
                {initials}
              </span>
            </div>
          )}
          {contact.potentialSale && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
              <Star className="w-3 h-3 text-white fill-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {contact.fullName}
            </h3>
            {contact.level && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-secondary/20 text-secondary">
                Niveau {contact.level}
              </span>
            )}
          </div>

          {contact.position && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="truncate">{contact.position}</span>
            </p>
          )}

          {contact.company && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{contact.company}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mt-4">
        {contact.region && (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
            <MapPin className="w-3 h-3" />
            {contact.region}
          </span>
        )}
        {contact.employmentField && (
          <span className="px-2 py-1 text-xs rounded-full bg-accent/10 text-accent">
            {contact.employmentField}
          </span>
        )}
        {contact.circles && (
          <span className="px-2 py-1 text-xs rounded-full bg-secondary/10 text-secondary">
            {contact.circles.split(",")[0]}
          </span>
        )}
      </div>

      {/* Contact Actions */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border">
        {contact.email && (
          <a
            href={`mailto:${contact.email.trim()}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Email</span>
          </a>
        )}
        {contact.phone && (
          <a
            href={`tel:${contact.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">Appeler</span>
          </a>
        )}
        {contact.linkedinUrl && (
          <a
            href={contact.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#0077B5] transition-colors"
          >
            <Linkedin className="w-4 h-4" />
            <span className="hidden sm:inline">LinkedIn</span>
          </a>
        )}
        {contact.relation && (
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            {contact.relation}
          </span>
        )}
      </div>
    </div>
  );
}
