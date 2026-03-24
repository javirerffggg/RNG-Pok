/**
 * Comprueba si un PID es Shiny dado el TID y SID del entrenador
 * Ecuación: (TID XOR SID XOR PID_upper XOR PID_lower) < threshold
 */
export function isShiny(
  pid: number,
  tid: number,
  sid: number,
  threshold: number = 8 // 8 para 1/8192, 16 para juegos modernos
): boolean {
  const pidUpper = (pid >> 16) & 0xFFFF
  const pidLower = pid & 0xFFFF
  const shinyValue = tid ^ sid ^ pidUpper ^ pidLower
  return shinyValue < threshold
}

/**
 * Calcula el valor shiny exacto (para debug)
 */
export function getShinyValue(pid: number, tid: number, sid: number): number {
  const pidUpper = (pid >> 16) & 0xFFFF
  const pidLower = pid & 0xFFFF
  return tid ^ sid ^ pidUpper ^ pidLower
}

/**
 * Decodifica la naturaleza de un PID
 */
export const NATURES = [
  'Hardy','Lonely','Brave','Adamant','Naughty',
  'Bold','Docile','Relaxed','Impish','Lax',
  'Timid','Hasty','Serious','Jolly','Naive',
  'Modest','Mild','Quiet','Bashful','Rash',
  'Calm','Gentle','Sassy','Careful','Quirky'
] as const

export type Nature = typeof NATURES[number]

export function getNature(pid: number): Nature {
  return NATURES[pid % 25]
}

export function getGender(pid: number, ratio: number): 'M' | 'F' | '–' {
  if (ratio === 255) return '–' // Sin género
  if (ratio === 0) return 'M'   // Siempre macho
  if (ratio === 254) return 'F' // Siempre hembra
  return (pid & 0xFF) >= ratio ? 'M' : 'F'
}
