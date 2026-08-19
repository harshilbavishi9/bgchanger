import React, { useRef, useState } from "react";
import { UploadCloud, Image as ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileValidation = (fileList: FileList | File[]) => {
    setError(null);
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(fileList).forEach((file) => {
      // Validate image/png primarily, also allow jpeg/webp
      if (file.type === "image/png" || file.type.startsWith("image/")) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setError(`Some files were skipped because they are not supported image formats (${invalidFiles.join(", ")}). PNG is recommended.`);
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileValidation(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <div className="w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer select-none ${
          isDragOver
            ? "border-jira-primary bg-blue-50/50"
            : "border-jira-border hover:border-jira-borderHover bg-jira-subtle/50 hover:bg-jira-subtle"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => e.target.files && handleFileValidation(e.target.files)}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-jira-primary">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div>
            <p className="text-sm font-semibold text-jira-text">
              Drag and drop product PNG images here
            </p>
            <p className="text-xs text-jira-muted mt-1">
              Supports transparent PNG images. Up to 50MB per file.
            </p>
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
            Browse files
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-3 text-xs text-jira-danger bg-red-50 border border-red-200 rounded p-2.5 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
