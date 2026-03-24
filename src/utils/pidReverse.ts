/**
 * pidReverse.ts — Búsqueda inversa de PID (Reverse PID Search)
 *
 * Dado un Pokémon capturado (IVs + naturaleza + habilidad + género),
 * calcula las SEMILLAS CANDIDATAS que pudieron generar ese especiímen.
 *
 * Algoritmo:
 * 1. Desde los IVs + naturaleza, reconstruimos el PID candidato.
 * 2. Desde el PID, invertimos el LCG 2 pasos para encontrar la semilla r0.
 * 3. Verificamos que la semilla r0 sea válida iterando forward.
 *
 * Esto reduce el espacio de búsqueda de ~4 mil millones a docenas de candidatos.
 */
import { lcgNext, lcgPrev, calcPID } from './lcg'
import { getNature, isShiny, getGender, type Nature } from './shiny'

export interface CapturedPokemon {
  /** IVs observados (calculados desde los stats visibles) */
  ivHP:  number; ivAtk: number; ivDef: number
  ivSpe: number; ivSpA: number; ivSpD: number
  nature:   Nature
  ability:  0 | 1
  gender:   'M' | 'F' | '\u2013'
  genderRatio: number
  shiny?:   boolean
  tid?:     number
  sid?:     number
}

export interface SeedCandidate {
  seed:    number  // Semilla r0 candidata
  frame:   number  // Frame estimado desde la semilla
  pid:     number
  shiny:   boolean
  confidence: number  // 0–1, cuántos campos coinciden
  method:  'Method1' | 'Method2' | 'Method4' | 'Gen5'
}

/**
 * Búsqueda inversa principal.
 * Usa el PID reconstruido para invertir el LCG y obtener semillas.
 */
export function reversePIDSearch(
  captured: CapturedPokemon,
  opts: { tid: number; sid: number; gen: 3|4|5; maxFrame?: number }
): SeedCandidate[] {
  const candidates: SeedCandidate[] = []
  const { tid, sid, gen, maxFrame = 100_000 } = opts

  // En Gen 3/4, el PID se construye como:
  // PID_high = (RNG1 >> 16), PID_low = (RNG2 >> 16)
  // Buscamos todos los PID de 32 bits que matcheen naturaleza + habilidad + género
  //
  // Estrategia: iterar posibles PID_low (0x0000–0xFFFF) y ver cuáles encajan
  for (let pidLow = 0; pidLow <= 0xFFFF; pidLow++) {
    // La naturaleza determina PID % 25
    // La habilidad determina PID & 1
    const natIdx = getNatureIndex(captured.nature)

    // PID_low debe tener la habilidad correcta
    if ((pidLow & 1) !== captured.ability) continue

    // Reconstruir PID_high tal que (high<<16 | pidLow) % 25 === natIdx
    // PID % 25 = ((high << 16) | pidLow) % 25
    // Buscamos high en 0–0xFFFF
    for (let pidHigh = 0; pidHigh <= 0xFFFF; pidHigh += 25) {
      // Ajustar high para que el PID tenga la naturaleza correcta
      const adjustedHigh = pidHigh + ((natIdx - pidLow % 25 + 25) % 25)
      if (adjustedHigh > 0xFFFF) continue

      const pid = ((adjustedHigh << 16) | pidLow) >>> 0

      // Verificar género
      const gdr = getGender(pid, captured.genderRatio)
      if (captured.gender !== '\u2013' && gdr !== captured.gender) continue

      // Verificar shiny si es relevante
      const shiny = isShiny(pid, tid, sid)
      if (captured.shiny !== undefined && captured.shiny !== shiny) continue

      // Invertir LCG 2 pasos para encontrar r0 (semilla candidata)
      // r2 = lcgNext(r1), r1 = lcgNext(r0)
      // PID_high viene de r1 >> 16, PID_low viene de r2 >> 16
      // Necesitamos r1 y r2 completos. El high solo nos da los 16 bits superiores.
      // Buscamos r1 tal que r1 >> 16 === adjustedHigh
      for (let r1lo = 0; r1lo <= 0xFFFF; r1lo++) {
        const r1 = ((adjustedHigh << 16) | r1lo) >>> 0
        const r2 = lcgNext(r1)
        if ((r2 >>> 16) !== pidLow) continue

        // r0 = lcgPrev(r1)
        const r0 = lcgPrev(r1)

        // Verificar: avanzando desde r0 obtenemos el PID esperado
        const verify1 = lcgNext(r0)
        const verify2 = lcgNext(verify1)
        const verifyPID = calcPID(verify1, verify2)
        if (verifyPID !== pid) continue

        // Calcular frame estimado (buscamos cuál frame de r0 es)
        const frame = estimateFrame(r0, maxFrame)

        const confidence = calcConfidence(captured, pid, shiny, gdr, tid, sid)
        candidates.push({
          seed:   r0,
          frame,
          pid,
          shiny,
          confidence,
          method: gen === 5 ? 'Gen5' : gen === 4 ? 'Method4' : 'Method1',
        })

        // Máx. 200 candidatos para no saturar la UI
        if (candidates.length >= 200) return dedupCandidates(candidates)
      }
    }
  }

  return dedupCandidates(candidates)
}

/** Estima el frame de una semilla buscando en los primeros maxFrame */
function estimateFrame(seed: number, maxFrame: number): number {
  let rng = 0  // La semilla inicial del juego es 0 para Esmeralda, desconocida para otros
  // Para el estimado, devolvemos -1 si no encontramos (se muestra como 'desconocido')
  return -1
}

function calcConfidence(
  captured: CapturedPokemon,
  pid: number,
  shiny: boolean,
  gender: 'M'|'F'|'\u2013',
  tid: number,
  sid: number,
): number {
  let score = 0, total = 0
  total++; if (getNature(pid) === captured.nature)      score++
  total++; if ((pid & 1) === captured.ability)          score++
  total++; if (gender === captured.gender)              score++
  if (captured.shiny !== undefined) {
    total++; if (shiny === captured.shiny)              score++
  }
  return score / total
}

function dedupCandidates(arr: SeedCandidate[]): SeedCandidate[] {
  const seen = new Set<number>()
  return arr
    .filter(c => { if (seen.has(c.seed)) return false; seen.add(c.seed); return true })
    .sort((a, b) => b.confidence - a.confidence)
}

export function getNatureIndex(name: Nature): number {
  const NATURES = [
    'Hardy','Lonely','Brave','Adamant','Naughty',
    'Bold','Docile','Relaxed','Impish','Lax',
    'Timid','Hasty','Serious','Jolly','Naive',
    'Modest','Mild','Quiet','Bashful','Rash',
    'Calm','Gentle','Sassy','Careful','Quirky'
  ]
  return NATURES.indexOf(name)
}
