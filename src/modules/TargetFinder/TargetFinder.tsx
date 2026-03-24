import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanSearch, Sparkles, ChevronRight, Filter, ArrowUp, ArrowDown } from 'lucide-react'
import type { FrameResult, SearchFilters } from '../../workers/rngWorker'
import { NATURES } from '../../utils/shiny'
import { lcgNext, calcPID } from '../../utils/lcg'
import { getNature } from '../../utils/shiny'
import confetti from 'canvas-confetti'
import {
  loadPokemonDB, calcGender, calcAbility,
  type PokemonData
} from '../../data/pokemon-db'
import { PokemonPicker } from '../../components/PokemonPicker'
import { useProfile } from '../../hooks/useProfile'
import { useGame } from '../../context/GameContext'

const NATURE_STAT: Record<string, string> = {
  Lonely:'nature-atk', Brave:'nature-atk', Adamant:'nature-atk', Naughty:'nature-atk',
  Bold:'nature-def',   Relaxed:'nature-def', Impish:'nature-def', Lax:'nature-def',
  Modest:'nature-spa', Mild:'nature-spa',    Quiet:'nature-spa',  Rash:'nature-spa',
  Calm:'nature-spd',   Gentle:'nature-spd',  Sassy:'nature-spd',  Careful:'nature-spd',
  Timid:'nature-spe',  Hasty:'nature-spe',   Jolly:'nature-spe',  Naive:'nature-spe',
}

function formatPID(pid: number) {
  const h = pid.toString(16).toUpperCase().padStart(8,'0')
  return `${h.slice(0,4)}\u00b7${h.slice(4)}`
}

function isShinyLocal(pid: number, tid: number, sid: number): boolean {
  return ((pid >> 16) ^ (pid & 0xFFFF) ^ tid ^ sid) < 8
}

function ShimmerCard() {
  return (
    <div className="glass-card rounded-xl p-3 space-y-2">
      <div className="shimmer-skeleton h-4 w-24 rounded" />
      <div className="shimmer-skeleton h-3 w-40 rounded" />
    </div>
  )
}

function getAdjacentFrames(
  seed: number, targetFrame: number, radius: number,
  tid: number, sid: number,
  pokemon: PokemonData | null
): Array<FrameResult & { ability: string; genderDisplay: string; delta: number }> {
  const results = []
  let rng = seed >>> 0
  const startFrame = Math.max(0, targetFrame - radius)
  for (let i = 0; i < startFrame; i++) rng = lcgNext(rng)
  for (let f = startFrame; f <= targetFrame + radius; f++) {
    const r1  = lcgNext(rng)
    const r2  = lcgNext(r1)
    const pid = calcPID(r1, r2)
    const nat = getNature(pid)
    const shiny = isShinyLocal(pid, tid, sid)
    results.push({
      frame: f, pid, nature: nat, shiny,
      gender:        pokemon ? calcGender(pid, pokemon.genderRatio) : '\u2013',
      ability:       pokemon ? calcAbility(pid, pokemon.abilities)  : '\u2014',
      genderDisplay: pokemon ? calcGender(pid, pokemon.genderRatio) : '\u2013',
      delta: f - targetFrame,
    })
    rng = r1
  }
  return results
}

export function TargetFinder() {
  const { profile, effectiveDelay, setLastPokemon } = useProfile()
  const { activeGen, isEmerald }                   = useGame()   // ← contexto de generación

  const [tid,           setTid]         = useState(profile.tid)
  const [sid,           setSid]         = useState(profile.sid)
  const [seed,          setSeed]        = useState('')
  const [pokemon,       setPokemon]     = useState<PokemonData | null>(null)
  const [targetShiny,   setTargetShiny] = useState(true)
  const [selNatures,    setNatures]     = useState<string[]>([])
  const [targetAbility, setAbility]     = useState('')
  const [targetGender,  setGender]      = useState<'any'|'M'|'F'>('any')
  const [results,       setResults]     = useState<(FrameResult & { ability: string; genderDisplay: string })[]>([])
  const [progress,      setProgress]    = useState(0)
  const [searching,     setSearching]   = useState(false)
  const [showFilters,   setShowFilters] = useState(false)
  const [selectedFrame, setSelectedFrame] = useState<number | null>(null)
  const [adjFrames,     setAdjFrames]   = useState<ReturnType<typeof getAdjacentFrames>>([])
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => { loadPokemonDB() }, [])

  const handleSearch = () => {
    if (workerRef.current) workerRef.current.terminate()
    setResults([]); setProgress(0); setSearching(true)
    setSelectedFrame(null); setAdjFrames([])

    const worker = new Worker(
      new URL('../../workers/rngWorker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current = worker

    // ✔ gen + fixedSeed ahora se pasan correctamente desde GameContext
    const filters: SearchFilters = {
      tid:           parseInt(tid),
      sid:           parseInt(sid),
      targetShiny,
      targetNatures: selNatures.length ? (selNatures as any) : undefined,
      genderRatio:   pokemon?.genderRatio ?? 127,
      gender:        targetGender === 'any' ? undefined : targetGender,
      maxFrames:     500_000,
      gen:           activeGen,       // ← Motor correcto según Gen Switcher
      fixedSeed:     isEmerald,       // ← Esmeralda: seed = 0
    }

    worker.postMessage({ seed: parseInt(seed, 16), filters })
    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setProgress(Math.floor((e.data.frame / e.data.total) * 100))
      } else if (e.data.type === 'done') {
        const enriched = (e.data.results as FrameResult[]).map(r => ({
          ...r,
          ability:       pokemon ? calcAbility(r.pid, pokemon.abilities)  : '\u2014',
          genderDisplay: pokemon ? calcGender(r.pid, pokemon.genderRatio) : r.gender,
        }))
        setResults(enriched)
        setSearching(false)
        setProgress(100)
        if (e.data.results.some((r: FrameResult) => r.shiny))
          confetti({ particleCount:80, spread:70, colors:['#ffd700','#f59e0b','#fff8dc','#ffffff'], origin:{y:0.5}, gravity:0.8 })
      }
    }
  }

  const handleSelectFrame = (frame: number) => {
    if (selectedFrame === frame) { setSelectedFrame(null); setAdjFrames([]); return }
    setSelectedFrame(frame)
    setAdjFrames(getAdjacentFrames(
      parseInt(seed, 16), frame, 5,
      parseInt(tid), parseInt(sid), pokemon
    ))
  }

  const displayed = targetAbility
    ? results.filter(r => r.ability.toLowerCase().includes(targetAbility.toLowerCase()))
    : results

  const toggleNature = (n: string) =>
    setNatures(p => p.includes(n) ? p.filter(x=>x!==n) : [...p, n])

  const handlePokemonChange = (p: PokemonData | null) => {
    setPokemon(p); setAbility('')
    if (p) setLastPokemon(p.id, p.name)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient-accent">Target</span>
          <span className="text-white ml-2">Finder</span>
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">
          Motor activo: <span className="font-mono" style={{color: activeGen===3?'#e94560':activeGen===4?'#a78bfa':'#22d3ee'}}>
            Gen {activeGen}{isEmerald?' (Emerald ★)':''}
          </span>
        </p>
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {([
            ['TID',  tid,  (v:string)=>setTid(v)],
            ['SID',  sid,  (v:string)=>setSid(v)],
            ['Seed', seed, (v:string)=>setSeed(v)],
          ] as const).map(([label,val,setter]) => (
            <div key={label} className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">{label}</label>
              <input value={val} onChange={e=>setter(e.target.value)}
                placeholder={label==='Seed'?'0x...':'0'}
                className="input-premium w-full rounded-xl px-3 py-2.5 text-sm font-mono" />
            </div>
          ))}
        </div>

        {/* Esmeralda toggle (solo Gen 3) */}
        {activeGen === 3 && (
          <div className="flex items-center justify-between glass-card rounded-xl px-4 py-3">
            <div>
              <p className="text-sm font-medium text-white">Modo Esmeralda</p>
              <p className="text-xs text-slate-500">Semilla inicial siempre = 0x00000000</p>
            </div>
            <motion.button
              onClick={() => { /* toggle via GameContext */ }}
              animate={{ backgroundColor: isEmerald ? '#e94560' : 'rgba(255,255,255,0.1)' }}
              className="w-12 h-6 rounded-full relative">
              <motion.div animate={{ x: isEmerald ? 24 : 2 }} transition={{type:'spring',stiffness:500,damping:30}}
                className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow" />
            </motion.button>
          </div>
        )}

        <PokemonPicker value={pokemon} onChange={handlePokemonChange} label="Pokémon objetivo" genFilter={activeGen} />

        {pokemon && pokemon.abilities.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Filtrar por habilidad</label>
            <div className="flex gap-2 flex-wrap">
              <motion.button whileTap={{scale:0.93}} onClick={()=>setAbility('')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  !targetAbility?'btn-primary text-white':'glass-card text-slate-400'
                }`}>Cualquiera</motion.button>
              {pokemon.abilities.map((a,i) => (
                <motion.button key={a} whileTap={{scale:0.93}}
                  onClick={()=>setAbility(targetAbility===a?'':a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    targetAbility===a?'text-white':'glass-card text-slate-400'
                  }`}
                  style={targetAbility===a?{background:'rgba(124,58,237,0.3)',border:'1px solid rgba(124,58,237,0.5)'}:{}}>
                  [{i}] {a}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        <button onClick={()=>setShowFilters(p=>!p)}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors">
          <Filter size={12}/> Filtros avanzados
          <span className="text-[10px] text-slate-600">{showFilters?'\u25b2':'\u25bc'}</span>
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
              className="space-y-3 overflow-hidden">
              <div className="flex items-center justify-between glass-card rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">Objetivo Shiny</p>
                  <p className="text-xs text-slate-500">Solo frames con PID shiny</p>
                </div>
                <motion.button onClick={()=>setTargetShiny(p=>!p)}
                  animate={{backgroundColor:targetShiny?'#ffd700':'rgba(255,255,255,0.1)'}}
                  className="w-12 h-6 rounded-full relative flex-shrink-0">
                  <motion.div animate={{x:targetShiny?24:2}} transition={{type:'spring',stiffness:500,damping:30}}
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"/>
                </motion.button>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Género objetivo</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['any','M','F'] as const).map(g => (
                    <motion.button key={g} whileTap={{scale:0.94}} onClick={()=>setGender(g)}
                      className={`py-2 rounded-xl text-sm font-semibold transition-all ${
                        targetGender===g?'btn-primary text-white':'glass-card-hover text-slate-400'
                      }`}>
                      {g==='any'?'Cualquiera':g==='M'?'\u2642 Macho':'\u2640 Hembra'}
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Naturalezas</label>
                <div className="flex flex-wrap gap-1.5">
                  {NATURES.map(n => {
                    const active = selNatures.includes(n)
                    return (
                      <motion.button key={n} whileTap={{scale:0.9}} onClick={()=>toggleNature(n)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          active?`bg-poke-card border border-poke-accent/50 ${NATURE_STAT[n]||'nature-neu'}`:'glass-card text-slate-500 hover:text-slate-300'
                        }`}>{n}</motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {searching && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:'linear'}}
                    className="w-3 h-3 border border-slate-500 border-t-poke-accent rounded-full"/>
                  Gen {activeGen} · Escaneando 500k frames...
                </span>
                <span className="font-mono text-poke-accent">{progress}%</span>
              </div>
              <div className="h-1.5 glass-card rounded-full overflow-hidden">
                <motion.div animate={{width:`${progress}%`}} transition={{ease:'linear'}}
                  className="h-full rounded-full"
                  style={{background: activeGen===5
                    ? 'linear-gradient(90deg,#22d3ee,#7c3aed)'
                    : activeGen===3
                    ? 'linear-gradient(90deg,#e94560,#f97316)'
                    : 'linear-gradient(90deg,#e94560,#7c3aed)'
                  }}/>
              </div>
              <div className="grid grid-cols-3 gap-2">{[0,1,2].map(i=><ShimmerCard key={i}/>)}</div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button whileTap={{scale:0.97}} onClick={handleSearch}
          disabled={searching||!tid||!sid||!seed}
          className="btn-primary w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
          {searching
            ? <span className="font-mono">{progress}%</span>
            : <><ScanSearch size={16}/>Escanear Frames<ChevronRight size={14} className="ml-auto opacity-60"/></>}
        </motion.button>
      </div>

      <AnimatePresence>
        {displayed.length > 0 && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                <span className="text-gradient-shiny">{displayed.length}</span>
                <span className="text-slate-400 ml-1.5">frames encontrados</span>
              </p>
              {pokemon && (
                <div className="flex items-center gap-2">
                  <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                    alt={pokemon.name} className="w-7 h-7" style={{imageRendering:'pixelated'}}/>
                  <span className="text-xs text-slate-400">{pokemon.name}</span>
                </div>
              )}
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {displayed.slice(0,50).map((r,idx) => (
                <div key={r.frame}>
                  <motion.button
                    initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*0.02}}
                    onClick={()=>handleSelectFrame(r.frame)}
                    className={`w-full text-left rounded-xl p-3 transition-all ${
                      selectedFrame===r.frame
                        ?'border border-poke-violet/60 bg-poke-violet/10'
                        :r.shiny?'shiny-border':'glass-card hover:bg-white/5'
                    }`}>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white font-bold text-sm">#{r.frame}</span>
                        {r.shiny && (
                          <span className="badge animate-glow-pulse"
                            style={{background:'rgba(255,215,0,0.15)',color:'#ffd700',border:'1px solid rgba(255,215,0,0.4)'}}>
                            <Sparkles size={9} className="mr-1"/>Shiny
                          </span>
                        )}
                        {r.ivs && (
                          <span className="text-[9px] text-cyan-400 font-mono">
                            {r.ivs.join('/')}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-600">
                          {selectedFrame===r.frame?'\u25b2 ocultar':'\u25bc adyacentes'}
                        </span>
                      </div>
                      <span className={`badge ${NATURE_STAT[r.nature]||'nature-neu'}`}
                        style={{background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)'}}>
                        {r.nature}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="font-mono text-xs text-violet-400">{formatPID(r.pid)}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-400">{r.genderDisplay}</span>
                      {r.ability!=='\u2014'&&(
                        <><span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400">{r.ability}</span></>
                      )}
                    </div>
                  </motion.button>

                  <AnimatePresence>
                    {selectedFrame===r.frame && adjFrames.length>0 && (
                      <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                        className="overflow-hidden">
                        <div className="mt-1 glass-card rounded-xl overflow-hidden border border-poke-violet/20">
                          <div className="px-3 py-2 border-b border-white/5 flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Frames adyacentes ±5</span>
                            <span className="text-[10px] text-slate-600">· Busca la naturaleza que obtuviste</span>
                          </div>
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[10px] text-slate-600 uppercase tracking-wider border-b border-white/5">
                                <th className="px-3 py-2 text-left">Frame</th>
                                <th className="px-3 py-2 text-left">Δ</th>
                                <th className="px-3 py-2 text-left">PID</th>
                                <th className="px-3 py-2 text-left">Naturaleza</th>
                                <th className="px-3 py-2 text-left">Gén.</th>
                                <th className="px-3 py-2 text-left">Hab.</th>
                                <th className="px-3 py-2 text-left">✨</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adjFrames.map(af => (
                                <tr key={af.frame}
                                  className={`border-b border-white/[0.03] transition-colors ${
                                    af.delta===0?'bg-poke-violet/15 border-l-2 border-l-poke-violet':'hover:bg-white/[0.02]'
                                  }`}>
                                  <td className="px-3 py-2 font-mono font-bold text-white">#{af.frame}</td>
                                  <td className="px-3 py-2 font-mono">
                                    {af.delta===0
                                      ?<span className="text-poke-violet font-bold">★</span>
                                      :af.delta<0
                                      ?<span className="text-green-400 flex items-center gap-0.5"><ArrowUp size={10}/>{af.delta}</span>
                                      :<span className="text-red-400 flex items-center gap-0.5"><ArrowDown size={10}/>+{af.delta}</span>}
                                  </td>
                                  <td className="px-3 py-2 font-mono text-violet-400 text-[10px]">{formatPID(af.pid)}</td>
                                  <td className={`px-3 py-2 font-medium ${NATURE_STAT[af.nature]||'text-slate-400'}`}>{af.nature}</td>
                                  <td className="px-3 py-2 text-slate-400">{af.genderDisplay}</td>
                                  <td className="px-3 py-2 text-slate-400 text-[10px]">{af.ability}</td>
                                  <td className="px-3 py-2">{af.shiny&&<span className="text-yellow-400">✨</span>}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="px-3 py-2 border-t border-white/5 flex gap-4 flex-wrap">
                            <span className="text-[10px] text-green-400 flex items-center gap-1">
                              <ArrowUp size={9}/>Δ negativo = pulsaste tarde → pulsa antes
                            </span>
                            <span className="text-[10px] text-red-400 flex items-center gap-1">
                              <ArrowDown size={9}/>Δ positivo = pulsaste pronto → pulsa después
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
