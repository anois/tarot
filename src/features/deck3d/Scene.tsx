import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Deck } from './Deck'
import { SlotOutlines } from './SlotOutlines'

export function Scene() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 0.2, 13.5], fov: 45 }} shadows>
      <color attach="background" args={['#0b0a1a']} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#cbd5ff', '#1a1530', 0.55]} />
      <directionalLight position={[4, 7, 9]} intensity={1.5} castShadow />
      <pointLight position={[-7, -3, 6]} intensity={0.6} color="#7c6cff" />
      <Suspense fallback={null}>
        <SlotOutlines />
        <Deck />
      </Suspense>
    </Canvas>
  )
}
