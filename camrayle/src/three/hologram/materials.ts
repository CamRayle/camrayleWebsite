import * as THREE from 'three'
import type { HologramSettings } from './settings'

const surfaceVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;
  varying float vHeight;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewPosition = -viewPosition.xyz;
    vHeight = position.y;
    gl_Position = projectionMatrix * viewPosition;
  }
`

const panelVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export function createSurfaceMaterial(bottom: number, settings: HologramSettings) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: settings.color },
      uHeight: { value: settings.height },
      uBottom: { value: bottom },
      uOpacity: { value: settings.surfaceOpacity },
      uStrength: { value: settings.surfaceStrength },
      uScanLines: { value: settings.scanLines },
      uScanWidth: { value: settings.scanWidth },
    },
    vertexShader: surfaceVertex,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uHeight, uBottom, uOpacity, uStrength, uScanLines, uScanWidth;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vHeight;
      void main() {
        float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
        float fresnel = pow(1.0 - facing, 3.0);
        float phase = (vHeight - uBottom) / uHeight * uScanLines;
        float aa = min(fwidth(phase), 0.2);
        float band = 1.0 - smoothstep(uScanWidth - aa, uScanWidth + aa, fract(phase));
        float opacity = max(band * 0.45, uOpacity + fresnel * 0.2);
        // Additive front/back layers accumulate more strongly than Blender's transparency.
        gl_FragColor = vec4(uColor * uStrength, opacity * 0.22);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  })
}

export function createWireMaterial(settings: HologramSettings) {
  return new THREE.LineBasicMaterial({
    color: settings.color,
    transparent: true,
    opacity: settings.wireOpacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}

export function createEmitterMaterial(settings: HologramSettings) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: settings.color }, uStrength: { value: settings.panelStrength } },
    vertexShader: panelVertex,
    fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uStrength;
        varying vec2 vUv;
        void main() {
          float radius = distance(vUv, vec2(0.5));
          vec3 core = mix(vec3(0.25, 1.0, 1.0), uColor, smoothstep(0.0, 0.14, radius));
          vec3 color = mix(core, vec3(0.0, 0.003, 0.008), smoothstep(0.14, 0.5, radius));
          gl_FragColor = vec4(color * uStrength, 1.0);
        }
      `,
  })
}

export function createHazeMaterial(cutHeight: number, settings: HologramSettings) {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: settings.color }, uHeight: { value: cutHeight } },
    vertexShader: surfaceVertex,
    fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uHeight;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vHeight;
        void main() {
          float fade = pow(1.0 - clamp(vHeight / uHeight, 0.0, 1.0), 2.0);
          float edge = abs(dot(normalize(vNormal), normalize(vViewPosition)));
          gl_FragColor = vec4(uColor, fade * smoothstep(0.0, 0.5, edge) * 0.055);
        }
      `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
}
