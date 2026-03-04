import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea">
>(({ className, ...props }, ref) => (
  <textarea
    className={cn(
      "flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:ring-2 file:ring-ring-offset-2 file:ring-ring-offset-background-2 placeholder:text-muted-foreground focus-visible:outline-none focus:ring-2 focus:ring-ring-offset-2 focus:ring-ring-offset-background-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
))
Textarea.displayName = Textarea

export { Textarea }
