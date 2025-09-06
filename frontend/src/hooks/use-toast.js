"use client"

import { toast } from "sonner"

/**
 * Shadcn-style hook wrapper around sonner's toast
 */
export function useToast() {
  return {
    toast,
  }
}
