import { useMemo } from 'react'
import * as THREE from 'three'
import { usePrefs } from '@/store/prefs.store'
import { getClothTexture } from './skins'

/** The tablecloth: a large plane behind the cards that receives their shadows,
 *  so the deck reads as cards resting on a cloth (viewed top-down). */
export function Table() {
  const cloth = usePrefs((s) => s.tableCloth)
  const tex = useMemo(() => {
    const t = getClothTexture(cloth)
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(3, 3)
    return t
  }, [cloth])

  return (
    <mesh position={[0, 0, -0.8]} receiveShadow>
      <planeGeometry args={[44, 44]} />
      <meshStandardMaterial map={tex} roughness={0.96} metalness={0} />
    </mesh>
  )
}
