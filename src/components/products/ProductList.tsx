import React from "react";
import { Trash2, Image as ImageIcon, CheckCircle2, XCircle } from "lucide-react";
import { ProductItem } from "@/types";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface ProductListProps {
  products: ProductItem[];
  onToggleReplace: (id: string, replace: boolean) => void;
  onRemove: (id: string) => void;
  onToggleAll: (replace: boolean) => void;
  disabled?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onToggleReplace,
  onRemove,
  onToggleAll,
  disabled,
}) => {
  if (products.length === 0) return null;

  const replaceCount = products.filter((p) => p.replaceBackground).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <h3 className="text-sm font-semibold text-jira-text">
            Uploaded Products ({products.length})
          </h3>
          <Badge variant="secondary">
            {replaceCount} of {products.length} Replace ON
          </Badge>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onToggleAll(true)}
            className="text-jira-primary hover:underline font-medium disabled:opacity-50"
          >
            Enable All
          </button>
          <span className="text-jira-border">|</span>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onToggleAll(false)}
            className="text-jira-muted hover:underline font-medium disabled:opacity-50"
          >
            Disable All
          </button>
        </div>
      </div>

      <div className="border border-jira-border rounded-lg bg-white overflow-hidden divide-y divide-jira-border/60 shadow-2xs">
        {products.map((prod) => (
          <div
            key={prod.id}
            className="flex items-center justify-between p-3 hover:bg-jira-subtle/50 transition-colors"
          >
            {/* Thumbnail + Info */}
            <div className="flex items-center space-x-3 min-w-0 flex-1 mr-4">
              <div className="relative w-11 h-11 rounded border border-jira-border bg-slate-100/70 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {prod.previewUrl ? (
                  <img
                    src={prod.previewUrl}
                    alt={prod.name}
                    className="w-full h-full object-contain p-1"
                  />
                ) : (
                  <ImageIcon className="w-5 h-5 text-jira-muted" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-jira-text truncate">
                  {prod.name}
                </p>
                <p className="text-[11px] text-jira-muted">
                  {formatFileSize(prod.size)}
                </p>
              </div>
            </div>

            {/* Replacement Switch + Status */}
            <div className="flex items-center space-x-6 flex-shrink-0">
              <div className="flex items-center space-x-2 bg-jira-bg/70 px-3 py-1.5 rounded border border-jira-border/70">
                <Switch
                  id={`switch-${prod.id}`}
                  checked={prod.replaceBackground}
                  onCheckedChange={(checked) => onToggleReplace(prod.id, checked)}
                  disabled={disabled}
                />
                <span className="text-xs font-medium text-jira-text min-w-[120px] text-right">
                  {prod.replaceBackground ? (
                    <span className="text-jira-primary font-semibold flex items-center justify-end">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Replace BG
                    </span>
                  ) : (
                    <span className="text-jira-muted flex items-center justify-end">
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Keep Original
                    </span>
                  )}
                </span>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={disabled}
                onClick={() => onRemove(prod.id)}
                title="Remove product"
                className="text-jira-muted hover:text-jira-danger hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
