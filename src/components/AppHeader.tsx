import { useEffect, useState } from 'react'
import { APP_BASE } from '../config'
import type { HealthStatus } from '../types'
import { ALERT_COLORS, ALERT_LABELS } from '../utils/alertColors'

interface AppHeaderProps {
  health: HealthStatus | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
  nextRunAt: Date | null
  progress: { done: number; total: number }
  onRefresh: () => void
  counts: Record<string, number>
  opsConnected?: boolean
  appOnline?: boolean
  appUrl?: string
}

function formatCountdown(nextRunAt: Date | null): string {
  if (!nextRunAt) return '—'
  const ms = Math.max(0, nextRunAt.getTime() - Date.now())
  const min = Math.floor(ms / 60000)
  const sec = Math.floor((ms % 60000) / 1000)
  return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function useNow(ms: number) {
  const [, setNow] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setNow((n) => n + 1), ms)
    return () => window.clearInterval(id)
  }, [ms])
}

export function AppHeader({
  health,
  loading,
  error,
  lastUpdated,
  nextRunAt,
  progress,
  onRefresh,
  counts,
  opsConnected = false,
  appOnline = false,
  appUrl = APP_BASE,
}: AppHeaderProps) {
  useNow(1000)

  return (
    <header className="app-header">
      <div className="brand">
        <p className="brand-mark">te-mova</p>
        <h1>Dashboard de vegetação</h1>
        <p className="brand-sub">Dados, equipes e mapa — sync ao vivo com o app</p>
      </div>

      <div className="header-stats">
        <div>
          <span>Modelo</span>
          <strong>{health ? `v${health.model_version}` : loading ? '…' : 'offline'}</strong>
        </div>
        <div>
          <span>App</span>
          <strong className={appOnline ? 'sync-on' : 'sync-off'}>
            {appOnline ? (
              <a href={appUrl} target="_blank" rel="noreferrer" className="app-link">
                <span className="app-link-full">{appUrl}</span>
                <span className="app-link-short">online</span>
              </a>
            ) : opsConnected ? (
              <>
                <span className="app-link-full">aguardando {appUrl}</span>
                <span className="app-link-short">aguardando</span>
              </>
            ) : (
              'offline'
            )}
          </strong>
        </div>
        <div>
          <span>Ciclo</span>
          <strong>{lastUpdated ? lastUpdated.toLocaleTimeString('pt-BR') : '—'}</strong>
        </div>
        <div>
          <span>Próximo</span>
          <strong className="mono">{formatCountdown(nextRunAt)}</strong>
        </div>
      </div>

      <div className="header-legend">
        {(Object.keys(ALERT_COLORS) as Array<keyof typeof ALERT_COLORS>).map((nivel) => (
          <span key={nivel}>
            <i style={{ background: ALERT_COLORS[nivel] }} />
            {ALERT_LABELS[nivel]} <em>{counts[nivel] ?? 0}</em>
          </span>
        ))}
      </div>

      <div className="header-actions">
        <button type="button" className="btn-primary" onClick={onRefresh} disabled={loading}>
          {loading ? `${progress.done}/${progress.total}…` : 'Atualizar agora'}
        </button>
        {error && <p className="error-inline">{error}</p>}
      </div>
    </header>
  )
}
