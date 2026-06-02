import { useMemo } from 'react'
import { Edges } from '@react-three/drei'
import { useDivination } from '@/features/divination/divination.store'
import { CARD_H, CARD_W, slotTransform, spreadCardScale, spreadPlane } from './layout'

/** Ghost outlines of the spread positions, shown while choosing / picking so the
 *  board is visible and picked cards are seen filling each slot. */
export function SlotOutlines() {
  const phase = useDivination((s) => s.phase)
  const spread = useDivination((s) => s.spread)
  const picked = useDivination((s) => s.picked)

  const plane = useMemo(() => (spread ? spreadPlane(spread) : null), [spread])
  const cardScale = useMemo(
    () => (spread && plane ? spreadCardScale(spread, plane) : 1),
    [spread, plane],
  )

  if (!spread || !plane || (phase !== 'idle' && phase !== 'picking')) return null

  const filled = new Set(picked.map((_, i) => i))
  const sorted = [...spread.positions].sort((a, b) => a.index - b.index)

  return (
    <group>
      {sorted.map((pos, slot) => {
        const t = slotTransform(pos, plane, cardScale, { faceUp: true, reversed: false })
        const isFilled = filled.has(slot)
        return (
          <mesh key={pos.id} position={t.position} rotation={t.rotation} scale={t.scale}>
            <planeGeometry args={[CARD_W, CARD_H]} />
            <meshBasicMaterial color="#e8c468" transparent opacity={isFilled ? 0 : 0.05} depthWrite={false} />
            <Edges color="#d9a441" />
          </mesh>
        )
      })}
    </group>
  )
}
