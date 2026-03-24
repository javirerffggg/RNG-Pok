/**
 * rngWorker.ts — Web Worker multi-generación
 * Recibe SearchOptions y postea resultados en chunks para no bloquear la UI.
 */
import { lcgNext, calcPID } from '../utils/lcg'
import { getNature, isShiny as isShinyFn, getGender } from '../utils/shiny'
import { gen5IVsFromMT } from '../utils/gen5seed'
import type { Nature } from '../utils/shiny'
import type { GameGen } from '../context/GameContext'

export interface FrameResult {
  frame:    number
  pid:      number
  nature:   Nature
  shiny:    boolean
  gender:   'M' | 'F' | '\u2013'
  ability:  number
  ivs?:     [number,number,number,number,number,number]
}

export interface SearchFilters {
  tid:           number
  sid:           number
  genderRatio:   number
  maxFrames?:    number
  targetShiny?:  boolean
  targetNatures?: Nature[]
  gender?:       'M' | 'F'
  targetAbility?: 0 | 1
  gen?:          GameGen
  fixedSeed?:    boolean  // Esmeralda
}

self.onmessage = (e: MessageEvent) => {
  const { seed, filters } = e.data as { seed: number; filters: SearchFilters }
  const {
    tid, sid, genderRatio,
    maxFrames  = 500_000,
    targetShiny,
    targetNatures,
    gender,
    targetAbility,
    gen         = 4,
    fixedSeed   = false,
  } = filters

  const results: FrameResult[] = []
  const seedInit = (fixedSeed && gen === 3) ? 0 : (seed >>> 0)
  const CHUNK    = 10_000

  let rng = seedInit

  for (let frame = 0; frame < maxFrames; frame++) {
    let pid: number
    let ivs: [number,number,number,number,number,number] | undefined

    if (gen === 5) {
      ivs = gen5IVsFromMT(rng)
      const r1 = lcgNext(rng)
      const r2 = lcgNext(r1)
      pid  = calcPID(r1, r2)
      rng  = r1
    } else {
      const r1 = lcgNext(rng)
      const r2 = lcgNext(r1)
      pid  = calcPID(r1, r2)
      rng  = r1
    }

    const nat    = getNature(pid)
    const shiny  = isShinyFn(pid, tid, sid)
    const gdr    = getGender(pid, genderRatio)
    const abil   = pid & 1

    const passes =
      (!targetShiny    || shiny) &&
      (!targetNatures  || targetNatures.includes(nat)) &&
      (!gender         || gdr === gender) &&
      (targetAbility === undefined || abil === targetAbility)

    if (passes) results.push({ frame, pid, nature: nat, shiny, gender: gdr, ability: abil, ivs })

    if (frame % CHUNK === 0)
      self.postMessage({ type: 'progress', frame, total: maxFrames })
  }

  self.postMessage({ type: 'done', results })
}
