/**
 * Store global avec Zustand
 * Gestion d'état partagé pour l'application
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string | null;
  photoUrl: string | null;
  role: string;
}

interface AppState {
  // État utilisateur
  user: User | null;
  setUser: (user: User | null) => void;

  // Thème (déjà géré par ThemeProvider, mais peut être synchronisé ici)
  theme: "light" | "dark" | "system";
  setTheme: (theme: "light" | "dark" | "system") => void;

  // Notifications
  notifications: Array<{
    id: string;
    type: "info" | "success" | "warning" | "error";
    message: string;
    timestamp: number;
  }>;
  addNotification: (notification: Omit<AppState["notifications"][0], "id" | "timestamp">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Cache client (pour données fréquemment accédées)
  cache: Record<string, { data: unknown; expiresAt: number }>;
  setCache: (key: string, data: unknown, ttlSeconds?: number) => void;
  getCache: <T>(key: string) => T | null;
  clearCache: () => void;

  // État de chargement global
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      theme: "system",
      notifications: [],
      cache: {},
      isLoading: false,

      // Actions
      setUser: (user) => set({ user }),

      setTheme: (theme) => set({ theme }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            ...state.notifications,
            {
              ...notification,
              id: `${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
            },
          ],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notifications: [] }),

      setCache: (key, data, ttlSeconds = 300) => {
        const expiresAt = Date.now() + ttlSeconds * 1000;
        set((state) => ({
          cache: {
            ...state.cache,
            [key]: { data, expiresAt },
          },
        }));
      },

      getCache: <T,>(key: string): T | null => {
        const cached = get().cache[key];
        if (!cached) return null;
        if (Date.now() > cached.expiresAt) {
          // Expiré, supprimer
          set((state) => {
            const newCache = { ...state.cache };
            delete newCache[key];
            return { cache: newCache };
          });
          return null;
        }
        return cached.data as T;
      },

      clearCache: () => set({ cache: {} }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "nukleo-app-store",
      partialize: (state) => ({
        user: state.user,
        theme: state.theme,
        // Ne pas persister notifications et cache
      }),
    }
  )
);
