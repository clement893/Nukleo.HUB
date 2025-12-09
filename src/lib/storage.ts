// S3 Storage helper for file uploads

const FORGE_API_URL = process.env.BUILT_IN_FORGE_API_URL || "";
const FORGE_API_KEY = process.env.BUILT_IN_FORGE_API_KEY || "";

interface StorageResult {
  key: string;
  url: string;
}

/**
 * Upload a file to S3 storage
 * @param key - The file key/path in S3
 * @param data - The file data as Buffer, Uint8Array, or string
 * @param contentType - The MIME type of the file
 * @returns The storage result with key and public URL
 */
export async function storagePut(
  key: string,
  data: Buffer | Uint8Array | string,
  contentType?: string
): Promise<StorageResult> {
  // Convert data to base64
  let base64Data: string;
  if (typeof data === "string") {
    base64Data = Buffer.from(data).toString("base64");
  } else {
    base64Data = Buffer.from(data).toString("base64");
  }

  const response = await fetch(`${FORGE_API_URL}/storage/put`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      key,
      data: base64Data,
      contentType: contentType || "application/octet-stream",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Storage upload failed: ${error}`);
  }

  const result = await response.json();
  return {
    key: result.key || key,
    url: result.url,
  };
}

/**
 * Get a presigned URL for a file in S3
 * @param key - The file key/path in S3
 * @param expiresIn - Expiration time in seconds (default: 3600)
 * @returns The storage result with key and presigned URL
 */
export async function storageGet(
  key: string,
  expiresIn?: number
): Promise<StorageResult> {
  const response = await fetch(`${FORGE_API_URL}/storage/get`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FORGE_API_KEY}`,
    },
    body: JSON.stringify({
      key,
      expiresIn: expiresIn || 3600,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Storage get failed: ${error}`);
  }

  const result = await response.json();
  return {
    key: result.key || key,
    url: result.url,
  };
}
