import * as React from 'react'
import { motion } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const progressVariants = cva(
  'w-full overflow-hidden rounded-full border border-border bg-secondary',
  {
    variants: {
      variant: {
        default: 'bg-secondary',
        primary: 'bg-primary',
        success: 'bg-[#10b981]',
        warning: 'bg-[#f59e0b]',
        destructive: 'bg-[#ef4444]',
        info: 'bg-[#3b82f6]',
      },
      size: {
        default: 'h-2',
        sm: 'h-1',
        lg: 'h-3',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number
}

function Progress({
  className,
  variant,
  size,
  value = 0,
  ...props
}: ProgressProps) {
  return (
    <div
      className={cn(progressVariants({ variant, size, className }))}
      {...props}
    >
      <motion.div
        className="h-full"
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
    </div>
  )
}

export { Progress, progressVariants }
