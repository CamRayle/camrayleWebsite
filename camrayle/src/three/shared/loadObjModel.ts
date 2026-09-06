import { OBJLoader } from 'three/addons/loaders/OBJLoader.js'

// The caller owns and must dispose the returned model.
export async function loadObjModel(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Sculpture request failed: ${response.status}`)
  const source = await response.text()
  signal.throwIfAborted()
  return new OBJLoader().parse(source)
}
