import { describe, expect, it } from 'vitest'
import {
  fromApiEnvironment,
  fromApiProfile,
  toApiEnvironment,
  toApiProfile,
} from './adapters'

describe('adapters', () => {
  it('maps UI profiles to API ids', () => {
    expect(toApiProfile('eng')).toBe('ShipEngineer')
    expect(toApiProfile('pesq')).toBe('Researcher')
    expect(toApiProfile('est')).toBe('Student')
  })

  it('maps API profiles back to UI ids', () => {
    expect(fromApiProfile('ShipEngineer')).toBe('eng')
    expect(fromApiProfile('eng')).toBe('eng')
    expect(fromApiProfile('nope')).toBeNull()
  })

  it('maps environments both ways', () => {
    expect(toApiEnvironment('lua')).toBe('Moon')
    expect(fromApiEnvironment('Mars')).toBe('marte')
    expect(fromApiEnvironment('iss')).toBe('iss')
  })
})
