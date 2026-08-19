import { ColorBackground } from "@/lib/storage/colors";

export type ExportMode = "background_wise" | "single_folder";
export type OutputFormat = "jpeg" | "webp" | "png";

export interface ProductItem {
  id: string;
  name: string;
  size: number;
  file?: File;
  previewUrl: string;
  replaceBackground: boolean;
}

export interface JobProductConfig {
  id: string;
  originalFilename: string;
  tempFilePath: string;
  replaceBackground: boolean;
}

export interface JobStatus {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  total: number;
  completed: number;
  progress: number;
  downloadUrl?: string;
  error?: string;
  createdAt: number;
  currentOperation?: string;
  exportMode: ExportMode;
  outputFormat: OutputFormat;
  backgroundCount: number;
  totalProducts: number;
}

export interface BackgroundScanResult {
  total: number;
  backgrounds: ColorBackground[];
}

export interface CreateJobRequest {
  exportMode: ExportMode;
  outputFormat: OutputFormat;
  backgroundCount: number;
  products: Array<{
    id: string;
    originalFilename: string;
    replaceBackground: boolean;
  }>;
}

export type { ColorBackground };
