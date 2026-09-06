// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadObjModel } from '../shared/loadObjModel'
import { disposeObject } from '../shared/disposeObject'

const triangle = 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3'
afterEach(() => vi.unstubAllGlobals())

describe('OBJ loading', () => {
  it('fetches and parses a model with the caller’s cancellation signal', async () => {
    const fetchModel = vi.fn().mockResolvedValue(new Response(triangle))
    vi.stubGlobal('fetch', fetchModel)
    const controller = new AbortController()
    const model = await loadObjModel('/thinker.obj', controller.signal)
    try {
      expect(fetchModel).toHaveBeenCalledWith('/thinker.obj', { signal: controller.signal })
      expect(model.children).toHaveLength(1)
      expect(model.children[0]?.type).toBe('Mesh')
    } finally {
      disposeObject(model)
    }
  })

  it('reports HTTP errors instead of parsing an error response as geometry', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('missing', { status: 404 })))
    await expect(loadObjModel('/missing.obj', new AbortController().signal)).rejects.toThrow('404')
  })

  it('does not parse a response after cancellation', async () => {
    const controller = new AbortController()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => {
        controller.abort()
        return new Response(triangle)
      }),
    )
    await expect(loadObjModel('/thinker.obj', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    })
  })
})
