import React from "react";
import { CheckCircle2, Download, RefreshCw, FileArchive, Layers, ArrowRight } from "lucide-react";
import { JobStatus } from "@/types";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

interface CompleteViewProps {
  job: JobStatus;
  onReset: () => void;
}

export const CompleteView: React.FC<CompleteViewProps> = ({ job, onReset }) => {
  const downloadUrl = job.downloadUrl || `/api/jobs/${job.id}/download`;

  return (
    <Card className="max-w-2xl mx-auto shadow-lg border-jira-border bg-white overflow-hidden">
      {/* Top Success Banner */}
      <div className="bg-emerald-50 border-b border-emerald-100 p-6 text-center space-y-2">
        <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-emerald-950">
          Export is ready!
        </h2>
        <p className="text-xs text-emerald-800">
          Your product image variations were generated and packaged into a ZIP export.
        </p>
      </div>

      <CardContent className="p-8 space-y-6">
        {/* File summary box */}
        <div className="bg-jira-bg border border-jira-border rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-jira-primary">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-jira-text font-mono">
                product-export-{job.id.slice(0, 8)}.zip
              </div>
              <div className="text-[11px] text-jira-muted">
                Mode: {job.exportMode === "background_wise" ? "Background-Wise Folders" : "Single Image Folder"}
              </div>
            </div>
          </div>

          <Badge variant="success" className="text-xs py-1 px-2.5">
            {job.total.toLocaleString()} Images
          </Badge>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <a
            href={downloadUrl}
            download={`product-export-${job.id.slice(0, 8)}.zip`}
            className="w-full sm:w-auto"
          >
            <Button size="lg" className="w-full sm:w-auto text-base px-8">
              <Download className="w-5 h-5 mr-2" />
              Download ZIP
            </Button>
          </a>

          <Button
            type="button"
            variant="secondary"
            size="lg"
            onClick={onReset}
            className="w-full sm:w-auto text-base"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Create another export
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
