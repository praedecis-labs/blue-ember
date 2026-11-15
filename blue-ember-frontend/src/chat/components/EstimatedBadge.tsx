import { useT } from '@/i18n'

/** Selo "Estimado": as faixas de O₂/pressão por investigação ainda não foram
 *  conferidas com as tabelas do PSI (ver TODO do backend). */
export function EstimatedBadge() {
  const t = useT()
  return (
    <span className="estimated-badge" title={t('estimated.tip')} aria-label={t('estimated.tip')}>
      {t('estimated.badge')}
    </span>
  )
}
