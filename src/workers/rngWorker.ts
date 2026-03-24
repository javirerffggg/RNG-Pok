/**
 * rngWorker.ts — Web Worker multi-generación.
 * Delega TODA la lógica de iteración en rngEngine.ts (Single Source of Truth).
 * El hilo principal no se bloquea: los resultados se envían en chunks de 10k frames.
 */
import { rngSearch, type SearchOptions, type RNGFrame } from '../utils/rngEngine'
import type { Nature } from '../utils/shiny'
import type { GameGen } from '../context/GameContext'

export interface FrameResult {
  frame:   number
  pid:     number
  nature:  Nature
  shiny:   boolean
  gender:  'M' | 'F' | '\u2013'
  ability: number
  ivs?:    [number,number,number,number,number,number]
}

export interface SearchFilters {
  tid:            number
  sid:            number
  genderRatio:    number
  maxFrames?:     number
  targetShiny?:   boolean
  targetNatures?: Nature[]
  gender?:        'M' | 'F'
  targetAbility?: 0 | 1
  gen?:           GameGen
  fixedSeed?:     boolean
}

self.onmessage = (e: MessageEvent) => {
  const { seed, filters } = e.data as { seed: number; filters: SearchFilters }
  const {
    tid, sid, genderRatio,
    maxFrames     = 500_000,
    targetShiny,
    targetNatures,
    gender,
    targetAbility,
    gen           = 4,
    fixedSeed     = false,
  } = filters

  const opts: SearchOptions = {
    gen,
    seed,
    tid,
    sid,
    maxFrames,
    genderRatio,
    targetShiny,
    targetNatures: targetNatures as Nature[] | undefined,
    targetGender:  gender,
    targetAbility,
    fixedSeed,
  }

  const results: FrameResult[] = []
  const CHUNK = 10_000
  let   chunk = 0

  // Iterar el generador de rngEngine (Single Source of Truth)
  for (const frame of rngSearch(opts)) {
    results.push(frame as FrameResult)

    // Progress cada CHUNK frames procesados (usamos frame.frame como indicador)
    if (frame.frame >= chunk * CHUNK) {
      self.postMessage({ type: 'progress', frame: frame.frame, total: maxFrames })
      chunk++
    }
  }

  self.postMessage({ type: 'done', results })
}
