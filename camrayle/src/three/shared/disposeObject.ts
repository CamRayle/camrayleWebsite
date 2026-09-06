import * as THREE from 'three'

// Dispose each owned GPU resource once, including materials shared by meshes.
export function disposeObject(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  object.traverse((child) => {
    if (!(
      child instanceof THREE.Mesh ||
      child instanceof THREE.Line ||
      child instanceof THREE.Points
    ))
      return
    geometries.add(child.geometry)
    for (const material of Array.isArray(child.material) ? child.material : [child.material])
      materials.add(material)
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
}
