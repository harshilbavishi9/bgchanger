import { JobStatus, ExportMode, OutputFormat, JobProductConfig } from "../../types";
import { getJobUploadDir, getJobZipPath } from "../storage/paths";
import { getRandomColorBackgrounds, ColorBackground } from "../storage/colors";
import { generateJobZip, calculateTotalTaskCount } from "../zip/generator";
import fs from "fs/promises";
import { existsSync } from "fs";

const globalForJobs = globalThis as unknown as {
  jobsMap: Map<string, JobStatus>;
};

export const jobsMap = globalForJobs.jobsMap || new Map<string, JobStatus>();

if (process.env.NODE_ENV !== "production") {
  globalForJobs.jobsMap = jobsMap;
}

const JOB_TTL_MS = 2 * 60 * 60 * 1000;

export interface CreateJobInput {
  jobId: string;
  products: JobProductConfig[];
  exportMode: ExportMode;
  outputFormat: OutputFormat;
  backgroundCount: number;
}

export function getJobStatus(jobId: string): JobStatus | undefined {
  cleanExpiredJobs();
  return jobsMap.get(jobId);
}

/**
 * Create a new processing job with randomized studio color backgrounds on every execution.
 */
export async function createAndStartJob(input: CreateJobInput): Promise<JobStatus> {
  const { jobId, products, exportMode, outputFormat, backgroundCount } = input;

  // Draw N random studio color backgrounds (guarantees a different background every run!)
  const selectedBackgrounds = getRandomColorBackgrounds(backgroundCount);

  if (selectedBackgrounds.length === 0) {
    throw new Error("No color backgrounds available.");
  }

  const totalTasks = calculateTotalTaskCount(products, selectedBackgrounds, exportMode);

  const initialJob: JobStatus = {
    id: jobId,
    status: "queued",
    total: totalTasks,
    completed: 0,
    progress: 0,
    createdAt: Date.now(),
    exportMode,
    outputFormat,
    backgroundCount: selectedBackgrounds.length,
    totalProducts: products.length,
    currentOperation: "Job queued for randomized color generation...",
  };

  jobsMap.set(jobId, initialJob);

  processJobAsync(jobId, products, selectedBackgrounds, exportMode, outputFormat).catch(async (err) => {
    console.error(`[Job Error] Job ${jobId} failed:`, err);
    const existing = jobsMap.get(jobId);
    if (existing) {
      jobsMap.set(jobId, {
        ...existing,
        status: "failed",
        error: err instanceof Error ? err.message : "Processing failed unexpectedly.",
        currentOperation: "Job failed.",
      });
    }
    await cleanupUploads(jobId);
  });

  return initialJob;
}

async function processJobAsync(
  jobId: string,
  products: JobProductConfig[],
  backgrounds: ColorBackground[],
  exportMode: ExportMode,
  outputFormat: OutputFormat
): Promise<void> {
  const zipPath = getJobZipPath(jobId);

  updateJob(jobId, {
    status: "processing",
    currentOperation: `Generating randomized ${outputFormat.toUpperCase()} studio color variations...`,
  });

  await generateJobZip({
    jobId,
    outputPath: zipPath,
    products,
    backgrounds,
    exportMode,
    outputFormat,
    onProgress: (completed, total, currentOp) => {
      const pct = Math.min(100, Math.round((completed / total) * 100));
      updateJob(jobId, {
        completed,
        total,
        progress: pct,
        currentOperation: currentOp,
      });
    },
  });

  updateJob(jobId, {
    status: "completed",
    progress: 100,
    completed: calculateTotalTaskCount(products, backgrounds, exportMode),
    downloadUrl: `/api/jobs/${jobId}/download`,
    currentOperation: "Randomized color export package ready for download.",
  });

  await cleanupUploads(jobId);
}

function updateJob(jobId: string, updates: Partial<JobStatus>): void {
  const existing = jobsMap.get(jobId);
  if (existing) {
    jobsMap.set(jobId, { ...existing, ...updates });
  }
}

async function cleanupUploads(jobId: string): Promise<void> {
  try {
    const uploadDir = getJobUploadDir(jobId);
    if (existsSync(uploadDir)) {
      await fs.rm(uploadDir, { recursive: true, force: true });
    }
  } catch (err) {
    console.warn(`[Cleanup Warning] Could not remove upload dir for job ${jobId}:`, err);
  }
}

function cleanExpiredJobs(): void {
  const now = Date.now();
  for (const [id, job] of jobsMap.entries()) {
    if (now - job.createdAt > JOB_TTL_MS) {
      jobsMap.delete(id);
      const zipPath = getJobZipPath(id);
      if (existsSync(zipPath)) {
        fs.unlink(zipPath).catch(() => {});
      }
    }
  }
}
