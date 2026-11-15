import { afterEach, describe, expect, it, vi } from 'vitest'
import { downloadBlob, downloadJson } from './download'

function stubDocument() {
  const click = vi.fn()
  const remove = vi.fn()
  const anchor = {
    href: '',
    download: '',
    rel: '',
    click,
    remove,
  }
  const appendChild = vi.fn((node: unknown) => node)
  const createElement = vi.fn(() => anchor)

  vi.stubGlobal('document', {
    createElement,
    body: { appendChild },
  })

  return { anchor, click, remove, appendChild, createElement }
}

describe('downloadBlob', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('creates an object URL, clicks an anchor, and revokes the URL', () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const { anchor, click, remove, appendChild, createElement } = stubDocument()

    const blob = new Blob(['a,b\n1,2'], { type: 'text/csv' })
    downloadBlob(blob, 'ranking.csv')

    expect(createObjectURL).toHaveBeenCalledWith(blob)
    expect(createElement).toHaveBeenCalledWith('a')
    expect(anchor.href).toBe('blob:mock-url')
    expect(anchor.download).toBe('ranking.csv')
    expect(appendChild).toHaveBeenCalledWith(anchor)
    expect(click).toHaveBeenCalled()
    expect(remove).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})

describe('downloadJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('stringifies data and downloads as application/json', () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:json-url')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    const { anchor } = stubDocument()

    downloadJson({ count: 1, items: [] }, 'ranking.json')

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    const blobArg = vi.mocked(createObjectURL).mock.calls[0][0]
    expect(blobArg).toBeInstanceOf(Blob)
    expect(blobArg.type).toBe('application/json')
    expect(anchor.download).toBe('ranking.json')
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:json-url')
  })
})
