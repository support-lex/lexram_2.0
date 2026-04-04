"use client"

import * as React from "react"
import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full font-sans",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Track data-slot="progress-track" className="h-full w-full">
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="h-full bg-primary transition-all duration-300 ease-in-out"
          style={{ width: `${value ?? 0}%` }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
