import { useMemo, type CSSProperties } from 'react'

/** Tiny seeded PRNG so the starfield is deterministic (no Math.random). */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ivory · candle-gold · faint amethyst
const STAR_COLORS = ['#fffdf5', '#f4dc9c', '#cbbceb']

/**
 * Seamless, code-driven site background: a slow drifting candlelit aurora plus a
 * generated twinkling starfield. Positions are percentage-based and the aurora
 * blobs are large + soft, so there are no tiled images and no boundary seams.
 * Fixed behind all content (z-0); respects prefers-reduced-motion via index.css.
 */
export function Backdrop() {
  const stars = useMemo(() => {
    const rand = mulberry32(0x5eed1e)
    return Array.from({ length: 90 }, () => {
      const tint = rand()
      return {
        x: rand() * 100,
        y: rand() * 100,
        size: 0.6 + rand() * 1.8,
        delay: rand() * 6,
        dur: 4 + rand() * 5,
        opacity: 0.3 + rand() * 0.55,
        color: STAR_COLORS[tint < 0.6 ? 0 : tint < 0.85 ? 1 : 2],
      }
    })
  }, [])

  return (
    <div className="backdrop" aria-hidden>
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />
      <div className="starfield">
        {stars.map((st, i) => (
          <span
            key={i}
            className="star"
            style={
              {
                left: `${st.x}%`,
                top: `${st.y}%`,
                width: st.size,
                height: st.size,
                color: st.color,
                background: st.color,
                animationDelay: `${st.delay}s`,
                animationDuration: `${st.dur}s`,
                '--star-o': st.opacity,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="backdrop-grain" />
      <div className="backdrop-vignette" />
    </div>
  )
}
