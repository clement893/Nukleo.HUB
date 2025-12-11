import { NextResponse } from "next/server";

// Types MIME autorisés par catégorie
export const ALLOWED_FILE_TYPES = {
  // Images
  images: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ],
  // Documents
  documents: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ],
  // Archives
  archives: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
  ],
};

// Extensions autorisées par catégorie
export const ALLOWED_EXTENSIONS = {
  images: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
  documents: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".txt", ".csv"],
  archives: [".zip", ".rar", ".7z"],
};

// Tailles maximales par catégorie (en bytes)
export const MAX_FILE_SIZES = {
  images: 10 * 1024 * 1024,      // 10 MB
  documents: 50 * 1024 * 1024,   // 50 MB
  archives: 100 * 1024 * 1024,   // 100 MB
  default: 25 * 1024 * 1024,     // 25 MB
};

// Extensions dangereuses à bloquer absolument
const DANGEROUS_EXTENSIONS = [
  ".exe", ".bat", ".cmd", ".com", ".msi", ".scr",
  ".js", ".vbs", ".ps1", ".sh", ".bash",
  ".php", ".asp", ".aspx", ".jsp",
  ".dll", ".so", ".dylib",
];

interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Valider un fichier uploadé
 */
export function validateUploadedFile(
  file: File,
  options: {
    allowedTypes?: string[];
    maxSize?: number;
    allowedExtensions?: string[];
  } = {}
): FileValidationResult {
  const {
    allowedTypes = [...ALLOWED_FILE_TYPES.images, ...ALLOWED_FILE_TYPES.documents],
    maxSize = MAX_FILE_SIZES.default,
    allowedExtensions = [...ALLOWED_EXTENSIONS.images, ...ALLOWED_EXTENSIONS.documents],
  } = options;

  // Vérifier le nom du fichier
  if (!file.name || file.name.length > 255) {
    return { valid: false, error: "Nom de fichier invalide" };
  }

  // Extraire l'extension
  const extension = "." + file.name.split(".").pop()?.toLowerCase();

  // Bloquer les extensions dangereuses
  if (DANGEROUS_EXTENSIONS.includes(extension)) {
    return { valid: false, error: `Type de fichier non autorisé: ${extension}` };
  }

  // Vérifier l'extension
  if (!allowedExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: `Extension non autorisée: ${extension}. Extensions autorisées: ${allowedExtensions.join(", ")}` 
    };
  }

  // Vérifier le type MIME
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Type de fichier non autorisé: ${file.type}` 
    };
  }

  // Vérifier la taille
  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / 1024 / 1024);
    return { 
      valid: false, 
      error: `Fichier trop volumineux. Taille maximale: ${maxSizeMB} MB` 
    };
  }

  // Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    return { valid: false, error: "Le fichier est vide" };
  }

  return { valid: true };
}

/**
 * Middleware de validation d'upload pour les API routes
 */
export function validateUploadMiddleware(
  file: File,
  options?: {
    allowedTypes?: string[];
    maxSize?: number;
    allowedExtensions?: string[];
  }
): NextResponse | null {
  const result = validateUploadedFile(file, options);
  
  if (!result.valid) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }
  
  return null; // Fichier valide
}

/**
 * Sanitiser le nom de fichier
 */
export function sanitizeFileName(fileName: string): string {
  // Supprimer les caractères dangereux
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, ".")
    .substring(0, 200);
}
