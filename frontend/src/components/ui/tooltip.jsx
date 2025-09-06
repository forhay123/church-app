"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

const TooltipProvider = TooltipPrimitive.Provider

const Tooltip = ({ children, ...props }) => {
  return (
    <TooltipPrimitive.Root {...props}>
      {children}
    </TooltipPrimitive.Root>
  )
}

const TooltipTrigger = TooltipPrimitive.Trigger
const TooltipContent = React.forwardRef(({ className, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={4}
    className="z-50 overflow-hidden rounded-md bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95"
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
