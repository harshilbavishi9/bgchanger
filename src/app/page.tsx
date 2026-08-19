"use client";

import React, { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { Header } from "@/components/Header";
import { Dropzone } from "@/components/upload/Dropzone";
import { ProductList } from "@/components/products/ProductList";
import { ExportOptions } from "@/components/export/ExportOptions";
import { ProgressView } from "@/components/progress/ProgressView";
import { CompleteView } from "@/components/export/CompleteView";
import { Button } from "@/components/ui/button";
import { ProductItem, ExportMode, OutputFormat, JobStatus, ColorBackground } from "@/types";
import { ArrowRight, AlertTriangle } from "lucide-react";

export default function HomePage() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [exportMode, setExportMode] = useState<ExportMode>("background_wise");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("jpeg"); // Default JPEG for instant speed!
  const [backgroundCount, setBackgroundCount] = useState<number>(100);
  const [maxAvailableBackgrounds, setMaxAvailableBackgrounds] = useState<number>(2000);
  const [sampleColors, setSampleColors] = useState<ColorBackground[]>([]);

  const [job, setJob] = useState<JobStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    async function fetchBackgrounds() {
      try {
        const res = await fetch("/api/backgrounds");
        if (res.ok) {
          const data = await res.json();
          if (typeof data.total === "number" && data.total > 0) {
            setMaxAvailableBackgrounds(data.total);
            if (Array.isArray(data.backgrounds)) {
              setSampleColors(data.backgrounds);
            }
          }
        }
      } catch (err) {
        console.warn("Could not fetch background collection from API:", err);
      }
    }
    fetchBackgrounds();
  }, []);

  useEffect(() => {
    return () => {
      products.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl);
      });
    };
  }, [products]);

  const handleFilesSelected = (newFiles: File[]) => {
    setError(null);
    const newItems: ProductItem[] = newFiles.map((file) => ({
      id: uuidv4(),
      name: file.name,
      size: file.size,
      file,
      previewUrl: URL.createObjectURL(file),
      replaceBackground: true,
    }));

    setProducts((prev) => [...prev, ...newItems]);
  };

  const handleToggleReplace = (id: string, replace: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, replaceBackground: replace } : p))
    );
  };

  const handleToggleAll = (replace: boolean) => {
    setProducts((prev) => prev.map((p) => ({ ...p, replaceBackground: replace })));
  };

  const handleRemoveProduct = (id: string) => {
    setProducts((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleStartGeneration = async () => {
    if (products.length === 0) {
      setError("Please upload at least one product image.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("exportMode", exportMode);
      formData.append("outputFormat", outputFormat);
      formData.append("backgroundCount", backgroundCount.toString());

      const productSettings = products.map((p) => ({
        id: p.id,
        originalFilename: p.name,
        replaceBackground: p.replaceBackground,
      }));

      formData.append("productSettings", JSON.stringify(productSettings));

      products.forEach((p) => {
        if (p.file) {
          formData.append(`file_${p.id}`, p.file, p.name);
        }
      });

      const res = await fetch("/api/jobs", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create processing job.");
      }

      const initialJobStatus: JobStatus = await res.json();
      setJob(initialJobStatus);
      startPolling(initialJobStatus.id);
    } catch (err) {
      console.error("Job creation error:", err);
      setError(err instanceof Error ? err.message : "Export generation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startPolling = (jobId: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        if (res.ok) {
          const updatedJob: JobStatus = await res.json();
          setJob(updatedJob);

          if (updatedJob.status === "completed" || updatedJob.status === "failed") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          }
        }
      } catch (err) {
        console.warn("Polling error:", err);
      }
    }, 200); // Polling every 200ms for instant UI updates
  };

  const handleReset = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setJob(null);
    setError(null);
  };

  const enabledCount = products.filter((p) => p.replaceBackground).length;
  const disabledCount = products.filter((p) => !p.replaceBackground).length;

  return (
    <div className="min-h-screen bg-jira-bg text-jira-text flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
        {job && job.status === "completed" ? (
          <CompleteView job={job} onReset={handleReset} />
        ) : job && (job.status === "queued" || job.status === "processing") ? (
          <ProgressView job={job} />
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-jira-border pb-5 gap-4">
              <div>
                <h2 className="text-xl font-bold text-jira-text tracking-tight">
                  Create Export
                </h2>
                <p className="text-xs text-jira-muted mt-1">
                  Upload transparent product images, configure background replacement toggles, and export color variations.
                </p>
              </div>

              {products.length > 0 && (
                <Button
                  size="lg"
                  disabled={isSubmitting}
                  onClick={handleStartGeneration}
                  className="shadow-sm"
                >
                  {isSubmitting ? (
                    "Starting Export..."
                  ) : (
                    <>
                      <span>Start Generation</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>

            {(error || (job && job.status === "failed")) && (
              <div className="bg-red-50 border border-red-200 text-jira-danger rounded-lg p-4 text-xs flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-red-900">Execution Error</h4>
                  <p className="mt-0.5">
                    {error || job?.error || "Processing job encountered an unexpected error."}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-jira-muted">
                1. Upload Products
              </h3>
              <Dropzone onFilesSelected={handleFilesSelected} disabled={isSubmitting} />
            </div>

            {products.length > 0 && (
              <div className="space-y-3">
                <ProductList
                  products={products}
                  onToggleReplace={handleToggleReplace}
                  onRemove={handleRemoveProduct}
                  onToggleAll={handleToggleAll}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {products.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-jira-muted">
                  2. Configure Color Backgrounds & Speed Format Settings
                </h3>
                <ExportOptions
                  exportMode={exportMode}
                  onExportModeChange={setExportMode}
                  outputFormat={outputFormat}
                  onOutputFormatChange={setOutputFormat}
                  backgroundCount={backgroundCount}
                  onBackgroundCountChange={setBackgroundCount}
                  maxAvailableBackgrounds={maxAvailableBackgrounds}
                  totalProducts={products.length}
                  enabledReplaceCount={enabledCount}
                  disabledReplaceCount={disabledCount}
                  disabled={isSubmitting}
                  sampleColors={sampleColors}
                />
              </div>
            )}

            {products.length > 0 && (
              <div className="border-t border-jira-border pt-6 flex items-center justify-between">
                <div className="text-xs text-jira-muted">
                  Ready to process <span className="font-bold text-jira-text">{products.length}</span> product(s) across <span className="font-bold text-jira-text">{backgroundCount}</span> color background(s) ({outputFormat.toUpperCase()} Format).
                </div>

                <Button
                  size="lg"
                  disabled={isSubmitting}
                  onClick={handleStartGeneration}
                  className="shadow-sm"
                >
                  {isSubmitting ? (
                    "Starting Export..."
                  ) : (
                    <>
                      <span>Start Generation</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
