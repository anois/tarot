import * as THREE from 'three'
import { CARDS } from '@/deck/cards'
import type { Spread, SpreadPosition } from '@/spreads/types'

/** Mesh i in the picking deck corresponds to deckOrder[i]. */
export const CARD_IDS: string[] = CARDS.map((c) => c.id)

/** Major Arcana only (22 cards) — for the "仅大阿卡纳" reading mode. */
export const MAJOR_CARD_IDS: string[] = CARDS.filter((c) => c.arcana === 'major').map((c) => c.id)

// Card dimensions in world units (RWS aspect ≈ 1.72).
export const CARD_W = 0.62
export const CARD_H = 1.07
export const CARD_T = 0.014

export type Vec3 = [number, number, number]
export interface Transform {
  position: Vec3
  rotation: Vec3
  scale: number
}

/** rotation.y that turns the front (+Z face) away so the back faces the camera. */
export const FACE_DOWN = Math.PI
export const FACE_UP = 0

const degToRad = THREE.MathUtils.degToRad

// ── Picking-deck transforms ───────────────────────────────────────────────
export function stackTransform(i: number): Transform {
  return { position: [0, 0.6, i * 0.006], rotation: [0, FACE_DOWN, 0], scale: 1 }
}

/**
 * Idle "hero" pile: a prominent, neatly-stacked deck with visible thickness,
 * centred and tilted slightly so it reads as a real deck of cards waiting to be
 * shuffled (rather than a lone thumbnail). The whole pile breathes/floats and is
 * tappable (see Deck) — the single focal object of the idle screen.
 */
export function idleStackTransform(i: number, n: number): Transform {
  const t = n > 1 ? i / (n - 1) : 0 // 0 (bottom) .. 1 (top)
  return {
    position: [-0.06 + t * 0.13, 0.55 + t * 0.11, i * 0.012],
    rotation: [0, FACE_DOWN, -0.05],
    scale: 2.0,
  }
}

/** Loose scattered ring used mid-shuffle. */
export function scatterTransform(i: number, n: number): Transform {
  const a = (i / n) * Math.PI * 2
  const r = 2.2 + (i % 5) * 0.18
  return {
    position: [Math.cos(a) * r, 0.6 + Math.sin(a) * r * 0.55, i * 0.01],
    rotation: [0, FACE_DOWN, a * 0.5],
    scale: 1,
  }
}

const FAN_TOTAL = degToRad(118)
const FAN_R = 7.2
const FAN_Y = 1.1
export function fanTransform(i: number, n: number): Transform {
  const a = (n <= 1 ? 0 : i / (n - 1) - 0.5) * FAN_TOTAL
  return {
    position: [Math.sin(a) * FAN_R, Math.cos(a) * FAN_R - FAN_R + FAN_Y, i * 0.012],
    rotation: [0, FACE_DOWN, -a],
    scale: 1,
  }
}

export function fanHoverTransform(i: number, n: number): Transform {
  const base = fanTransform(i, n)
  return {
    position: [base.position[0], base.position[1] + 0.8, 3.2],
    rotation: [0, FACE_DOWN, 0],
    scale: 1.14,
  }
}

/**
 * Coverflow ribbon for browsing the face-down deck. `d = i - centered` is the
 * signed distance from the focused card. The focused card sits forward, large,
 * and straight; neighbours recede along z, tilt away around Y, and shrink — so
 * there is always one clearly-presented card instead of a buried fan edge.
 */
const COVERFLOW_WINDOW = 7
/** The browsing ribbon lives along the BOTTOM of the view (RIBBON_Y), so the
 *  spread board above stays clear and picked cards visibly fly up into it. */
const RIBBON_Y = -2.4
export function coverflowTransform(d: number): Transform {
  const sign = Math.sign(d)
  const ad = Math.abs(d)
  if (ad < 0.5) {
    return { position: [0, RIBBON_Y + 0.35, 3.6], rotation: [0, FACE_DOWN, 0], scale: 1.32 }
  }
  const c = Math.min(ad, COVERFLOW_WINDOW)
  const x = sign * (1.25 + (c - 1) * 0.62)
  const y = RIBBON_Y - c * 0.04
  const z = 3.4 - c * 0.6
  // Gentle album-coverflow tilt (~30° max) — never past edge-on, so backs stay toward camera.
  const tiltY = FACE_DOWN + sign * Math.min(ad, 4) * 0.14
  const scale = Math.max(0.58, 1.32 - c * 0.13)
  return { position: [x, y, z], rotation: [0, tiltY, sign * 0.05], scale }
}

/** A drawn card sitting in its spread slot — face-down while picking, face-up
 *  (with reversed 180°) once revealed. Shared by the unified deck. */
export function slotTransform(
  pos: SpreadPosition,
  plane: PlaneSpec,
  scale: number,
  opts: { faceUp: boolean; reversed: boolean },
): Transform {
  const x = (pos.x - 0.5) * plane.width
  const y = (0.5 - pos.y) * plane.height + BOARD_OFFSET_Y
  // Depth = paint-order layer (primary) + a per-card index tiebreaker, so cards
  // that share the same `z` (e.g. a whole column) are never coplanar and stack
  // stably instead of z-fighting/flickering. The tiebreaker exceeds a card's
  // scaled thickness, so overlapping faces never intersect.
  const z = pos.z * 0.05 + pos.index * 0.02
  const baseZ = -degToRad(pos.rotation)
  if (!opts.faceUp) {
    return { position: [x, y, z], rotation: [0, FACE_DOWN, baseZ], scale }
  }
  return { position: [x, y, z], rotation: [0, FACE_UP, baseZ + (opts.reversed ? Math.PI : 0)], scale }
}

/** Selected cards rise to a holding row near the top while picking continues. */
export function holdTransform(slot: number, total: number): Transform {
  const x = (slot - (total - 1) / 2) * 1.45
  return { position: [x, 4.4, 4 + slot * 0.01], rotation: [0, FACE_DOWN, 0], scale: 0.92 }
}

/** Discard pile (unpicked cards slide away once the reading is revealed). */
export function discardTransform(i: number): Transform {
  return { position: [0, -7.5, i * 0.004], rotation: [0, FACE_DOWN, 0], scale: 0.6 }
}

// ── Spread-layout transforms (shared mapping: normalized [0,1] → world) ─────
export interface PlaneSpec {
  width: number
  height: number
}

/** The spread board sits in the upper portion of the view (above the ribbon). */
export const BOARD_OFFSET_Y = 1.7

export function spreadPlane(spread: Spread): PlaneSpec {
  const ar = spread.aspectRatio ?? 1
  // Clamp width so wide spreads stay inside the camera frustum.
  const width = Math.min(6.6 * ar, 10.4)
  return { width, height: width / ar }
}

/** Scale that makes a card fill its designated slot (matches the 2D preview). */
export function spreadCardScale(spread: Spread, plane: PlaneSpec): number {
  return (spread.card.widthRatio * plane.width) / CARD_W
}

/**
 * World-space bounding box of the laid-out board (card rectangles, incl.
 * rotation + BOARD_OFFSET_Y). Used to frame the camera onto the spread once the
 * reading is revealed. Returns the box center and half-extents.
 */
export function spreadBounds(spread: Spread): { cx: number; cy: number; hw: number; hh: number } {
  const plane = spreadPlane(spread)
  const scale = spreadCardScale(spread, plane)
  const cw = CARD_W * scale
  const ch = CARD_H * scale
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  for (const p of spread.positions) {
    const x = (p.x - 0.5) * plane.width
    const y = (0.5 - p.y) * plane.height + BOARD_OFFSET_Y
    const r = degToRad(p.rotation)
    // half-extents of the rotated card's axis-aligned bounding box
    const hw = 0.5 * (Math.abs(cw * Math.cos(r)) + Math.abs(ch * Math.sin(r)))
    const hh = 0.5 * (Math.abs(cw * Math.sin(r)) + Math.abs(ch * Math.cos(r)))
    minX = Math.min(minX, x - hw)
    maxX = Math.max(maxX, x + hw)
    minY = Math.min(minY, y - hh)
    maxY = Math.max(maxY, y + hh)
  }
  return { cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, hw: (maxX - minX) / 2, hh: (maxY - minY) / 2 }
}

export function spreadTransform(
  pos: SpreadPosition,
  reversed: boolean,
  plane: PlaneSpec,
  scale: number,
): Transform {
  const x = (pos.x - 0.5) * plane.width
  const y = (0.5 - pos.y) * plane.height
  const z = pos.z * 0.03
  // screen rotation is clockwise → negative world Z; reversed flips 180°.
  const rotZ = -degToRad(pos.rotation) + (reversed ? Math.PI : 0)
  return { position: [x, y, z], rotation: [0, FACE_UP, rotZ], scale }
}

/** Where a revealing card starts before it deals out (face-down at center). */
export function revealStartTransform(scale: number): Transform {
  return { position: [0, 0.6, 0.2], rotation: [0, FACE_DOWN, 0], scale: scale * 0.85 }
}
