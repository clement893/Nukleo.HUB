import { describe, it, expect } from "vitest";
import {
  paginationSchema,
  getPaginationParams,
  getSkip,
  createPaginatedResponse,
} from "../pagination";

describe("Pagination", () => {
  describe("paginationSchema", () => {
    it("should validate valid pagination params", () => {
      const result = paginationSchema.safeParse({ page: 1, limit: 20 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should use default values", () => {
      const result = paginationSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should reject invalid page", () => {
      const result = paginationSchema.safeParse({ page: 0, limit: 20 });
      expect(result.success).toBe(false);
    });

    it("should enforce max limit", () => {
      const result = paginationSchema.safeParse({ page: 1, limit: 200 });
      expect(result.success).toBe(false);
    });
  });

  describe("getPaginationParams", () => {
    it("should return null when no params provided", () => {
      const params = new URLSearchParams();
      const result = getPaginationParams(params);
      expect(result).toBeNull();
    });

    it("should parse valid params", () => {
      const params = new URLSearchParams("page=2&limit=10");
      const result = getPaginationParams(params);
      expect(result).not.toBeNull();
      if (result) {
        expect(result.page).toBe(2);
        expect(result.limit).toBe(10);
      }
    });
  });

  describe("getSkip", () => {
    it("should calculate skip correctly", () => {
      expect(getSkip(1, 20)).toBe(0);
      expect(getSkip(2, 20)).toBe(20);
      expect(getSkip(3, 10)).toBe(20);
    });
  });

  describe("createPaginatedResponse", () => {
    it("should create correct paginated response", () => {
      const data = [1, 2, 3, 4, 5];
      const total = 25;
      const page = 1;
      const limit = 5;

      const result = createPaginatedResponse(data, total, page, limit);

      expect(result.data).toEqual(data);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.total).toBe(25);
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasMore).toBe(true);
    });

    it("should detect last page correctly", () => {
      const data = [1, 2, 3];
      const total = 3;
      const page = 1;
      const limit = 3;

      const result = createPaginatedResponse(data, total, page, limit);

      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.totalPages).toBe(1);
    });
  });
});
