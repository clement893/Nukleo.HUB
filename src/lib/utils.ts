import { clsx, type ClassValue } from "clsx";

/**
 * Combine des classes CSS avec clsx
 * Utilitaire pour fusionner des classes conditionnelles
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
