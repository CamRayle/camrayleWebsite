import { createHologram } from './hologram'
import { createCameraRig } from './scene/cameraRig'
import { createEnvironment } from './scene/environment'
import { createRenderPipeline } from './scene/renderPipeline'
import { disposeObject } from './shared/disposeObject'
import { loadObjModel } from './shared/loadObjModel'

export interface HologramScene {
  /** Resolves false if disposed before loading finishes; rejects on a loading failure. */
  readonly ready: Promise<boolean>
  dispose(): void
}

// Coordinates one canvas lifetime. Rendering, loading, and geometry stay in their factories.
export function createHologramScene(element: HTMLCanvasElement, modelUrl: string): HologramScene {
  const scene = createEnvironment()
  const abortController = new AbortController()
  let cameraRig: ReturnType<typeof createCameraRig> | undefined
  let pipeline: ReturnType<typeof createRenderPipeline> | undefined
  let observer: ResizeObserver | undefined
  let disposed = false
  let frame = 0

  const render = () => {
    frame = 0
    if (disposed) return
    cameraRig?.controls.update()
    pipeline?.render()
  }
  // Keep the static scene idle; damping requests additional frames through control changes.
  const requestRender = () => {
    if (!disposed && !frame) frame = requestAnimationFrame(render)
  }
  const resize = () => {
    const width = Math.max(element.clientWidth, 1)
    const height = Math.max(element.clientHeight, 1)
    cameraRig?.resize(width, height)
    pipeline?.resize(width, height)
    requestRender()
  }
  const dispose = () => {
    if (disposed) return
    disposed = true
    abortController.abort()
    cancelAnimationFrame(frame)
    observer?.disconnect()
    cameraRig?.controls.removeEventListener('change', requestRender)
    cameraRig?.dispose()
    disposeObject(scene)
    pipeline?.dispose()
  }

  try {
    cameraRig = createCameraRig(element)
    pipeline = createRenderPipeline(element, scene, cameraRig.camera)
    cameraRig.controls.addEventListener('change', requestRender)
    observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
  } catch (error) {
    dispose()
    throw error
  }

  const load = async () => {
    try {
      const model = await loadObjModel(modelUrl, abortController.signal)
      try {
        if (disposed) return false
        scene.add(createHologram(model))
      } finally {
        disposeObject(model)
      }
      requestRender()
      return true
    } catch (error) {
      if (disposed) return false
      throw error
    }
  }

  return { ready: load(), dispose }
}
