import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Search, ChevronRight, Dna, Hash } from 'lucide-react'
import { lcgNext, calcPID } from '../../utils/lcg'
import { getNature, NATURES } from '../../utils/shiny'
import {
  loadPokemonDB, searchPokemon, calcAllIVs, calcGender,
  calcAbility, getNatureMods, type PokemonData, type BaseStats
} from '../../data/pokemon-db'
import { PokemonPicker } from '../../components/PokemonPicker'
import { IVBadge } from '../../components/IVBadge'

const CONSOLES = [
  { id: 'GBA'  as const, label: 'GBA', delay: 0,    icon: '🎮' },
  { id: 'DS'   as const, label: 'DS',  delay: 629,  icon: '📟' },
  { id: 'DSi'  as const, label: 'DSi', delay: 664,  icon: '📱' },
  { id: '3DS'  as const, label: '3DS', delay: 1000, icon: '🕹️' },
]
type ConsoleType = typeof CONSOLES[number]['id']

const STAT_KEYS: (keyof BaseStats)[] = ['hp','atk','def','spa','spd','spe']
const STAT_LABELS = { hp:'HP', atk:'ATK', def:'DEF', spa:'SpA', spd:'SpD', spe:'SPE' }

export function SeedFinder() {
  const [dbLoaded, setDbLoaded]     = useState(false)
  const [consoleType, setConsole]   = useState<ConsoleType>('DS')
  const [date, setDate]             = useState('')
  const [time, setTime]             = useState('')
  const [pokemon, setPokemon]       = useState<PokemonData | null>(null)
  const [level, setLevel]           = useState('5')
  const [nature, setNature]         = useState('')
  const [visibleStats, setStats]    = useState<Partial<BaseStats>>({})
  const [foundSeed, setFoundSeed]   = useState<number | null>(null)
  const [calcIVs, setCalcIVs]       = useState<Record<string, number> | null>(null)
  const [searching, setSearching]   = useState(false)

  useEffect(() => {
    loadPokemonDB().then(() => setDbLoaded(true))
  }, [])

  const selectedConsole = CONSOLES.find(c => c.id === consoleType)!

  const handleStatChange = (stat: keyof BaseStats, val: string) =>
    setStats(prev => ({ ...prev, [stat]: val === '' ? undefined : parseInt(val) }))

  const handleSearch = async () => {
    setSearching(true)
    setFoundSeed(null)
    setCalcIVs(null)
    await new Promise(r => setTimeout(r, 120))

    const timestamp = new Date(`${date}T${time}`).getTime()
    let testSeed = ((timestamp + selectedConsole.delay) & 0xFFFFFFFF) >>> 0
    let found: number | null = null

    for (let i = 0; i < 10000; i++) {
      const rng1 = lcgNext(testSeed)
      const rng2 = lcgNext(rng1)
      const pid  = calcPID(rng1, rng2)
      if (getNature(pid).toLowerCase() === nature.toLowerCase()) {
        found = testSeed
        break
      }
      testSeed = lcgNext(testSeed)
    }

    setFoundSeed(found ?? -1)

    // Si tenemos Pokémon + stats visibles → calcular IVs automáticamente
    if (found !== null && pokemon) {
      const allStats = STAT_KEYS.every(k => visibleStats[k] !== undefined)
      if (allStats && nature && level) {
        const nMods = getNatureMods(nature)
        const ivs   = calcAllIVs(
          visibleStats as BaseStats,
          pokemon.baseStats,
          parseInt(level),
          nMods as any
        )
        setCalcIVs(ivs)
      }
    }
    setSearching(false)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient-accent">Seed</span>
          <span className="text-white ml-2">Finder</span>
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Identifica tu semilla inicial. Selecciona el Pokémon capturado y la app calculará sus IVs automáticamente.
        </p>
        {!dbLoaded && (
          <p className="text-xs text-poke-violet mt-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-poke-violet animate-pulse inline-block" />
            Cargando base de datos...
          </p>
        )}
      </div>

      {/* Consola */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-wider">
          <Cpu size={12} />
          <span>Consola · Delay: {selectedConsole.delay} frames</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CONSOLES.map(c => (
            <motion.button key={c.id} whileTap={{ scale: 0.94 }}
              onClick={() => setConsole(c.id)}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all flex flex-col items-center gap-0.5 ${
                consoleType === c.id ? 'btn-primary text-white' : 'glass-card-hover text-slate-400'
              }`}>
              <span className="text-base">{c.icon}</span>
              <span>{c.label}</span>
            </motion.button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Fecha consola</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="input-premium w-full rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Hora consola</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="input-premium w-full rounded-xl px-3 py-2.5 text-sm" />
          </div>
        </div>
      </div>

      {/* Pokémon + naturaleza + nivel */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <PokemonPicker value={pokemon} onChange={setPokemon} label="Pokémon capturado" genFilter={5} />

        {pokemon && (
          <AnimatePresence>
            <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-3">
              {/* Habilidades del Pokémon */}
              <div className="glass-card rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap">
                <Dna size={12} className="text-slate-500" />
                <span className="text-xs text-slate-400">Habilidades:</span>
                {pokemon.abilities.map((a, i) => (
                  <span key={a} className="badge text-[10px]"
                    style={{ background:'rgba(124,58,237,0.15)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.3)' }}>
                    [{i}] {a}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Dna size={11} /> Naturaleza
                  </label>
                  <select value={nature} onChange={e => setNature(e.target.value)}
                    className="input-premium w-full rounded-xl px-3 py-2.5 text-sm">
                    <option value="">Seleccionar...</option>
                    {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Hash size={11} /> Nivel
                  </label>
                  <input type="number" value={level} onChange={e => setLevel(e.target.value)}
                    min="1" max="100" placeholder="5"
                    className="input-premium w-full rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </div>

              {/* Stats visibles */}
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-2">
                  Stats visibles en el juego (opcional — para calcular IVs)
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {STAT_KEYS.map(stat => (
                    <div key={stat} className="space-y-1">
                      <label className="text-[10px] text-slate-500 text-center block uppercase tracking-wide">
                        {STAT_LABELS[stat]}
                      </label>
                      <input type="number" min="1" max="999"
                        value={visibleStats[stat] ?? ''}
                        onChange={e => handleStatChange(stat, e.target.value)}
                        placeholder="—"
                        className="input-premium w-full rounded-lg px-1.5 py-2 text-sm text-center font-mono"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Sin Pokémon: modo clásico por naturaleza texto */}
        {!pokemon && (
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Naturaleza (modo rápido)</label>
            <select value={nature} onChange={e => setNature(e.target.value)}
              className="input-premium w-full rounded-xl px-3 py-2.5 text-sm">
              <option value="">Seleccionar naturaleza...</option>
              {NATURES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}

        <motion.button whileTap={{ scale: 0.97 }} onClick={handleSearch}
          disabled={searching || !date || !time || !nature}
          className="btn-primary w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
          {searching ? (
            <><motion.div animate={{ rotate:360 }} transition={{ repeat:Infinity, duration:1, ease:'linear' }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Buscando...</>
          ) : (
            <><Search size={16} />Buscar Semilla<ChevronRight size={14} className="ml-auto opacity-60" /></>
          )}
        </motion.button>
      </div>

      {/* Resultado semilla */}
      <AnimatePresence>
        {foundSeed !== null && (
          <motion.div initial={{ opacity:0, scale:0.95, y:10 }} animate={{ opacity:1, scale:1, y:0 }}
            transition={{ type:'spring', stiffness:300, damping:25 }}>
            {foundSeed >= 0 ? (
              <div className="shiny-border rounded-2xl p-5 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">✨ Semilla encontrada</p>
                <p className="timer-display text-3xl font-bold text-gradient-shiny">
                  0x{foundSeed.toString(16).toUpperCase().padStart(8,'0')}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-mono">Decimal: {foundSeed}</p>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-4 text-center" style={{ borderColor:'rgba(233,69,96,0.3)' }}>
                <p className="text-poke-accent font-semibold">No se encontró semilla</p>
                <p className="text-xs text-slate-500 mt-1">Verifica fecha, hora y naturaleza</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* IVs calculados */}
      <AnimatePresence>
        {calcIVs && pokemon && (
          <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
            className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                <span className="text-gradient-shiny">IVs calculados</span>
                <span className="text-slate-500 ml-2 text-xs">— {pokemon.name}</span>
              </p>
              <span className="text-xs text-slate-500 font-mono">Lv.{level}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {STAT_KEYS.map((stat, i) => (
                <IVBadge key={stat} stat={stat} iv={calcIVs[stat]} delay={i * 0.05} />
              ))}
            </div>
            {Object.values(calcIVs).filter(v => v === 31).length >= 3 && (
              <p className="text-xs text-center text-poke-shiny animate-float">
                ✨ ¡Este Pokémon tiene {Object.values(calcIVs).filter(v=>v===31).length} IVs perfectos!
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
