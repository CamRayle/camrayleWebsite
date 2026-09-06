<script setup lang="ts">
import ThreeScene from './components/ThreeScene.vue'
</script>

<template>
  <main>
    <ThreeScene />
  </main>
</template>

<style>
* {
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
}

body {
  color: #f8fafc;
  background: #090b0d;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}

main {
  width: 100%;
  height: 100svh;
  overflow: hidden;
}
</style>
