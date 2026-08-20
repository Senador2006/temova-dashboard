import { APP_BASE } from '../config'
import type {
  AppPresence,
  DispatchOrder,
  DispatchStatus,
  FieldUpdate,
  NivelAlerta,
  OpsState,
  SegmentPrediction,
} from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/$/, '')

export type DispatchCreatePayload = {
  idPonto: string
  equipe: string
  situacao: string
  nivelAlerta: NivelAlerta
  crescimentoCm: number
  limitePodaCm: number
  limiteAlertaCm: number
  road: string
  km: number
  local: string
  sentido: string
  titulo: string
}

export async function fetchOpsState(): Promise<OpsState> {
  const res = await fetch(`${API_BASE}/ops/state`)
  if (!res.ok) throw new Error(`Sync operacional falhou (${res.status})`)
  return res.json()
}

function isLocalUrl(url: string): boolean {
  return url.includes('127.0.0.1') || url.includes('localhost')
}

export async function pingApp(url: string = APP_BASE): Promise<boolean> {
  // O proxy /field-app só existe no Vite local. Em produção o app está noutro host.
  if (isLocalUrl(url)) {
    try {
      const proxied = await fetch('/field-app/', { method: 'GET', cache: 'no-store' })
      if (proxied.ok) return true
    } catch {
      /* tenta o endereço direto do Flutter */
    }
  }
  try {
    const direct = await fetch(url, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
    return direct.type === 'opaque' || direct.ok
  } catch {
    return false
  }
}

export async function registerAppPresence(
  url: string = APP_BASE,
  equipe = 'Equipe Delta',
): Promise<AppPresence> {
  const res = await fetch(`${API_BASE}/ops/presence`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ url, equipe, client: 'app' }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Falha ao registrar o app (${res.status}): ${detail}`)
  }
  return res.json()
}

export async function createDispatch(payload: DispatchCreatePayload): Promise<DispatchOrder> {
  const res = await fetch(`${API_BASE}/ops/dispatches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Falha ao enviar tarefa (${res.status}): ${detail}`)
  }
  return res.json()
}

export async function patchDispatch(
  id: string,
  payload: {
    status?: DispatchStatus
    alturaFinal?: number
    foto?: string
    source?: 'app' | 'dashboard'
  },
): Promise<DispatchOrder> {
  const res = await fetch(`${API_BASE}/ops/dispatches/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ source: 'dashboard', ...payload }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Falha ao atualizar tarefa (${res.status}): ${detail}`)
  }
  return res.json()
}

export async function publishPredictions(
  predictions: Record<string, SegmentPrediction>,
): Promise<void> {
  const slim: Record<string, Record<string, unknown>> = {}
  for (const [id, pred] of Object.entries(predictions)) {
    slim[id] = {
      id_ponto: pred.id_ponto,
      crescimento_acumulado_cm: pred.crescimento_acumulado_cm,
      nivel_alerta: pred.nivel_alerta,
      nivel_label: pred.nivel_label,
      limite_poda_cm: pred.limite_poda_cm,
      limite_alerta_cm: pred.limite_alerta_cm,
      recomendacao_poda: pred.recomendacao_poda,
      mensagem_alerta: pred.mensagem_alerta,
      updatedAt: pred.updatedAt,
      local: pred.local,
    }
  }

  const res = await fetch(`${API_BASE}/ops/predictions`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ predictions: slim }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Falha ao publicar previsões (${res.status}): ${detail}`)
  }
}

export function applyFieldUpdates(
  predictions: Record<string, SegmentPrediction>,
  fieldUpdates: Record<string, FieldUpdate>,
): Record<string, SegmentPrediction> {
  const next: Record<string, SegmentPrediction> = { ...predictions }
  for (const [id, field] of Object.entries(fieldUpdates)) {
    const pred = next[id]
    if (!pred) continue
    next[id] = {
      ...pred,
      crescimento_acumulado_cm: field.alturaCm,
      nivel_alerta: field.nivelAlerta,
      nivel_label: field.nivelLabel,
      limite_poda_cm: field.limitePodaCm,
      medicaoCampo: field,
    }
  }
  return next
}
