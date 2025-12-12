"use client";

import { useEffect, useState } from "react";

interface UserAccessData {
  clientsAccess: "all" | "specific" | "none";
  projectsAccess: "all" | "specific" | "none";
  spacesAccess: "all" | "specific" | "none";
  allowedClients: string[];
  allowedProjects: string[];
  allowedSpaces: string[];
}

export function useUserAccess() {
  const [access, setAccess] = useState<UserAccessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const res = await fetch("/api/user-access");
        if (!res.ok) {
          throw new Error("Failed to fetch user access");
        }
        const data = await res.json();
        setAccess(data.access);
      } catch (err) {
        console.error("Error fetching user access:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        // Par défaut, donner un accès complet en cas d'erreur
        setAccess({
          clientsAccess: "all",
          projectsAccess: "all",
          spacesAccess: "all",
          allowedClients: [],
          allowedProjects: [],
          allowedSpaces: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAccess();
  }, []);

  /**
   * Vérifier si l'utilisateur a accès à un client spécifique
   */
  const hasClientAccess = (clientId: string): boolean => {
    if (!access) return false;
    if (access.clientsAccess === "all") return true;
    if (access.clientsAccess === "none") return false;
    return access.allowedClients.includes(clientId);
  };

  /**
   * Vérifier si l'utilisateur a accès à un projet spécifique
   */
  const hasProjectAccess = (projectId: string): boolean => {
    if (!access) return false;
    if (access.projectsAccess === "all") return true;
    if (access.projectsAccess === "none") return false;
    return access.allowedProjects.includes(projectId);
  };

  /**
   * Vérifier si l'utilisateur a accès à un espace spécifique
   */
  const hasSpaceAccess = (spaceId: string): boolean => {
    if (!access) return false;
    if (access.spacesAccess === "all") return true;
    if (access.spacesAccess === "none") return false;
    return access.allowedSpaces.includes(spaceId);
  };

  /**
   * Filtrer une liste de clients en fonction des permissions
   */
  const filterClients = (clients: Array<{ id: string; [key: string]: any }>): Array<{ id: string; [key: string]: any }> => {
    if (!access) return clients;
    if (access.clientsAccess === "all") return clients;
    if (access.clientsAccess === "none") return [];
    return clients.filter(c => access.allowedClients.includes(c.id));
  };

  /**
   * Filtrer une liste de projets en fonction des permissions
   */
  const filterProjects = (projects: Array<{ id: string; [key: string]: any }>): Array<{ id: string; [key: string]: any }> => {
    if (!access) return projects;
    if (access.projectsAccess === "all") return projects;
    if (access.projectsAccess === "none") return [];
    return projects.filter(p => access.allowedProjects.includes(p.id));
  };

  /**
   * Filtrer une liste d'espaces en fonction des permissions
   */
  const filterSpaces = (spaces: Array<{ id: string; [key: string]: any }>): Array<{ id: string; [key: string]: any }> => {
    if (!access) return spaces;
    if (access.spacesAccess === "all") return spaces;
    if (access.spacesAccess === "none") return [];
    return spaces.filter(s => access.allowedSpaces.includes(s.id));
  };

  return {
    access,
    loading,
    error,
    hasClientAccess,
    hasProjectAccess,
    hasSpaceAccess,
    filterClients,
    filterProjects,
    filterSpaces,
  };
}
