import * as THREE from 'three'

// The stage owns the background, floor, grid, and ambient lighting.
export function createEnvironment() {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#090b0d')
  scene.fog = new THREE.FogExp2('#090b0d', 0.065)
  scene.add(new THREE.HemisphereLight(0xa1c9d9, 0x080b10, 1.2))
  const keyLight = new THREE.DirectionalLight(0xbad8e3, 2)
  keyLight.position.set(-3, 6, 4)
  scene.add(keyLight)

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 100),
    new THREE.MeshStandardMaterial({ color: '#090c0f', roughness: 0.55, metalness: 0.35 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.12
  scene.add(floor)
  const grid = new THREE.GridHelper(60, 60, 0x26373c, 0x1b282e)
  grid.position.y = -0.115
  grid.material.transparent = true
  grid.material.opacity = 0.35
  scene.add(grid)

  return scene
}
