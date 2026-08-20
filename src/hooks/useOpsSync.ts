import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchOpsState, pingApp, registerAppPresence } from '../api/ops'
import { APP_BASE } from '../config'
import type { AppPresence, DispatchOrder, FieldUpdate } from '../types'

const POLL_MS = 2000

export function useOpsSync() {
  const [dispatches, setDispatches] = useState<DispatchOrder[]>([])
  const [fieldUpdates, setFieldUpdates] = useState<Record<string, FieldUpdate>>({})
  const [appPresence, setAppPresence] = useState<AppPresence | null>(null)
  const [version, setVersion] = useState(0)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const versionRef = useRef(0)

  const refresh = useCallback(async () => {
    try {
      const reachable = await pingApp(APP_BASE)
      if (reachable) {
        const presence = await registerAppPresence(APP_BASE)
        setAppPresence(presence)
      }

      const state = await fetchOpsState()
      const presence = state.app ?? null
      if (presence) setAppPresence(presence)
      if (state.version === versionRef.current && versionRef.current !== 0) {
        setConnected(true)
        setError(null)
        return
      }
      versionRef.current = state.version
      setVersion(state.version)
      setDispatches(state.dispatches ?? [])
      setFieldUpdates(state.field_updates ?? {})
      setConnected(true)
      setError(null)
    } catch (err) {
      setConnected(false)
      setError(err instanceof Error ? err.message : 'Sync operacional indisponível')
    }
  }, [])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => {
      void refresh()
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [refresh])

  return {
    dispatches,
    fieldUpdates,
    appPresence,
    version,
    connected,
    error,
    refresh,
  }
}
