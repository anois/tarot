import { useCallback, useRef, useState } from 'react'
import * as THREE from 'three'
import { cardImageUrl } from '@/deck/images'

/**
 * Imperatively loads card-front textures on demand (when a card is picked) and
 * caches them. Avoids Suspense so streaming a face in never re-mounts / kills the
 * deck animations. A version counter triggers re-render when a texture arrives.
 */
export function useDeckFronts() {
  const mapRef = useRef<Map<string, THREE.Texture>>(new Map())
  const loadingRef = useRef<Set<string>>(new Set())
  const loaderRef = useRef<THREE.TextureLoader | null>(null)
  const [, setVersion] = useState(0)

  if (loaderRef.current == null) loaderRef.current = new THREE.TextureLoader()

  const load = useCallback((imageKey: string) => {
    const map = mapRef.current
    if (map.has(imageKey) || loadingRef.current.has(imageKey)) return
    loadingRef.current.add(imageKey)
    loaderRef.current!
      .loadAsync(cardImageUrl(imageKey))
      .then((tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 4
        map.set(imageKey, tex)
        loadingRef.current.delete(imageKey)
        setVersion((v) => v + 1)
      })
      .catch(() => loadingRef.current.delete(imageKey))
  }, [])

  const get = useCallback((imageKey: string) => mapRef.current.get(imageKey), [])

  return { load, get }
}
