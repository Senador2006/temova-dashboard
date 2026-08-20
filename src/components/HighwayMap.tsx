import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { useEffect } from 'react'
import { FIELD_TEST_SEGMENT, HIGHWAY_SEGMENTS, MAP_CENTER, MAP_ZOOM, getSegmentById } from '../data/motivaSegments'
import type { SegmentPrediction } from '../types'
import { ALERT_LABELS, colorForNivel } from '../utils/alertColors'
import 'leaflet/dist/leaflet.css'

interface HighwayMapProps {
  predictions: Record<string, SegmentPrediction>
  selectedId: string | null
  onSelect: (id: string) => void
}

function FitSelected({ selectedId }: { selectedId: string | null }) {
  const map = useMap()

  useEffect(() => {
    if (!selectedId) return
    const segment = getSegmentById(selectedId)
    if (!segment) return
    map.fitBounds(segment.path, { padding: [56, 56], maxZoom: 12, animate: true })
  }, [map, selectedId])

  return null
}

function MapResizeFix() {
  const map = useMap()

  useEffect(() => {
    const container = map.getContainer()
    let frame = 0
    const invalidate = () => {
      map.invalidateSize({ animate: false })
    }
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(invalidate)
    })
    observer.observe(container)
    const id = window.setTimeout(invalidate, 80)
    return () => {
      window.clearTimeout(id)
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [map])

  return null
}

export function HighwayMap({ predictions, selectedId, onSelect }: HighwayMapProps) {
  return (
    <div className="map-shell">
      <div className="map-overlay-title">
        <p className="panel-kicker">Área do mapa</p>
        <h2>Previsão de poda</h2>
        <p className="map-field-hint">REAL001 · teste de campo</p>
      </div>

      <MapContainer
        center={MAP_CENTER}
        zoom={MAP_ZOOM}
        className="highway-map"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <MapResizeFix />
        <FitSelected selectedId={selectedId} />

        {HIGHWAY_SEGMENTS.map((segment) => {
          const pred = predictions[segment.id]
          const color = colorForNivel(pred?.nivel_alerta)
          const isSelected = selectedId === segment.id

          return (
            <Polyline
              key={`line-${segment.id}`}
              positions={segment.path}
              pathOptions={{
                color,
                weight: isSelected ? 9 : 6,
                opacity: pred ? 0.95 : 0.4,
                lineCap: 'round',
                lineJoin: 'round',
              }}
              eventHandlers={{ click: () => onSelect(segment.id) }}
            />
          )
        })}

        {HIGHWAY_SEGMENTS.map((segment) => {
          const pred = predictions[segment.id]
          const color = colorForNivel(pred?.nivel_alerta)
          const isSelected = selectedId === segment.id

          return (
            <CircleMarker
              key={`station-${segment.id}`}
              center={segment.station}
              radius={isSelected ? 9 : 7}
              pathOptions={{
                color: '#ffffff',
                weight: 2,
                fillColor: color,
                fillOpacity: pred ? 0.95 : 0.55,
              }}
              eventHandlers={{ click: () => onSelect(segment.id) }}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{segment.road}</strong>
                  <p>{segment.local}</p>
                  {pred ? (
                    <>
                      <hr />
                      <p>
                        <strong>
                          {pred.medicaoCampo ? 'Altura medida:' : 'Crescimento:'}
                        </strong>{' '}
                        {pred.crescimento_acumulado_cm.toFixed(1)} cm
                      </p>
                      <p>Nível: {ALERT_LABELS[pred.nivel_alerta]}</p>
                    </>
                  ) : (
                    <p className="muted">Aguardando previsão…</p>
                  )}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}

        <FieldTestMapLayer
          prediction={predictions[FIELD_TEST_SEGMENT.id]}
          selected={selectedId === FIELD_TEST_SEGMENT.id}
          onSelect={() => onSelect(FIELD_TEST_SEGMENT.id)}
        />
      </MapContainer>
    </div>
  )
}

function FieldTestMapLayer({
  prediction,
  selected,
  onSelect,
}: {
  prediction?: SegmentPrediction
  selected: boolean
  onSelect: () => void
}) {
  const color = colorForNivel(prediction?.nivel_alerta)
  const test = prediction?.fieldTest

  return (
    <>
      <Polyline
        positions={FIELD_TEST_SEGMENT.path}
        pathOptions={{
          color,
          weight: selected ? 8 : 5,
          opacity: 0.95,
          dashArray: '6 8',
          lineCap: 'round',
          lineJoin: 'round',
        }}
        eventHandlers={{ click: onSelect }}
      />
      <CircleMarker
        center={FIELD_TEST_SEGMENT.station}
        radius={selected ? 12 : 10}
        pathOptions={{
          color: '#ffffff',
          weight: 3,
          fillColor: color,
          fillOpacity: 1,
        }}
        eventHandlers={{ click: onSelect }}
      >
        <Popup>
          <div className="map-popup">
            <strong>Teste de campo</strong>
            <p>{FIELD_TEST_SEGMENT.local}</p>
            {test && prediction ? (
              <>
                <hr />
                <p>
                  <strong>Crescimento previsto:</strong> +{test.crescimentoPrevisto2dCm.toFixed(1)} cm
                </p>
                <p>Nível: {ALERT_LABELS[prediction.nivel_alerta]}</p>
              </>
            ) : (
              <p className="muted">Aguardando previsão…</p>
            )}
          </div>
        </Popup>
      </CircleMarker>
    </>
  )
}
