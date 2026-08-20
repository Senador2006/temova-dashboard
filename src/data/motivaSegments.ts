import type { HighwaySegment } from '../types'
import { FIELD_TEST_SEGMENT } from './fieldTest'

export { FIELD_TEST_ID, FIELD_TEST_SEGMENT } from './fieldTest'

type LatLng = [number, number]

function densify(waypoints: LatLng[], pointsPerEdge: number): LatLng[] {
  if (waypoints.length < 2) return waypoints
  const out: LatLng[] = []
  const steps = Math.max(1, pointsPerEdge)

  for (let i = 0; i < waypoints.length - 1; i += 1) {
    const [lat0, lng0] = waypoints[i]
    const [lat1, lng1] = waypoints[i + 1]
    for (let s = 0; s < steps; s += 1) {
      const t = s / steps
      out.push([lat0 + (lat1 - lat0) * t, lng0 + (lng1 - lng0) * t])
    }
  }
  out.push(waypoints[waypoints.length - 1])
  return out
}

function midpoint(path: LatLng[]): LatLng {
  const idx = Math.floor(path.length / 2)
  return path[idx] ?? path[0]
}

function splitCorridor(
  waypoints: LatLng[],
  count: number,
  startKm: number,
  road: string,
  code: string,
  concession: string,
  locais: string[],
): HighwaySegment[] {
  const dense = densify(waypoints, 10)
  const chunk = Math.max(2, Math.floor((dense.length - 1) / count))
  const segments: HighwaySegment[] = []

  for (let i = 0; i < count; i += 1) {
    const start = i * chunk
    const end = i === count - 1 ? dense.length - 1 : Math.min(dense.length - 1, start + chunk)
    const path = dense.slice(start, end + 1)
    const km = startKm + i
    const id = `RODO_KM_${String(km).padStart(2, '0')}`
    const station = midpoint(path)

    segments.push({
      id,
      road,
      code,
      concession,
      label: `${road} · km ${km}`,
      km,
      path,
      station,
      local: locais[Math.min(i, locais.length - 1)] ?? concession,
    })
  }

  return segments
}

const CORRIDORS: Array<{
  road: string
  code: string
  concession: string
  count: number
  locais: string[]
  waypoints: LatLng[]
}> = [
  {
    road: 'RodoAnel Oeste',
    code: 'SP-021',
    concession: 'Motiva RodoAnel',
    count: 8,
    locais: [
      'Cajamar / Anhanguera',
      'Osasco Norte',
      'Barueri',
      'Carapicuíba',
      'Cotia Norte',
      'Cotia Sul',
      'Embu das Artes',
      'Ligação Castelo',
    ],
    waypoints: [
      [-23.405, -46.815],
      [-23.455, -46.845],
      [-23.505, -46.875],
      [-23.555, -46.905],
      [-23.605, -46.925],
      [-23.655, -46.910],
      [-23.685, -46.870],
      [-23.670, -46.820],
    ],
  },
  {
    road: 'Rodovia dos Bandeirantes',
    code: 'SP-348',
    concession: 'Motiva AutoBAn',
    count: 5,
    locais: ['São Paulo', 'Caieiras', 'Franco da Rocha', 'Jundiaí', 'Campinas'],
    waypoints: [
      [-23.508, -46.778],
      [-23.455, -46.820],
      [-23.380, -46.860],
      [-23.290, -46.910],
      [-23.200, -46.980],
      [-23.120, -47.040],
    ],
  },
  {
    road: 'Rodovia Anhanguera',
    code: 'SP-330',
    concession: 'Motiva AutoBAn',
    count: 5,
    locais: ['São Paulo', 'Perus', 'Jundiaí', 'Louveira', 'Campinas'],
    waypoints: [
      [-23.495, -46.760],
      [-23.430, -46.800],
      [-23.340, -46.850],
      [-23.240, -46.930],
      [-23.140, -47.010],
      [-23.050, -47.070],
    ],
  },
  {
    road: 'Rodovia Pres. Dutra',
    code: 'BR-116',
    concession: 'Motiva RioSP',
    count: 5,
    locais: ['Guarulhos', 'Arujá', 'Santa Isabel', 'Jacareí', 'São José dos Campos'],
    waypoints: [
      [-23.460, -46.530],
      [-23.430, -46.420],
      [-23.390, -46.300],
      [-23.340, -46.150],
      [-23.300, -46.000],
      [-23.270, -45.900],
    ],
  },
  {
    road: 'Rodovia Castelo Branco',
    code: 'SP-280',
    concession: 'Motiva SPVias',
    count: 4,
    locais: ['Osasco', 'Barueri', 'Itu', 'Sorocaba'],
    waypoints: [
      [-23.545, -46.785],
      [-23.530, -46.900],
      [-23.515, -47.050],
      [-23.500, -47.200],
      [-23.490, -47.350],
    ],
  },
  {
    road: 'Rodovia Raposo Tavares',
    code: 'SP-270',
    concession: 'Motiva SPVias',
    count: 3,
    locais: ['São Paulo Oeste', 'Cotia', 'São Roque'],
    waypoints: [
      [-23.585, -46.780],
      [-23.560, -46.920],
      [-23.540, -47.080],
      [-23.520, -47.220],
    ],
  },
]

function buildSegments(): HighwaySegment[] {
  const segments: HighwaySegment[] = []
  let nextKm = 1

  for (const corridor of CORRIDORS) {
    segments.push(
      ...splitCorridor(
        corridor.waypoints,
        corridor.count,
        nextKm,
        corridor.road,
        corridor.code,
        corridor.concession,
        corridor.locais,
      ),
    )
    nextKm += corridor.count
  }

  return segments
}

export const HIGHWAY_SEGMENTS = buildSegments()

export const SELECTABLE_SEGMENTS = [...HIGHWAY_SEGMENTS, FIELD_TEST_SEGMENT]

export const MAP_CENTER: [number, number] = [-23.48, -46.85]
export const MAP_ZOOM = 10

export function getSegmentById(id: string): HighwaySegment | undefined {
  return SELECTABLE_SEGMENTS.find((s) => s.id === id)
}

export function segmentDisplayName(id: string): string {
  const segment = getSegmentById(id)
  if (!segment) return id
  if (segment.kind === 'teste-campo') return `Teste de campo · ${segment.id}`
  return `${segment.road} · ${segment.id}`
}
