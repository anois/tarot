import type { Spread } from './types'
import { spreadSchema } from './schema'

export interface ValidationIssue {
  path: string
  message: string
}

export type ValidationResult =
  | { ok: true; spread: Spread }
  | { ok: false; issues: ValidationIssue[] }

/** Validate an untrusted object against tarot-spread/1.x. Returns the typed
 *  Spread on success, or Chinese field-level issues on failure. */
export function validateSpread(input: unknown): ValidationResult {
  const result = spreadSchema.safeParse(input)
  if (result.success) {
    return { ok: true, spread: result.data as Spread }
  }
  const issues = result.error.issues.map((i) => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
  }))
  return { ok: false, issues }
}
