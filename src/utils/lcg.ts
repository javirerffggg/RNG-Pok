/**
 * Linear Congruential Generator para Pokémon Gen 3 & 4
 * Fórmula: seed = seed * 0x41C64E6D + 0x6073 (mod 2^32)
 */
export function lcgNext(seed: number): number {
  return ((seed * 0x41C64E6D + 0x6073) >>> 0)
}

export function lcgPrev(seed: number): number {
  // Inverso multiplicativo de 0x41C64E6D mod 2^32 = 0xEEB9EB65
  return (((seed - 0x6073) * 0xEEB9EB65) >>> 0)
}

/**
 * Genera N frames a partir de una semilla
 */
export function generateFrames(seed: number, count: number): number[] {
  const frames: number[] = []
  let current = seed
  for (let i = 0; i < count; i++) {
    current = lcgNext(current)
    frames.push(current)
  }
  return frames
}

/**
 * Calcula el PID a partir de dos valores RNG consecutivos (Gen 3/4)
 */
export function calcPID(rng1: number, rng2: number): number {
  const high = (rng1 >> 16) & 0xFFFF
  const low = (rng2 >> 16) & 0xFFFF
  return (high << 16) | low
}
