import { useEffect, useMemo, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { DataArea } from './components/DataArea'
import { HighwayMap } from './components/HighwayMap'
import { TeamArea } from './components/TeamArea'
import { applyFieldUpdates, createDispatch, patchDispatch, publishPredictions } from './api/ops'
import { FIELD_TEST_ID, buildFieldTestPrediction } from './data/fieldTest'
import { getSegmentById, segmentDisplayName } from './data/motivaSegments'
import { isAppOnline, APP_BASE } from './config'
import { useOpsSync } from './hooks/useOpsSync'
import { usePredictionCycle } from './hooks/usePredictionCycle'
import type { DispatchOrder, DispatchStatus } from './types'

const NEXT_STATUS: Record<DispatchStatus, DispatchStatus | null> = {
  enviada: 'confirmada',
  confirmada: 'em_andamento',
  em_andamento: 'concluida',
  concluida: null,
  interrompida: 'confirmada',
}

export default function App() {
  const {
    predictions,
    health,
    loading,
    error,
    lastUpdated,
    nextRunAt,
    progress,
    refreshNow,
  } = usePredictionCycle()

  const {
    dispatches,
    fieldUpdates,
    appPresence,
    connected,
    error: opsError,
    refresh: refreshOps,
  } = useOpsSync()

  const appUrl = APP_BASE
  const appOnline = isAppOnline(appPresence)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dispatchError, setDispatchError] = useState<string | null>(null)

  const livePredictions = useMemo(() => {
    const merged = applyFieldUpdates(predictions, fieldUpdates)
    merged[FIELD_TEST_ID] = buildFieldTestPrediction()
    return merged
  }, [predictions, fieldUpdates])

  const counts = useMemo(() => {
    const base: Record<string, number> = {
      verde: 0,
      amarelo: 0,
      vermelho: 0,
      laranja: 0,
    }
    for (const pred of Object.values(livePredictions)) {
      base[pred.nivel_alerta] = (base[pred.nivel_alerta] ?? 0) + 1
    }
    return base
  }, [livePredictions])

  useEffect(() => {
    if (Object.keys(livePredictions).length === 0) return
    void publishPredictions(livePredictions).catch(() => undefined)
  }, [livePredictions])

  async function handleDispatch(
    order: Omit<DispatchOrder, 'id' | 'createdAt' | 'status' | 'notifications'>,
  ) {
    const segment = getSegmentById(order.idPonto)
    const pred = livePredictions[order.idPonto]
    const crescimento =
      pred?.fieldTest?.alturaPrevistaD4Cm ?? order.crescimentoCm
    try {
      setDispatchError(null)
      await createDispatch({
        idPonto: order.idPonto,
        equipe: order.equipe,
        situacao: order.situacao,
        nivelAlerta: order.nivelAlerta,
        crescimentoCm: crescimento,
        limitePodaCm: order.limitePodaCm ?? 10,
        limiteAlertaCm: order.limiteAlertaCm ?? 9,
        road: segment?.road ?? order.idPonto,
        km: segment?.km ?? 0,
        local: segment?.local ?? '',
        sentido: segment?.local ?? 'Operação de campo',
        titulo: segmentDisplayName(order.idPonto),
      })
      await refreshOps()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao enviar ao app'
      setDispatchError(message)
      console.error(err)
    }
  }

  async function handleAdvance(id: string) {
    const current = dispatches.find((d) => d.id === id)
    if (!current) return
    const nextStatus = NEXT_STATUS[current.status]
    if (!nextStatus) return
    try {
      await patchDispatch(id, { status: nextStatus, source: 'dashboard' })
      await refreshOps()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="app-shell">
      <AppHeader
        health={health}
        loading={loading}
        error={error ?? opsError}
        lastUpdated={lastUpdated}
        nextRunAt={nextRunAt}
        progress={progress}
        onRefresh={() => void refreshNow()}
        counts={counts}
        opsConnected={connected}
        appOnline={appOnline}
        appUrl={appUrl}
      />

      <main className="workspace">
        <DataArea
          selectedId={selectedId}
          onSelect={setSelectedId}
          predictions={livePredictions}
        />

        <section className="map-pane" aria-label="Área do mapa">
          <HighwayMap
            predictions={livePredictions}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>

        <TeamArea
          selectedId={selectedId}
          onSelect={setSelectedId}
          predictions={livePredictions}
          dispatches={dispatches}
          opsConnected={connected}
          appOnline={appOnline}
          appUrl={appUrl}
          dispatchError={dispatchError}
          onDispatch={(order) => void handleDispatch(order)}
          onAdvance={(id) => void handleAdvance(id)}
        />
      </main>
    </div>
  )
}
