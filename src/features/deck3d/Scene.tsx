import { Suspense, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { easing } from 'maath'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { Deck } from './Deck'
import { Table } from './Table'
import { SlotOutlines } from './SlotOutlines'

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
      [state.pointer.y * 0.07, state.pointer.x * 0.09, 0],
      0.35,
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
        <ParallaxRig>
          <Table />
          <Sparkles
            count={SPARKLE_COUNT}
            scale={[16, 11, 5]}
            position={[0, 1.5, 2.5]}
            size={2.4}
            speed={0.28}
            opacity={0.5}
            color="#f4dc9c"
          />
          <SlotOutlines />
          <Deck />
        </ParallaxRig>
      </Suspense>
    </Canvas>
  )
}
