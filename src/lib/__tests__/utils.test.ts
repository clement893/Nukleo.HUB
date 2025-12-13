import { describe, it, expect } from "vitest";

// Tests pour les utilitaires généraux
describe("Utils", () => {
  describe("String utilities", () => {
    it("should format currency correctly", () => {
      // Exemple de test pour une fonction utilitaire
      const formatCurrency = (value: number) => {
        if (value >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M$`;
        }
        if (value >= 1000) {
          return `${(value / 1000).toFixed(0)}K$`;
        }
        return `${value}$`;
      };

      expect(formatCurrency(100)).toBe("100$");
      expect(formatCurrency(1500)).toBe("2K$");
      expect(formatCurrency(2500000)).toBe("2.5M$");
    });
  });

  describe("Date utilities", () => {
    it("should calculate days difference correctly", () => {
      const startDate = new Date("2024-01-01");
      const endDate = new Date("2024-01-05");
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      expect(diffDays).toBe(5);
    });
  });
});
