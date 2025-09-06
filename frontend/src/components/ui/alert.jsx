// src/components/ui/alert.jsx
import React from "react";
import { cn } from "@/lib/utils";

export function Alert({ children, className }) {
  return (
    <div
      className={cn(
        "relative w-full rounded-lg border border-border bg-card p-4 text-foreground shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AlertTitle({ children, className }) {
  return (
    <h5 className={cn("mb-1 font-medium leading-none tracking-tight", className)}>
      {children}
    </h5>
  );
}

export function AlertDescription({ children, className }) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </div>
  );
}
