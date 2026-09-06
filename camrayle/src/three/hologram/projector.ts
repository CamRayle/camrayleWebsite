import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import type { HologramSettings } from './settings'
import { createEmitterMaterial } from './materials'

export function createProjector(unit: number, settings: HologramSettings) {
  const group = new THREE.Group()
  const base = new THREE.Mesh(
    new RoundedBoxGeometry(
      unit * settings.projectorSize,
      unit * 0.035,
      unit * settings.projectorSize * 0.75,
      3,
      unit * 0.008,
    ),
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(0.012, 0.018, 0.025),
      metalness: 0.65,
      roughness: 0.35,
    }),
  )
  base.position.y = (-unit * 0.035) / 2
  group.add(base)

  const emitter = new THREE.Mesh(
    new THREE.PlaneGeometry(unit * 0.65, unit * 0.4),
    createEmitterMaterial(settings),
  )

  emitter.rotation.x = -Math.PI / 2
  emitter.position.y = unit * 0.002
  group.add(emitter)
  const light = new THREE.PointLight(settings.color, 0.15 * unit * unit, unit * 2, 2)
  light.position.y = unit * 0.045
  group.add(light)

  return group
}
