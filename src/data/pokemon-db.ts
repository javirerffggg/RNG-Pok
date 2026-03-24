// pokemon-db.ts — Generado automáticamente desde pokemon.csv
// 801 Pokémon (Gen 1-7) · Stats Base · Habilidades · Ratio de Género RNG
// NO editar manualmente

export interface BaseStats {
  hp: number; atk: number; def: number
  spa: number; spd: number; spe: number
}

export interface PokemonData {
  id:          number        // Nº Pokédex
  name:        string        // Nombre EN
  gen:         number        // Generación 1-7
  type1:       string
  type2:       string | null
  abilities:   string[]      // índice 0 = PID par, 1 = PID impar (Gen 3/4)
  genderRatio: number        // 0=siempre♂  254=siempre♀  255=sin género  127=50/50
  captureRate: number        // 0-255
  isLegendary: boolean
  baseStats:   BaseStats
}

// ── Helpers ────────────────────────────────────────────────
export const BY_ID   = new Map<number, PokemonData>()
export const BY_NAME = new Map<string, PokemonData>()

/** Pokémon de Gen 1-5 (relevantes para RNG manipulation) */
export let RNG_POKEMON: PokemonData[] = []

export async function loadPokemonDB(): Promise<PokemonData[]> {
  if (BY_ID.size > 0) return Array.from(BY_ID.values())
  const res  = await fetch('/pokemon.csv')
  const text = await res.text()
  const db   = parseCSV(text)
  db.forEach(p => {
    BY_ID.set(p.id, p)
    BY_NAME.set(p.name.toLowerCase(), p)
  })
  RNG_POKEMON = db.filter(p => p.gen <= 5)
  return db
}

function parseCSV(csv: string): PokemonData[] {
  const lines  = csv.trim().split('\n')
  const header = lines[0].split(',')
  const idx    = (col: string) => header.indexOf(col)

  // Índices de columnas
  const I = {
    abilities:    idx('abilities'),
    attack:       idx('attack'),
    captureRate:  idx('capture_rate'),
    defense:      idx('defense'),
    generation:   idx('generation'),
    hp:           idx('hp'),
    isLegendary:  idx('is_legendary'),
    name:         idx('name'),
    pctMale:      idx('percentage_male'),
    pokedex:      idx('pokedex_number'),
    spAttack:     idx('sp_attack'),
    spDefense:    idx('sp_defense'),
    speed:        idx('speed'),
    type1:        idx('type1'),
    type2:        idx('type2'),
  }

  const records: PokemonData[] = []

  for (let i = 1; i < lines.length; i++) {
    const row = splitCSVRow(lines[i])
    if (row.length < 10) continue

    const pctMale = row[I.pctMale]?.trim()
    const genderRatio = pctMaleToRatio(pctMale)

    records.push({
      id:          safeInt(row[I.pokedex]),
      name:        row[I.name]?.trim() ?? '',
      gen:         safeInt(row[I.generation]),
      type1:       row[I.type1]?.trim() ?? '',
      type2:       row[I.type2]?.trim() || null,
      abilities:   parseAbilities(row[I.abilities] ?? ''),
      genderRatio,
      captureRate: safeInt(row[I.captureRate], 45),
      isLegendary: row[I.isLegendary]?.trim() === '1',
      baseStats: {
        hp:  safeInt(row[I.hp]),
        atk: safeInt(row[I.attack]),
        def: safeInt(row[I.defense]),
        spa: safeInt(row[I.spAttack]),
        spd: safeInt(row[I.spDefense]),
        spe: safeInt(row[I.speed]),
      },
    })
  }
  return records
}

function splitCSVRow(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuote = false
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote }
    else if (ch === ',' && !inQuote) { result.push(cur); cur = '' }
    else cur += ch
  }
  result.push(cur)
  return result
}

function parseAbilities(raw: string): string[] {
  const clean = raw.replace(/[\[\]'"]/g, '').trim()
  return clean ? clean.split(',').map(s => s.trim()).filter(Boolean) : []
}

function safeInt(val: string | undefined, fallback = 0): number {
  if (!val) return fallback
  const m = val.match(/\d+/)
  return m ? parseInt(m[0]) : fallback
}

function pctMaleToRatio(pct: string | undefined): number {
  if (!pct || pct.trim() === '') return 255 // genderless
  const p = parseFloat(pct)
  if (isNaN(p)) return 255
  const map: Record<number, number> = {
    100: 0, 88.1: 31, 75: 63, 50: 127,
    25: 191, 12.5: 223, 0: 254,
  }
  if (p in map) return map[p]
  return Math.min(254, Math.round((100 - p) / 100 * 256))
}

// ── Búsqueda ───────────────────────────────────────────────
export function searchPokemon(q: string): PokemonData[] {
  const s = q.toLowerCase().trim()
  if (!s) return []
  const db = Array.from(BY_ID.values())
  return db.filter(p =>
    p.name.toLowerCase().includes(s) ||
    p.abilities.some(a => a.toLowerCase().includes(s)) ||
    String(p.id) === s
  ).slice(0, 20)
}

export function getPokemon(nameOrId: string | number): PokemonData | undefined {
  return typeof nameOrId === 'number'
    ? BY_ID.get(nameOrId)
    : BY_NAME.get(nameOrId.toLowerCase())
}

// ── Cálculo de IVs (fórmula Gen 3+) ──────────────────────
/**
 * HP = floor((2*base + iv + floor(ev/4)) * level / 100) + level + 10
 */
export function calcHPIV(stat: number, base: number, level: number, ev = 0): number {
  for (let iv = 0; iv <= 31; iv++)
    if (Math.floor((2*base + iv + Math.floor(ev/4)) * level / 100) + level + 10 === stat)
      return iv
  return -1
}

/**
 * Stat = floor((floor((2*base + iv + floor(ev/4)) * level / 100) + 5) * nature)
 */
export function calcStatIV(
  stat: number, base: number, level: number,
  nature: 1.1 | 1.0 | 0.9 = 1.0, ev = 0
): number {
  for (let iv = 0; iv <= 31; iv++)
    if (Math.floor((Math.floor((2*base + iv + Math.floor(ev/4)) * level / 100) + 5) * nature) === stat)
      return iv
  return -1
}

/** Calcula los 6 IVs dados los stats visibles del Pokémon */
export function calcAllIVs(
  stats:  BaseStats,
  base:   BaseStats,
  level:  number,
  nMods:  Record<'atk'|'def'|'spa'|'spd'|'spe', 1.1|1.0|0.9>,
  evs:    BaseStats = { hp:0,atk:0,def:0,spa:0,spd:0,spe:0 }
): Record<keyof BaseStats, number> {
  return {
    hp:  calcHPIV(stats.hp,  base.hp,  level, evs.hp),
    atk: calcStatIV(stats.atk, base.atk, level, nMods.atk, evs.atk),
    def: calcStatIV(stats.def, base.def, level, nMods.def, evs.def),
    spa: calcStatIV(stats.spa, base.spa, level, nMods.spa, evs.spa),
    spd: calcStatIV(stats.spd, base.spd, level, nMods.spd, evs.spd),
    spe: calcStatIV(stats.spe, base.spe, level, nMods.spe, evs.spe),
  }
}

// ── Género desde PID ──────────────────────────────────────
/** (PID & 0xFF) < genderRatio → Hembra (lógica del juego) */
export function calcGender(pid: number, genderRatio: number): 'M' | 'F' | '–' {
  if (genderRatio === 255) return '–'
  if (genderRatio === 0)   return 'M'
  if (genderRatio === 254) return 'F'
  return (pid & 0xFF) < genderRatio ? 'F' : 'M'
}

// ── Habilidad desde PID (Gen 3/4) ────────────────────────
/** PID par → abilities[0], PID impar → abilities[1] */
export function calcAbility(pid: number, abilities: string[]): string {
  return abilities[pid & 1] ?? abilities[0] ?? 'Unknown'
}

// ── Multiplicadores de naturaleza ─────────────────────────
type StatKey = 'atk'|'def'|'spa'|'spd'|'spe'
type NMod    = 1.1 | 1.0 | 0.9

const NATURE_FX: Record<string, [StatKey|'–', StatKey|'–']> = {
  Hardy:   ['–','–'],   Lonely:  ['atk','def'], Brave:   ['atk','spe'],
  Adamant: ['atk','spa'], Naughty:['atk','spd'],
  Bold:    ['def','atk'], Docile:  ['–','–'],   Relaxed: ['def','spe'],
  Impish:  ['def','spa'], Lax:    ['def','spd'],
  Timid:   ['spe','atk'], Hasty:   ['spe','def'], Serious: ['–','–'],
  Jolly:   ['spe','spa'], Naive:   ['spe','spd'],
  Modest:  ['spa','atk'], Mild:    ['spa','def'], Quiet:   ['spa','spe'],
  Bashful: ['–','–'],   Rash:    ['spa','spd'],
  Calm:    ['spd','atk'], Gentle:  ['spd','def'], Sassy:   ['spd','spe'],
  Careful: ['spd','spa'], Quirky:  ['–','–'],
}

export function getNatureMods(nature: string): Record<StatKey, NMod> {
  const [up, down] = NATURE_FX[nature] ?? ['–','–']
  const m = { atk:1.0,def:1.0,spa:1.0,spd:1.0,spe:1.0 } as Record<StatKey, NMod>
  if (up   !== '–') m[up]   = 1.1
  if (down !== '–') m[down] = 0.9
  return m
}
