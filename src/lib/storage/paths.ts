import path from "path";
import os from "os";
import fs from "fs/promises";
import { existsSync } from "fs";

// On Vercel serverless runtime, use os.tmpdir() for temporary file storage
const ROOT_STORAGE = process.env.VERCEL
  ? path.join(os.tmpdir(), "bgchanger_storage")
  : path.join(process.cwd(), "storage");

export const STORAGE_PATHS = {
  root: ROOT_STORAGE,
  backgrounds: path.join(ROOT_STORAGE, "backgrounds"),
  uploads: path.join(ROOT_STORAGE, "uploads"),
  exports: path.join(ROOT_STORAGE, "exports"),
};

/**
 * Ensures all required base storage directories exist.
 */
export async function ensureStorageDirectories(): Promise<void> {
  const dirs = [
    STORAGE_PATHS.root,
    STORAGE_PATHS.backgrounds,
    STORAGE_PATHS.uploads,
    STORAGE_PATHS.exports,
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) {
      await fs.mkdir(dir, { recursive: true });
    }
  }
}

/**
 * Get job upload directory path safely.
 */
export function getJobUploadDir(jobId: string): string {
  const safeJobId = path.basename(jobId);
  return path.join(STORAGE_PATHS.uploads, safeJobId);
}

/**
 * Get job zip export path safely.
 */
export function getJobZipPath(jobId: string): string {
  const safeJobId = path.basename(jobId);
  return path.join(STORAGE_PATHS.exports, `${safeJobId}.zip`);
}

/**
 * Sanitize filename to prevent path traversal or unsafe file system characters.
 */
export function sanitizeFilename(filename: string): string {
  const nameOnly = path.basename(filename);
  const ext = path.extname(nameOnly);
  const base = path.basename(nameOnly, ext);
  const cleanBase = base.replace(/[^a-zA-Z0-9_\-]/g, "_").replace(/_+/g, "_");
  const cleanExt = ext.toLowerCase().replace(/[^a-z0-9.]/g, "");
  return `${cleanBase || "product"}${cleanExt || ".png"}`;
}
