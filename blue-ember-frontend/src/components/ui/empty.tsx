import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'

import { cn } from '@/lib/utils'

interface EmptyProps extends HTMLMotionProps<'div'> {
  title?: string
  description?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
}

function Empty({
  className,
  title,
  description,
  action,
  icon,
  ...props
}: EmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
      {...props}
    >
      {icon && (
        <div className="mb-4 opacity-50">{icon}</div>
      )}
      {title && (
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {title}
        </h3>
      )}
      {description && (
        <p className="mb-6 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </motion.div>
  )
}

export { Empty }
