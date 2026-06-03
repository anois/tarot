import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useSprings } from '@react-spring/three'
import { easing } from 'maath'
import { useDivination } from '@/features/divination/divination.store'
import { usePrefs } from '@/store/prefs.store'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { getCard } from '@/deck/cards'
import { Card, type CardSpring } from './Card'
import { getBackTexture, getMinimalFaceTexture } from './skins'
import { useDeckFronts } from './useDeckFronts'
import {
  coverflowTransform,
  discardTransform,
  idleStackTransform,
  scatterTransform,
  slotTransform,
  spreadCardScale,
  spreadPlane,
  stackTransform,
  type Transform,
  type Vec3,
} from './layout'

const DRAG_SENSITIVITY = 1.15 // world units dragged per card-step

/**
 * Unified deck: one set of meshes drives the whole flow — stack → shuffle →
 * coverflow browse → pick (card flies into its spread slot, face-down) → reveal
 * (flip face-up in place with reversed). The card you pick IS the card that flips.
 *
 * Interaction is a carousel that behaves identically on desktop and touch:
 * drag/swipe (or wheel, or the HUD ◀ ▶) scrubs the focus; a tap picks the
 * centered card. Faces are NEVER shown until reveal — only a drawn card in the
 * revealing/done phase gets its real front texture (otherwise the back shows).
 */
export function Deck() {
  const phase = useDivination((s) => s.phase)
  const deckOrder = useDivination((s) => s.deckOrder)
  const picked = useDivination((s) => s.picked)
  const spread = useDivination((s) => s.spread)
  const drawn = useDivination((s) => s.drawn)
  const centered = useDivination((s) => s.centered)
  const setCentered = useDivination((s) => s.setCentered)
  const stepCentered = useDivination((s) => s.stepCentered)
  const pickCentered = useDivination((s) => s.pickCentered)
  const selectCard = useDivination((s) => s.selectCard)
  const startShuffle = useDivination((s) => s.startShuffle)
  const finishShuffle = useDivination((s) => s.finishShuffle)
  const finishReveal = useDivination((s) => s.finishReveal)
  const reduced = useReducedMotion()

  const deckBack = usePrefs((s) => s.deckBack)
  const cardFace = usePrefs((s) => s.cardFace)
  const back = useMemo(() => getBackTexture(deckBack), [deckBack])
  const fronts = useDeckFronts()
  const n = deckOrder.length

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
    if (phase === 'idle') return idleStackTransform(i, n)
    if (phase === 'shuffling') return stackTransform(i)
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
    ...idleStackTransform(i, n),
    config: { tension: 210, friction: 24 },
  }))

  // Gentle "breathing" float on the idle hero pile (eased back to rest otherwise).
  const floatRef = useRef<THREE.Group>(null)
  useFrame((state, dt) => {
    const g = floatRef.current
    if (!g) return
    if (phase === 'idle' && !reduced) {
      const tm = state.clock.elapsedTime
      easing.damp3(g.position, [0, Math.sin(tm * 0.9) * 0.12, 0], 0.4, dt)
      easing.dampE(g.rotation, [Math.sin(tm * 0.6) * 0.03, Math.sin(tm * 0.45) * 0.05, 0], 0.5, dt)
    } else {
      easing.damp3(g.position, [0, 0, 0], 0.3, dt)
      easing.dampE(g.rotation, [0, 0, 0], 0.3, dt)
    }
  })

  const timers = useRef<number[]>([])

  // Phase-level choreography (shuffle / reveal / settle).
  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    if (phase === 'shuffling') {
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

  // ── carousel input (drag/swipe to scrub, wheel on desktop, tap to pick) ──
  const dragRef = useRef<{ x: number; start: number; moved: boolean } | null>(null)
  function onDown(e: ThreeEvent<PointerEvent>) {
    e.stopPropagation()
    dragRef.current = { x: e.point.x, start: centered, moved: false }
  }
  function onMove(e: ThreeEvent<PointerEvent>) {
    const dr = dragRef.current
    if (!dr) return
    const dx = e.point.x - dr.x
    if (Math.abs(dx) > 0.12) dr.moved = true
    setCentered(dr.start - dx / DRAG_SENSITIVITY)
  }
  function onUp() {
    const dr = dragRef.current
    dragRef.current = null
    if (dr && !dr.moved) pickCentered() // a tap (no drag) picks the centered card
  }
  function onWheel(e: ThreeEvent<WheelEvent>) {
    e.stopPropagation()
    stepCentered(e.deltaY > 0 ? 1 : -1)
  }

  return (
    <group>
      {/* carousel surface (picking only): drag/swipe scrubs, wheel steps, tap picks */}
      {phase === 'picking' && (
        <mesh
          position={[0, 0, 4.6]}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
          onWheel={onWheel}
        >
          <planeGeometry args={[60, 40]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      {phase === 'idle' && <IdleGlow />}
      {phase === 'picking' && <CenterGlow />}
      {burst && <BurstRing key={burst.key} position={burst.pos} onDone={() => setBurst(null)} />}

      <group ref={floatRef}>
        {springs.map((spring, i) => {
          const card = getCard(deckOrder[i])
          const drawnEntry = drawnByCard.get(deckOrder[i])
          const revealing = phase === 'revealing' || phase === 'done'
          // Faces are hidden until reveal: only a drawn card, while revealing/done,
          // gets its real front texture — everything else shows the back.
          const front =
            card && drawnEntry && revealing
              ? cardFace === 'minimal'
                ? getMinimalFaceTexture(card)
                : fronts.get(card.imageKey)
              : undefined
          const idle = phase === 'idle'
          const clickable = idle || (phase === 'done' && !!drawnEntry)
          return (
            <Card
              key={i}
              spring={spring as unknown as CardSpring}
              backTexture={back}
              frontTexture={front}
              interactive={clickable}
              onSelect={(e) => {
                e.stopPropagation()
                if (idle) startShuffle()
                else if (drawnEntry) selectCard(drawnEntry.positionId)
              }}
            />
          )
        })}
      </group>
    </group>
  )
}

/** Soft aura behind the idle hero pile — signals the deck is alive & tappable. */
function IdleGlow() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    const p = 1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.05
    ref.current.scale.set(p, p, 1)
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity =
      0.16 + Math.sin(state.clock.elapsedTime * 1.4) * 0.05
  })
  return (
    <mesh ref={ref} position={[0, 0.7, 0.1]}>
      <circleGeometry args={[2.4, 64]} />
      <meshBasicMaterial color="#f4dc9c" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
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
      <meshBasicMaterial color="#f4dc9c" transparent opacity={0.2} blending={THREE.AdditiveBlending} depthWrite={false} />
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
      <meshBasicMaterial color="#f4dc9c" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  )
}
