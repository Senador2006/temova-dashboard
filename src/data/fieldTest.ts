import type { FieldTestForecast, HighwaySegment, SegmentPrediction } from '../types'

export const FIELD_TEST_ID = 'REAL001'

const STATION: [number, number] = [-23.598, -46.918]
const PLOT = 0.0038

/** Área fixa do experimento REAL001 — gramado alto no RodoAnel Oeste. */
export const FIELD_TEST_SEGMENT: HighwaySegment = {
  id: FIELD_TEST_ID,
  road: 'RodoAnel Oeste',
  code: 'SP-021',
  concession: 'Motiva RodoAnel',
  label: 'Teste de campo REAL001',
  km: 0,
  path: [
    [STATION[0] - PLOT, STATION[1] - PLOT],
    [STATION[0] - PLOT, STATION[1] + PLOT],
    [STATION[0] + PLOT, STATION[1] + PLOT],
    [STATION[0] + PLOT, STATION[1] - PLOT],
    [STATION[0] - PLOT, STATION[1] - PLOT],
  ],
  station: STATION,
  local: 'Área fixa — teste de campo',
  kind: 'teste-campo',
}

/**
 * Só a previsão D2→D4 do modelo de teste 2.3.0.
 * Não inclui altura real de D4 nem erro — holdout de validação fica fora do dash.
 */
const FORECAST: FieldTestForecast = {
  sampleId: FIELD_TEST_ID,
  alturaD0Cm: 62.25,
  alturaD2Cm: 62.37,
  crescimentoPrevisto2dCm: 0.1999,
  alturaPrevistaD4Cm: 62.5699,
  dataPrevisao: '2026-08-15',
  tempD0C: 21,
  precipitacaoD0Mm: 0,
  umidadeD0Pct: 95,
  tempD2C: 20.5,
  precipitacaoD2Mm: 6.5,
  umidadeD2Pct: 85,
  tempFuturo2dC: 25,
  precipitacaoFuturo2dMm: 0,
  umidadeFuturo2dPct: 56,
}

export function buildFieldTestPrediction(): SegmentPrediction {
  const crescimento = FORECAST.crescimentoPrevisto2dCm
  const alturaPrevista = FORECAST.alturaPrevistaD4Cm
  const limitePoda = 10
  const limiteAlerta = 9
  const acimaPoda = alturaPrevista >= limitePoda

  return {
    prediction_id: `field-test-${FORECAST.sampleId}`,
    crescimento_acumulado_cm: crescimento,
    limite_alerta_cm: limiteAlerta,
    limite_poda_cm: limitePoda,
    acima_limite_poda: acimaPoda,
    alerta_preventivo: acimaPoda,
    recomendacao_poda: acimaPoda ? 'Poda recomendada' : 'Monitorar',
    nivel_alerta: acimaPoda ? 'laranja' : 'verde',
    nivel_label: acimaPoda ? 'Poda necessária' : 'Normal',
    mensagem_alerta: `Teste de campo: +${crescimento.toFixed(2)} cm previstos em 2 dias (altura prevista ${alturaPrevista.toFixed(2)} cm).`,
    distancia_limite_cm: Number((alturaPrevista - limitePoda).toFixed(2)),
    distancia_alerta_cm: Number((alturaPrevista - limiteAlerta).toFixed(2)),
    proximo_limite: acimaPoda,
    model_version: '2.3.0',
    look_back: 2,
    registros_utilizados: 2,
    id_ponto: FIELD_TEST_ID,
    data_referencia: FORECAST.dataPrevisao,
    latency_ms: 0,
    unidade: 'cm',
    updatedAt: `${FORECAST.dataPrevisao}T08:00:00`,
    movimentacaoAtual: 0,
    local: FIELD_TEST_SEGMENT.local,
    fieldTest: FORECAST,
    climate: {
      temperaturaMediaC: FORECAST.tempD2C,
      precipitacaoMm: FORECAST.precipitacaoD2Mm,
      umidadeRelativaPct: FORECAST.umidadeD2Pct,
      radiacaoSolarMjm2: 0,
      umidadeSoloPct: 0,
      ndvi: 0,
      evi: 0,
      diasSemChuva: FORECAST.precipitacaoD2Mm > 0 ? 0 : 1,
      dataInicio: '2026-08-14',
      dataFim: FORECAST.dataPrevisao,
      registros: 2,
      fonte: 'teste-campo',
    },
  }
}
