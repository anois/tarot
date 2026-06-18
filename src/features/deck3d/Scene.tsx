import { Suspense, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { easing } from 'maath'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { useDivination } from '@/features/divination/divination.store'
import { spreadBounds } from './layout'
import { Deck } from './Deck'
import { Table } from './Table'
import { SlotOutlines } from './SlotOutlines'

const DEFAULT_CAM: [number, number, number] = [0, 0.2, 13.5]
const DEFAULT_LOOK: [number, number, number] = [0, 0.2, 0]

/**
 * Eases the camera between the wide "table" view (idle → revealing) and a
 * framed close-up centered on the spread once the reading is `done`: the board
 * is fit to the viewport (respecting aspect) with a small margin, so it sits
 * centered and fills the freed space instead of hanging in the upper area.
 */
function CameraRig() {
  const phase = useDivination((s) => s.phase)
  const spread = useDivination((s) => s.spread)
  const { camera, size } = useThree()
  const reduced = useReducedMotion()
  const look = useRef(new THREE.Vector3(...DEFAULT_LOOK))
  useFrame((_, dt) => {
    let pos = DEFAULT_CAM
    let target = DEFAULT_LOOK
    if (phase === 'done' && spread) {
      const aspect = size.width / Math.max(1, size.height)
      const fov = (camera as THREE.PerspectiveCamera).fov ?? 45
      const tanV = Math.tan(THREE.MathUtils.degToRad(fov) / 2)
      const b = spreadBounds(spread)
      const m = 1.14 // keep a small, even margin around the board
      const dist = Math.max((b.hh * m) / tanV, (b.hw * m) / (aspect * tanV), 6)
      pos = [b.cx, b.cy, dist]
      target = [b.cx, b.cy, 0]
    }
    const smooth = reduced ? 0.06 : 0.5
    easing.damp3(camera.position, pos, smooth, dt)
    easing.damp3(look.current, target, smooth, dt)
    camera.lookAt(look.current)
  })
  return null
}

// Parallax only makes sense with a hovering mouse — on touch the pointer jumps
// to the last touch point, which feels jittery. Gate it to fine pointers.
const HAS_FINE_POINTER =
  typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches

// Coarse-pointer (touch) devices get a lighter render budget: lower dpr cap,
// a smaller shadow map and fewer sparkles, to stay smooth on phone GPUs.
const COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const DPR_CAP = COARSE ? 1.5 : 2
const SHADOW_SIZE = COARSE ? 1024 : 2048
const SPARKLE_COUNT = COARSE ? 18 : 42

/** Subtly tilts the whole table toward the pointer for a tactile, parallax depth. */
function ParallaxRig({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const reduced = useReducedMotion()
  useFrame((state, dt) => {
    if (!ref.current || reduced || !HAS_FINE_POINTER) return
    easing.dampE(
      ref.current.rotation,
      [state.pointer.y * 0.035, state.pointer.x * 0.045, 0],
      0.6,
      dt,
    )
  })
  return <group ref={ref}>{children}</group>
}

export function Scene() {
  return (
    <Canvas
      dpr={[1, DPR_CAP]}
      shadows
      camera={{ position: [0, 0.2, 13.5], fov: 45 }}
      style={{ touchAction: 'pan-y' }}
    >
      {/* night-950 ground (matches the 2D theme token) */}
      <color attach="background" args={['#0e0a13']} />
      <fog attach="fog" args={['#0e0a13', 16, 30]} />
      <CameraRig />

      <ambientLight intensity={0.42} />
      <hemisphereLight args={['#efe2c4', '#1a1320', 0.5]} />
      <directionalLight
        position={[6, 9, 8]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[SHADOW_SIZE, SHADOW_SIZE]}
        shadow-bias={-0.0004}
        shadow-radius={7}
      >
        <orthographicCamera attach="shadow-camera" args={[-16, 16, 16, -16, 0.5, 40]} />
      </directionalLight>
      {/* cool amethyst rim light for depth against the warm candlelight */}
      <pointLight position={[-8, -2, 7]} intensity={0.5} color="#9b7fd4" />

      <Suspense fallback={null}>
        {/* a calm, near-still starfield — OUTSIDE the parallax rig so it does
            not dart around when the pointer moves */}
        <Sparkles
          count={SPARKLE_COUNT}
          scale={[16, 11, 5]}
          position={[0, 1.5, 2.5]}
          size={1.8}
          speed={0.08}
          noise={0.4}
          opacity={0.45}
          color="#f4dc9c"
        />
        <ParallaxRig>
          <Table />
          <SlotOutlines />
          <Deck />
        </ParallaxRig>
      </Suspense>
    </Canvas>
  )
}
