import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function PanelShell({
  title,
  variant = 'default',
  headerExtra,
  children,
}: {
  title: ReactNode
  variant?: 'default' | 'gaps'
  headerExtra?: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-xl p-3.5',
        variant === 'gaps' ? 'bg-[var(--gap-bg)]' : 'bg-[var(--bg)]',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <b
          className={cn(
            'text-sm font-semibold',
            variant === 'gaps' && 'text-[var(--gap)]',
          )}
        >
          {title}
        </b>
        {headerExtra}
      </div>
      {children}
    </div>
  )
}

export function PanelSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3 w-full', i === lines - 1 && 'w-[55%]')}
        />
      ))}
    </div>
  )
}

export const fieldClassName =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-[var(--white)] px-2.5 py-1 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

export const labelClassName =
  'flex flex-col gap-1 text-[13px] font-medium text-[var(--sub)]'
