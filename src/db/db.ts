import Dexie, { type EntityTable } from 'dexie'
import type { StoredSpread } from '@/spreads/types'
import type { Reading } from '@/reading/types'

/** Single app database. Spreads + readings live here (not localStorage) because
 *  they can carry large data-URL background images and rich snapshots. */
export const db = new Dexie('tarot') as Dexie & {
  spreads: EntityTable<StoredSpread, 'uuid'>
  readings: EntityTable<Reading, 'id'>
}

db.version(1).stores({
  spreads: '&uuid, builtinId, updatedAt',
  readings: '&id, createdAt, updatedAt',
})
