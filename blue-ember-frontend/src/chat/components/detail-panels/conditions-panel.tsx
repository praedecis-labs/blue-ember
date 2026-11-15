import { useEffect, useMemo, useRef, useState, type SubmitEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useT } from '@/i18n'
import { cn } from '@/lib/utils'
import type { EnvironmentDto } from '@/services/shared/contracts'
import { ENV_IDS } from '../../domain/adapters'
import { GRAV } from '../../domain/data'
import {
  buildQueryDefaults,
  environmentLabel,
} from '../../domain/env-defaults'
import { fmt, kpa } from '../../domain/engine'
import type { EnvId, QueryState } from '../../domain/types'
import {
  fieldClassName,
  labelClassName,
  PanelShell,
} from './panel-shell'
import type { AiMsg } from './types'

type AtmChip = {
  env: EnvId
  label: string
  psi: number
  o2: number
  flow: number
}

function fallbackAtmChips(): AtmChip[] {
  return [
    { env: 'iss', label: 'ISS', psi: 14.7, o2: 21, flow: 10 },
    { env: 'lua', label: 'Lunar habitat', psi: 8.2, o2: 34, flow: 10 },
    { env: 'lua', label: 'Lunar habitat', psi: 10.2, o2: 26.5, flow: 10 },
  ]
}

function buildAtmChips(
  environments?: EnvironmentDto[] | null,
): AtmChip[] {
  if (environments?.length) {
    return ENV_IDS.map((env) => {
      const defaults = buildQueryDefaults(env, environments)
      return {
        env,
        label: environmentLabel(env, environments),
        psi: defaults.psi,
        o2: defaults.o2,
        flow: defaults.flow,
      }
    })
  }
  return fallbackAtmChips()
}

export function ConditionsPanel({
  msg,
  onApply,
  environments = null,
}: {
  msg: AiMsg
  onApply: (q: QueryState) => void
  environments?: EnvironmentDto[] | null
}) {
  const t = useT()
  const { q, missing } = msg
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const chips = useMemo(() => buildAtmChips(environments), [environments])

  useEffect(() => {
    const f = formRef.current
    if (!f) return
    ;(Object.keys(q) as Array<keyof QueryState>).forEach((k) => {
      const el = f.elements.namedItem(k) as
        | HTMLInputElement
        | HTMLSelectElement
        | null
      if (el) el.value = String(q[k])
    })
  }, [q])

  const envLabel = environmentLabel(q.env, environments)
  const items: Array<[string | null, string]> = [
    ['env', envLabel],
    [
      null,
      t(`grav.${q.env}`) + (GRAV[q.env][1] ? ` ${t('panels.estimated')}` : ''),
    ],
    ['material', t(`material.${q.material}`)],
    ['o2', `${fmt(q.o2)}% O₂`],
    ['psi', `${fmt(q.psi)} psi · ${fmt(kpa(q.psi), 0)} kPa`],
    [
      'flow',
      q.flow === 0 ? t('cond.stillAir') : `${fmt(q.flow)} cm/s`,
    ],
  ]
  if (q.thick) items.push([null, t(`thick.${q.thick}`)])
  if (q.dir) items.push([null, t(`dir.${q.dir}`)])
  if (q.gas) items.push([null, t(`gas.${q.gas}`)])
  items.push([null, t('goal.label', { goal: t(`goal.${q.goal}`) })])

  function setAtm(chip: AtmChip) {
    const f = formRef.current
    if (!f) return
    ;(f.elements.namedItem('env') as HTMLSelectElement).value = chip.env
    ;(f.elements.namedItem('psi') as HTMLInputElement).value = String(
      Number(chip.psi.toFixed(1)),
    )
    ;(f.elements.namedItem('o2') as HTMLInputElement).value = String(chip.o2)
    const flowEl = f.elements.namedItem('flow') as HTMLInputElement | null
    if (flowEl) flowEl.value = String(chip.flow)
  }

  function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = formRef.current
    if (!f) return
    const o2 = Number((f.elements.namedItem('o2') as HTMLInputElement).value)
    const psi = Number((f.elements.namedItem('psi') as HTMLInputElement).value)
    const flowRaw = (f.elements.namedItem('flow') as HTMLInputElement).value
    const flow = Number(flowRaw)
    const invalidO2 = !o2 || o2 < 15 || o2 > 100
    const invalidPsi = !psi || psi < 3 || psi > 15
    const invalidFlow = flowRaw === '' || flow < 0 || flow > 100

    if (invalidO2) {
      setError(t('panels.errO2'))
      return
    }
    if (invalidPsi) {
      setError(t('panels.errPsi'))
      return
    }
    if (invalidFlow) {
      setError(t('panels.errFlow'))
      return
    }
    setError(null)
    onApply({
      env: (f.elements.namedItem('env') as HTMLSelectElement)
        .value as QueryState['env'],
      material: (f.elements.namedItem('material') as HTMLSelectElement)
        .value as QueryState['material'],
      o2,
      psi,
      flow,
      thick: (f.elements.namedItem('thick') as HTMLSelectElement)
        .value as QueryState['thick'],
      dir: (f.elements.namedItem('dir') as HTMLSelectElement)
        .value as QueryState['dir'],
      gas: (f.elements.namedItem('gas') as HTMLSelectElement)
        .value as QueryState['gas'],
      goal: (f.elements.namedItem('goal') as HTMLSelectElement)
        .value as QueryState['goal'],
    })
  }

  return (
    <PanelShell title={t('panels.conditionsTitle')}>
      <div className="flex flex-wrap gap-1.5">
        {items.map(([k, label], i) => (
          <Badge
            key={`${label}-${i}`}
            variant="secondary"
            size="sm"
            className={cn(
              'h-auto font-medium text-[var(--sub)]',
              k &&
                missing.includes(k) &&
                '!bg-[var(--miss)] !text-[#6B6E00]',
            )}
          >
            {label}
          </Badge>
        ))}
      </div>
      {missing.length ? (
        <span className="text-xs text-muted-foreground">
          {t('panels.missingHint')}
        </span>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-fit px-0 text-[var(--blue)] hover:bg-transparent hover:underline"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {t('panels.adjustConditions')}
      </Button>

      {open ? (
        <form
          className="mt-1 grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3"
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
        >
          <div className={cn(labelClassName, 'sm:col-span-2 md:col-span-3')}>
            {t('panels.atmRef')}
            <div className="flex flex-wrap gap-1.5">
              {chips.map((chip) => (
                <Button
                  key={`${chip.env}-${chip.o2}-${chip.psi}`}
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full font-medium"
                  onClick={() => setAtm(chip)}
                >
                  {chip.label} · {fmt(chip.psi, 1)} psi · {fmt(chip.o2)}%
                </Button>
              ))}
            </div>
          </div>

          <label className={labelClassName}>
            {t('panels.labelEnv')}
            <select
              name="env"
              defaultValue={q.env}
              className={fieldClassName}
            >
              {ENV_IDS.map((env) => (
                <option key={env} value={env}>
                  {environmentLabel(env, environments)}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClassName}>
            {t('panels.labelMaterial')}
            <select
              name="material"
              defaultValue={q.material}
              className={fieldClassName}
            >
              <option value="tecido">{t('panels.matFabric')}</option>
              <option value="plastico">{t('panels.matPlastic')}</option>
              <option value="liquido">{t('panels.matLiquid')}</option>
            </select>
          </label>
          <label className={labelClassName}>
            {t('panels.labelO2')}
            <Input
              name="o2"
              type="number"
              min={15}
              max={100}
              step={0.5}
              defaultValue={q.o2}
              className="bg-[var(--white)]"
            />
          </label>
          <label className={labelClassName}>
            {t('panels.labelPsi')}
            <Input
              name="psi"
              type="number"
              min={3}
              max={15}
              step={0.1}
              defaultValue={q.psi}
              className="bg-[var(--white)]"
            />
          </label>
          <label className={labelClassName}>
            {t('panels.labelFlow')}
            <Input
              name="flow"
              type="number"
              min={0}
              max={100}
              step={1}
              defaultValue={q.flow}
              className="bg-[var(--white)]"
            />
          </label>
          <label className={labelClassName}>
            {t('panels.labelGoal')}
            <select
              name="goal"
              defaultValue={q.goal}
              className={fieldClassName}
            >
              <option value="prevenir">{t('panels.goalPrevent')}</option>
              <option value="detectar">{t('panels.goalDetect')}</option>
              <option value="apagar">{t('panels.goalExtinguish')}</option>
            </select>
          </label>
          <label className={labelClassName}>
            {t('panels.labelThick')}
            <select
              name="thick"
              defaultValue={q.thick}
              className={fieldClassName}
            >
              <option value="">{t('panels.unknownOpt')}</option>
              <option value="fina">{t('panels.thickThin')}</option>
              <option value="grossa">{t('panels.thickThick')}</option>
            </select>
          </label>
          <label className={labelClassName}>
            {t('panels.labelDir')}
            <select
              name="dir"
              defaultValue={q.dir}
              className={fieldClassName}
            >
              <option value="">{t('panels.unknownOpt')}</option>
              <option value="favor">{t('panels.dirFavor')}</option>
              <option value="contra">{t('panels.dirContra')}</option>
            </select>
          </label>
          <label className={labelClassName}>
            {t('panels.labelGas')}
            <select
              name="gas"
              defaultValue={q.gas}
              className={fieldClassName}
            >
              <option value="">{t('panels.noneOpt')}</option>
              <option value="co2">CO₂</option>
              <option value="he">{t('gas.he')}</option>
              <option value="n2">{t('gas.n2')}</option>
            </select>
          </label>

          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 md:col-span-3">
            <Button
              type="submit"
              className="!bg-[var(--yellow)] !text-[var(--ink)] hover:!bg-[var(--yellow)]/90"
            >
              {t('panels.rerun')}
            </Button>
            {error ? (
              <span className="text-sm text-destructive" role="alert">
                {error}
              </span>
            ) : null}
          </div>
        </form>
      ) : null}
    </PanelShell>
  )
}
