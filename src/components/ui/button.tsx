import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jira-primary disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-jira-primary text-white hover:bg-jira-primaryHover active:bg-jira-primaryActive shadow-sm",
        secondary:
          "bg-jira-subtle text-jira-text border border-jira-border hover:bg-slate-100 active:bg-slate-200",
        outline:
          "border border-jira-border bg-white text-jira-text hover:bg-jira-subtle hover:border-jira-borderHover",
        ghost:
          "text-jira-text hover:bg-slate-100 hover:text-jira-text",
        danger:
          "bg-jira-danger text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
        subtleDanger:
          "text-jira-danger bg-red-50 hover:bg-red-100 border border-red-200",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-6 text-base font-semibold",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants, cn };
