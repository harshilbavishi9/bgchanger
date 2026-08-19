import * as React from "react";
import { cn } from "./button";

interface ProgressProps {
  value: number; // 0 to 100
  className?: string;
  barClassName?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  className,
  barClassName,
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-200",
        className
      )}
    >
      <div
        className={cn(
          "h-full bg-jira-primary transition-all duration-300 ease-out",
          barClassName
        )}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
};
