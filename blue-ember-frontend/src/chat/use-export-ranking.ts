import { useCallback, useState } from 'react'
import type { ApiEnvironmentId, ApiProfileId } from '@/services/contracts'
import { exportRanking } from '@/services/export'
import { messageFromUnknown } from '@/services/request-state'
import { toast } from '@/hooks/use-toast'
import { downloadBlob, downloadJson } from './download'

export type UseExportRankingOptions = {
  profile: ApiProfileId | string | null
  environment: ApiEnvironmentId | string | null
  category?: string | null
}

export function useExportRanking({
  profile,
  environment,
  category = null,
}: UseExportRankingOptions) {
  const [busy, setBusy] = useState(false)
  const canExport = Boolean(profile && environment) && !busy

  const runExport = useCallback(
    async (format: 'csv' | 'json') => {
      if (!profile || !environment) return
      setBusy(true)
      try {
        const params = {
          format,
          profile,
          environment,
          ...(category ? { category } : {}),
        }
        const filename = `blue-ember-ranking-${environment}-${profile}.${format}`
        const result = await exportRanking(params)
        if (format === 'csv') {
          downloadBlob(result as Blob, filename)
        } else {
          downloadJson(result, filename)
        }
        toast({
          title: format === 'csv' ? 'CSV baixado' : 'JSON baixado',
          description: filename,
        })
      } catch (err) {
        toast({
          title: 'Falha no export',
          description: messageFromUnknown(err),
          variant: 'destructive',
        })
      } finally {
        setBusy(false)
      }
    },
    [profile, environment, category],
  )

  return {
    busy,
    canExport,
    exportCsv: () => runExport('csv'),
    exportJson: () => runExport('json'),
  }
}
