import { SELECTABLE_SEGMENTS, getSegmentById } from '../data/motivaSegments'
import type { SegmentPrediction } from '../types'
import { ALERT_LABELS, colorForNivel } from '../utils/alertColors'

interface DataAreaProps {
  selectedId: string | null
  onSelect: (id: string) => void
  predictions: Record<string, SegmentPrediction>
}

export function DataArea({ selectedId, onSelect, predictions }: DataAreaProps) {
  const selected = selectedId ? predictions[selectedId] : null
  const segment = selectedId ? getSegmentById(selectedId) : undefined

  const alerts = Object.values(predictions)
    .filter((p) => p.alerta_preventivo || p.acima_limite_poda || p.proximo_limite)
    .sort((a, b) => {
      if (Boolean(a.fieldTest) !== Boolean(b.fieldTest)) return a.fieldTest ? -1 : 1
      return b.crescimento_acumulado_cm - a.crescimento_acumulado_cm
    })
    .slice(0, 4)

  return (
    <section className="panel data-area" aria-label="Área de dados">
      <header className="panel-head">
        <p className="panel-kicker">Área de dados</p>
        <h2>Monitoramento contínuo</h2>
        <p className="panel-desc">Clima, crescimento e alerta do trecho selecionado.</p>
      </header>

      <label className="field-label" htmlFor="trecho-dados">
        Trecho selecionado
      </label>
      <select
        id="trecho-dados"
        value={selectedId ?? ''}
        onChange={(e) => onSelect(e.target.value)}
      >
        <option value="" disabled>
          Selecione no mapa ou aqui
        </option>
        {SELECTABLE_SEGMENTS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.kind === 'teste-campo' ? `Teste de campo · ${s.id}` : `${s.id} — ${s.road} · ${s.local}`}
          </option>
        ))}
      </select>

      {!selectedId || !segment ? (
        <p className="empty-hint">Selecione um trecho para ver o resumo.</p>
      ) : (
        <>
          <div className="road-meta">
            <strong>{segment.road}</strong>
            <span>
              {segment.id} · {segment.local}
            </span>
            {selected?.fieldTest && <span className="field-test-badge">Teste de campo</span>}
          </div>

          {selected?.fieldTest ? (
            <FieldTestBlocks prediction={selected} />
          ) : (
            <>
          <div className="data-block">
            <h3>Clima</h3>
            {selected?.climate ? (
              <dl className="stat-grid">
                <div>
                  <dt>Temperatura</dt>
                  <dd>{selected.climate.temperaturaMediaC} °C</dd>
                </div>
                <div>
                  <dt>Precipitação</dt>
                  <dd>{selected.climate.precipitacaoMm} mm</dd>
                </div>
                <div>
                  <dt>Umidade</dt>
                  <dd>{selected.climate.umidadeRelativaPct}%</dd>
                </div>
              </dl>
            ) : (
              <p className="empty-hint">Aguardando coleta…</p>
            )}
          </div>

          <div className="data-block">
            <h3>Monitoramento</h3>
            {selected ? (
              <dl className="stat-grid">
                <div>
                  <dt>{selected.medicaoCampo ? 'Altura medida' : 'Crescimento'}</dt>
                  <dd>{selected.crescimento_acumulado_cm.toFixed(1)} cm</dd>
                </div>
                <div>
                  <dt>Nível</dt>
                  <dd style={{ color: colorForNivel(selected.nivel_alerta) }}>
                    {ALERT_LABELS[selected.nivel_alerta]}
                  </dd>
                </div>
                <div>
                  <dt>Limite poda</dt>
                  <dd>{selected.limite_poda_cm} cm</dd>
                </div>
              </dl>
            ) : (
              <p className="empty-hint">Sem previsão neste ciclo.</p>
            )}
          </div>

          <div className="data-block">
            <h3>Previsão</h3>
            {selected ? (
              <div
                className="forecast-banner"
                style={{ borderColor: colorForNivel(selected.nivel_alerta) }}
              >
                <p className="forecast-value">
                  {selected.crescimento_acumulado_cm.toFixed(1)}
                  <span> cm</span>
                </p>
                <p>{selected.mensagem_alerta}</p>
              </div>
            ) : (
              <p className="empty-hint">Selecione um trecho com previsão.</p>
            )}
          </div>
            </>
          )}
        </>
      )}

      <div className="data-block">
        <h3>Alertas</h3>
        {alerts.length === 0 ? (
          <p className="empty-hint">Nenhum alerta crítico no ciclo atual.</p>
        ) : (
          <ul className="alert-list">
            {alerts.map((p) => {
              const s = getSegmentById(p.id_ponto)
              return (
                <li key={p.id_ponto}>
                  <button type="button" onClick={() => onSelect(p.id_ponto)}>
                    <span
                      className="dot"
                      style={{ background: colorForNivel(p.nivel_alerta) }}
                    />
                    <span className="alert-copy">
                      <strong>{s?.road ?? p.id_ponto}</strong>
                      <em>
                        {p.fieldTest
                          ? `+${p.fieldTest.crescimentoPrevisto2dCm.toFixed(1)} cm previstos`
                          : `+${p.crescimento_acumulado_cm.toFixed(1)} cm · ${ALERT_LABELS[p.nivel_alerta]}`}
                      </em>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function FieldTestBlocks({ prediction }: { prediction: SegmentPrediction }) {
  const test = prediction.fieldTest
  if (!test) return null

  return (
    <>
      <div className="data-block">
        <h3>Previsão</h3>
        <div
          className="forecast-banner"
          style={{ borderColor: colorForNivel(prediction.nivel_alerta) }}
        >
          <p className="forecast-value">
            +{test.crescimentoPrevisto2dCm.toFixed(1)}
            <span> cm</span>
          </p>
          <p>Crescimento previsto em 2 dias</p>
        </div>
        <dl className="stat-grid" style={{ marginTop: '0.65rem' }}>
          <div>
            <dt>Altura prevista</dt>
            <dd>{test.alturaPrevistaD4Cm.toFixed(1)} cm</dd>
          </div>
          <div>
            <dt>Nível</dt>
            <dd style={{ color: colorForNivel(prediction.nivel_alerta) }}>
              {ALERT_LABELS[prediction.nivel_alerta]}
            </dd>
          </div>
        </dl>
      </div>

      <div className="data-block">
        <h3>Clima previsto</h3>
        <dl className="stat-grid">
          <div>
            <dt>Temperatura</dt>
            <dd>{test.tempFuturo2dC} °C</dd>
          </div>
          <div>
            <dt>Precipitação</dt>
            <dd>{test.precipitacaoFuturo2dMm} mm</dd>
          </div>
          <div>
            <dt>Umidade</dt>
            <dd>{test.umidadeFuturo2dPct}%</dd>
          </div>
        </dl>
      </div>
    </>
  )
}
