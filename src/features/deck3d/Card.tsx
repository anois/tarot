import { useMemo } from 'react'
import * as THREE from 'three'
import { animated, type SpringValue } from '@react-spring/three'
import type { ThreeEvent } from '@react-three/fiber'
import { CARD_H, CARD_T, CARD_W, type Vec3 } from './layout'

export interface CardSpring {
  position: SpringValue<Vec3>
  rotation: SpringValue<Vec3>
  scale: SpringValue<number>
}

interface CardProps {
  spring: CardSpring
  backTexture: THREE.Texture
  frontTexture?: THREE.Texture | null
  edgeColor?: string
  interactive?: boolean
  onOver?: (e: ThreeEvent<PointerEvent>) => void
  onOut?: (e: ThreeEvent<PointerEvent>) => void
  onSelect?: (e: ThreeEvent<MouseEvent>) => void
}

/** A single tarot card: a thin box with front-art (+Z), card-back (−Z) and edges. */
export function Card({
  spring,
  backTexture,
  frontTexture,
  edgeColor = '#e9e0c4',
  interactive,
  onOver,
  onOut,
  onSelect,
}: CardProps) {
  const materials = useMemo(() => {
    const edge = new THREE.MeshStandardMaterial({ color: edgeColor, roughness: 0.75 })
    const front = new THREE.MeshStandardMaterial({
      map: frontTexture ?? backTexture,
      roughness: 0.55,
    })
    const back = new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.55 })
    // BoxGeometry group order: +X, −X, +Y, −Y, +Z(front), −Z(back)
    return [edge, edge, edge, edge, front, back]
  }, [frontTexture, backTexture, edgeColor])

  return (
    <animated.group
      position={spring.position as unknown as Vec3}
      rotation={spring.rotation as unknown as [number, number, number]}
      scale={spring.scale as unknown as number}
      onPointerOver={interactive ? onOver : undefined}
      onPointerOut={interactive ? onOut : undefined}
      onClick={interactive ? onSelect : undefined}
    >
      <mesh castShadow receiveShadow material={materials}>
        <boxGeometry args={[CARD_W, CARD_H, CARD_T]} />
      </mesh>
    </animated.group>
  )
}
