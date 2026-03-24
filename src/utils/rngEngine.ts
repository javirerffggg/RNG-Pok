/**
 * rngEngine.ts — Motor RNG unificado por generación. Única fuente de verdad.
 * - Gen 3: LCG puro (Esmeralda: seed fija = 0)
 * - Gen 4: LCG puro + soporte de frames de Llamadas de la Madre
 * - Gen 5: MT para IVs + LCG para PID (motor dual)
 *
 * Tanto el Web Worker como la UI usan este módulo directamente.
 */
import { lcgNext, calcPID } from './lcg'
import { getNature, isShiny, getGender, type Nature } from './shiny'
import { gen5IVsFromMT } from './gen5seed'
import type { GameGen } from '../context/GameContext'

export interface RNGFrame {
  frame:   number
  pid:     number
  nature:  Nature
  shiny:   boolean
  gender:  'M' | 'F' | '\u2013'
  ability: number
  ivs?:    [number,number,number,number,number,number]
}

export interface SearchOptions {
  gen:           GameGen
  seed:          number
  tid:           number
  sid:           number
  maxFrames:     number
  genderRatio:   number
  targetShiny?:  boolean
  targetNatures?: Nature[]
  targetGender?:  'M' | 'F'
  targetAbility?: 0 | 1
  fixedSeed?:    boolean
}

/**
 * Generador unificado. Itera hasta maxFrames y hace yield de cada frame
 * que pase los filtros. El caller decide si ejecuta en Worker o en UI.
 */
export function* rngSearch(opts: SearchOptions): Generator<RNGFrame> {
  const { gen, tid, sid, maxFrames, genderRatio } = opts
  const seedInit = (opts.fixedSeed && gen === 3) ? 0 : (opts.seed >>> 0)

  if (gen === 5) {
    yield* searchGen5(seedInit, opts)
  } else {
    yield* searchGen34(seedInit, opts, maxFrames)
  }
}

function* searchGen34(
  seed: number,
  opts: SearchOptions,
  maxFrames: number
): Generator<RNGFrame> {
  const { tid, sid, genderRatio } = opts
  let rng = seed >>> 0

  for (let frame = 0; frame < maxFrames; frame++) {
    const r1  = lcgNext(rng)
    const r2  = lcgNext(r1)
    const pid = calcPID(r1, r2)
    const nat = getNature(pid)
    const shy = isShiny(pid, tid, sid)
    const gdr = getGender(pid, genderRatio)
    const abl = pid & 1

    const passes =
      (!opts.targetShiny   || shy) &&
      (!opts.targetNatures || opts.targetNatures.includes(nat)) &&
      (!opts.targetGender  || gdr === opts.targetGender) &&
      (opts.targetAbility === undefined || abl === opts.targetAbility)

    if (passes) yield { frame, pid, nature: nat, shiny: shy, gender: gdr, ability: abl }
    rng = r1
  }
}

function* searchGen5(
  seed: number,
  opts: SearchOptions
): Generator<RNGFrame> {
  const { tid, sid, genderRatio, maxFrames } = opts
  let lcgSeed = seed >>> 0

  for (let frame = 0; frame < maxFrames; frame++) {
    const ivs    = gen5IVsFromMT(lcgSeed)
    const r1     = lcgNext(lcgSeed)
    const r2     = lcgNext(r1)
    const pid    = calcPID(r1, r2)
    const nat    = getNature(pid)
    const shy    = isShiny(pid, tid, sid)
    const gdr    = getGender(pid, genderRatio)
    const abl    = pid & 1

    const passes =
      (!opts.targetShiny   || shy) &&
      (!opts.targetNatures || opts.targetNatures.includes(nat)) &&
      (!opts.targetGender  || gdr === opts.targetGender) &&
      (opts.targetAbility === undefined || abl === opts.targetAbility)

    if (passes) yield { frame, pid, nature: nat, shiny: shy, gender: gdr, ability: abl, ivs }
    lcgSeed = r1
  }
}

/**
 * Calcula frames extra por Llamadas de la Madre (Gen 4).
 * ~1 llamada cada 2 minutos de juego activo.
 */
export function calcMotherCallAdvance(minutesPlayed: number): number {
  return Math.floor(minutesPlayed / 2)
}
