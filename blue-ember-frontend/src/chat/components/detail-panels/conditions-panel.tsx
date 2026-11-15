import { useEffect, useMemo, useRef, type FormEvent } from 'react'
import type { EnvironmentDto } from '@/services/contracts'
import { ENV_IDS } from '../../adapters'
import {
  DIR,
  GAS,
  GOAL,
  GRAV,
  MAT,
  THICK,
} from '../../data'
import {
  buildQueryDefaults,
  environmentLabel,
  findEnvironmentDto,
} from '../../env-defaults'
import { fmt, kpa } from '../../engine'
import type { EnvId, QueryState } from '../../types'
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
      const dto = findEnvironmentDto(env, environments)
      return {
        env,
        label: dto?.label ?? environmentLabel(env, environments),
        psi: defaults.psi,
        o2: defaults.o2,
        flow: defaults.flow,
      }
    })
  }
  return [
    { env: 'iss', label: 'ISS', psi: 14.7, o2: 21, flow: 10 },
    { env: 'lua', label: 'Habitat lunar', psi: 8.2, o2: 34, flow: 10 },
    { env: 'lua', label: 'Habitat lunar', psi: 10.2, o2: 26.5, flow: 10 },
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
    [null, GRAV[q.env][0] + (GRAV[q.env][1] ? ' (estimado)' : '')],
    ['material', MAT[q.material]],
    ['o2', `${fmt(q.o2)}% O₂`],
    ['psi', `${fmt(q.psi)} psi · ${fmt(kpa(q.psi), 0)} kPa`],
    ['flow', q.flow === 0 ? 'ar parado' : `${fmt(q.flow)} cm/s`],
  ]
  if (q.thick) items.push([null, THICK[q.thick]])
  if (q.dir) items.push([null, DIR[q.dir]])
  if (q.gas) items.push([null, GAS[q.gas]])
  items.push([null, `objetivo: ${GOAL[q.goal]}`])

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
      err.textContent = 'Oxigênio entre 15% e 100%.'
      err.hidden = false
      return
    }
    if (!psi || psi < 3 || psi > 15) {
      err.textContent = 'Pressão entre 3 e 15 psi.'
      err.hidden = false
      return
    }
    if (flowRaw === '' || flow < 0 || flow > 100) {
      err.textContent = 'Fluxo entre 0 e 100 cm/s.'
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
      <b>Condições usadas</b>
      <div className="cond-list">
        {items.map(([k, t], i) => (
          <span
            key={`${t}-${i}`}
            className={k && missing.includes(k) ? 'missing' : undefined}
          >
            {t}
          </span>
        ))}
      </div>
      {missing.length ? (
        <span className="hint">
          Em amarelo: não estava no texto; usei o valor padrão.
        </span>
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
          Ajustar condições
        </summary>
        <form
          className="grid cond-form"
          style={{ marginTop: 10 }}
          ref={formRef}
          onSubmit={onSubmit}
          noValidate
        >
          <div className="lbl full">
            Atmosfera de referência (NASA)
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
            Ambiente
            <select name="env" defaultValue={q.env}>
              {ENV_IDS.map((env) => (
                <option key={env} value={env}>
                  {environmentLabel(env, environments)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Material
            <select name="material" defaultValue={q.material}>
              <option value="tecido">Tecido</option>
              <option value="plastico">Plástico (acrílico)</option>
              <option value="liquido">Combustível líquido</option>
            </select>
          </label>
          <label>
            Oxigênio (%)
            <input name="o2" type="number" min={15} max={100} step={0.5} defaultValue={q.o2} />
          </label>
          <label>
            Pressão (psi)
            <input name="psi" type="number" min={3} max={15} step={0.1} defaultValue={q.psi} />
          </label>
          <label>
            Fluxo de ar (cm/s)
            <input name="flow" type="number" min={0} max={100} step={1} defaultValue={q.flow} />
          </label>
          <label>
            Objetivo
            <select name="goal" defaultValue={q.goal}>
              <option value="prevenir">Prevenir</option>
              <option value="detectar">Detectar cedo</option>
              <option value="apagar">Apagar</option>
            </select>
          </label>
          <label>
            Espessura
            <select name="thick" defaultValue={q.thick}>
              <option value="">Não sei</option>
              <option value="fina">Fina</option>
              <option value="grossa">Grossa</option>
            </select>
          </label>
          <label>
            Direção do ar
            <select name="dir" defaultValue={q.dir}>
              <option value="">Não sei</option>
              <option value="favor">A favor da chama</option>
              <option value="contra">Contra a chama</option>
            </select>
          </label>
          <label>
            Gás para apagar
            <select name="gas" defaultValue={q.gas}>
              <option value="">Nenhum</option>
              <option value="co2">CO₂</option>
              <option value="he">Hélio</option>
              <option value="n2">Nitrogênio</option>
            </select>
          </label>
          <div className="full row">
            <button type="submit">Refazer a análise</button>
            <span className="error" ref={errRef} hidden />
          </div>
        </form>
      </details>
    </div>
  )
}
