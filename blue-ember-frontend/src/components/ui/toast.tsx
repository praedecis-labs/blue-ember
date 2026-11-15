import * as React from 'react'
import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'
import { X } from 'lucide-react'

import { cn } from '@/lib/utils'

const toastVariants = cva(
  'group pointer-events-auto flex flex-col items-start justify-between space-x-4 whitespace-normal rounded-lg border border-border bg-background p-6 text-foreground shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:duration-200 data-[state=closed]:duration-100 dark:border-input/50',
  {
    variants: {
      variant: {
        default: '',
        destructive:
          'destructive group border-destructive/50 bg-destructive text-destructive-foreground shadow-md',
        success:
          'success group border-[#10b981]/50 bg-[#10b981]/10 text-[#10b981] dark:bg-[#10b981]/20',
        warning:
          'warning group border-[#f59e0b]/50 bg-[#f59e0b]/10 text-[#f59e0b] dark:bg-[#f59e0b]/20',
        info:
          'info group border-[#3b82f6]/50 bg-[#3b82f6]/10 text-[#3b82f6] dark:bg-[#3b82f6]/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Toast({
  className,
  variant,
  title,
  description,
  action,
  closeButton = true,
  ...props
}: ToastProps) {
  return (
    <motion.div
      className={cn(toastVariants({ variant, className }))}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      <div className="grid gap-1">
        {title && <h3 className="text-lg font-semibold">{title}</h3>}
        {description && (
          <div className="text-sm opacity-90">{description}</div>
        )}
      </div>
      <div className="flex items-center justify-between space-x-2">
        {action}
        {closeButton && (
          <button
            className="opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 disabled:pointer-events-none p-1 rounded-md hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

interface ToasterProps {
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
}

const TOASTER_POSITIONS: Record<
  Required<ToasterProps>['position'],
  string
> = {
  'top-left': 'top-0 left-0',
  'top-center': 'top-0 left-1/2 -translate-x-1/2',
  'top-right': 'top-0 right-0',
  'bottom-left': 'bottom-0 left-0',
  'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
  'bottom-right': 'bottom-0 right-0',
}

function Toaster({ position = 'top-right' }: ToasterProps) {
  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-4 p-6 sm:p-8',
        TOASTER_POSITIONS[position],
        'pointer-events-none'
      )}
    >
      <div className="flex flex-col gap-4 w-full max-w-xs pointer-events-auto" />
    </div>
  )
}

export type ToastProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof toastVariants> & {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  closeButton?: boolean
}

export type ToastAction = React.ReactNode

export { Toast, Toaster }
