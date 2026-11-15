import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'border-input bg-background hover:bg-muted hover:text-foreground',
        success:
          'border-transparent bg-[#10b981]/20 text-[#10b981] dark:bg-[#10b981]/40 dark:text-[#34d399]',
        warning:
          'border-transparent bg-[#f59e0b]/20 text-[#f59e0b] dark:bg-[#f59e0b]/40 dark:text-[#fbbf24]',
        info:
          'border-transparent bg-[#3b82f6]/20 text-[#3b82f6] dark:bg-[#3b82f6]/40 dark:text-[#60a5fa]',
        critical:
          'border-transparent bg-[#ef4444]/20 text-[#ef4444] dark:bg-[#ef4444]/40 dark:text-[#f87171]',
      },
      size: {
        default: 'h-8 px-2.5 py-0.5 text-xs',
        sm: 'h-6 px-2 py-0.5 text-xs',
        lg: 'h-10 px-3 py-0.5 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
