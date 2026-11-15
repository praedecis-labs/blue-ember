import axios from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, buildQuery, requestJson } from './http'

vi.mock('axios', () => ({
  default: {
    request: vi.fn(),
  },
  isAxiosError: (error: unknown) =>
    Boolean(
      error &&
        typeof error === 'object' &&
        'isAxiosError' in error &&
        (error as { isAxiosError?: boolean }).isAxiosError,
    ),
}))

const mockedRequest = vi.mocked(axios.request)

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
    vi.clearAllMocks()
  })

  it('returns parsed JSON on success', async () => {
    mockedRequest.mockResolvedValue({
      data: { status: 'ok', service: 'BlueEmber.Api' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })

    const data = await requestJson<{ status: string }>('/api/health')
    expect(data.status).toBe('ok')
    expect(mockedRequest).toHaveBeenCalledWith({
      url: '/api/health',
    })
  })

  it('throws ApiError with ErrorResponse body on 400', async () => {
    const axiosError = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { error: 'Invalid profile.', missing: ['profile'] },
      },
    }
    mockedRequest.mockRejectedValue(axiosError)

    const err = await requestJson('/api/ranking').catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    const apiErr = err as ApiError
    expect(apiErr.status).toBe(400)
    expect(apiErr.body).toEqual({ error: 'Invalid profile.', missing: ['profile'] })
    expect(apiErr.message).toBe('Invalid profile.')
  })
})
