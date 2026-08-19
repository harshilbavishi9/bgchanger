import archiver from "archiver";
import fs from "fs";
import fsPromises from "fs/promises";
import path from "path";
import { PassThrough } from "stream";
import { prepareResizedProduct, compositeProductOnColorBackground, PreparedProduct } from "../image/processor";
import { ColorBackground } from "../storage/colors";
import { JobProductConfig, ExportMode, OutputFormat } from "../../types";
import { sanitizeFilename } from "../storage/paths";

export interface ZipGeneratorOptions {
  jobId: string;
  outputPath?: string;
  products: JobProductConfig[];
  backgrounds: ColorBackground[];
  exportMode: ExportMode;
  outputFormat?: OutputFormat;
  onProgress?: (completed: number, total: number, currentOp: string) => void;
}

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
 * Creates an in-memory PassThrough stream and pipes the generated Archiver ZIP.
 * Guarantees clean ZIP footer finalization to prevent corrupted archives.
 */
export function createJobZipStream(options: Omit<ZipGeneratorOptions, "outputPath">): {
  stream: PassThrough;
  promise: Promise<void>;
} {
  const {
    products,
    backgrounds,
    exportMode,
    outputFormat = "jpeg",
    onProgress,
  } = options;

  const totalTasks = calculateTotalTaskCount(products, backgrounds, exportMode);
  let completedTasks = 0;
  const targetExt = getFormatExtension(outputFormat);

  const passThrough = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 0 } }); // Zero-CPU store mode

  archive.pipe(passThrough);

  const promise = (async () => {
    try {
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

      const CONCURRENCY_BATCH_SIZE = 32; // 32 parallel workers with threadpool 64

      if (exportMode === "background_wise") {
        for (const bg of backgrounds) {
          const folderName = bg.name;

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
        const targetFolder = "Generated Images";

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
    } finally {
      // Guarantee ZIP footer finalization so archive is never left corrupt
      await archive.finalize();
    }
  })();

  return { stream: passThrough, promise };
}

export async function generateJobZip(options: ZipGeneratorOptions): Promise<void> {
  if (!options.outputPath) {
    throw new Error("outputPath is required for generateJobZip");
  }

  const { stream, promise } = createJobZipStream(options);
  const outputStream = fs.createWriteStream(options.outputPath);

  const filePromise = new Promise<void>((resolve, reject) => {
    outputStream.on("close", () => resolve());
    outputStream.on("error", (err) => reject(err));
    stream.on("error", (err) => reject(err));
  });

  stream.pipe(outputStream);
  await Promise.all([promise, filePromise]);
}
