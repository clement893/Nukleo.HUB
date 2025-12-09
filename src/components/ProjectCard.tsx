"use client";

import { Project } from "@/types/project";
import {
  Building2,
  User,
  Calendar,
  ExternalLink,
  FolderKanban,
  DollarSign,
  Clock,
} from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  "Not started": "bg-gray-500/20 text-gray-400",
  "En cours": "bg-blue-500/20 text-blue-400",
  "Actif": "bg-green-500/20 text-green-400",
  "Optimisation": "bg-purple-500/20 text-purple-400",
  "Retours clients": "bg-amber-500/20 text-amber-400",
  "Demandé": "bg-cyan-500/20 text-cyan-400",
  "Bloqué": "bg-red-500/20 text-red-400",
  "Flag": "bg-orange-500/20 text-orange-400",
  "Done": "bg-emerald-500/20 text-emerald-400",
};

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-500/20 text-gray-400";
    return statusColors[status] || "bg-gray-500/20 text-gray-400";
  };

  return (
    <div
      onClick={onClick}
      className="glass-card rounded-xl p-5 transition-all hover:border-primary/30 hover:shadow-lg cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {project.name}
          </h3>
          {project.client && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{project.client}</span>
            </p>
          )}
        </div>
        {project.status && (
          <span className={`px-2.5 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(project.status)}`}>
            {project.status}
          </span>
        )}
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {project.lead && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{project.lead}</span>
          </div>
        )}
        {project.projectType && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FolderKanban className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{project.projectType}</span>
          </div>
        )}
        {project.year && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>{project.year}</span>
          </div>
        )}
        {project.hourlyRate && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="w-4 h-4 flex-shrink-0" />
            <span>{project.hourlyRate}$/h</span>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {project.stage && (
          <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
            {project.stage}
          </span>
        )}
        {project.departments && project.departments.split(",").slice(0, 2).map((dept, i) => (
          <span key={i} className="px-2 py-1 text-xs rounded-full bg-secondary/10 text-secondary">
            {dept.trim()}
          </span>
        ))}
      </div>

      {/* Links */}
      <div className="flex items-center gap-3 pt-4 border-t border-border">
        {project.driveUrl && (
          <a
            href={project.driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.71 3.5L1.15 15l4.58 6.5h11.84L22.15 15 15.71 3.5H7.71zm.79 1.5h6.42l5.58 9.5-3.71 5.5H5.21l-3.71-5.5L7.08 5z"/>
            </svg>
            <span className="hidden sm:inline">Drive</span>
          </a>
        )}
        {project.asanaUrl && (
          <a
            href={project.asanaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#F06A6A] transition-colors"
          >
            <Clock className="w-4 h-4" />
            <span className="hidden sm:inline">Asana</span>
          </a>
        )}
        {project.slackUrl && (
          <a
            href={project.slackUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-[#4A154B] transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
            </svg>
            <span className="hidden sm:inline">Slack</span>
          </a>
        )}
        {project.proposalUrl && (
          <a
            href={project.proposalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Proposition</span>
          </a>
        )}
      </div>
    </div>
  );
}
