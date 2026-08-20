import type { AppPresence } from './types'

export const APP_PORT = 5050
export const APP_BASE = import.meta.env.VITE_APP_BASE ?? `http://127.0.0.1:${APP_PORT}`

const PRESENCE_MAX_AGE_MS = 8_000

export function isAppOnline(presence: AppPresence | null | undefined, now = Date.now()): boolean {
  if (!presence?.at) return false
  const seen = Date.parse(presence.at)
  if (Number.isNaN(seen)) return false
  return now - seen <= PRESENCE_MAX_AGE_MS
}
