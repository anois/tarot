/**
 * Cryptographically-backed randomness with no modulo bias. Everything that must
 * be FAIR (shuffle, reversed orientation) goes through here — never Math.random
 * (not uniform across engines, not defensible) and never array.sort with a random
 * comparator (provably biased).
 */

const TWO_POW_32 = 0x1_0000_0000

/** A source of uniform uint32 values. Pluggable so tests can seed it. */
export interface RandomSource {
  /** A uniformly random integer in [0, 2^32). */
  nextUint32(): number
}

export const cryptoSource: RandomSource = {
  nextUint32() {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0]
  },
}

/** Unbiased integer in [0, maxExclusive) via rejection sampling. */
export function randInt(maxExclusive: number, src: RandomSource = cryptoSource): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new RangeError(`maxExclusive must be a positive integer, got ${maxExclusive}`)
  }
  if (maxExclusive === 1) return 0
  // Largest multiple of range that fits in a uint32; reject the tail to avoid bias.
  const maxValid = Math.floor(TWO_POW_32 / maxExclusive) * maxExclusive
  let x: number
  do {
    x = src.nextUint32()
  } while (x >= maxValid)
  return x % maxExclusive
}

/** Uniform float in [0, 1). */
export function randFloat(src: RandomSource = cryptoSource): number {
  return src.nextUint32() / TWO_POW_32
}

/** Bernoulli(p). p<=0 → always false, p>=1 → always true; default fair coin. */
export function randBool(p = 0.5, src: RandomSource = cryptoSource): boolean {
  if (p <= 0) return false
  if (p >= 1) return true
  return randFloat(src) < p
}

/**
 * Deterministic PRNG (mulberry32) for tests and for cosmetic-only randomness
 * (e.g. shuffle-animation jitter) where reproducibility matters. NOT for fairness.
 */
export function mulberry32(seed: number): RandomSource {
  let a = seed >>> 0
  return {
    nextUint32() {
      a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return (t ^ (t >>> 14)) >>> 0
    },
  }
}
