import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createHologramScene } from '../createHologramScene'
import { createCameraRig } from '../scene/cameraRig'
import { createEnvironment } from '../scene/environment'
import { createRenderPipeline } from '../scene/renderPipeline'
import { loadObjModel } from '../shared/loadObjModel'

vi.mock('../scene/cameraRig')
vi.mock('../scene/renderPipeline')
vi.mock('../scene/environment')
vi.mock('../shared/loadObjModel')

const update = vi.fn()
const removeListener = vi.fn()
const disposeControls = vi.fn()
const disposePipeline = vi.fn()
const disconnect = vi.fn()
const environment = new THREE.Scene()
let resolveModel: (model: THREE.Group) => void
let rejectModel: (reason: Error) => void

beforeEach(() => {
  vi.clearAllMocks()
  environment.clear()
  vi.mocked(createEnvironment).mockReturnValue(environment)
  vi.mocked(createCameraRig).mockReturnValue({
    camera: new THREE.PerspectiveCamera(),
    controls: {
      update,
      addEventListener: vi.fn(),
      removeEventListener: removeListener,
    } as unknown as ReturnType<typeof createCameraRig>['controls'],
    resize: vi.fn(),
    dispose: disposeControls,
  })
  vi.mocked(createRenderPipeline).mockReturnValue({
    render: vi.fn(),
    resize: vi.fn(),
    dispose: disposePipeline,
  })
  vi.mocked(loadObjModel).mockReturnValue(
    new Promise((resolve, reject) => {
      resolveModel = resolve
      rejectModel = reject
    }),
  )
  vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe = vi.fn()
      disconnect = disconnect
    },
  )
})

afterEach(() => vi.unstubAllGlobals())

function sourceModel() {
  const model = new THREE.Group()
  const geometry = new THREE.BoxGeometry(1, 2, 1)
  model.add(new THREE.Mesh(geometry, new THREE.MeshBasicMaterial()))
  return { model, disposed: vi.spyOn(geometry, 'dispose') }
}

describe('scene lifetime', () => {
  it('transfers the loaded model into independent scene resources and tears down once', async () => {
    const source = sourceModel()
    const controller = createHologramScene(document.createElement('canvas'), '/thinker.obj')
    resolveModel(source.model)
    expect(await controller.ready).toBe(true)
    expect(source.disposed).toHaveBeenCalledTimes(1)
    expect(environment.children).toHaveLength(1)
    const sceneGeometries: ReturnType<typeof vi.spyOn>[] = []
    environment.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
        sceneGeometries.push(vi.spyOn(object.geometry, 'dispose'))
      }
    })

    controller.dispose()
    controller.dispose()

    expect(sceneGeometries.length).toBeGreaterThan(0)
    sceneGeometries.forEach((dispose) => expect(dispose).toHaveBeenCalledTimes(1))
    expect(disposeControls).toHaveBeenCalledTimes(1)
    expect(disposePipeline).toHaveBeenCalledTimes(1)
    expect(removeListener).toHaveBeenCalledTimes(1)
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1)
  })

  it('aborts loading and releases a late result without attaching it to a disposed scene', async () => {
    const source = sourceModel()
    const controller = createHologramScene(document.createElement('canvas'), '/thinker.obj')
    const signal = vi.mocked(loadObjModel).mock.calls[0]![1]
    controller.dispose()
    expect(signal.aborted).toBe(true)
    resolveModel(source.model)

    expect(await controller.ready).toBe(false)
    expect(source.disposed).toHaveBeenCalledTimes(1)
    expect(environment.children).toHaveLength(0)
  })

  it('propagates loading failures to the presentation layer', async () => {
    const controller = createHologramScene(document.createElement('canvas'), '/thinker.obj')
    rejectModel(new Error('Network unavailable'))
    await expect(controller.ready).rejects.toThrow('Network unavailable')
    controller.dispose()
  })

  it('releases the camera controls when renderer initialization fails', () => {
    vi.mocked(createRenderPipeline).mockImplementationOnce(() => {
      throw new Error('WebGL unavailable')
    })
    expect(() => createHologramScene(document.createElement('canvas'), '/thinker.obj')).toThrow(
      'WebGL unavailable',
    )
    expect(disposeControls).toHaveBeenCalledTimes(1)
    expect(loadObjModel).not.toHaveBeenCalled()
  })
})
