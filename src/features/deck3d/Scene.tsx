import { Suspense, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
import { easing } from 'maath'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { Deck } from './Deck'
import { Table } from './Table'
import { SlotOutlines } from './SlotOutlines'

/** Subtly tilts the whole table toward the pointer for a tactile, parallax depth. */
function ParallaxRig({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const reduced = useReducedMotion()
  useFrame((state, dt) => {
    if (!ref.current || reduced) return
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
    <Canvas dpr={[1, 2]} shadows camera={{ position: [0, 0.2, 13.5], fov: 45 }}>
      <color attach="background" args={['#07061a']} />
      <fog attach="fog" args={['#07061a', 16, 30]} />

      <ambientLight intensity={0.42} />
      <hemisphereLight args={['#cbd5ff', '#161228', 0.5]} />
      <directionalLight
        position={[6, 9, 8]}
        intensity={1.7}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={7}
      >
        <orthographicCamera attach="shadow-camera" args={[-16, 16, 16, -16, 0.5, 40]} />
      </directionalLight>
      <pointLight position={[-8, -2, 7]} intensity={0.5} color="#7c6cff" />

      <Suspense fallback={null}>
        <ParallaxRig>
          <Table />
          <Sparkles count={42} scale={[16, 11, 5]} position={[0, 1.5, 2.5]} size={2.4} speed={0.28} opacity={0.5} color="#e8c468" />
          <SlotOutlines />
          <Deck />
        </ParallaxRig>
      </Suspense>
    </Canvas>
  )
}
