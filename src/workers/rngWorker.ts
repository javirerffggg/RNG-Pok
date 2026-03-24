/**
 * Web Worker para cálculos RNG pesados (no bloquea la UI)
 * Búsqueda de frames objetivo con filtros
 */
import { lcgNext, calcPID } from '../utils/lcg'
import { isShiny, getNature, getGender, type Nature } from '../utils/shiny'

export interface SearchFilters {
  tid: number
  sid: number
  targetShiny: boolean
  targetNatures?: Nature[]
  minIVs?: [number, number, number, number, number, number]
  gender?: 'M' | 'F' | 'any'
  genderRatio?: number
  maxFrames?: number
}

export interface FrameResult {
  frame: number
  seed: number
  pid: number
  shiny: boolean
  nature: Nature
  gender: string
  ivs?: number[]
}

self.onmessage = (e: MessageEvent<{ seed: number; filters: SearchFilters }>) => {
  const { seed, filters } = e.data
  const results: FrameResult[] = []
  const maxFrames = filters.maxFrames ?? 100_000

  let current = seed

  for (let frame = 1; frame <= maxFrames; frame++) {
    const rng1 = lcgNext(current)
    const rng2 = lcgNext(rng1)
    const pid = calcPID(rng1, rng2)

    const shinyResult = isShiny(pid, filters.tid, filters.sid)
    const nature = getNature(pid)
    const gender = getGender(pid, filters.genderRatio ?? 127)

    const passesShiny = !filters.targetShiny || shinyResult
    const passesNature = !filters.targetNatures?.length || filters.targetNatures.includes(nature)
    const passesGender = !filters.gender || filters.gender === 'any' || filters.gender === gender

    if (passesShiny && passesNature && passesGender) {
      results.push({ frame, seed: current, pid, shiny: shinyResult, nature, gender })
    }

    current = rng2

    // Envía progreso cada 10k frames
    if (frame % 10_000 === 0) {
      self.postMessage({ type: 'progress', frame, total: maxFrames })
    }
  }

  self.postMessage({ type: 'done', results })
}
