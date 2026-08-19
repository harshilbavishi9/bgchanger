import sharp from "sharp";
import { ColorBackground } from "../storage/colors";
import { OutputFormat } from "@/types";

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
  maxSizeRatio: 0.96, // Fills 96% of background height/width for maximum product size
  fit: "contain",
  bgWidth: 1200,
  bgHeight: 1200,
  addDropShadow: true,
};

/**
 * Pre-resize transparent PNG product image ONCE per product.
 * Scales product to 96% max size for maximum prominence.
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

  // Maximum allowed bounds for product on background (96% ratio for BIG size)
  const maxAllowedWidth = Math.round(bgWidth * config.maxSizeRatio);
  const maxAllowedHeight = Math.round(bgHeight * config.maxSizeRatio);

  const widthScale = maxAllowedWidth / prodWidth;
  const heightScale = maxAllowedHeight / prodHeight;
  const scale = Math.min(widthScale, heightScale);

  const targetScale = scale < 1 ? scale : 1;
  const finalProdWidth = Math.max(1, Math.round(prodWidth * targetScale));
  const finalProdHeight = Math.max(1, Math.round(prodHeight * targetScale));

  // Resize product image once to transparent PNG buffer
  const resizedBuffer = await prodImage
    .resize(finalProdWidth, finalProdHeight, {
      fit: config.fit,
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();

  const left = Math.max(0, Math.round((bgWidth - finalProdWidth) / 2));
  const top = Math.max(0, Math.round((bgHeight - finalProdHeight) / 2));

  // Generate soft, realistic studio drop shadow underneath product base
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
 * Single-pass compositing of soft studio drop shadow + MAX 96% sized centered product onto light color background.
 */
export async function compositeProductOnColorBackground(
  prepared: PreparedProduct,
  color: ColorBackground,
  outputFormat: OutputFormat = "jpeg"
): Promise<Buffer> {
  const { resizedBuffer, left, top, bgWidth, bgHeight, shadowBuffer } = prepared;

  const composites: sharp.OverlayOptions[] = [];

  // Drop shadow layer first
  if (shadowBuffer) {
    composites.push({
      input: shadowBuffer,
      left: 0,
      top: 0,
    });
  }

  // Centered large product layer on top
  composites.push({
    input: resizedBuffer,
    left,
    top,
  });

  let sharpInstance: sharp.Sharp;

  if (color.type === "gradient" && color.hex2) {
    const svg = `<svg width="${bgWidth}" height="${bgHeight}" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="g" cx="50%" cy="50%" r="75%"><stop offset="0%" stop-color="${color.hex}"/><stop offset="100%" stop-color="${color.hex2}"/></radialGradient></defs><rect width="${bgWidth}" height="${bgHeight}" fill="url(#g)"/></svg>`;
    sharpInstance = sharp(Buffer.from(svg)).composite(composites);
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
      .jpeg({ quality: 88, progressive: false, mozjpeg: false })
      .toBuffer();
  } else if (outputFormat === "webp") {
    return sharpInstance
      .webp({ quality: 85, effort: 1 })
      .toBuffer();
  } else {
    return sharpInstance
      .png({ compressionLevel: 1, effort: 1 })
      .toBuffer();
  }
}
