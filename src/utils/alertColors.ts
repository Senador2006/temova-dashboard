import type { NivelAlerta } from '../types'

/** Alertas operacionais — mantêm contraste sobre o branco te-mova. */
export const ALERT_COLORS: Record<NivelAlerta, string> = {
  verde: '#1f9d6a',
  amarelo: '#d4a017',
  vermelho: '#d64545',
  laranja: '#6047ec',
}

export const ALERT_LABELS: Record<NivelAlerta, string> = {
  verde: 'Normal',
  amarelo: 'Atenção',
  vermelho: 'Alerta preventivo',
  laranja: 'Poda necessária',
}

export function colorForNivel(nivel?: NivelAlerta | string): string {
  if (nivel && nivel in ALERT_COLORS) {
    return ALERT_COLORS[nivel as NivelAlerta]
  }
  return '#9aa0b5'
}
