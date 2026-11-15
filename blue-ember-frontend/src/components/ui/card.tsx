import * as React from 'react'
import { motion, type HTMLMotionProps } from 'framer-motion'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const cardVariants = cva(
  'rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-ring/50',
  {
    variants: {
      variant: {
        default: 'bg-card border-border',
        elevated:
          'bg-card border-border shadow-md hover:shadow-lg hover:border-ring/50',
        outline: 'border-border bg-background hover:bg-muted',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

type CardProps = HTMLMotionProps<'div'> & VariantProps<typeof cardVariants>

function Card({ className, variant, children, ...props }: CardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(cardVariants({ variant, className }))}
      {...props}
    >
      {children}
    </motion.div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <h3
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  )
}

interface CardDescriptionProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}
function CardDescription({
  className,
  ...props
}: CardDescriptionProps) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}
function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props} />
  )
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      className={cn('mt-6 p-6 pt-0 border-t border-border/50', className)}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
}
