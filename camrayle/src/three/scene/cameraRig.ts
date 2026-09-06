import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export function createCameraRig(element: HTMLCanvasElement) {
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80)
  const target = new THREE.Vector3(0, 2.12, 0)
  const viewDirection = new THREE.Vector3(0.15, 0.12, 1).normalize()
  const controls = new OrbitControls(camera, element)
  controls.target.copy(target)
  controls.enableDamping = true
  controls.enablePan = false
  controls.minDistance = 5
  controls.maxDistance = 22
  controls.minPolarAngle = Math.PI * 0.2
  controls.maxPolarAngle = Math.PI * 0.49

  camera.position.copy(target).add(viewDirection)

  return {
    camera,
    controls,
    resize(width: number, height: number) {
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      const verticalFov = THREE.MathUtils.degToRad(camera.fov)
      const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * camera.aspect)
      const distance = Math.max(2.9 / Math.tan(verticalFov / 2), 2.15 / Math.tan(horizontalFov / 2))
      const direction = camera.position.clone().sub(target).normalize()
      camera.position
        .copy(target)
        .addScaledVector(direction.lengthSq() ? direction : viewDirection, distance)
      controls.maxDistance = Math.max(22, distance * 1.5)
      controls.update()
    },
    dispose() {
      controls.dispose()
    },
  }
}
