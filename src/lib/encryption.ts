import crypto from "crypto";

/**
 * Système de chiffrement AES-256-GCM pour les données sensibles
 * Utilisé pour chiffrer les tokens OAuth Google
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // 16 bytes pour AES
const AUTH_TAG_LENGTH = 16; // 16 bytes pour GCM

/**
 * Récupère la clé de chiffrement depuis les variables d'environnement
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // La clé doit faire 32 bytes (256 bits) pour AES-256
  // Si c'est une chaîne hex, la convertir en Buffer
  if (key.length === 64) {
    // Clé hex de 64 caractères = 32 bytes
    return Buffer.from(key, "hex");
  }

  // Sinon, utiliser une dérivation de clé (PBKDF2)
  return crypto.pbkdf2Sync(key, "nukleo-salt", 100000, 32, "sha256");
}

/**
 * Chiffre un texte en utilisant AES-256-GCM
 * @param text - Texte à chiffrer
 * @returns Chaîne chiffrée au format: iv:authTag:encryptedText (tous en hex)
 */
export function encrypt(text: string): string {
  if (!text) {
    return text;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedText
    return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Déchiffre un texte chiffré avec AES-256-GCM
 * @param encryptedText - Texte chiffré au format: iv:authTag:encryptedText
 * @returns Texte déchiffré
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) {
      throw new Error("Invalid encrypted text format");
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Vérifie si une chaîne est chiffrée (format: iv:authTag:encryptedText)
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  const parts = text.split(":");
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
}


