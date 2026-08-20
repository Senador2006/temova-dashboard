import { useMemo, useState, type FormEvent } from 'react'
import { APP_BASE } from '../config'
import { SELECTABLE_SEGMENTS, getSegmentById, segmentDisplayName } from '../data/motivaSegments'
import type { DispatchOrder, DispatchStatus, SegmentPrediction, TeamNotification } from '../types'
import { ALERT_LABELS, colorForNivel } from '../utils/alertColors'

const TEAMS = ['Equipe Delta', 'Equipe Alpha', 'Equipe Beta', 'Equipe Gama']

interface TeamAreaProps {
  selectedId: string | null
  onSelect: (id: string) => void
  predictions: Record<string, SegmentPrediction>
  dispatches: DispatchOrder[]
  opsConnected: boolean
  appOnline?: boolean
  appUrl?: string
  dispatchError?: string | null
  onDispatch: (order: Omit<DispatchOrder, 'id' | 'createdAt' | 'status' | 'notifications'>) => void
  onAdvance: (id: string) => void
}

const STATUS_LABEL: Record<DispatchStatus, string> = {
  enviada: 'Enviada ao app',
  confirmada: 'Equipe confirmou',
  em_andamento: 'Poda em andamento',
  concluida: 'Finalizada',
  interrompida: 'Interrompida',
}

export function TeamArea({
  selectedId,
  onSelect,
  predictions,
  dispatches,
  opsConnected,
  appOnline = false,
  appUrl = APP_BASE,
  dispatchError,
  onDispatch,
  onAdvance,
}: TeamAreaProps) {
  const [equipe, setEquipe] = useState(TEAMS[0])
  const [note, setNote] = useState('')
  const selected = selectedId ? predictions[selectedId] : null
  const segment = selectedId ? getSegmentById(selectedId) : undefined

  const situacao = useMemo(() => {
    if (!selectedId || !segment) return ''
    if (!selected) return `${segment.id} — aguardando previsão do modelo.`
    if (selected.fieldTest) {
      return `Teste de campo · +${selected.fieldTest.crescimentoPrevisto2dCm.toFixed(1)} cm previstos`
    }
    return `${ALERT_LABELS[selected.nivel_alerta]} · ${selected.crescimento_acumulado_cm.toFixed(1)} cm`
  }, [selected, selectedId, segment])

  const suggested = useMemo(() => {
    return Object.values(predictions)
      .filter((p) => p.acima_limite_poda || p.alerta_preventivo)
      .sort((a, b) => b.crescimento_acumulado_cm - a.crescimento_acumulado_cm)[0]
  }, [predictions])

  const notifications = useMemo(() => {
    return dispatches
      .flatMap((d) => d.notifications.map((n) => ({ ...n, dispatch: d })))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 6)
  }, [dispatches])

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selectedId || !selected) return
    onDispatch({
      idPonto: selectedId,
      equipe,
      situacao: note.trim() || situacao,
      nivelAlerta: selected.nivel_alerta,
      crescimentoCm: selected.crescimento_acumulado_cm,
      limitePodaCm: selected.limite_poda_cm,
      limiteAlertaCm: selected.limite_alerta_cm,
    })
    setNote('')
  }

  return (
    <section className="panel team-area" aria-label="Designação de equipe">
      <header className="panel-head">
        <p className="panel-kicker">Designação de equipe</p>
        <h2>Controle gerencial</h2>
        <p className="panel-desc">Envie a tarefa ao app. O status volta ao vivo.</p>
        <p className={`ops-badge ${appOnline ? 'on' : 'off'}`}>
          {appOnline ? (
            <>
              App conectado ·{' '}
              <a href={appUrl} target="_blank" rel="noreferrer">
                <span className="app-link-full">{appUrl}</span>
                <span className="app-link-short">abrir</span>
              </a>
            </>
          ) : opsConnected ? (
            <>
              <span className="app-link-full">
                Aguardando app em{' '}
                <a href={appUrl} target="_blank" rel="noreferrer">
                  {appUrl}
                </a>
              </span>
              <span className="app-link-short">
                Aguardando app ·{' '}
                <a href={appUrl} target="_blank" rel="noreferrer">
                  abrir
                </a>
              </span>
            </>
          ) : (
            'Aguardando API /ops'
          )}
        </p>
      </header>

      {suggested && (
        <button
          type="button"
          className="auto-suggest"
          onClick={() => onSelect(suggested.id_ponto)}
        >
          <span>Sugestão pela previsão</span>
          <strong>
            {suggested.fieldTest ? 'Teste de campo · ' : ''}
            {segmentDisplayName(suggested.id_ponto)} ·{' '}
            {suggested.fieldTest
              ? `+${suggested.fieldTest.crescimentoPrevisto2dCm.toFixed(1)} cm`
              : `${suggested.crescimento_acumulado_cm.toFixed(1)} cm`}
          </strong>
        </button>
      )}

      <form className="dispatch-form" onSubmit={handleSubmit}>
        <h3>Designar equipe</h3>

        <label className="field-label" htmlFor="km-equipe">
          KM / ID da rodovia
        </label>
        <select
          id="km-equipe"
          value={selectedId ?? ''}
          onChange={(e) => onSelect(e.target.value)}
          required
        >
          <option value="" disabled>
            Selecione o KM
          </option>
          {SELECTABLE_SEGMENTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.kind === 'teste-campo' ? `Teste de campo · ${s.id}` : `${s.id} — ${s.road} (${s.local})`}
            </option>
          ))}
        </select>

        <label className="field-label" htmlFor="equipe">
          Equipe
        </label>
        <select id="equipe" value={equipe} onChange={(e) => setEquipe(e.target.value)}>
          {TEAMS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <label className="field-label">Situação da vegetação</label>
        <div
          className="situacao-box"
          style={{ borderColor: selected ? colorForNivel(selected.nivel_alerta) : undefined }}
        >
          {selectedId ? situacao : 'Selecione o KM para carregar a situação atual.'}
        </div>

        <label className="field-label" htmlFor="obs-equipe">
          Observação (opcional)
        </label>
        <textarea
          id="obs-equipe"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Instrução enviada ao app da equipe…"
        />

        <button type="submit" className="btn-primary" disabled={!selectedId || !selected || !opsConnected}>
          Enviar ao app da equipe
        </button>
        {dispatchError && <p className="ops-badge off">{dispatchError}</p>}
      </form>

      <div className="data-block">
        <h3>Notificações</h3>
        {notifications.length === 0 ? (
          <p className="empty-hint">Nenhuma notificação ainda.</p>
        ) : (
          <ul className="notif-list">
            {notifications.map((n) => (
              <li key={n.id}>
                <NotificationItem
                  notification={n}
                  status={n.dispatch.status}
                  onAdvance={
                    n.dispatch.status !== 'concluida'
                      ? () => onAdvance(n.dispatch.id)
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="data-block">
        <h3>Tarefas ativas</h3>
        {dispatches.length === 0 ? (
          <p className="empty-hint">Nenhuma equipe designada.</p>
        ) : (
          <ul className="task-list">
            {dispatches.map((d) => (
              <li key={d.id}>
                <div className="task-head">
                  <strong>{segmentDisplayName(d.idPonto)}</strong>
                  <span className="chip" style={{ background: colorForNivel(d.nivelAlerta) }}>
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>
                <p>
                  {d.equipe} · {d.crescimentoCm.toFixed(1)} cm
                  {d.alturaFinal != null ? ` · medido ${d.alturaFinal.toFixed(1)} cm` : ''}
                </p>
                {d.status !== 'concluida' && (
                  <button type="button" className="btn-ghost" onClick={() => onAdvance(d.id)}>
                    Avançar status (simular)
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function NotificationItem({
  notification,
  status,
  onAdvance,
}: {
  notification: TeamNotification & { dispatch: DispatchOrder }
  status: DispatchStatus
  onAdvance?: () => void
}) {
  return (
    <div className={`notif-item kind-${notification.kind}`}>
      <div className="notif-top">
        <strong>{notification.dispatch.equipe}</strong>
        <span className="mono tiny">{new Date(notification.at).toLocaleTimeString('pt-BR')}</span>
      </div>
      <p>{notification.message}</p>
      <span className="mono tiny">
        {segmentDisplayName(notification.dispatch.idPonto)} · {STATUS_LABEL[status]}
      </span>
      {onAdvance && notification.kind !== 'finalizacao' && (
        <button type="button" className="btn-ghost" onClick={onAdvance}>
          Simular próximo passo
        </button>
      )}
    </div>
  )
}
