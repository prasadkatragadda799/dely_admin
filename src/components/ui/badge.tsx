import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border border-border",
        pending: "bg-amber-100 text-amber-800 border-transparent",
        confirmed: "bg-blue-100 text-blue-800 border-transparent",
        processing: "bg-indigo-100 text-indigo-800 border-transparent",
        shipped: "bg-cyan-100 text-cyan-800 border-transparent",
        delivered: "bg-emerald-100 text-emerald-800 border-transparent",
        cancelled: "bg-red-100 text-red-800 border-transparent",
        verified: "bg-emerald-100 text-emerald-800 border-transparent",
        rejected: "bg-red-100 text-red-800 border-transparent",
        active: "bg-emerald-100 text-emerald-800 border-transparent",
        inactive: "bg-gray-100 text-gray-800 border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
