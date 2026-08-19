import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs/promises";
import { getJobUploadDir, sanitizeFilename } from "@/lib/storage/paths";
import { createAndStartJob } from "@/lib/jobs/manager";
import { exportModeSchema, outputFormatSchema, MAX_FILE_SIZE_BYTES } from "@/lib/validation/job";
import { JobProductConfig, ExportMode, OutputFormat } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const exportModeRaw = formData.get("exportMode") as string;
    const outputFormatRaw = (formData.get("outputFormat") as string) || "jpeg";
    const backgroundCountRaw = formData.get("backgroundCount") as string;
    const settingsRaw = formData.get("productSettings") as string;

    if (!exportModeRaw || !backgroundCountRaw || !settingsRaw) {
      return NextResponse.json(
        { error: "Missing required form fields (exportMode, backgroundCount, productSettings)." },
        { status: 400 }
      );
    }

    const exportMode = exportModeSchema.parse(exportModeRaw) as ExportMode;
    const outputFormat = outputFormatSchema.parse(outputFormatRaw) as OutputFormat;
    const backgroundCount = parseInt(backgroundCountRaw, 10);
    const parsedSettings: Array<{ id: string; originalFilename: string; replaceBackground: boolean }> =
      JSON.parse(settingsRaw);

    if (!Array.isArray(parsedSettings) || parsedSettings.length === 0) {
      return NextResponse.json(
        { error: "At least one product setting must be provided." },
        { status: 400 }
      );
    }

    const jobId = uuidv4();
    const jobUploadDir = getJobUploadDir(jobId);

    await fs.mkdir(jobUploadDir, { recursive: true });

    const jobProducts: JobProductConfig[] = [];

    for (const setting of parsedSettings) {
      const file = formData.get(`file_${setting.id}`) as File | null;
      
      if (!file) {
        return NextResponse.json(
          { error: `Missing file upload for product ID ${setting.id}` },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { error: `File ${setting.originalFilename} exceeds maximum 50MB size limit.` },
          { status: 400 }
        );
      }

      const safeName = sanitizeFilename(setting.originalFilename);
      const targetFilePath = path.join(jobUploadDir, `${setting.id}_${safeName}`);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await fs.writeFile(targetFilePath, buffer);

      jobProducts.push({
        id: setting.id,
        originalFilename: setting.originalFilename,
        tempFilePath: targetFilePath,
        replaceBackground: Boolean(setting.replaceBackground),
      });
    }

    const initialJob = await createAndStartJob({
      jobId,
      products: jobProducts,
      exportMode,
      outputFormat,
      backgroundCount,
    });

    return NextResponse.json(initialJob, { status: 201 });
  } catch (error) {
    console.error("[API Error] Failed to create job:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process job request." },
      { status: 500 }
    );
  }
}
