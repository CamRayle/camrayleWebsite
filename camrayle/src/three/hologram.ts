import * as THREE from 'three'
import { HOLOGRAM, type HologramSettings } from './hologram/settings'
import { createSculpture } from './hologram/sculpture'
import { createProjector } from './hologram/projector'
import { createProjection } from './hologram/projection'
import { disposeObject } from './shared/disposeObject'

// Composition root for the visual effect. The returned group owns its resources.
export function createHologram(model: THREE.Group, settings: HologramSettings = HOLOGRAM) {
  const group = new THREE.Group()
  group.name = 'Thinker hologram and projector'
  try {
    const sculpture = createSculpture(model, settings)
    group.add(sculpture.object)
    group.add(createProjector(sculpture.unit, settings))
    group.add(createProjection(sculpture.unit, sculpture.cutHeight, sculpture.connection, settings))
    return group
  } catch (error) {
    disposeObject(group)
    throw error
  }
}
