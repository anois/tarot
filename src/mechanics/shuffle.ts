import { cryptoSource, randInt, type RandomSource } from './rng'

/**
 * Fisher-Yates (Durstenfeld) shuffle. Produces a uniformly random permutation:
 * every ordering is equally likely. Returns a NEW array; the input is untouched.
 *
 * The inclusive `randInt(i + 1)` (j in [0, i]) is essential — sampling [0, i)
 * instead biases the result.
 */
export function shuffle<T>(input: readonly T[], src: RandomSource = cryptoSource): T[] {
  const a = input.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1, src)
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}
