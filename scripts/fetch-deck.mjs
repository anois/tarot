// Downloads the 78 Rider-Waite-Smith card faces and renames them to our stable
// imageKey scheme (major_00.jpg, cups_page.jpg, ...). Run: `node scripts/fetch-deck.mjs`.
//
// Source: metabismuth/tarot-json (uniform 350x600 JPGs). Public domain in the US.
// NOTE: For production, verify these are the 1909 Pamela Colman Smith edition (not
// the still-copyrighted 1971 U.S. Games recoloring) or swap in the CC0 luciellaes
// pack — the imageKey↔file mapping is stable so this is a drop-in replacement.
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'deck')
const RAW = 'https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards'

const SUIT = { c: 'cups', p: 'pentacles', s: 'swords', w: 'wands' }
const COURT = { 11: 'page', 12: 'knight', 13: 'queen', 14: 'king' }

function targetName(src) {
  const prefix = src[0]
  const num = src.slice(1)
  if (prefix === 'm') return `major_${num}`
  const suit = SUIT[prefix]
  const n = Number(num)
  const rank = COURT[n] ?? String(n).padStart(2, '0')
  return `${suit}_${rank}`
}

function sources() {
  const list = []
  for (let i = 0; i <= 21; i++) list.push(`m${String(i).padStart(2, '0')}`)
  for (const p of ['c', 'p', 's', 'w']) {
    for (let i = 1; i <= 14; i++) list.push(`${p}${String(i).padStart(2, '0')}`)
  }
  return list
}

await mkdir(OUT, { recursive: true })
const srcs = sources()
let done = 0
await Promise.all(
  srcs.map(async (src) => {
    const res = await fetch(`${RAW}/${src}.jpg`)
    if (!res.ok) throw new Error(`${src}: HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    await writeFile(join(OUT, `${targetName(src)}.jpg`), buf)
    done++
  }),
)
console.log(`Downloaded ${done}/${srcs.length} card faces to public/deck/`)
