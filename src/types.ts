export type NivelAlerta = 'verde' | 'amarelo' | 'vermelho' | 'laranja'

export interface PredictionResult {
  prediction_id: string
  crescimento_acumulado_cm: number
  limite_alerta_cm: number
  limite_poda_cm: number
  acima_limite_poda: boolean
  alerta_preventivo: boolean
  recomendacao_poda: string
  nivel_alerta: NivelAlerta
  nivel_label: string
  mensagem_alerta: string
  distancia_limite_cm: number
  distancia_alerta_cm: number
  proximo_limite: boolean
  model_version: string
  look_back: number
  registros_utilizados: number
  id_ponto: string
  data_referencia: string
  latency_ms: number
  unidade: string
}

/** Resumo climático da janela de 20 dias (sistema de coleta). */
export interface ClimateSnapshot {
  temperaturaMediaC: number
  precipitacaoMm: number
  umidadeRelativaPct: number
  radiacaoSolarMjm2: number
  umidadeSoloPct: number
  ndvi: number
  evi: number
  diasSemChuva: number
  dataInicio: string
  dataFim: string
  registros: number
  fonte: 'sistema-coleta' | 'app' | 'mock' | 'teste-campo'
}

/** Previsão do modelo de teste (LSTM 2.3.0) — só valores previstos, sem D4 real. */
export interface FieldTestForecast {
  sampleId: string
  alturaD0Cm: number
  alturaD2Cm: number
  crescimentoPrevisto2dCm: number
  alturaPrevistaD4Cm: number
  dataPrevisao: string
  tempD0C: number
  precipitacaoD0Mm: number
  umidadeD0Pct: number
  tempD2C: number
  precipitacaoD2Mm: number
  umidadeD2Pct: number
  tempFuturo2dC: number
  precipitacaoFuturo2dMm: number
  umidadeFuturo2dPct: number
}

export interface FieldUpdate {
  idPonto: string
  alturaCm: number
  nivelAlerta: NivelAlerta
  nivelLabel: string
  limitePodaCm: number
  at: string
  dispatchId: string
  equipe: string
  fonte: 'app'
  foto?: string | null
}

export interface SegmentPrediction extends PredictionResult {
  updatedAt: string
  climate: ClimateSnapshot
  /** Movimentação simulada no trecho (veíc./h) */
  movimentacaoAtual: number
  local: string
  medicaoCampo?: FieldUpdate
  fieldTest?: FieldTestForecast
}

export interface HighwaySegment {
  id: string
  road: string
  code: string
  concession: string
  label: string
  km: number
  path: [number, number][]
  station: [number, number]
  local: string
  kind?: 'operacao' | 'teste-campo'
}

export type DispatchStatus =
  | 'enviada'
  | 'confirmada'
  | 'em_andamento'
  | 'concluida'
  | 'interrompida'

export interface TeamNotification {
  id: string
  dispatchId: string
  message: string
  at: string
  kind: 'envio' | 'confirmacao' | 'andamento' | 'finalizacao' | 'interrupcao'
}

export interface DispatchOrder {
  id: string
  idPonto: string
  titulo?: string
  road?: string
  km?: number
  local?: string
  sentido?: string
  equipe: string
  situacao: string
  nivelAlerta: NivelAlerta
  crescimentoCm: number
  limitePodaCm?: number
  limiteAlertaCm?: number
  createdAt: string
  updatedAt?: string
  status: DispatchStatus
  notifications: TeamNotification[]
  alturaFinal?: number | null
  foto?: string | null
}

export interface AppPresence {
  url: string
  equipe: string
  client: string
  at: string
}

export interface OpsState {
  version: number
  dispatches: DispatchOrder[]
  predictions: Record<string, Record<string, unknown>>
  field_updates: Record<string, FieldUpdate>
  app?: AppPresence | null
}

export interface HealthStatus {
  status: string
  model_version: string
  look_back: number
}
