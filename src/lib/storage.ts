// AWS S3 Storage helper for file uploads
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || "nukleo-hub-photos";

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
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: data instanceof Buffer ? data : Buffer.from(data),
    ContentType: contentType || "application/octet-stream",
  });

  await s3Client.send(command);

  // Construct the public URL
  const url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-2"}.amazonaws.com/${key}`;

  return {
    key,
    url,
  };
}

/**
 * Delete a file from S3 storage
 * @param key - The file key/path in S3
 */
export async function storageDelete(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get the public URL for a file in S3
 * @param key - The file key/path in S3
 * @returns The public URL
 */
export function getPublicUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-2"}.amazonaws.com/${key}`;
}
