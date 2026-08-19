import React from "react";
import { Loader2, Layers, CheckCircle2 } from "lucide-react";
import { JobStatus } from "@/types";
import { Progress } from "../ui/progress";
import { Card, CardContent } from "../ui/card";

interface ProgressViewProps {
  job: JobStatus;
}

export const ProgressView: React.FC<ProgressViewProps> = ({ job }) => {
  return (
    <Card className="max-w-2xl mx-auto shadow-md border-jira-border">
      <CardContent className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-jira-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-jira-text">
                Generating product variations...
              </h3>
              <p className="text-xs text-jira-muted">
                Processing images with Sharp & Archiver queue
              </p>
            </div>
          </div>

          <span className="text-2xl font-bold text-jira-primary font-mono">
            {job.progress}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={job.progress} className="h-3" />

          <div className="flex items-center justify-between text-xs font-semibold text-jira-text">
            <span>
              {job.completed.toLocaleString()} of {job.total.toLocaleString()} images completed
            </span>
            <span className="text-jira-muted font-normal">
              Job ID: {job.id.slice(0, 8)}
            </span>
          </div>
        </div>

        {/* Current Operation Status Box */}
        <div className="bg-jira-bg border border-jira-border rounded-md p-4 space-y-2 text-xs">
          <div className="flex items-center justify-between text-jira-muted font-medium">
            <span className="uppercase tracking-wider text-[10px]">
              Current Batch Operation
            </span>
            <span className="flex items-center text-jira-primary">
              <span className="w-2 h-2 rounded-full bg-jira-primary animate-ping mr-1.5" />
              Live Process
            </span>
          </div>

          <p className="font-mono text-jira-text truncate bg-white p-2.5 rounded border border-jira-border/60">
            {job.currentOperation || "Processing background compositing queue..."}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-3 text-center pt-2">
          <div className="bg-jira-subtle p-3 rounded border border-jira-border/60">
            <div className="text-[11px] text-jira-muted uppercase">Products</div>
            <div className="text-sm font-bold text-jira-text">{job.totalProducts}</div>
          </div>
          <div className="bg-jira-subtle p-3 rounded border border-jira-border/60">
            <div className="text-[11px] text-jira-muted uppercase">Backgrounds</div>
            <div className="text-sm font-bold text-jira-text">{job.backgroundCount}</div>
          </div>
          <div className="bg-jira-subtle p-3 rounded border border-jira-border/60">
            <div className="text-[11px] text-jira-muted uppercase">Mode</div>
            <div className="text-xs font-bold text-jira-text capitalize">
              {job.exportMode === "background_wise" ? "Foldered" : "Single"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
