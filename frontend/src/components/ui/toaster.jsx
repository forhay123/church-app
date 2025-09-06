"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "./toast"

export function Toaster() {
  return (
    <ToastProvider>
      <ToastViewport />
    </ToastProvider>
  )
}
