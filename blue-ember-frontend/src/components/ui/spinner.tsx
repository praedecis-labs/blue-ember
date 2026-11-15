import * as React from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'default' | 'lg'
}

function Spinner({ className, size = 'default', ...props }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    default: 'w-6 h-6',
    lg: 'w-8 h-8',
  }

  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'w-full h-full border-2 border-current border-t-transparent rounded-full animate-[spin_1s_linear_infinite]',
          sizes[size]
        )}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
}

export { Spinner }
