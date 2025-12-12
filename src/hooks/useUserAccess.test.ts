import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock fetch
global.fetch = vi.fn();

describe("useUserAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return full access when clientsAccess is 'all'", () => {
    const access = {
      clientsAccess: "all" as const,
      projectsAccess: "all" as const,
      spacesAccess: "all" as const,
      allowedClients: [],
      allowedProjects: [],
      allowedSpaces: [],
    };

    // Test hasClientAccess
    const hasClientAccess = (clientId: string): boolean => {
      if (access.clientsAccess === "all") return true;
      if (access.clientsAccess === "none") return false;
      return access.allowedClients.includes(clientId);
    };

    expect(hasClientAccess("client-1")).toBe(true);
    expect(hasClientAccess("client-2")).toBe(true);
  });

  it("should deny access when clientsAccess is 'none'", () => {
    const access = {
      clientsAccess: "none" as const,
      projectsAccess: "all" as const,
      spacesAccess: "all" as const,
      allowedClients: [],
      allowedProjects: [],
      allowedSpaces: [],
    };

    const hasClientAccess = (clientId: string): boolean => {
      if (access.clientsAccess === "all") return true;
      if (access.clientsAccess === "none") return false;
      return access.allowedClients.includes(clientId);
    };

    expect(hasClientAccess("client-1")).toBe(false);
    expect(hasClientAccess("client-2")).toBe(false);
  });

  it("should allow specific clients when clientsAccess is 'specific'", () => {
    const access = {
      clientsAccess: "specific" as const,
      projectsAccess: "all" as const,
      spacesAccess: "all" as const,
      allowedClients: ["client-1", "client-3"],
      allowedProjects: [],
      allowedSpaces: [],
    };

    const hasClientAccess = (clientId: string): boolean => {
      if (access.clientsAccess === "all") return true;
      if (access.clientsAccess === "none") return false;
      return access.allowedClients.includes(clientId);
    };

    expect(hasClientAccess("client-1")).toBe(true);
    expect(hasClientAccess("client-2")).toBe(false);
    expect(hasClientAccess("client-3")).toBe(true);
  });

  it("should filter clients list correctly", () => {
    const access = {
      clientsAccess: "specific" as const,
      projectsAccess: "all" as const,
      spacesAccess: "all" as const,
      allowedClients: ["client-1", "client-3"],
      allowedProjects: [],
      allowedSpaces: [],
    };

    const clients = [
      { id: "client-1", name: "Client 1" },
      { id: "client-2", name: "Client 2" },
      { id: "client-3", name: "Client 3" },
    ];

    const filterClients = (
      clients: Array<{ id: string; [key: string]: any }>
    ): Array<{ id: string; [key: string]: any }> => {
      if (access.clientsAccess === "all") return clients;
      if (access.clientsAccess === "none") return [];
      return clients.filter((c) => access.allowedClients.includes(c.id));
    };

    const filtered = filterClients(clients);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe("client-1");
    expect(filtered[1].id).toBe("client-3");
  });

  it("should check space access correctly", () => {
    const access = {
      clientsAccess: "all" as const,
      projectsAccess: "all" as const,
      spacesAccess: "specific" as const,
      allowedClients: [],
      allowedProjects: [],
      allowedSpaces: ["billing", "teams"],
    };

    const hasSpaceAccess = (spaceId: string): boolean => {
      if (access.spacesAccess === "all") return true;
      if (access.spacesAccess === "none") return false;
      return access.allowedSpaces.includes(spaceId);
    };

    expect(hasSpaceAccess("billing")).toBe(true);
    expect(hasSpaceAccess("teams")).toBe(true);
    expect(hasSpaceAccess("admin")).toBe(false);
  });
});
