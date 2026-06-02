import { db } from '@/db/db'
import { newUuid } from '@/lib/uuid'
import type { Spread, StoredSpread } from './types'

export async function listStoredSpreads(): Promise<StoredSpread[]> {
  return db.spreads.orderBy('updatedAt').reverse().toArray()
}

export async function getStoredSpread(uuid: string): Promise<StoredSpread | undefined> {
  return db.spreads.get(uuid)
}

export interface SaveSpreadOptions {
  /** Update an existing stored spread instead of creating a new one. */
  uuid?: string
  /** If derived from a built-in (via "duplicate to edit"). */
  builtinId?: string
}

export async function saveSpread(
  spread: Spread,
  opts: SaveSpreadOptions = {},
): Promise<StoredSpread> {
  const now = Date.now()
  const existing = opts.uuid ? await db.spreads.get(opts.uuid) : undefined
  const stored: StoredSpread = {
    uuid: opts.uuid ?? newUuid(),
    spread,
    builtinId: opts.builtinId ?? existing?.builtinId,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await db.spreads.put(stored)
  return stored
}

export async function deleteStoredSpread(uuid: string): Promise<void> {
  await db.spreads.delete(uuid)
}
