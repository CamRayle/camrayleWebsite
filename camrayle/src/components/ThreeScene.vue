<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue'
import thinkerUrl from '../assets/models/Rodin_Thinker.obj?url'
import { createHologramScene, type HologramScene } from '../three/createHologramScene'

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')
const status = ref('Loading sculpture…')
const failed = ref(false)
let scene: HologramScene | undefined

onBeforeUnmount(() => scene?.dispose())

onMounted(async () => {
  if (!canvas.value) return

  try {
    scene = createHologramScene(canvas.value, thinkerUrl)
  } catch {
    failed.value = true
    status.value = 'The hologram needs a browser with WebGL 2 enabled.'
    return
  }

  try {
    if (await scene.ready) status.value = ''
  } catch (error: unknown) {
    console.error('Unable to load the hologram', error)
    failed.value = true
    status.value = 'The sculpture could not load. Refresh the page to try again.'
  }
})
</script>

<template>
  <div class="hologram-scene">
    <canvas
      ref="canvas"
      class="three-scene"
      aria-label="Cyan hologram of Rodin’s The Thinker floating above a projector. Drag to orbit and scroll to zoom."
    />
    <p v-if="status" class="scene-status" :role="failed ? 'alert' : 'status'">{{ status }}</p>
  </div>
</template>

<style scoped>
.hologram-scene,
.three-scene {
  display: block;
  width: 100%;
  height: 100%;
}

.hologram-scene {
  position: relative;
}

.three-scene {
  cursor: grab;
}

.three-scene:active {
  cursor: grabbing;
}

.scene-status {
  position: absolute;
  right: 1rem;
  bottom: 0.75rem;
  left: 1rem;
  margin: 0;
  color: #7e9ca5;
  font-size: 0.75rem;
  text-align: center;
  pointer-events: none;
}
</style>
