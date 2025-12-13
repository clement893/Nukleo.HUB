/**
 * Hook pour récupérer les données du dashboard avec React Query
 * Optimise les requêtes et le cache
 */

import { useQuery } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { logger } from "@/lib/logger";

export interface HomeData {
  kpis: {
    activeOpportunities: number;
    pipelineValue: number;
    wonAmount: number;
    conversionRate: number;
  };
  pipelineDistribution: Array<{
    stage: string;
    count: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    stage: string | null;
    time: string;
  }>;
  newContacts: Array<{
    id: string;
    name: string;
    company: string;
    position: string;
    photoUrl: string | null;
    time: string;
  }>;
  deadlines: Array<{
    id: string;
    title: string;
    project: string;
    dueDate: string;
    priority: string;
  }>;
  agenda: Array<{
    day: string;
    events: number;
  }>;
}

async function fetchDashboardData(): Promise<HomeData> {
  const response = await fetch("/api/home");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

export function useDashboard() {
  const query = useQuery<HomeData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      try {
        return await fetchDashboardData();
      } catch (error) {
        toast.error("Erreur", "Impossible de charger les données du dashboard");
        const errorObj = error instanceof Error ? error : new Error(String(error));
        logger.error("Dashboard fetch error", errorObj, "DASHBOARD", {});
        throw error;
      }
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  return query;
}
