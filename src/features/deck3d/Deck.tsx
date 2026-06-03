import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useSprings } from '@react-spring/three'
import { useDivination } from '@/features/divination/divination.store'
import { usePrefs } from '@/store/prefs.store'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { getCard } from '@/deck/cards'
import type { Card as CardType } from '@/deck/types'
import { Card, type CardSpring } from './Card'
import { getBackTexture, getMinimalFaceTexture } from './skins'
import { useDeckFronts } from './useDeckFronts'
import {
  coverflowTransform,
  discardTransform,
  scatterTransform,
  slotTransform,
  spreadCardScale,
  spreadPlane,
  stackTransform,
  type Transform,
  type Vec3,
} from './layout'

/**
 * Unified deck: one set of meshes drives the whole flow — stack → shuffle →
 * coverflow browse → pick (card flies into its spread slot, face-down) → reveal
 * (flip face-up in place with reversed). The card you pick IS the card that flips.
 */
export function Deck() {
  const phase = useDivination((s) => s.phase)
  const deckOrder = useDivination((s) => s.deckOrder)
  const picked = useDivination((s) => s.picked)
  const spread = useDivination((s) => s.spread)
  const drawn = useDivination((s) => s.drawn)
  const pick = useDivination((s) => s.pick)
  const selectCard = useDivination((s) => s.selectCard)
  const finishShuffle = useDivination((s) => s.finishShuffle)
  const finishReveal = useDivination((s) => s.finishReveal)
  const reduced = useReducedMotion()

  const deckBack = usePrefs((s) => s.deckBack)
  const cardFace = usePrefs((s) => s.cardFace)
  const back = useMemo(() => getBackTexture(deckBack), [deckBack])
  const fronts = useDeckFronts()
  const n = deckOrder.length

  const frontFor = (card: CardType | undefined): THREE.Texture | undefined => {
    if (!card) return undefined
    return cardFace === 'minimal' ? getMinimalFaceTexture(card) : fronts.get(card.imageKey)
  }

  const plane = useMemo(() => (spread ? spreadPlane(spread) : null), [spread])
  const cardScale = useMemo(
    () => (spread && plane ? spreadCardScale(spread, plane) : 1),
    [spread, plane],
  )
  const sortedPositions = useMemo(
    () => (spread ? [...spread.positions].sort((a, b) => a.index - b.index) : []),
    [spread],
  )
  const posById = useMemo(() => new Map(sortedPositions.map((p) => [p.id, p])), [sortedPositions])
  const drawnByCard = useMemo(() => new Map(drawn.map((d) => [d.cardId, d])), [drawn])

  const [centered, setCentered] = useState(0)
  const centeredRef = useRef(0)

  // Pre-load image faces of picked / drawn cards (classic style only).
  useEffect(() => {
    if (cardFace !== 'classic') return
    picked.forEach((id) => {
      const c = getCard(id)
      if (c) fronts.load(c.imageKey)
    })
  }, [picked, fronts, cardFace])
  useEffect(() => {
    if (cardFace !== 'classic') return
    drawn.forEach((d) => {
      const c = getCard(d.cardId)
      if (c) fronts.load(c.imageKey)
    })
  }, [drawn, fronts, cardFace])

  // ── landing burst: a ring pulses where a card just dropped into its slot ──
  const [burst, setBurst] = useState<{ pos: Vec3; key: number } | null>(null)
  const prevPicked = useRef(0)
  const burstKey = useRef(0)
  useEffect(() => {
    if (picked.length > prevPicked.current && plane) {
      const pos = sortedPositions[picked.length - 1]
      if (pos) {
        const t = slotTransform(pos, plane, cardScale, { faceUp: false, reversed: false })
        setBurst({ pos: [t.position[0], t.position[1], t.position[2] + 0.05], key: ++burstKey.current })
      }
    }
    prevPicked.current = picked.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picked])

  const targetFor = (i: number): Transform => {
    if (phase === 'idle' || phase === 'shuffling') return stackTransform(i)
    const cardId = deckOrder[i]
    if (phase === 'revealing' || phase === 'done') {
      const d = drawnByCard.get(cardId)
      const pos = d ? posById.get(d.positionId) : undefined
      if (d && pos && plane) {
        return slotTransform(pos, plane, cardScale, { faceUp: true, reversed: d.reversed })
      }
      return discardTransform(i)
    }
    // picking
    const slot = picked.indexOf(cardId)
    if (slot >= 0 && plane && sortedPositions[slot]) {
      return slotTransform(sortedPositions[slot], plane, cardScale, { faceUp: false, reversed: false })
    }
    return coverflowTransform(i - centered)
  }

  const [springs, api] = useSprings(n, (i) => ({
    ...stackTransform(i),
    config: { tension: 210, friction: 24 },
  }))

  const timers = useRef<number[]>([])

  // Phase-level choreography (shuffle / reveal / settle).
  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (phase === 'shuffling') {
      centeredRef.current = Math.floor(n / 2)
      setCentered(centeredRef.current)
      if (reduced) {
        api.start((i) => ({ ...stackTransform(i), config: { tension: 260, friction: 30 } }))
        timers.current.push(window.setTimeout(() => finishShuffle(), 450))
      } else {
        api.start((i) => ({
          ...scatterTransform(i, n),
          delay: (i % 12) * 12,
          config: { tension: 170, friction: 18 },
        }))
        timers.current.push(
          window.setTimeout(() => {
            api.start((i) => ({
              ...stackTransform(i),
              delay: (i % 12) * 8,
              config: { tension: 260, friction: 26 },
            }))
          }, 800),
        )
        timers.current.push(window.setTimeout(() => finishShuffle(), 1550))
      }
    } else if (phase === 'revealing') {
      api.start((i) => {
        const d = drawnByCard.get(deckOrder[i])
        if (d) {
          return { ...targetFor(i), delay: (d.index - 1) * 220, config: { tension: 90, friction: 14 } }
        }
        return { ...targetFor(i), config: { tension: 220, friction: 26 } }
      })
      const total = drawn.length * 220 + 1100
      timers.current.push(window.setTimeout(() => finishReveal(), total))
    } else {
      api.start((i) => ({ ...targetFor(i) }))
    }
    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Retarget the ribbon as the focus scrubs or a card is picked (springy = juicy).
  useEffect(() => {
    if (phase !== 'picking') return
    api.start((i) => {
      const isPicked = picked.includes(deckOrder[i])
      return { ...targetFor(i), config: isPicked ? { tension: 230, friction: 16 } : { tension: 260, friction: 26 } }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centered, picked, phase])

  // Mouse-x scrubs the coverflow focus (continuous, throttled to integer steps).
  useFrame((state) => {
    if (phase !== 'picking' || n <= 1) return
    const t = state.pointer.x * 0.6 + 0.5
    const target = Math.max(0, Math.min(n - 1, Math.round(t * (n - 1))))
    if (target !== centeredRef.current) {
      centeredRef.current = target
      setCentered(target)
    }
  })

  function pickCentered(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    if (phase !== 'picking') return
    pick(deckOrder[centeredRef.current])
  }

  return (
    <group>
      {/* invisible click-catcher (picking only): click anywhere takes the centered card */}
      {phase === 'picking' && (
        <mesh position={[0, 0, 4.6]} onClick={pickCentered}>
          <planeGeometry args={[60, 40]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {phase === 'picking' && <CenterGlow />}
      {burst && <BurstRing key={burst.key} position={burst.pos} onDone={() => setBurst(null)} />}

      {springs.map((spring, i) => {
        const card = getCard(deckOrder[i])
        const d = phase === 'done' ? drawnByCard.get(deckOrder[i]) : undefined
        return (
          <Card
            key={i}
            spring={spring as unknown as CardSpring}
            backTexture={back}
            frontTexture={frontFor(card)}
            interactive={!!d}
            onSelect={(e) => {
              e.stopPropagation()
              if (d) selectCard(d.positionId)
            }}
          />
        )
      })}
    </group>
  )
}

/** Pulsing halo behind the focused (front) card to signal "this is pickable". */
function CenterGlow() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const p = 1 + Math.sin(state.clock.elapsedTime * 2.5) * 0.06
    ref.current.scale.set(p, p, 1)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity =
      0.18 + Math.sin(state.clock.elapsedTime * 2.5) * 0.06
  })
  return (
    <mesh ref={ref} position={[0, -2.05, 3.2]}>
      <circleGeometry args={[1.4, 48]} />
      <meshBasicMaterial color="#e8c468" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}

/** Expanding gold ring where a picked card lands in its slot. */
function BurstRing({ position, onDone }: { position: Vec3; onDone: () => void }) {
  const ref = useRef<THREE.Mesh>(null)
  const elapsed = useRef(0)
  useFrame((_, dt) => {
    elapsed.current += dt
    const p = Math.min(elapsed.current / 0.55, 1)
    if (ref.current) {
      const s = 0.4 + p * 2.4
      ref.current.scale.set(s, s, 1)
      ;(ref.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.8
    }
    if (p >= 1) onDone()
  })
  return (
    <mesh ref={ref} position={position}>
      <ringGeometry args={[0.5, 0.62, 56]} />
      <meshBasicMaterial color="#e8c468" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}
