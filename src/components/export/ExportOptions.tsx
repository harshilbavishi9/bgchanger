import React from "react";
import { FolderTree, Palette, Info, Zap, FileType } from "lucide-react";
import { ExportMode, OutputFormat, ColorBackground } from "@/types";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

interface ExportOptionsProps {
  exportMode: ExportMode;
  onExportModeChange: (mode: ExportMode) => void;
  outputFormat: OutputFormat;
  onOutputFormatChange: (format: OutputFormat) => void;
  backgroundCount: number;
  onBackgroundCountChange: (count: number) => void;
  maxAvailableBackgrounds: number;
  totalProducts: number;
  enabledReplaceCount: number;
  disabledReplaceCount: number;
  disabled?: boolean;
  sampleColors?: ColorBackground[];
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({
  exportMode,
  onExportModeChange,
  outputFormat,
  onOutputFormatChange,
  backgroundCount,
  onBackgroundCountChange,
  maxAvailableBackgrounds,
  totalProducts,
  enabledReplaceCount,
  disabledReplaceCount,
  disabled,
  sampleColors = [],
}) => {
  const estimatedImages =
    exportMode === "background_wise"
      ? totalProducts * backgroundCount
      : enabledReplaceCount * backgroundCount + disabledReplaceCount;

  const previewSwatches = sampleColors.slice(0, 16);

  return (
    <div className="space-y-5">
      {/* Top Row: Background Count & Speed Format Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Background Count Setting */}
        <div className="bg-white border border-jira-border rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-jira-text flex items-center space-x-2">
              <Palette className="w-4 h-4 text-jira-primary" />
              <span>Color Background Collection</span>
            </label>
            <Badge variant="default" className="text-[11px] bg-emerald-100 text-emerald-800 border-emerald-200">
              <Zap className="w-3 h-3 mr-1" />
              Fast Engine
            </Badge>
          </div>

          <div className="flex items-center space-x-3">
            <div className="space-y-1">
              <span className="text-xs font-medium text-jira-muted">Number of Colors:</span>
              <Input
                type="number"
                min={1}
                max={maxAvailableBackgrounds}
                value={backgroundCount}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) {
                    onBackgroundCountChange(
                      Math.min(Math.max(1, val), maxAvailableBackgrounds)
                    );
                  }
                }}
                disabled={disabled}
                className="w-36 font-semibold text-jira-text"
              />
            </div>
            <div className="text-xs text-jira-muted pt-4">
              / {maxAvailableBackgrounds.toLocaleString()} color codes
            </div>
          </div>

          {/* Color Swatch Preview Strip */}
          {previewSwatches.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] text-jira-muted font-medium flex items-center justify-between">
                <span>Color Palette Preview:</span>
                <span className="text-[10px] text-jira-primary font-mono font-semibold">
                  color-0001 → color-{String(Math.min(backgroundCount, maxAvailableBackgrounds)).padStart(4, "0")}
                </span>
              </div>
              <div className="flex items-center flex-wrap gap-1.5 p-2 bg-jira-bg rounded border border-jira-border/60">
                {previewSwatches.map((color) => (
                  <div
                    key={color.id}
                    title={`${color.name}: ${color.hex} (${color.label})`}
                    className="w-6 h-6 rounded border border-slate-300/80 shadow-2xs flex-shrink-0 transition-transform hover:scale-110"
                    style={{
                      background:
                        color.type === "gradient" && color.hex2
                          ? `radial-gradient(circle, ${color.hex} 0%, ${color.hex2} 100%)`
                          : color.hex,
                    }}
                  />
                ))}
                {backgroundCount > previewSwatches.length && (
                  <span className="text-[10px] font-bold text-jira-muted px-1.5">
                    +{backgroundCount - previewSwatches.length} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Speed Format & Output Estimate Box */}
        <div className="bg-white border border-jira-border rounded-lg p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-jira-text flex items-center space-x-2">
                <FileType className="w-4 h-4 text-jira-primary" />
                <span>Image Format & Speed</span>
              </label>
              <Badge variant="secondary" className="text-[10px]">
                High Speed
              </Badge>
            </div>

            {/* Format Selection Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => onOutputFormatChange("jpeg")}
                className={`p-2 rounded border text-center transition-all select-none ${
                  outputFormat === "jpeg"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500 font-bold"
                    : "border-jira-border bg-white text-jira-muted hover:bg-slate-50"
                }`}
              >
                <div className="text-xs flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 mr-1" />
                  JPEG
                </div>
                <div className="text-[10px] text-emerald-700 font-normal">~0.3s (Ultra Fast)</div>
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => onOutputFormatChange("webp")}
                className={`p-2 rounded border text-center transition-all select-none ${
                  outputFormat === "webp"
                    ? "border-jira-primary bg-blue-50 text-jira-primary ring-1 ring-jira-primary font-bold"
                    : "border-jira-border bg-white text-jira-muted hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-semibold">WebP</div>
                <div className="text-[10px] font-normal">~1.2s (Compact)</div>
              </button>

              <button
                type="button"
                disabled={disabled}
                onClick={() => onOutputFormatChange("png")}
                className={`p-2 rounded border text-center transition-all select-none ${
                  outputFormat === "png"
                    ? "border-jira-primary bg-blue-50 text-jira-primary ring-1 ring-jira-primary font-bold"
                    : "border-jira-border bg-white text-jira-muted hover:bg-slate-50"
                }`}
              >
                <div className="text-xs font-semibold">PNG</div>
                <div className="text-[10px] font-normal">Lossless</div>
              </button>
            </div>
          </div>

          <div className="border-t border-jira-border/60 pt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-jira-muted">Total Output Files:</span>
              <span className="text-xl font-bold text-jira-text font-mono">
                {estimatedImages.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-emerald-700 mt-1 flex items-center">
              <Zap className="w-3 h-3 mr-1 text-emerald-600 flex-shrink-0" />
              {outputFormat === "jpeg"
                ? "JPEG uses hardware SIMD acceleration (<0.5s total batch time)."
                : outputFormat === "webp"
                ? "WebP provides compact files with high quality."
                : "PNG generates high resolution uncompressed files."}
            </p>
          </div>
        </div>
      </div>

      {/* Export Mode Selector */}
      <div className="bg-white border border-jira-border rounded-lg p-5 shadow-2xs space-y-4">
        <label className="text-sm font-semibold text-jira-text flex items-center space-x-2">
          <FolderTree className="w-4 h-4 text-jira-primary" />
          <span>Export Folder Structure Mode</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Mode 1 Card */}
          <div
            onClick={() => !disabled && onExportModeChange("background_wise")}
            className={`border rounded-lg p-4 cursor-pointer transition-all select-none ${
              exportMode === "background_wise"
                ? "border-jira-primary bg-blue-50/40 ring-1 ring-jira-primary"
                : "border-jira-border hover:border-jira-borderHover bg-white"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                name="exportMode"
                checked={exportMode === "background_wise"}
                onChange={() => onExportModeChange("background_wise")}
                disabled={disabled}
                className="mt-1 accent-jira-primary"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-jira-text uppercase tracking-wide">
                    Mode 1: Background Folders
                  </h4>
                  {exportMode === "background_wise" && (
                    <Badge variant="default" className="text-[10px]">Active</Badge>
                  )}
                </div>
                <p className="text-xs text-jira-muted">
                  Each color background gets its own folder containing all products.
                </p>

                <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-2.5 rounded mt-2 overflow-x-auto leading-relaxed border border-slate-800">
                  <div className="text-slate-400">export.zip</div>
                  <div>├── color-0001/</div>
                  <div>│   ├── product-1.{outputFormat === "jpeg" ? "jpg" : outputFormat}</div>
                  <div>│   └── product-2.{outputFormat === "jpeg" ? "jpg" : outputFormat}</div>
                  <div>└── color-0002/</div>
                </div>
              </div>
            </div>
          </div>

          {/* Mode 2 Card */}
          <div
            onClick={() => !disabled && onExportModeChange("single_folder")}
            className={`border rounded-lg p-4 cursor-pointer transition-all select-none ${
              exportMode === "single_folder"
                ? "border-jira-primary bg-blue-50/40 ring-1 ring-jira-primary"
                : "border-jira-border hover:border-jira-borderHover bg-white"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-start space-x-3">
              <input
                type="radio"
                name="exportMode"
                checked={exportMode === "single_folder"}
                onChange={() => onExportModeChange("single_folder")}
                disabled={disabled}
                className="mt-1 accent-jira-primary"
              />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-jira-text uppercase tracking-wide">
                    Mode 2: Single Image Folder
                  </h4>
                  {exportMode === "single_folder" && (
                    <Badge variant="default" className="text-[10px]">Active</Badge>
                  )}
                </div>
                <p className="text-xs text-jira-muted">
                  All color variations are stored in a single flat folder.
                </p>

                <div className="bg-slate-900 text-emerald-400 font-mono text-[11px] p-2.5 rounded mt-2 overflow-x-auto leading-relaxed border border-slate-800">
                  <div className="text-slate-400">export.zip</div>
                  <div>└── Generated Images/</div>
                  <div>    ├── product-1_color-0001.{outputFormat === "jpeg" ? "jpg" : outputFormat}</div>
                  <div>    ├── product-1_color-0002.{outputFormat === "jpeg" ? "jpg" : outputFormat}</div>
                  <div>    └── product-2_original.png</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
