"use client";

import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils"; // or replace with your own className joiner if you don’t have this

export function DropdownMenu({ children, ...props }) {
  return (
    <DropdownMenuPrimitive.Root {...props}>
      {children}
    </DropdownMenuPrimitive.Root>
  );
}

export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuContent = DropdownMenuPrimitive.Content;
export const DropdownMenuItem = DropdownMenuPrimitive.Item;
export const DropdownMenuSeparator = DropdownMenuPrimitive.Separator;
export const DropdownMenuLabel = DropdownMenuPrimitive.Label;
