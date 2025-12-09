"use client";

import { Opportunity } from "@/types/opportunity";
import { Building2, DollarSign, MapPin, User } from "lucide-react";

interface KanbanCardProps {
  opportunity: Opportunity;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: (opportunity: Opportunity) => void;
}

export default function KanbanCard({ opportunity, onDragStart, onClick }: KanbanCardProps) {
  const formatCurrency = (value: number | null) => {
    if (!value) return null;
    return new Intl.NumberFormat("fr-CA", {
      style: "currency",
      currency: "CAD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Ne pas ouvrir la modale si on est en train de drag
    if (e.defaultPrevented) return;
    onClick(opportunity);
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, opportunity.id)}
      onClick={handleClick}
      className="group glass-card rounded-lg p-4 cursor-pointer active:cursor-grabbing hover:border-primary/30 hover:shadow-lg transition-all"
    >
      <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
        {opportunity.name}
      </h4>
      
      {opportunity.value && (
        <div className="flex items-center gap-1.5 text-accent text-sm font-semibold mb-2">
          <DollarSign className="h-3.5 w-3.5" />
          {formatCurrency(opportunity.value)}
        </div>
      )}
      
      <div className="space-y-1.5">
        {opportunity.company && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <Building2 className="h-3 w-3" />
            <span className="truncate">{opportunity.company}</span>
          </div>
        )}
        
        {opportunity.contact && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <User className="h-3 w-3" />
            <span className="truncate">{opportunity.contact}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 mt-2">
          {opportunity.region && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs bg-primary/10 text-primary">
              <MapPin className="h-2.5 w-2.5" />
              {opportunity.region}
            </span>
          )}
          
          {opportunity.segment && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-secondary/10 text-secondary truncate max-w-[100px]">
              {opportunity.segment}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
