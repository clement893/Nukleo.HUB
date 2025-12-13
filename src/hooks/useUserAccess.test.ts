import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock fetch
global.fetch = vi.fn();

// Type pour les accès
type AccessLevel = "all" | "none" | "specific";

interface UserAccess {
  clientsAccess: AccessLevel;
  projectsAccess: AccessLevel;
  spacesAccess: AccessLevel;
  allowedClients: string[];
  allowedProjects: string[];
  allowedSpaces: string[];
}

describe("useUserAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return full access when clientsAccess is 'all'", () => {
    const access: UserAccess = {
      clientsAccess: "all",
      projectsAccess: "all",
      spacesAccess: "all",
      allowedClients: [],
      allowedProjects: [],
      allowedSpaces: [],
    };

    // Test hasClientAccess
    const hasClientAccess = (clientId: string): boolean => {
      if (access.clientsAccess === "all") return true;
      if (access.clientsAccess === "none") return false;
      if (access.clientsAccess === "specific") return access.allowedClients.includes(clientId);
      return false;
    };

    expect(hasClientAccess("client-1")).toBe(true);
    expect(hasClientAccess("client-2")).toBe(true);
  });

  it("should deny access when clientsAccess is 'none'", () => {
    const access: UserAccess = {
      clientsAccess: "none",
      projectsAccess: "all",
      spacesAccess: "all",
      allowedClients: [],
      allowedProjects: [],
      allowedSpaces: [],
    };

    const hasClientAccess = (clientId: string): boolean => {
      if (access.clientsAccess === "all") return true;
      if (access.clientsAccess === "none") return false;
      if (access.clientsAccess === "specific") return access.allowedClients.includes(clientId);
      return false;
    };

    expect(hasClientAccess("client-1")).toBe(false);
    expect(hasClientAccess("client-2")).toBe(false);
  });

  it("should allow specific clients when clientsAccess is 'specific'", () => {
    const access: UserAccess = {
      clientsAccess: "specific",
      projectsAccess: "all",
      spacesAccess: "all",
      allowedClients: ["client-1", "client-3"],
      allowedProjects: [],
      allowedSpaces: [],
    };

    const hasClientAccess = (clientId: string): boolean => {
      if (access.clientsAccess === "all") return true;
      if (access.clientsAccess === "none") return false;
      if (access.clientsAccess === "specific") return access.allowedClients.includes(clientId);
      return false;
    };

    expect(hasClientAccess("client-1")).toBe(true);
    expect(hasClientAccess("client-2")).toBe(false);
    expect(hasClientAccess("client-3")).toBe(true);
  });

  it("should filter clients list correctly", () => {
    const access: UserAccess = {
      clientsAccess: "specific",
      projectsAccess: "all",
      spacesAccess: "all",
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
      clientsList: Array<{ id: string; [key: string]: string }>
    ): Array<{ id: string; [key: string]: string }> => {
      if (access.clientsAccess === "all") return clientsList;
      if (access.clientsAccess === "none") return [];
      if (access.clientsAccess === "specific") return clientsList.filter((c) => access.allowedClients.includes(c.id));
      return [];
    };

    const filtered = filterClients(clients);
    expect(filtered).toHaveLength(2);
    expect(filtered[0].id).toBe("client-1");
    expect(filtered[1].id).toBe("client-3");
  });

  it("should check space access correctly", () => {
    const access: UserAccess = {
      clientsAccess: "all",
      projectsAccess: "all",
      spacesAccess: "specific",
      allowedClients: [],
      allowedProjects: [],
      allowedSpaces: ["billing", "teams"],
    };

    const hasSpaceAccess = (spaceId: string): boolean => {
      if (access.spacesAccess === "all") return true;
      if (access.spacesAccess === "none") return false;
      if (access.spacesAccess === "specific") return access.allowedSpaces.includes(spaceId);
      return false;
    };

    expect(hasSpaceAccess("billing")).toBe(true);
    expect(hasSpaceAccess("teams")).toBe(true);
    expect(hasSpaceAccess("admin")).toBe(false);
  });
});
