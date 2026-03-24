import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, ChevronRight, Dna, Cpu, HelpCircle } from 'lucide-react'
import { loadPokemonDB, calcAllIVs, type PokemonData } from '../../data/pokemon-db'
import { reversePIDSearch, type SeedCandidate, type CapturedPokemon } from '../../utils/pidReverse'
import { PokemonPicker } from '../../components/PokemonPicker'
import { IVBadge } from '../../components/IVBadge'
import { useProfile } from '../../hooks/useProfile'
import { useGame } from '../../context/GameContext'
import { NATURES } from '../../utils/shiny'
import type { Nature } from '../../utils/shiny'

const STAT_LABELS = ['HP','ATK','DEF','SPE','SPA','SPD'] as const

function toHex8(n: number) {
  return '0x' + n.toString(16).toUpperCase().padStart(8, '0')
}

export function SeedFinder() {
  const { profile } = useProfile()
  const { activeGen } = useGame()

  const [pokemon,   setPokemon]   = useState<PokemonData | null>(null)
  const [level,     setLevel]     = useState('50')
  const [stats,     setStats]     = useState(['','','','','',''])
  const [nature,    setNature]    = useState<Nature>('Hardy')
  const [ability,   setAbility]   = useState<0|1>(0)
  const [gender,    setGender]    = useState<'M'|'F'|'\u2013'>('\u2013')
  const [ivs,       setIVs]       = useState<(number|null)[]>(Array(6).fill(null))
  const [searching, setSearching] = useState(false)
  const [candidates,setCandidates]= useState<SeedCandidate[]>([])
  const [showHelp,  setShowHelp]  = useState(false)

  useEffect(() => { loadPokemonDB() }, [])

  const calcIVs = () => {
    if (!pokemon) return
    const base = [
      pokemon.stats.hp, pokemon.stats.atk, pokemon.stats.def,
      pokemon.stats.spe, pokemon.stats.spa, pokemon.stats.spd
    ]
    const lvl = parseInt(level)
    const result = stats.map((s, i) => {
      const sv = parseInt(s)
      if (isNaN(sv) || isNaN(lvl)) return null
      return calcAllIVs(
        [sv, parseInt(stats[1]), parseInt(stats[2]), parseInt(stats[3]), parseInt(stats[4]), parseInt(stats[5])],
        base as any, lvl, nature
      )[i]
    })
    setIVs(result)
  }

  const doReverseSearch = () => {
    if (ivs.some(v => v === null)) return
    setSearching(true)
    // Ejecutar en setTimeout para no bloquear UI
    setTimeout(() => {
      const captured: CapturedPokemon = {
        ivHP: ivs[0]!, ivAtk: ivs[1]!, ivDef: ivs[2]!,
        ivSpe: ivs[3]!, ivSpA: ivs[4]!, ivSpD: ivs[5]!,
        nature, ability, gender,
        genderRatio: pokemon?.genderRatio ?? 127,
        shiny: undefined,
        tid: parseInt(profile.tid) || undefined,
        sid: parseInt(profile.sid) || undefined,
      }
      const results = reversePIDSearch(captured, {
        tid: parseInt(profile.tid) || 0,
        sid: parseInt(profile.sid) || 0,
        gen: activeGen as 3|4|5,
      })
      setCandidates(results)
      setSearching(false)
    }, 50)
  }

  const allIVsReady = ivs.every(v => v !== null)
  const perfect31s  = ivs.filter(v => v === 31).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            <span className="text-gradient-accent">Seed</span>
            <span className="text-white ml-2">Finder</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">Identifica tu semilla desde un Pokémon capturado.</p>
        </div>
        <button onClick={() => setShowHelp(p=>!p)} className="text-slate-600 hover:text-slate-400 transition-colors">
          <HelpCircle size={18} />
        </button>
      </div>

      {/* Tooltip ayuda */}
      <AnimatePresence>
        {showHelp && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
            className="overflow-hidden">
            <div className="glass-card rounded-xl p-3 border border-poke-violet/20 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-white">Cómo funciona la búsqueda inversa de PID</p>
              <p>1️⃣ Captura un Pokémon y anota sus stats visibles.</p>
              <p>2️⃣ Selecciona su especie para obtener los Stats Base automáticamente.</p>
              <p>3️⃣ La app calcula sus IVs y luego invierte el LCG para encontrar qué semillas pudieron generarlo.</p>
              <p>4️⃣ Usa las semillas candidatas en el TargetFinder para ir directo a tu Shiny.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selector Pokémon */}
      <PokemonPicker value={pokemon} onChange={setPokemon} label="Pokémon capturado" genFilter={5} />

      {/* Stats input */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
            <Dna size={12} /> Stats visibles (nivel {level})
          </span>
          <input type="number" value={level} onChange={e=>setLevel(e.target.value)}
            className="input-premium w-16 rounded-lg px-2 py-1 text-xs text-center" placeholder="50" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {STAT_LABELS.map((label, i) => (
            <div key={label} className="space-y-1">
              <label className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</label>
              <div className="flex gap-1 items-center">
                <input type="number" value={stats[i]}
                  onChange={e => { const ns=[...stats]; ns[i]=e.target.value; setStats(ns) }}
                  placeholder="–"
                  className="input-premium w-full rounded-lg px-2 py-2 text-sm font-mono" />
                {ivs[i] !== null && <IVBadge iv={ivs[i]!} />}
              </div>
            </div>
          ))}
        </div>

        {/* Naturaleza + habilidad */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Naturaleza</label>
            <select value={nature} onChange={e=>setNature(e.target.value as Nature)}
              className="input-premium w-full rounded-xl px-3 py-2 text-sm">
              {NATURES.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Género</label>
            <select value={gender} onChange={e=>setGender(e.target.value as any)}
              className="input-premium w-full rounded-xl px-3 py-2 text-sm">
              <option value="\u2013">– Sin género</option>
              <option value="M">♂ Macho</option>
              <option value="F">♀ Hembra</option>
            </select>
          </div>
        </div>

        {/* Habilidad */}
        {pokemon && (
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Habilidad observada</label>
            <div className="flex gap-2">
              {pokemon.abilities.map((a,i) => (
                <motion.button key={a} whileTap={{scale:0.93}} onClick={() => setAbility(i as 0|1)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    ability===i ? 'btn-primary text-white' : 'glass-card text-slate-400'
                  }`}>[{i}] {a}</motion.button>
              ))}
            </div>
          </div>
        )}

        <motion.button whileTap={{scale:0.97}} onClick={calcIVs}
          disabled={!pokemon || stats.some(s=>!s)}
          className="btn-primary w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
          <Dna size={15}/> Calcular IVs
        </motion.button>
      </div>

      {/* IVs resultado */}
      <AnimatePresence>
        {allIVsReady && (
          <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="glass-card rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <Dna size={12} /> IVs calculados
              </span>
              {perfect31s >= 3 && (
                <span className="text-xs text-yellow-400 font-semibold">✨ {perfect31s} x 31!</span>
              )}
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {STAT_LABELS.map((label,i) => (
                <div key={label} className="text-center space-y-1">
                  <p className="text-[9px] text-slate-600 uppercase">{label}</p>
                  <IVBadge iv={ivs[i]!} size="lg" />
                </div>
              ))}
            </div>

            {/* Búsqueda inversa de PID */}
            <motion.button whileTap={{scale:0.97}} onClick={doReverseSearch}
              disabled={searching}
              className="btn-primary w-full text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              {searching
                ? <><motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Buscando semillas...</>
                : <><Cpu size={15}/> Encontrar Semillas Candidatas <ChevronRight size={13} className="ml-auto opacity-60"/></>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Candidatos */}
      <AnimatePresence>
        {candidates.length > 0 && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-3">
            <p className="text-sm">
              <span className="text-gradient-shiny">{candidates.length}</span>
              <span className="text-slate-400 ml-1.5">semillas candidatas</span>
            </p>
            <div className="space-y-2">
              {candidates.slice(0,10).map((c,i) => (
                <motion.div key={c.seed} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className="glass-card rounded-xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-white font-bold">{toHex8(c.seed)}</span>
                    <div className="flex items-center gap-2">
                      {c.shiny && <span className="text-yellow-400 text-xs">✨ Shiny</span>}
                      <span className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{
                          background: `rgba(124,58,237,${c.confidence * 0.3 + 0.1})`,
                          color: `rgba(167,139,250,${c.confidence * 0.5 + 0.5})`
                        }}>
                        {Math.round(c.confidence * 100)}% match
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="font-mono text-violet-400">PID: {toHex8(c.pid)}</span>
                    <span>{c.method}</span>
                  </div>
                  <p className="text-[10px] text-slate-600">
                    Copia esta semilla en el TargetFinder para buscar tu Shiny desde este punto.
                  </p>
                </motion.div>
              ))}
            </div>
            {candidates.length > 10 && (
              <p className="text-xs text-slate-600 text-center">
                +{candidates.length - 10} candidatos adicionales (mostrando los de mayor confianza)
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
