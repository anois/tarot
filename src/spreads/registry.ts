import type { Spread } from './types'
import { BUILTIN_SPREADS } from './builtins'

export { BUILTIN_SPREADS }

export const BUILTIN_BY_ID: ReadonlyMap<string, Spread> = new Map(
  BUILTIN_SPREADS.map((s) => [s.id, s]),
)

export function getBuiltinSpread(id: string): Spread | undefined {
  return BUILTIN_BY_ID.get(id)
}

export function isBuiltinId(id: string): boolean {
  return BUILTIN_BY_ID.has(id)
}
