import type { ClimateSnapshot, HealthStatus, PredictionResult } from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE ?? '/api').replace(/\/$/, '')
const SOURCE_HEADER = { 'X-Source-System': 'te-mova-dashboard' }

export async function fetchHealth(): Promise<HealthStatus> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error(`Health check falhou (${res.status})`)
  return res.json()
}

export async function fetchSample(idPonto: string): Promise<{ records: Record<string, unknown>[] }> {
  const res = await fetch(`${API_BASE}/sample/${encodeURIComponent(idPonto)}`)
  if (!res.ok) throw new Error(`Amostra ${idPonto} indisponível (${res.status})`)
  return res.json()
}

/** Garante ID_Ponto consistente; não altera features climáticas do dataset/API. */
export function bindRecordsToPoint(
  records: Record<string, unknown>[],
  idPonto: string,
): Record<string, unknown>[] {
  return records.map((row) => ({
    ...row,
    ID_Ponto: idPonto,
  }))
}

function avg(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function summarizeClimate(records: Record<string, unknown>[]): ClimateSnapshot {
  const temps = records.map((r) => Number(r.Temperatura_Media_C ?? 0))
  const rains = records.map((r) => Number(r.Precipitacao_Diaria_mm ?? 0))
  const humids = records.map((r) => Number(r.Umidade_Relativa_Pct ?? 0))
  const rads = records.map((r) => Number(r.Radiacao_Solar_MJm2 ?? 0))
  const solos = records.map((r) => Number(r.Umidade_Solo_Pct ?? 0))
  const ndvis = records.map((r) => Number(r.NDVI ?? 0))
  const evis = records.map((r) => Number(r.EVI ?? 0))
  const last = records[records.length - 1] ?? {}
  const first = records[0] ?? {}

  return {
    temperaturaMediaC: Number(avg(temps).toFixed(1)),
    precipitacaoMm: Number(avg(rains).toFixed(1)),
    umidadeRelativaPct: Number(avg(humids).toFixed(1)),
    radiacaoSolarMjm2: Number(avg(rads).toFixed(1)),
    umidadeSoloPct: Number(avg(solos).toFixed(1)),
    ndvi: Number(avg(ndvis).toFixed(3)),
    evi: Number(avg(evis).toFixed(3)),
    diasSemChuva: Number(last.Dias_Sem_Chuva ?? 0),
    dataInicio: String(first.Data ?? ''),
    dataFim: String(last.Data ?? ''),
    registros: records.length,
    fonte: 'sistema-coleta',
  }
}

export async function predictGrowth(
  records: Record<string, unknown>[],
): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...SOURCE_HEADER,
    },
    body: JSON.stringify({ records }),
  })

  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`Predição falhou (${res.status}): ${detail}`)
  }

  return res.json()
}

/**
 * Fluxo oficial do protótipo:
 * 1) GET /sample/{id} — janela de 20 dias do dataset (entrada do sistema de coleta)
 * 2) POST /predict — previsão real do Modelo 1 (LSTM)
 * Não há jitter/mock no front sobre as features enviadas ao modelo.
 */
export async function predictPoint(
  idPonto: string,
): Promise<{ prediction: PredictionResult; climate: ClimateSnapshot; records: Record<string, unknown>[] }> {
  const sample = await fetchSample(idPonto)
  const records = bindRecordsToPoint(sample.records, idPonto)
  const climate = summarizeClimate(records)
  const prediction = await predictGrowth(records)
  return {
    prediction: {
      ...prediction,
      id_ponto: prediction.id_ponto || idPonto,
    },
    climate,
    records,
  }
}
