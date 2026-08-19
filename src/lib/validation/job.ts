import { z } from "zod";

export const exportModeSchema = z.enum(["background_wise", "single_folder"]);
export const outputFormatSchema = z.enum(["jpeg", "webp", "png"]);

export const productSettingSchema = z.object({
  id: z.string().min(1),
  originalFilename: z.string().min(1),
  replaceBackground: z.boolean(),
});

export const createJobFormSchema = z.object({
  exportMode: exportModeSchema,
  outputFormat: outputFormatSchema.default("jpeg"),
  backgroundCount: z.number().int().min(1, "Must select at least 1 background").max(2000, "Maximum 2000 backgrounds"),
  productSettings: z.array(productSettingSchema).min(1, "At least 1 product image must be uploaded"),
});

export type CreateJobFormInput = z.infer<typeof createJobFormSchema>;

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB per image
export const MAX_PRODUCT_FILES = 50;
