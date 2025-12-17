/**
 * Configuration globale pour les tests Vitest
 */

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});

// Mock de window.matchMedia (utilisé par certains composants)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock de fetch global
global.fetch = global.fetch || (() => Promise.reject(new Error("fetch is not defined")));
