import * as React from "react"
import { cn } from "../../lib/utils"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "vertical" | "horizontal"
}

const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, orientation = "vertical", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-auto",
          orientation === "horizontal" ? "overflow-x-auto overflow-y-hidden" : "overflow-y-auto overflow-x-hidden",
          // Scrollbar styling for Webkit
          "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar]:h-2",
          "[&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-slate-400",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ScrollArea.displayName = "ScrollArea"

export { ScrollArea }
