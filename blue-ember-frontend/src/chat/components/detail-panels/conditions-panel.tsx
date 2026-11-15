import { useEffect, useMemo, useRef, type FormEvent } from 'react'
import { useT } from '@/i18n'
import type { EnvironmentDto } from '@/services/shared/contracts'
import { ENV_IDS } from '../../domain/adapters'
import { GRAV } from '../../domain/data'
import {
  buildQueryDefaults,
  environmentLabel,
} from '../../domain/env-defaults'
import { fmt, kpa } from '../../domain/engine'
import type { EnvId, QueryState } from '../../domain/types'
import type { AiMsg } from './types'

type AtmChip = {
  env: EnvId
  label: string
  psi: number
  o2: number
  flow: number
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
  return [
    { env: 'iss', label: 'ISS', psi: 14.7, o2: 21, flow: 10 },
    { env: 'lua', label: 'Lunar habitat', psi: 8.2, o2: 34, flow: 10 },
    { env: 'lua', label: 'Lunar habitat', psi: 10.2, o2: 26.5, flow: 10 },
  ]
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
  const errRef = useRef<HTMLSpanElement>(null)
  const chips = useMemo(() => buildAtmChips(environments), [environments])

  useEffect(() => {
    const f = formRef.current
    if (!f) return
    ;(Object.keys(q) as Array<keyof QueryState>).forEach((k) => {
      const el = f.elements.namedItem(k) as HTMLInputElement | HTMLSelectElement | null
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
  items.push([
    null,
    t('goal.label', { goal: t(`goal.${q.goal}`) }),
  ])

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

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const f = formRef.current
    const err = errRef.current
    if (!f || !err) return
    const o2 = Number((f.elements.namedItem('o2') as HTMLInputElement).value)
    const psi = Number((f.elements.namedItem('psi') as HTMLInputElement).value)
    const flowRaw = (f.elements.namedItem('flow') as HTMLInputElement).value
    const flow = Number(flowRaw)
    if (!o2 || o2 < 15 || o2 > 100) {
      err.textContent = t('panels.errO2')
      err.hidden = false
      return
    }
    if (!psi || psi < 3 || psi > 15) {
      err.textContent = t('panels.errPsi')
      err.hidden = false
      return
    }
    if (flowRaw === '' || flow < 0 || flow > 100) {
      err.textContent = t('panels.errFlow')
      err.hidden = false
      return
    }
    err.hidden = true
    onApply({
      env: (f.elements.namedItem('env') as HTMLSelectElement).value as QueryState['env'],
      material: (f.elements.namedItem('material') as HTMLSelectElement)
        .value as QueryState['material'],
      o2,
      psi,
      flow,
      thick: (f.elements.namedItem('thick') as HTMLSelectElement)
        .value as QueryState['thick'],
      dir: (f.elements.namedItem('dir') as HTMLSelectElement).value as QueryState['dir'],
      gas: (f.elements.namedItem('gas') as HTMLSelectElement).value as QueryState['gas'],
      goal: (f.elements.namedItem('goal') as HTMLSelectElement)
        .value as QueryState['goal'],
    })
  }

  return (
    <div className="panel">
      <b>{t('panels.conditionsTitle')}</b>
      <div className="cond-list">
        {items.map(([k, label], i) => (
          <span
            key={`${label}-${i}`}
            className={k && missing.includes(k) ? 'missing' : undefined}
          >
            {label}
          </span>
        ))}
      </div>
      {missing.length ? (
        <span className="hint">{t('panels.missingHint')}</span>
      ) : null}
      <details>
        <summary
          className="ghost"
          style={{
            cursor: 'pointer',
            color: 'var(--blue)',
            fontWeight: 500,
            fontSize: 14,
            listStyle: 'none',
          }}
        >
          {t('panels.adjustConditions')}
        </summary>
        <form
          className="grid cond-form"
          style={{ marginTop: 10 }}
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
        >
          <div className="lbl full">
            {t('panels.atmRef')}
            <div className="chips">
              {chips.map((chip) => (
                <button
                  key={`${chip.env}-${chip.o2}-${chip.psi}`}
                  type="button"
                  className="chip atm"
                  onClick={() => setAtm(chip)}
                >
                  {chip.label} · {fmt(chip.psi, 1)} psi · {fmt(chip.o2)}%
                </button>
              ))}
            </div>
          </div>
          <label>
            {t('panels.labelEnv')}
            <select name="env" defaultValue={q.env}>
              {ENV_IDS.map((env) => (
                <option key={env} value={env}>
                  {environmentLabel(env, environments)}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('panels.labelMaterial')}
            <select name="material" defaultValue={q.material}>
              <option value="tecido">{t('panels.matFabric')}</option>
              <option value="plastico">{t('panels.matPlastic')}</option>
              <option value="liquido">{t('panels.matLiquid')}</option>
            </select>
          </label>
          <label>
            {t('panels.labelO2')}
            <input name="o2" type="number" min={15} max={100} step={0.5} defaultValue={q.o2} />
          </label>
          <label>
            {t('panels.labelPsi')}
            <input name="psi" type="number" min={3} max={15} step={0.1} defaultValue={q.psi} />
          </label>
          <label>
            {t('panels.labelFlow')}
            <input name="flow" type="number" min={0} max={100} step={1} defaultValue={q.flow} />
          </label>
          <label>
            {t('panels.labelGoal')}
            <select name="goal" defaultValue={q.goal}>
              <option value="prevenir">{t('panels.goalPrevent')}</option>
              <option value="detectar">{t('panels.goalDetect')}</option>
              <option value="apagar">{t('panels.goalExtinguish')}</option>
            </select>
          </label>
          <label>
            {t('panels.labelThick')}
            <select name="thick" defaultValue={q.thick}>
              <option value="">{t('panels.unknownOpt')}</option>
              <option value="fina">{t('panels.thickThin')}</option>
              <option value="grossa">{t('panels.thickThick')}</option>
            </select>
          </label>
          <label>
            {t('panels.labelDir')}
            <select name="dir" defaultValue={q.dir}>
              <option value="">{t('panels.unknownOpt')}</option>
              <option value="favor">{t('panels.dirFavor')}</option>
              <option value="contra">{t('panels.dirContra')}</option>
            </select>
          </label>
          <label>
            {t('panels.labelGas')}
            <select name="gas" defaultValue={q.gas}>
              <option value="">{t('panels.noneOpt')}</option>
              <option value="co2">CO₂</option>
              <option value="he">{t('gas.he')}</option>
              <option value="n2">{t('gas.n2')}</option>
            </select>
          </label>
          <div className="full row">
            <button type="submit">{t('panels.rerun')}</button>
            <span className="error" ref={errRef} hidden />
          </div>
        </form>
      </details>
    </div>
  )
}
