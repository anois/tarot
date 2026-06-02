import { useEffect, useState } from 'react'
import { usePrefs } from '@/store/prefs.store'

const QUERY = '(prefers-reduced-motion: reduce)'

/** True if the OS prefers reduced motion or the user forced it in prefs. */
export function useReducedMotion(): boolean {
  const forced = usePrefs((s) => s.forceReducedMotion)
  const [osReduced, setOsReduced] = useState(
    () => typeof matchMedia !== 'undefined' && matchMedia(QUERY).matches,
  )
  useEffect(() => {
    const mq = matchMedia(QUERY)
    const handler = () => setOsReduced(mq.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return forced || osReduced
}
