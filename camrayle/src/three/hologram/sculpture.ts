import * as THREE from 'three'
import type { HologramSettings } from './settings'
import { createSurfaceMaterial, createWireMaterial } from './materials'

// Clone the imported mesh: the caller retains ownership of the source model.
export function createSculpture(model: THREE.Group, settings: HologramSettings) {
  const group = new THREE.Group()
  model.updateMatrixWorld(true)
  const bounds = new THREE.Box3().setFromObject(model)
  const size = bounds.getSize(new THREE.Vector3())
  if (bounds.isEmpty() || size.y <= 0) throw new Error('The sculpture has no usable geometry')
  const center = bounds.getCenter(new THREE.Vector3())
  const scale = settings.height / size.y
  const unit = Math.max(size.x, size.y, size.z) * scale
  const bottom = unit * settings.projectorGap
  const cutHeight = bottom + settings.height * settings.connectHeight
  const transform = new THREE.Matrix4()
    .makeTranslation(-center.x * scale, bottom - bounds.min.y * scale, -center.z * scale)
    .multiply(new THREE.Matrix4().makeScale(scale, scale, scale))

  const surface = createSurfaceMaterial(bottom, settings)
  const wire = createWireMaterial(settings)
  const connection: THREE.Vector3[] = []
  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const geometry = child.geometry.clone().applyMatrix4(child.matrixWorld).applyMatrix4(transform)
    if (!geometry.hasAttribute('normal')) geometry.computeVertexNormals()
    group.add(new THREE.Mesh(geometry, surface))
    // Preserve the scan's topology; screen-space lines avoid thousands of tube meshes.
    group.add(new THREE.LineSegments(new THREE.WireframeGeometry(geometry), wire))
    const positions = geometry.getAttribute('position')
    const step = Math.max(1, Math.floor(positions.count / 1600))
    for (let i = 0; i < positions.count; i += step) {
      const point = new THREE.Vector3().fromBufferAttribute(positions, i)
      if (point.y <= cutHeight) connection.push(point)
    }
  })

  return { object: group, unit, cutHeight, connection }
}
