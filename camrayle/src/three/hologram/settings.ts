import * as THREE from 'three'

// Ratios and material controls from blender_script.py, in Three.js Y-up coordinates.
export const HOLOGRAM = {
  height: 3,
  color: new THREE.Color(0.01, 0.65, 1),
  surfaceStrength: 2,
  surfaceOpacity: 0.025,
  scanLines: 35,
  scanWidth: 0.1,
  wireOpacity: 0.16,
  projectorSize: 1.15,
  projectorGap: 0.35,
  panelStrength: 2.5,
  rayCount: 28,
  rayOpacity: 0.08,
  connectHeight: 0.5,
  sourceRadius: 0.025,
}

export type HologramSettings = typeof HOLOGRAM
