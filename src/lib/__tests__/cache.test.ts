import { describe, it, expect, beforeEach } from "vitest";
import { cache } from "../cache";

describe("Cache", () => {
  beforeEach(() => {
    cache.clear();
  });

  it("should store and retrieve values", () => {
    cache.set("test-key", "test-value", 60);
    const value = cache.get<string>("test-key");
    expect(value).toBe("test-value");
  });

  it("should return null for non-existent keys", () => {
    const value = cache.get("non-existent");
    expect(value).toBeNull();
  });

  it("should delete values", () => {
    cache.set("test-key", "test-value", 60);
    cache.delete("test-key");
    const value = cache.get("test-key");
    expect(value).toBeNull();
  });

  it("should invalidate patterns", () => {
    cache.set("projects:1", "data1", 60);
    cache.set("projects:2", "data2", 60);
    cache.set("contacts:1", "data3", 60);
    
    const count = cache.invalidatePattern("projects:*");
    expect(count).toBeGreaterThanOrEqual(2);
    
    expect(cache.get("projects:1")).toBeNull();
    expect(cache.get("contacts:1")).not.toBeNull();
  });

  it("should clear all values", () => {
    cache.set("key1", "value1", 60);
    cache.set("key2", "value2", 60);
    
    cache.clear();
    
    expect(cache.get("key1")).toBeNull();
    expect(cache.get("key2")).toBeNull();
  });
});
