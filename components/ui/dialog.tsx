'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

const DialogContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {}
})

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, onOpenChange, children, ...props }: DialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const finalOpen = isControlled ? open : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  return (
    <DialogContext.Provider value={{ open: finalOpen, setOpen }}>
      <div {...props}>{children}</div>
    </DialogContext.Provider>
  )
}

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Slot> & React.ComponentPropsWithoutRef<'button'> & { asChild?: boolean }
>(
  ({ className, children, asChild, ...props }, ref) => {
    const { setOpen } = React.useContext(DialogContext)
    const Comp = asChild ? Slot : 'button' as any
    return (
      <Comp
        ref={ref}
        className={cn('inline-flex items-center justify-center', className)}
        onClick={() => setOpen(true)}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
DialogTrigger.displayName = 'DialogTrigger'

const DialogContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(DialogContext)
    return open ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div
          ref={ref}
          className={cn(
            'bg-white rounded-lg shadow-lg p-6 w-full max-w-md',
            className
          )}
          {...props}
        >
          {children}
          <button onClick={() => setOpen(false)} className="mt-4 w-full">
            Close
          </button>
        </div>
      </div>
    ) : null
  }
)
DialogContent.displayName = 'DialogContent'

export { Dialog, DialogTrigger, DialogContent }
