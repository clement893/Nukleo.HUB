import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  validateClient,
  getFirstError,
  getFieldErrors,
  contactCreateSchema,
} from "../client-validations";

describe("Client Validations", () => {
  describe("validateClient", () => {
    const schema = z.object({
      name: z.string().min(1, "Le nom est requis"),
      email: z.string().email("Email invalide"),
    });

    it("should return success for valid data", () => {
      const result = validateClient(schema, {
        name: "John Doe",
        email: "john@example.com",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("John Doe");
        expect(result.data.email).toBe("john@example.com");
      }
    });

    it("should return errors for invalid data", () => {
      const result = validateClient(schema, {
        name: "",
        email: "invalid-email",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toBeInstanceOf(z.ZodError);
      }
    });
  });

  describe("getFirstError", () => {
    it("should return null for valid data", () => {
      const result = getFirstError(contactCreateSchema, {
        fullName: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
      });

      expect(result).toBeNull();
    });

    it("should return first error message", () => {
      const result = getFirstError(contactCreateSchema, {
        fullName: "",
        email: "invalid",
      });

      expect(result).toBeTruthy();
      expect(typeof result).toBe("string");
    });
  });

  describe("getFieldErrors", () => {
    it("should return empty object for valid data", () => {
      const result = getFieldErrors(contactCreateSchema, {
        fullName: "John Doe",
        email: "john@example.com",
        phone: "1234567890",
      });

      expect(result).toEqual({});
    });

    it("should return errors by field", () => {
      const result = getFieldErrors(contactCreateSchema, {
        fullName: "",
        email: "invalid",
      });

      expect(Object.keys(result).length).toBeGreaterThan(0);
      // Vérifier que les erreurs sont des strings
      Object.values(result).forEach((error) => {
        expect(typeof error).toBe("string");
      });
    });
  });
});
