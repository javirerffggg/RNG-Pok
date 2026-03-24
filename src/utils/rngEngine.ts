/**
 * rngEngine.ts — Motor RNG unificado por generación.
 * Según la generación activa, usa algoritmos distintos.
 */
import { lcgNext, lcgPrev, calcPID } from './lcg'
import { getNature, isShiny, getGender, type Nature } from './shiny'
import { gen5IVsFromMT } from './gen5seed'
import type { GameGen } from '../context/GameContext'

export interface RNGFrame {
  frame:    number
  pid:      number
  nature:   Nature
  shiny:    boolean
  gender:   'M' | 'F' | '\u2013'
  ivs?:     [number,number,number,number,number,number]  // Gen5: HP/ATK/DEF/SPE/SPA/SPD
  ability:  number  // 0 ó 1
}

export interface SearchOptions {
  gen:          GameGen
  seed:         number
  tid:          number
  sid:          number
  maxFrames:    number
  genderRatio:  number
  targetShiny?: boolean
  targetNatures?: Nature[]
  targetGender?:  'M' | 'F'
  targetAbility?: 0 | 1
  /** Solo Esmeralda: semilla fija = 0 */
  fixedSeed?:   boolean
}

/**
 * Generador unificado: devuelve iterador de frames para cualquier gen.
 * - Gen 3: LCG puro (PID = 2 outputs LCG)
 * - Gen 4: LCG puro + soporte para llamadas de la Madre como frame advance
 * - Gen 5: MT para IVs, LCG para PID (moto dual)
 */
export function* rngSearch(opts: SearchOptions): Generator<RNGFrame> {
  const { gen, tid, sid, maxFrames, genderRatio } = opts
  const seedInit = (opts.fixedSeed && gen === 3) ? 0 : opts.seed

  if (gen === 5) {
    yield* searchGen5(seedInit, opts)
  } else {
    yield* searchGen34(seedInit, opts)
  }
}

function* searchGen34(seed: number, opts: SearchOptions): Generator<RNGFrame> {
  const { tid, sid, maxFrames, genderRatio } = opts
  let rng = seed >>> 0

  for (let frame = 0; frame < maxFrames; frame++) {
    const r1  = lcgNext(rng)
    const r2  = lcgNext(r1)
    const pid = calcPID(r1, r2)
    const nat = getNature(pid)
    const shiny = isShiny(pid, tid, sid)
    const gender = getGender(pid, genderRatio)
    const ability = pid & 1

    const passes =
      (!opts.targetShiny    || shiny) &&
      (!opts.targetNatures  || opts.targetNatures.includes(nat)) &&
      (!opts.targetGender   || gender === opts.targetGender) &&
      (opts.targetAbility === undefined || ability === opts.targetAbility)

    if (passes) {
      yield { frame, pid, nature: nat, shiny, gender, ability }
    }
    rng = r1
  }
}

function* searchGen5(seed: number, opts: SearchOptions): Generator<RNGFrame> {
  const { tid, sid, maxFrames, genderRatio } = opts
  let lcgSeed = seed >>> 0

  for (let frame = 0; frame < maxFrames; frame++) {
    // Gen5: IVs desde MT, PID desde LCG
    const ivs    = gen5IVsFromMT(lcgSeed)
    const r1     = lcgNext(lcgSeed)
    const r2     = lcgNext(r1)
    const pid    = calcPID(r1, r2)
    const nat    = getNature(pid)
    const shiny  = isShiny(pid, tid, sid)
    const gender = getGender(pid, genderRatio)
    const ability = pid & 1

    const passes =
      (!opts.targetShiny   || shiny) &&
      (!opts.targetNatures || opts.targetNatures.includes(nat)) &&
      (!opts.targetGender  || gender === opts.targetGender) &&
      (opts.targetAbility === undefined || ability === opts.targetAbility)

    if (passes) {
      yield { frame, pid, nature: nat, shiny, gender, ability, ivs }
    }
    lcgSeed = r1
  }
}

/**
 * Calcula frames de avance por "Llamadas de la Madre" (Gen 4)
 * Cada llamada avanza el RNG 1 frame extra. Se acumula en sesiones largas.
 */
export function calcMotherCallAdvance(minutesPlayed: number): number {
  // Promedio: ~1 llamada cada 2 minutos en Gen 4
  return Math.floor(minutesPlayed / 2)
}
