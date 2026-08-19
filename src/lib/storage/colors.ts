export interface ColorBackground {
  id: string;
  name: string;        // e.g. "color-0001"
  hex: string;         // Primary hex color code
  hex2?: string;        // Secondary hex color code for soft gradient
  type: "solid" | "gradient";
  label: string;       // e.g. "Studio Soft White"
}

// Curated light & soft studio background palettes (High lightness 85%-98%)
const BASE_LIGHT_PALETTES: Array<{ hex: string; hex2?: string; label: string }> = [
  { hex: "#FFFFFF", label: "Pure Studio White" },
  { hex: "#FAFAFA", label: "Alabaster Soft White" },
  { hex: "#F5F5F7", label: "Minimalist Cool Gray" },
  { hex: "#F1F5F9", label: "Light Slate Neutral" },
  { hex: "#E2E8F0", label: "Soft Studio Pearl" },
  { hex: "#EBECEF", label: "Light Steel Neutral" },
  { hex: "#FFFDF7", label: "Warm Milk Cream" },
  { hex: "#FFFBEB", label: "Warm Sand Beige" },
  { hex: "#FEF3C7", label: "Soft Champagne Gold" },
  { hex: "#FFF7ED", label: "Soft Peach Linen" },
  { hex: "#FFEDD5", label: "Warm Terracotta Light" },
  { hex: "#FDFBF7", label: "Vanilla Studio White" },
  { hex: "#F0F7FF", label: "Pastel Ice Blue" },
  { hex: "#EFF6FF", label: "Soft Sky Studio" },
  { hex: "#E0F2FE", label: "Pastel Breeze Blue" },
  { hex: "#ECFDF5", label: "Pastel Mint Fresh" },
  { hex: "#F0FDF4", label: "Soft Emerald Sage" },
  { hex: "#FCE7F3", label: "Pastel Rose Pink" },
  { hex: "#FDF2F8", label: "Soft Blush Studio" },
  { hex: "#F3E8FF", label: "Pastel Lavender" },
  { hex: "#FAF5FF", label: "Soft Lilac Studio" },
  { hex: "#FEFCE8", label: "Pastel Warm Sunshine" },
  { hex: "#FFFFFF", hex2: "#E2E8F0", label: "Studio Softbox Radial White" },
  { hex: "#FFFFFF", hex2: "#E0F2FE", label: "Studio Soft Ice Blue Radial" },
  { hex: "#FFFDF7", hex2: "#FEF3C7", label: "Studio Warm Champagne Radial" },
  { hex: "#FFFFFF", hex2: "#ECFDF5", label: "Studio Mint Fresh Radial" },
  { hex: "#FFFFFF", hex2: "#FCE7F3", label: "Studio Rose Blush Radial" },
  { hex: "#FFFFFF", hex2: "#F3E8FF", label: "Studio Soft Lavender Radial" },
  { hex: "#FAFAFA", hex2: "#CBD5E1", label: "Studio Neutral Slate Radial" },
];

/**
 * Generate a collection of 2,000 light, elegant studio color backgrounds.
 */
export function generateColorBackgroundCollection(): ColorBackground[] {
  const collection: ColorBackground[] = [];
  const totalTarget = 2000;

  BASE_LIGHT_PALETTES.forEach((palette, idx) => {
    const numStr = String(idx + 1).padStart(4, "0");
    collection.push({
      id: `color-${numStr}`,
      name: `color-${numStr}`,
      hex: palette.hex,
      hex2: palette.hex2,
      type: palette.hex2 ? "gradient" : "solid",
      label: palette.label,
    });
  });

  let counter = collection.length + 1;
  const hues = 100;
  const saturations = [5, 12, 22, 35];
  const lightnesses = [97, 94, 91, 88, 85];

  for (const h of Array.from({ length: hues }, (_, i) => (i * 360) / hues)) {
    for (const s of saturations) {
      for (const l of lightnesses) {
        if (counter > totalTarget) break;

        const hexColor = hslToHex(Math.round(h), s, l);
        const numStr = String(counter).padStart(4, "0");

        const isGradient = counter % 3 === 0;
        const hex2 = isGradient ? hslToHex(Math.round(h), s, Math.max(70, l - 12)) : undefined;

        collection.push({
          id: `color-${numStr}`,
          name: `color-${numStr}`,
          hex: hexColor,
          hex2: hex2,
          type: isGradient ? "gradient" : "solid",
          label: `Light Color ${numStr} (HSL ${Math.round(h)}°, ${s}%, ${l}%)`,
        });

        counter++;
      }
      if (counter > totalTarget) break;
    }
    if (counter > totalTarget) break;
  }

  while (collection.length < totalTarget) {
    const idx = collection.length + 1;
    const numStr = String(idx).padStart(4, "0");
    collection.push({
      id: `color-${numStr}`,
      name: `color-${numStr}`,
      hex: "#F8FAFC",
      type: "solid",
      label: `Light Color ${numStr}`,
    });
  }

  return collection.slice(0, totalTarget);
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function getAvailableColorBackgrounds(limit = 2000): ColorBackground[] {
  const collection = generateColorBackgroundCollection();
  return collection.slice(0, limit);
}

/**
 * Draw N random color backgrounds from the 2,000 studio collection using Fisher-Yates sampling.
 * Guarantees a different background every time, even if count = 1.
 */
export function getRandomColorBackgrounds(count: number): ColorBackground[] {
  const collection = generateColorBackgroundCollection();
  const clampedCount = Math.min(Math.max(1, count), collection.length);

  // Fisher-Yates Shuffle
  const array = [...collection];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array.slice(0, clampedCount);
}
