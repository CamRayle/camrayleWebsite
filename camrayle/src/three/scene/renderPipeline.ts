import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'

// Owns the WebGL renderer and all postprocessing resources.
export function createRenderPipeline(
  element: HTMLCanvasElement,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
) {
  const renderer = new THREE.WebGLRenderer({ canvas: element, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 0.9

  const composer = new EffectComposer(renderer)
  const renderPass = new RenderPass(scene, camera)
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.18, 0.3, 1.1)
  const output = new OutputPass()
  composer.addPass(renderPass)
  composer.addPass(bloom)
  composer.addPass(output)

  return {
    render() {
      composer.render()
    },
    resize(width: number, height: number) {
      renderer.setSize(width, height, false)
      composer.setSize(width, height)
    },
    dispose() {
      renderPass.dispose()
      bloom.dispose()
      output.dispose()
      composer.dispose()
      renderer.dispose()
    },
  }
}
