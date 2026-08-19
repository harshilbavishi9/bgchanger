import React from "react";
import { Layers, Sparkles, HelpCircle } from "lucide-react";
import { Badge } from "./ui/badge";

export const Header: React.FC = () => {
  return (
    <header className="border-b border-jira-border bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-jira-primary flex items-center justify-center text-white shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-semibold text-base text-jira-text tracking-tight">
                Product Background Generator
              </h1>
              <Badge variant="default" className="text-[10px] py-0 px-1.5">
                Batch v1.0
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="inline-flex items-center text-xs font-medium text-jira-muted bg-jira-bg px-2.5 py-1 rounded border border-jira-border">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
            Sharp Engine
          </span>
          <a
            href="#help"
            onClick={(e) => {
              e.preventDefault();
              alert(
                "How it works:\n1. Upload product PNG images.\n2. Set individual background replacement toggles.\n3. Choose background count & export mode.\n4. Batch generate and download your ZIP export."
              );
            }}
            className="text-xs font-medium text-jira-muted hover:text-jira-primary flex items-center space-x-1"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help</span>
          </a>
        </div>
      </div>
    </header>
  );
};
