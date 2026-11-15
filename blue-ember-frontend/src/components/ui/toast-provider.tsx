'use client'

import * as React from 'react'
import { useToast } from '@/hooks/use-toast'
import { Toaster } from '@/components/ui/toast'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  useToast()
  return <>{children}<Toaster /></>
}
