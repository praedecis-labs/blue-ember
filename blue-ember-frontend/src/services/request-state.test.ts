import { describe, expect, it } from 'vitest'
import { ApiError } from './http'
import { messageFromUnknown } from './request-state'

describe('messageFromUnknown', () => {
  it('prefers ErrorResponse.error from ApiError', () => {
    expect(
      messageFromUnknown(new ApiError(400, { error: 'Invalid environment.' })),
    ).toBe('Invalid environment.')
  })

  it('appends missing fields from ErrorResponse', () => {
    expect(
      messageFromUnknown(
        new ApiError(400, {
          error: 'Invalid query.',
          missing: ['profile', 'environment'],
        }),
      ),
    ).toBe('Invalid query. (missing: profile, environment)')
  })

  it('falls back for generic Error', () => {
    expect(messageFromUnknown(new Error('boom'))).toBe('boom')
  })
})

