import type { EnvironmentDto } from '@/services/contracts'
import type { PanelId, QueryState } from '../../types'
import { ConditionsPanel } from './conditions-panel'
import { EvidencePanel } from './evidence-panel'
import { GapsPanel } from './gaps-panel'
import { InvestigationsPanel } from './investigations-panel'
import { SourcesPanel } from './sources-panel'
import type { AiMsg } from './types'

type Props = {
  msg: AiMsg
  openPanel: PanelId | null
  onApplyConditions: (q: QueryState) => void
  environments?: EnvironmentDto[] | null
}

export function DetailPanels({
  msg,
  openPanel,
  onApplyConditions,
  environments = null,
}: Props) {
  if (!openPanel) return null
  if (openPanel === 'cond')
    return (
      <ConditionsPanel
        msg={msg}
        onApply={onApplyConditions}
        environments={environments}
      />
    )
  if (openPanel === 'inv') return <InvestigationsPanel msg={msg} />
  if (openPanel === 'ev') return <EvidencePanel msg={msg} />
  if (openPanel === 'gaps') return <GapsPanel msg={msg} />
  return <SourcesPanel msg={msg} />
}

export type { AiMsg }
