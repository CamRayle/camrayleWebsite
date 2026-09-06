import * as THREE from 'three'
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js'
import type { HologramSettings } from './settings'
import { createHazeMaterial } from './materials'

export function createProjection(
  unit: number,
  cutHeight: number,
  connection: readonly THREE.Vector3[],
  settings: HologramSettings,
) {
  const group = new THREE.Group()
  if (connection.length < 4) return group
  const source = new THREE.Vector3(0, unit * 0.006, 0)
  const hullPoints = [...connection]
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2
    hullPoints.push(
      source
        .clone()
        .add(
          new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(
            unit * settings.sourceRadius,
          ),
        ),
    )
  }
  // A faint, height-faded hull approximates Blender's volumetric scattering.
  const haze = new THREE.Mesh(
    new ConvexGeometry(hullPoints),
    createHazeMaterial(cutHeight, settings),
  )
  group.add(haze)

  const rayPositions: number[] = []
  const rayColors: number[] = []
  let seed = 12
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    return seed / 4294967296
  }
  for (let i = 0; i < settings.rayCount; i++) {
    const end = connection[Math.floor(random() * connection.length)]!
    const angle = random() * Math.PI * 2
    const radius = unit * settings.sourceRadius * (0.2 + random() * 0.8)
    const start = source
      .clone()
      .add(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius))
    const stops = [0, 0.15, 0.65, 1]
    const strengths = [0.5, 1, 0.4, 0]
    for (let segment = 0; segment < stops.length - 1; segment++) {
      for (const index of [segment, segment + 1]) {
        rayPositions.push(...start.clone().lerp(end, stops[index]!).toArray())
        rayColors.push(
          ...settings.color
            .clone()
            .multiplyScalar(strengths[index]! * 0.6)
            .toArray(),
        )
      }
    }
  }
  const rays = new THREE.BufferGeometry()
  rays.setAttribute('position', new THREE.Float32BufferAttribute(rayPositions, 3))
  rays.setAttribute('color', new THREE.Float32BufferAttribute(rayColors, 3))
  group.add(
    new THREE.LineSegments(
      rays,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: settings.rayOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  )
  return group
}
