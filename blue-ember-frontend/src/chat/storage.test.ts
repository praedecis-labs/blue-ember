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
})
