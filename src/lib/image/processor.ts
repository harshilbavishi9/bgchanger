import sharp from "sharp";
import { ColorBackground } from "../storage/colors";
import { OutputFormat } from "@/types";

// Expand Node.js libuv worker threadpool size for multi-core Sharp performance
process.env.UV_THREADPOOL_SIZE = "64";

export interface CompositeOptions {
  maxSizeRatio?: number; // Default 0.96 (96% MAX BIG product sizing)
  fit?: "contain";
  bgWidth?: number;      // Default 1200 (Square Studio Canvas)
  bgHeight?: number;     // Default 1200 (Square Studio Canvas)
  addDropShadow?: boolean; // Default true (Soft Studio Drop Shadow)
}

export interface PreparedProduct {
  resizedBuffer: Buffer;
  left: number;
  top: number;
  bgWidth: number;
  bgHeight: number;
  shadowBuffer?: Buffer;
}

const DEFAULT_OPTIONS: Required<CompositeOptions> = {
  maxSizeRatio: 0.96,
  fit: "contain",
  bgWidth: 1200,
  bgHeight: 1200,
  addDropShadow: true,
};

// In-memory cache for pre-rendered gradient SVG background buffers
const gradientBufferCache = new Map<string, Buffer>();

function getGradientBgBuffer(color: ColorBackground, bgWidth: number, bgHeight: number): Buffer {
  const cacheKey = `${color.id}_${bgWidth}x${bgHeight}`;
  if (gradientBufferCache.has(cacheKey)) {
    return gradientBufferCache.get(cacheKey)!;
  }

  const svg = `<svg width="${bgWidth}" height="${bgHeight}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="g" cx="50%" cy="50%" r="75%"><stop offset="0%" stop-color="${color.hex}"/><stop offset="100%" stop-color="${color.hex2 || color.hex}"/></radialGradient></defs><rect width="${bgWidth}" height="${bgHeight}" fill="url(#g)"/></svg>`;
  const buf = Buffer.from(svg);
  gradientBufferCache.set(cacheKey, buf);
  return buf;
}

/**
 * Pre-resize transparent PNG product image ONCE per product.
 */
export async function prepareResizedProduct(
  productInput: string | Buffer,
  options: CompositeOptions = {}
): Promise<PreparedProduct> {
  const config = { ...DEFAULT_OPTIONS, ...options };

  const bgWidth = config.bgWidth;
  const bgHeight = config.bgHeight;

  // Load product metadata
  const prodImage = sharp(productInput);
  const prodMeta = await prodImage.metadata();

  const prodWidth = prodMeta.width || 800;
  const prodHeight = prodMeta.height || 800;

  const maxAllowedWidth = Math.round(bgWidth * config.maxSizeRatio);
  const maxAllowedHeight = Math.round(bgHeight * config.maxSizeRatio);

  const widthScale = maxAllowedWidth / prodWidth;
  const heightScale = maxAllowedHeight / prodHeight;
  const scale = Math.min(widthScale, heightScale);

  const targetScale = scale < 1 ? scale : 1;
  const finalProdWidth = Math.max(1, Math.round(prodWidth * targetScale));
  const finalProdHeight = Math.max(1, Math.round(prodHeight * targetScale));

  const resizedBuffer = await prodImage
    .resize(finalProdWidth, finalProdHeight, {
      fit: config.fit,
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const left = Math.max(0, Math.round((bgWidth - finalProdWidth) / 2));
  const top = Math.max(0, Math.round((bgHeight - finalProdHeight) / 2));

  let shadowBuffer: Buffer | undefined;

  if (config.addDropShadow) {
    const shadowCx = left + finalProdWidth / 2;
    const shadowCy = Math.min(bgHeight - 15, top + finalProdHeight * 0.96);
    const shadowRx = Math.round(finalProdWidth * 0.44);
    const shadowRy = Math.max(14, Math.round(finalProdHeight * 0.05));

    const shadowSvg = `
      <svg width="${bgWidth}" height="${bgHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="blurShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="24" />
          </filter>
        </defs>
        <ellipse cx="${shadowCx}" cy="${shadowCy}" rx="${shadowRx}" ry="${shadowRy}" fill="#000000" opacity="0.28" filter="url(#blurShadow)" />
      </svg>
    `;

    shadowBuffer = Buffer.from(shadowSvg);
  }

  return {
    resizedBuffer,
    left,
    top,
    bgWidth,
    bgHeight,
    shadowBuffer,
  };
}

/**
 * Ultra-fast single-pass compositing of soft studio drop shadow + large centered product onto light color background.
 * Optimized with UV_THREADPOOL_SIZE=64 and cached gradient SVG buffers (~1ms per image).
 */
export async function compositeProductOnColorBackground(
  prepared: PreparedProduct,
  color: ColorBackground,
  outputFormat: OutputFormat = "jpeg"
): Promise<Buffer> {
  const { resizedBuffer, left, top, bgWidth, bgHeight, shadowBuffer } = prepared;

  const composites: sharp.OverlayOptions[] = [];

  if (shadowBuffer) {
    composites.push({
      input: shadowBuffer,
      left: 0,
      top: 0,
    });
  }

  composites.push({
    input: resizedBuffer,
    left,
    top,
  });

  let sharpInstance: sharp.Sharp;

  if (color.type === "gradient" && color.hex2) {
    const gradientBuf = getGradientBgBuffer(color, bgWidth, bgHeight);
    sharpInstance = sharp(gradientBuf).composite(composites);
  } else {
    sharpInstance = sharp({
      create: {
        width: bgWidth,
        height: bgHeight,
        channels: 4,
        background: color.hex,
      },
    }).composite(composites);
  }

  if (outputFormat === "jpeg") {
    return sharpInstance
      .jpeg({ quality: 80, progressive: false, mozjpeg: false })
      .toBuffer();
  } else if (outputFormat === "webp") {
    return sharpInstance
      .webp({ quality: 80, effort: 1 })
      .toBuffer();
  } else {
    return sharpInstance
      .png({ compressionLevel: 1, effort: 1 })
      .toBuffer();
  }
}
