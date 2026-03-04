'use client'

import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  value: string
  setValue?: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue>({
  value: 'email',
  setValue: () => {}
})

const Tabs = ({ children, value, defaultValue = 'email', className, onValueChange, ...props }: React.HTMLAttributes<HTMLDivElement> & {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue)
  const isControlled = value !== undefined
  const finalValue = isControlled ? value : internalValue
  const setValue = React.useCallback((newValue: string) => {
    if (isControlled) {
      onValueChange?.(newValue)
    } else {
      setInternalValue(newValue)
    }
  }, [isControlled, onValueChange])

  return (
    <TabsContext.Provider value={{ value: finalValue, setValue }}>
      <div className={className} {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { value } = React.useContext(TabsContext)

  return (
    <div ref={ref} className={cn('inline-flex h-10 items-center justify-center rounded-lg bg-muted p-1', className)} {...props}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === TabsTrigger) {
          return React.cloneElement(child as React.ReactElement, {
            selected: child.props.value === value,
          })
        }
        return child
      })}
    </div>
  )
})
TabsList.displayName = TabsList

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Slot> & React.ComponentPropsWithoutRef<'button'> & {
  value: string
}>(({ className, children, value, ...props }, ref) => {
  const { setValue } = React.useContext(TabsContext)
  const isSelected = React.useContext(TabsContext).value === value

  return (
    <Slot
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isSelected
          ? 'bg-background text-foreground shadow'
          : 'hover:bg-muted/50 hover:text-foreground',
        className
      )}
      onClick={() => setValue?.(value)}
      {...props}
    >
      {children}
    </Slot>
  )
})
TabsTrigger.displayName = TabsTrigger

const TabsContent = React.forwardRef<
  HTMLDivElement,
  { value: string } & React.HTMLAttributes<HTMLDivElement>
>(({ children, value, className, ...props }, ref) => {
  const { value: contextValue } = React.useContext(TabsContext)
  const isSelected = contextValue === value

  if (!isSelected) return null

  return (
    <div ref={ref} className={cn('mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring-offset-2 rounded-lg border bg-background p-6', className)} {...props}>
      {children}
    </div>
  )
})
TabsContent.displayName = TabsContent

export { Tabs, TabsList, TabsTrigger, TabsContent }
