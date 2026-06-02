import { db } from '@/db/db'
import type { Reading } from './types'

export async function listReadings(): Promise<Reading[]> {
  return db.readings.orderBy('createdAt').reverse().toArray()
}

export async function getReading(id: string): Promise<Reading | undefined> {
  return db.readings.get(id)
}

export async function putReading(reading: Reading): Promise<void> {
  await db.readings.put(reading)
}

export async function deleteReading(id: string): Promise<void> {
  await db.readings.delete(id)
}
