import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadPersisted, savePersisted } from './storage'

const STATE_KEY = 'blueEmberChat'

function stubLocalStorage() {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
  })
  return store
}

describe('storage canonical persistence', () => {
  let store: Map<string, string>

  beforeEach(() => {
    store = stubLocalStorage()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('saves profile and environment as API canonical ids', () => {
    savePersisted({
      profile: 'eng',
      environment: 'lua',
      history: [],
    })
    const raw = JSON.parse(store.get(STATE_KEY)!) as Record<string, unknown>
    expect(raw.profile).toBe('ShipEngineer')
    expect(raw.environment).toBe('Moon')
  })

  it('loads canonical API ids into UI ids', () => {
    store.set(
      STATE_KEY,
      JSON.stringify({
        profile: 'ShipEngineer',
        environment: 'Moon',
        history: [],
      }),
    )
    expect(loadPersisted()).toEqual({
      profile: 'eng',
      environment: 'lua',
      history: [],
    })
  })

  it('migrates legacy UI profile ids and defaults environment to lua', () => {
    store.set(STATE_KEY, JSON.stringify({ profile: 'pesq', history: [] }))
    expect(loadPersisted()).toEqual({
      profile: 'pesq',
      environment: 'lua',
      history: [],
    })
  })

  it('returns null profile and default environment when empty', () => {
    expect(loadPersisted()).toEqual({
      profile: null,
      environment: 'lua',
      history: [],
    })
  })

  it('round-trips history topIds', () => {
    savePersisted({
      profile: 'eng',
      environment: 'lua',
      history: [
        {
          id: 'h1',
          when: '15/11, 03:00',
          text: 'Tecido seguro na Lua?',
          claim: 'safe',
          q: {
            env: 'lua',
            material: 'tecido',
            o2: 34,
            psi: 8.2,
            flow: 10,
            thick: 'fina',
            dir: '',
            gas: '',
            goal: 'prevenir',
          },
          level: ['moderate', 'Evidência moderada'],
          top: 'Saffire-I',
          topIds: ['inv-1', 'inv-2'],
        },
      ],
    })
    const loaded = loadPersisted()
    expect(loaded.history).toHaveLength(1)
    expect(loaded.history[0].top).toBe('Saffire-I')
    expect(loaded.history[0].topIds).toEqual(['inv-1', 'inv-2'])
  })

  it('migrates legacy history items without topIds to empty array', () => {
    store.set(
      STATE_KEY,
      JSON.stringify({
        profile: 'ShipEngineer',
        environment: 'Moon',
        history: [
          {
            id: 'legacy',
            when: '14/11, 12:00',
            text: 'Acrílico em Marte',
            claim: 'risky',
            q: {
              env: 'marte',
              material: 'plastico',
              o2: 26.5,
              psi: 10.2,
              flow: 5,
              thick: 'grossa',
              dir: 'favor',
              gas: '',
              goal: 'prevenir',
            },
            level: ['weak', 'Evidência fraca'],
            top: 'BASS',
          },
        ],
      }),
    )
    const loaded = loadPersisted()
    expect(loaded.history).toHaveLength(1)
    expect(loaded.history[0].topIds).toEqual([])
  })
})
