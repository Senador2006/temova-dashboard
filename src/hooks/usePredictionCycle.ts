import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchHealth, predictPoint } from '../api/client'
import { HIGHWAY_SEGMENTS, getSegmentById } from '../data/motivaSegments'
import type { HealthStatus, SegmentPrediction } from '../types'

const INTERVAL_MS = 5 * 60 * 1000
const CONCURRENCY = 4

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0

  async function run(): Promise<void> {
    while (next < items.length) {
      const current = next
      next += 1
      results[current] = await worker(items[current], current)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => run()),
  )
  return results
}

/** Movimentação ainda não vem do modelo — placeholder operacional do mapa. */
function placeholderTraffic(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) % 10000
  return 800 + (hash % 4200)
}

export function usePredictionCycle() {
  const [predictions, setPredictions] = useState<Record<string, SegmentPrediction>>({})
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [nextRunAt, setNextRunAt] = useState<Date | null>(null)
  const [cycleCount, setCycleCount] = useState(0)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const runningRef = useRef(false)

  const runCycle = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    setLoading(true)
    setError(null)
    setProgress({ done: 0, total: HIGHWAY_SEGMENTS.length })

    try {
      const healthStatus = await fetchHealth()
      setHealth(healthStatus)

      const results = await mapPool(
        HIGHWAY_SEGMENTS,
        CONCURRENCY,
        async (segment) => {
          const { prediction, climate } = await predictPoint(segment.id)
          setProgress((prev) => ({ ...prev, done: prev.done + 1 }))
          const meta = getSegmentById(segment.id)
          return {
            ...prediction,
            updatedAt: new Date().toISOString(),
            climate,
            movimentacaoAtual: placeholderTraffic(segment.id),
            local: meta?.local ?? segment.road,
          } satisfies SegmentPrediction
        },
      )

      const nextMap: Record<string, SegmentPrediction> = {}
      for (const item of results) {
        nextMap[item.id_ponto] = item
      }

      setPredictions(nextMap)
      setLastUpdated(new Date())
      setCycleCount((c) => c + 1)
      setNextRunAt(new Date(Date.now() + INTERVAL_MS))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha no ciclo de previsão'
      setError(message)
      setNextRunAt(new Date(Date.now() + INTERVAL_MS))
    } finally {
      setLoading(false)
      runningRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const safeRun = async () => {
      if (cancelled) return
      await runCycle()
    }

    void safeRun()
    const timer = window.setInterval(() => {
      void safeRun()
    }, INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [runCycle])

  return {
    predictions,
    health,
    loading,
    error,
    lastUpdated,
    nextRunAt,
    cycleCount,
    progress,
    intervalMs: INTERVAL_MS,
    refreshNow: runCycle,
  }
}
