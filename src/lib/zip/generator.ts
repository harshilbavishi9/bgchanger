import archiver from "archiver";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { prepareResizedProduct, compositeProductOnColorBackground, PreparedProduct } from "../image/processor";
import { ColorBackground } from "../storage/colors";
import { JobProductConfig, ExportMode, OutputFormat } from "../../types";
import { sanitizeFilename } from "../storage/paths";

export interface ZipGeneratorOptions {
  jobId: string;
  outputPath: string;
  products: JobProductConfig[];
  backgrounds: ColorBackground[];
  exportMode: ExportMode;
  outputFormat?: OutputFormat;
  onProgress?: (completed: number, total: number, currentOp: string) => void;
}

/**
 * Calculate total output image files to be produced.
 */
export function calculateTotalTaskCount(
  products: JobProductConfig[],
  backgrounds: ColorBackground[],
  exportMode: ExportMode
): number {
  if (exportMode === "background_wise") {
    return products.length * backgrounds.length;
  } else {
    let count = 0;
    for (const prod of products) {
      if (prod.replaceBackground) {
        count += backgrounds.length;
      } else {
        count += 1;
      }
    }
    return count;
  }
}

/**
 * Helper to process array items in concurrent parallel batches.
 */
async function processInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const chunk = items.slice(i, i + batchSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

function getFormatExtension(format: OutputFormat = "jpeg"): string {
  switch (format) {
    case "jpeg":
      return ".jpg";
    case "webp":
      return ".webp";
    case "png":
    default:
      return ".png";
  }
}

/**
 * Instant ZIP archive generator using store mode (level 0), hardware-accelerated image formats,
 * and 24-worker parallel execution.
 */
export async function generateJobZip(options: ZipGeneratorOptions): Promise<void> {
  const {
    outputPath,
    products,
    backgrounds,
    exportMode,
    outputFormat = "jpeg",
    onProgress,
  } = options;

  const totalTasks = calculateTotalTaskCount(products, backgrounds, exportMode);
  let completedTasks = 0;
  const targetExt = getFormatExtension(outputFormat);

  // 1. PRE-RESIZE PRODUCTS ONCE PER JOB
  onProgress?.(0, totalTasks, "Pre-processing product images...");
  
  const preparedProductsMap = new Map<string, PreparedProduct>();
  const originalBuffersMap = new Map<string, Buffer>();

  for (const prod of products) {
    if (prod.replaceBackground) {
      const prepared = await prepareResizedProduct(prod.tempFilePath);
      preparedProductsMap.set(prod.id, prepared);
    }
    if (!prod.replaceBackground || exportMode === "background_wise") {
      const buf = await fsPromises.readFile(prod.tempFilePath);
      originalBuffersMap.set(prod.id, buf);
    }
  }

  // Create stream write target using Archiver level 0 (Store mode - Zero CPU wasted)
  const outputStream = fs.createWriteStream(outputPath);
  const archive = archiver("zip", { zlib: { level: 0 } });

  const archivePromise = new Promise<void>((resolve, reject) => {
    outputStream.on("close", () => resolve());
    archive.on("error", (err) => reject(err));
    outputStream.on("error", (err) => reject(err));
  });

  archive.pipe(outputStream);

  const CONCURRENCY_BATCH_SIZE = 24; // 24 parallel compositing workers

  if (exportMode === "background_wise") {
    // --- MODE 1: Background-Wise Folders ---
    for (const bg of backgrounds) {
      const folderName = bg.name; // e.g. "color-0001"

      await processInBatches(products, CONCURRENCY_BATCH_SIZE, async (prod) => {
        const safeName = sanitizeFilename(prod.originalFilename);
        const baseName = path.parse(safeName).name;
        
        const zipEntryPath = prod.replaceBackground
          ? `${folderName}/${baseName}${targetExt}`
          : `${folderName}/${safeName}`;

        if (prod.replaceBackground) {
          const prepared = preparedProductsMap.get(prod.id)!;
          const generatedBuffer = await compositeProductOnColorBackground(
            prepared,
            bg,
            outputFormat
          );
          archive.append(generatedBuffer, { name: zipEntryPath });
        } else {
          const origBuf = originalBuffersMap.get(prod.id)!;
          archive.append(origBuf, { name: zipEntryPath });
        }

        completedTasks++;
        onProgress?.(
          completedTasks,
          totalTasks,
          `Processed ${prod.originalFilename} → ${folderName}`
        );
      });
    }
  } else {
    // --- MODE 2: Single Generated Images Folder ---
    const targetFolder = "Generated Images";

    // 1. Add background-disabled products ONCE
    for (const prod of products) {
      if (!prod.replaceBackground) {
        const safeName = sanitizeFilename(prod.originalFilename);
        const ext = path.extname(safeName);
        const base = path.basename(safeName, ext);
        const originalZipEntry = `${targetFolder}/${base}_original${ext || ".png"}`;

        const origBuf = originalBuffersMap.get(prod.id)!;
        archive.append(origBuf, { name: originalZipEntry });

        completedTasks++;
        onProgress?.(completedTasks, totalTasks, `Added ${originalZipEntry}`);
      }
    }

    // 2. Generate variations for background-enabled products in fast concurrent batches
    for (const bg of backgrounds) {
      const bgBase = bg.name;
      const enabledProducts = products.filter((p) => p.replaceBackground);

      await processInBatches(enabledProducts, CONCURRENCY_BATCH_SIZE, async (prod) => {
        const safeName = sanitizeFilename(prod.originalFilename);
        const base = path.parse(safeName).name;

        const imageFileName = `${base}_${bgBase}${targetExt}`;
        const zipEntryPath = `${targetFolder}/${imageFileName}`;

        const prepared = preparedProductsMap.get(prod.id)!;
        const generatedBuffer = await compositeProductOnColorBackground(
          prepared,
          bg,
          outputFormat
        );

        archive.append(generatedBuffer, { name: zipEntryPath });

        completedTasks++;
        onProgress?.(completedTasks, totalTasks, `Processed ${imageFileName}`);
      });
    }
  }

  // Finalize archive stream
  await archive.finalize();
  await archivePromise;
}
