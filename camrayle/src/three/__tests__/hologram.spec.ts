// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import * as THREE from 'three'
import { createHologram } from '../hologram'
import { createSculpture } from '../hologram/sculpture'
import { HOLOGRAM } from '../hologram/settings'
import { disposeObject } from '../shared/disposeObject'

describe('hologram geometry ownership', () => {
  it('fits a transformed model above the projector without changing its source geometry', () => {
    const model = new THREE.Group()
    const geometry = new THREE.BoxGeometry(1, 2, 1)
    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
    mesh.position.set(2, 3, -4)
    model.position.set(-1, 5, 2)
    model.scale.setScalar(2)
    model.add(mesh)
    const original = geometry.getAttribute('position').array.slice()
    const sourceDispose = vi.spyOn(geometry, 'dispose')
    const sculpture = createSculpture(model, HOLOGRAM)

    try {
      const bounds = new THREE.Box3().setFromObject(sculpture.object)
      const center = bounds.getCenter(new THREE.Vector3())
      expect(bounds.getSize(new THREE.Vector3()).y).toBeCloseTo(3)
      expect(bounds.min.y).toBeCloseTo(1.05)
      expect(center.x).toBeCloseTo(0)
      expect(center.z).toBeCloseTo(0)
      expect(sculpture.connection.length).toBeGreaterThan(0)
      expect(sculpture.connection.every((point) => point.y <= sculpture.cutHeight)).toBe(true)
      expect(geometry.getAttribute('position').array).toEqual(original)
    } finally {
      disposeObject(sculpture.object)
    }
    expect(sourceDispose).not.toHaveBeenCalled()
    disposeObject(model)
  })

  it('releases shared materials and geometries once across nested groups', () => {
    const root = new THREE.Group()
    const child = new THREE.Group()
    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial()
    const geometryDispose = vi.spyOn(geometry, 'dispose')
    const materialDispose = vi.spyOn(material, 'dispose')
    root.add(new THREE.Mesh(geometry, material), child)
    child.add(new THREE.Mesh(geometry, [material, material]))

    disposeObject(root)

    expect(geometryDispose).toHaveBeenCalledTimes(1)
    expect(materialDispose).toHaveBeenCalledTimes(1)
  })

  it('rejects empty models before constructing a projector', () => {
    expect(() => createHologram(new THREE.Group())).toThrow('no usable geometry')
  })
})
