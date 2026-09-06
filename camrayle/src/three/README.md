# Hologram scene architecture

The implementation uses composition and focused factory functions. Each factory creates one part of the scene; the scene controller connects those parts and owns their lifetime. Three.js code has no dependency on Vue.

| Module                         | Responsibility                                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `../components/ThreeScene.vue` | Canvas markup, loading/error presentation, and Vue mount/unmount hooks.                                                                     |
| `createHologramScene.ts`       | Scene lifecycle: connect factories, schedule frames, observe resizing, load the model, and tear down. Exposes only `ready` and `dispose()`. |
| `scene/environment.ts`         | Background, fog, floor, grid, and stage lights.                                                                                             |
| `scene/cameraRig.ts`           | Camera framing, orbit controls, and responsive viewing distance.                                                                            |
| `scene/renderPipeline.ts`      | WebGL renderer, bloom, output pass, and render-target sizing.                                                                               |
| `shared/loadObjModel.ts`       | Fetch and parse an OBJ with cancellation.                                                                                                   |
| `shared/disposeObject.ts`      | Release the geometries and materials owned by an object hierarchy, deduplicating shared resources.                                          |
| `hologram.ts`                  | Assemble the sculpture, projector, and projection into one owned group.                                                                     |
| `hologram/sculpture.ts`        | Normalize cloned model geometry, build its surface/wireframe, and sample beam connection points.                                            |
| `hologram/projector.ts`        | Build the physical platform, emitter, and projector light.                                                                                  |
| `hologram/projection.ts`       | Build the fitted haze and deterministic projection rays.                                                                                    |
| `hologram/materials.ts`        | Construct hologram materials and encapsulate their shaders.                                                                                 |
| `hologram/settings.ts`         | Hologram defaults translated from the Blender script.                                                                                       |

## Resource ownership

- `loadObjModel()` transfers ownership of the imported model to its caller.
- `createHologram()` clones source geometry. Disposing the returned group does not dispose the source model. The controller releases the source after constructing the hologram.
- The controller owns the scene group, camera rig, render pipeline, pending request, animation frame, and resize observer. Its `dispose()` is idempotent and aborts loading. A late model result is disposed without being attached.
- The render pipeline owns its renderer, postprocessing passes, and render targets. The camera rig owns its controls and their DOM listeners.
- `disposeObject()` handles geometry and material resources used by this untextured effect. Texture ownership would need to be added explicitly if textured materials are introduced.

## Making changes

Adjust hologram defaults in `hologram/settings.ts`; `createHologram(model, settings)` also accepts explicit settings. Change camera behavior in `scene/cameraRig.ts` and postprocessing in `scene/renderPipeline.ts`. Keep application text and Vue state in the component. The OBJ asset stays in `src/assets/models/` so Vite includes it in production builds.

The scene remains static and renders on load, resize, and control changes. Orbit damping requests frames until it settles.

Run `npm run build` and `npm run test:unit -- --run` from `camrayle/`. Tests cover model normalization and ownership, shared-resource disposal, loading errors, cancellation, and scene teardown.
