// src/components/ui/table.jsx
import React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }) {
  return (
    <table
      className={cn("w-full border-collapse text-sm text-left", className)}
      {...props}
    />
  );
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("bg-muted", className)} {...props} />;
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("", className)} {...props} />;
}

export function TableRow({ className, ...props }) {
  return (
    <tr
      className={cn("border-b last:border-none hover:bg-accent/50", className)}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }) {
  return (
    <th
      className={cn("px-4 py-2 text-xs font-semibold uppercase text-muted-foreground", className)}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }) {
  return (
    <td
      className={cn("px-4 py-2 align-middle", className)}
      {...props}
    />
  );
}
