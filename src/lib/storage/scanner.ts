import fs from "fs/promises";
import path from "path";
import { STORAGE_PATHS, ensureStorageDirectories } from "./paths";
import sharp from "sharp";

export interface BackgroundFile {
  filename: string;
  fullPath: string;
}

const SUPPORTED_BG_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

/**
 * Seed initial sample background images if the directory is empty.
 * This ensures out-of-the-box functionality.
 */
async function seedDefaultBackgroundsIfEmpty(): Promise<void> {
  await ensureStorageDirectories();

  const files = await fs.readdir(STORAGE_PATHS.backgrounds);
  const imageFiles = files.filter((f) =>
    SUPPORTED_BG_EXTENSIONS.has(path.extname(f).toLowerCase())
  );

  if (imageFiles.length > 0) {
    return; // Directory already has backgrounds
  }

  // Generate 20 diverse, high-quality, professional product stage backgrounds
  const width = 1920;
  const height = 1080;

  const presets = [
    { name: "background-0001.jpg", color1: "#F5F5F7", color2: "#E2E2E7", type: "gradient" },
    { name: "background-0002.jpg", color1: "#FFFFFF", color2: "#ECEFF1", type: "studio" },
    { name: "background-0003.jpg", color1: "#1E293B", color2: "#0F172A", type: "dark" },
    { name: "background-0004.jpg", color1: "#FEF3C7", color2: "#FDE68A", type: "warm" },
    { name: "background-0005.jpg", color1: "#E0F2FE", color2: "#BAE6FD", type: "cool" },
    { name: "background-0006.jpg", color1: "#FCE7F3", color2: "#FBCFE8", type: "pastel" },
    { name: "background-0007.jpg", color1: "#ECFDF5", color2: "#A7F3D0", type: "mint" },
    { name: "background-0008.jpg", color1: "#F3E8FF", color2: "#DDD6FE", type: "lavender" },
    { name: "background-0009.jpg", color1: "#D1D5DB", color2: "#9CA3AF", type: "neutral" },
    { name: "background-0010.jpg", color1: "#334155", color2: "#1E293B", type: "slate" },
    { name: "background-0011.jpg", color1: "#FFF7ED", color2: "#FFEDD5", type: "peach" },
    { name: "background-0012.jpg", color1: "#EFF6FF", color2: "#DBEAFE", type: "sky" },
    { name: "background-0013.jpg", color1: "#F8FAFC", color2: "#E2E8F0", type: "marble" },
    { name: "background-0014.jpg", color1: "#292524", color2: "#1C1917", type: "stone" },
    { name: "background-0015.jpg", color1: "#FEF2F2", color2: "#FECACA", type: "rose" },
    { name: "background-0016.jpg", color1: "#F0FDF4", color2: "#BBF7D0", type: "emerald" },
    { name: "background-0017.jpg", color1: "#FAF5FF", color2: "#E9D5FF", type: "purple" },
    { name: "background-0018.jpg", color1: "#FFFBEB", color2: "#FEF08A", type: "amber" },
    { name: "background-0019.jpg", color1: "#18181B", color2: "#09090B", type: "black" },
    { name: "background-0020.jpg", color1: "#F1F5F9", color2: "#CBD5E1", type: "minimal" },
  ];

  for (const preset of presets) {
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="grad" cx="50%" cy="50%" r="75%" fx="50%" fy="50%">
            <stop offset="0%" stop-color="${preset.color1}" />
            <stop offset="100%" stop-color="${preset.color2}" />
          </radialGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="40" />
            <feOffset dx="0" dy="25" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.15" />
            </feComponentTransfer>
            <feMerge> 
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#grad)" />
        <ellipse cx="${width / 2}" cy="${height * 0.82}" rx="${width * 0.35}" ry="${height * 0.08}" fill="#000000" opacity="0.08" filter="blur(20px)" />
      </svg>
    `;

    const filePath = path.join(STORAGE_PATHS.backgrounds, preset.name);
    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(filePath);
  }
}

/**
 * Scan backgrounds directory and return deterministic sorted list of available backgrounds.
 */
export async function getAvailableBackgrounds(): Promise<BackgroundFile[]> {
  await seedDefaultBackgroundsIfEmpty();

  const files = await fs.readdir(STORAGE_PATHS.backgrounds);
  const imageFiles = files
    .filter((f) => SUPPORTED_BG_EXTENSIONS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

  return imageFiles.map((filename) => ({
    filename,
    fullPath: path.join(STORAGE_PATHS.backgrounds, filename),
  }));
}
