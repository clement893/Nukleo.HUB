"use client";

import { Opportunity } from "@/types/opportunity";
import KanbanCard from "./KanbanCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface KanbanColumnProps {
  stage: {
    id: string;
    name: string;
    color: string;
  };
  opportunities: Opportunity[];
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, stageId: string) => void;
  onCardClick: (opportunity: Opportunity) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function KanbanColumn({
  stage,
  opportunities,
  onDragStart,
  onDragOver,
  onDrop,
  onCardClick,
  isCollapsed = false,
  onToggleCollapse,
}: KanbanColumnProps) {
  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M$`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K$`;
    }
    return `${value}$`;
  };

  if (isCollapsed) {
    return (
      <div
        className="flex-shrink-0 w-12 bg-muted/30 rounded-xl p-2 flex flex-col items-center cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggleCollapse}
        title={`Afficher ${stage.name}`}
      >
        <div
          className="w-3 h-3 rounded-full mb-2"
          style={{ backgroundColor: stage.color }}
        />
        <span className="text-xs font-medium text-foreground writing-vertical-rl transform rotate-180">
          {stage.name}
        </span>
        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full mt-2">
          {opportunities.length}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground mt-auto" />
      </div>
    );
  }

  return (
    <div
      className="flex-shrink-0 w-72 bg-muted/30 rounded-xl p-3"
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <h3 className="font-medium text-foreground text-sm">{stage.name}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {opportunities.length}
          </span>
        </div>
        {onToggleCollapse && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
            className="p-1 rounded hover:bg-muted/50 transition-colors"
            title="Masquer la colonne"
            aria-label="Masquer la colonne"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>
      
      {/* Total Value */}
      {totalValue > 0 && (
        <div className="text-xs text-muted-foreground mb-3 px-1">
          Total: <span className="text-accent font-medium">{formatCurrency(totalValue)}</span>
        </div>
      )}
      
      {/* Cards */}
      <div className="space-y-2 min-h-[200px]">
        {opportunities.map((opportunity) => (
          <KanbanCard
            key={opportunity.id}
            opportunity={opportunity}
            onDragStart={onDragStart}
            onClick={onCardClick}
          />
        ))}
        
        {opportunities.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Aucune opportunité
          </div>
        )}
      </div>
    </div>
  );
}
