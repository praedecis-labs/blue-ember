import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, buildQuery, requestJson } from './http'

describe('buildQuery', () => {
  it('returns empty string when params missing or empty', () => {
    expect(buildQuery()).toBe('')
    expect(buildQuery({})).toBe('')
  })

  it('omits null and undefined and serializes values', () => {
    expect(
      buildQuery({
        profile: 'ShipEngineer',
        environment: 'Moon',
        featured: true,
        w1: 0.2,
        category: undefined,
        skip: null,
      }),
    ).toBe('?profile=ShipEngineer&environment=Moon&featured=true&w1=0.2')
  })
})

describe('requestJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('returns parsed JSON on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok', service: 'BlueEmber.Api' }),
      }),
    )

    const data = await requestJson<{ status: string }>('/api/health')
    expect(data.status).toBe('ok')
    expect(fetch).toHaveBeenCalledWith('/api/health', undefined)
  })

  it('throws ApiError with ErrorResponse body on 400', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid profile.', missing: ['profile'] }),
      }),
    )

    const err = await requestJson('/api/ranking').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    const apiErr = err as ApiError
    expect(apiErr.status).toBe(400)
    expect(apiErr.body).toEqual({ error: 'Invalid profile.', missing: ['profile'] })
    expect(apiErr.message).toBe('Invalid profile.')
  })
})
