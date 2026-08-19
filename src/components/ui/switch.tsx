import * as React from "react";
import { cn } from "./button";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  disabled,
  className,
  label,
  id,
}) => {
  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex items-center cursor-pointer select-none space-x-2.5",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
    >
      <div className="relative">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={cn(
            "w-9 h-5 rounded-full transition-colors duration-200 ease-in-out",
            checked ? "bg-jira-primary" : "bg-slate-300"
          )}
        />
        <div
          className={cn(
            "absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm",
            checked && "transform translate-x-4"
          )}
        />
      </div>
      {label && <span className="text-xs font-medium text-jira-text">{label}</span>}
    </label>
  );
};
