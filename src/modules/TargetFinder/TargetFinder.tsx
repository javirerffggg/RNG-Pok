import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ScanSearch, Sparkles, ChevronRight } from 'lucide-react'
import type { FrameResult, SearchFilters } from '../../workers/rngWorker'
import { NATURES } from '../../utils/shiny'
import confetti from 'canvas-confetti'

// Colores por naturaleza (stat +)
const NATURE_STAT: Record<string, string> = {
  Lonely: 'nature-atk', Brave: 'nature-atk', Adamant: 'nature-atk', Naughty: 'nature-atk',
  Bold: 'nature-def',   Relaxed: 'nature-def', Impish: 'nature-def', Lax: 'nature-def',
  Modest: 'nature-spa', Mild: 'nature-spa',    Quiet: 'nature-spa',  Rash: 'nature-spa',
  Calm: 'nature-spd',   Gentle: 'nature-spd',  Sassy: 'nature-spd',  Careful: 'nature-spd',
  Timid: 'nature-spe',  Hasty: 'nature-spe',   Jolly: 'nature-spe',  Naive: 'nature-spe',
}

function formatPID(pid: number) {
  const hex = pid.toString(16).toUpperCase().padStart(8, '0')
  return `${hex.slice(0, 4)}·${hex.slice(4)}`
}

function ShimmerCard() {
  return (
    <div className="glass-card rounded-xl p-3 space-y-2">
      <div className="shimmer-skeleton h-4 w-24 rounded" />
      <div className="shimmer-skeleton h-3 w-40 rounded" />
    </div>
  )
}

export function TargetFinder() {
  const [tid, setTid] = useState('')
  const [sid, setSid] = useState('')
  const [seed, setSeed] = useState('')
  const [targetShiny, setTargetShiny] = useState(true)
  const [selectedNatures, setSelectedNatures] = useState<string[]>([])
  const [results, setResults] = useState<FrameResult[]>([])
  const [progress, setProgress] = useState(0)
  const [searching, setSearching] = useState(false)
  const workerRef = useRef<Worker | null>(null)

  const handleSearch = () => {
    if (workerRef.current) workerRef.current.terminate()
    setResults([])
    setProgress(0)
    setSearching(true)
    const worker = new Worker(new URL('../../workers/rngWorker.ts', import.meta.url), { type: 'module' })
    workerRef.current = worker
    const filters: SearchFilters = {
      tid: parseInt(tid), sid: parseInt(sid),
      targetShiny,
      targetNatures: selectedNatures.length ? (selectedNatures as any) : undefined,
      maxFrames: 500_000,
    }
    worker.postMessage({ seed: parseInt(seed, 16), filters })
    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        setProgress(Math.floor((e.data.frame / e.data.total) * 100))
      } else if (e.data.type === 'done') {
        setResults(e.data.results)
        setSearching(false)
        setProgress(100)
        if (e.data.results.some((r: FrameResult) => r.shiny)) {
          confetti({
            particleCount: 80,
            spread: 70,
            colors: ['#ffd700', '#f59e0b', '#fff8dc', '#ffffff'],
            origin: { y: 0.5 },
            gravity: 0.8,
            scalar: 0.9,
          })
        }
      }
    }
  }

  const toggleNature = (n: string) =>
    setSelectedNatures(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient-accent">Target</span>
          <span className="text-white ml-2">Finder</span>
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Escanea frames para encontrar tu Pokémon objetivo.</p>
      </div>

      <div className="glass-card rounded-2xl p-4 space-y-4">
        {/* TID / SID / Seed */}
        <div className="grid grid-cols-3 gap-3">
          {([['TID', tid, setTid], ['SID', sid, setSid], ['Seed', seed, setSeed]] as const).map(([label, val, setter]) => (
            <div key={label} className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">{label}</label>
              <input
                value={val}
                onChange={e => setter(e.target.value)}
                placeholder={label === 'Seed' ? '0x...' : '0'}
                className="input-premium w-full rounded-xl px-3 py-2.5 text-sm font-mono"
              />
            </div>
          ))}
        </div>

        {/* Shiny toggle */}
        <div className="flex items-center justify-between glass-card rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-medium text-white">Objetivo Shiny</p>
            <p className="text-xs text-slate-500">Filtrar solo frames que generen Shiny</p>
          </div>
          <motion.button
            onClick={() => setTargetShiny(p => !p)}
            animate={{ backgroundColor: targetShiny ? '#ffd700' : 'rgba(255,255,255,0.1)' }}
            className="w-12 h-6 rounded-full relative flex-shrink-0"
          >
            <motion.div
              animate={{ x: targetShiny ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md"
            />
          </motion.button>
        </div>

        {/* Naturalezas */}
        <div className="space-y-2">
          <label className="text-xs text-slate-400 font-medium uppercase tracking-wider">Naturalezas</label>
          <div className="flex flex-wrap gap-1.5">
            {NATURES.map(n => {
              const active = selectedNatures.includes(n)
              const colorClass = NATURE_STAT[n] || 'nature-neu'
              return (
                <motion.button
                  key={n}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleNature(n)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? `bg-poke-card border border-poke-accent/50 ${colorClass}`
                      : 'glass-card text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {n}
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Progress */}
        <AnimatePresence>
          {searching && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-3 h-3 border border-slate-500 border-t-poke-accent rounded-full" />
                  Escaneando 500k frames...
                </span>
                <span className="font-mono text-poke-accent">{progress}%</span>
              </div>
              <div className="h-1.5 glass-card rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: 'linear' }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, #e94560, #7c3aed)' }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[0,1,2].map(i => <ShimmerCard key={i} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSearch}
          disabled={searching || !tid || !sid || !seed}
          className="btn-primary w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
        >
          {searching ? (
            <span className="font-mono">{progress}%</span>
          ) : (
            <>
              <ScanSearch size={16} />
              Escanear Frames
              <ChevronRight size={14} className="ml-auto opacity-60" />
            </>
          )}
        </motion.button>
      </div>

      {/* Resultados */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">
                <span className="text-gradient-shiny">{results.length}</span>
                <span className="text-slate-400 ml-1.5">frames encontrados</span>
              </p>
              <span className="badge" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
                Top 50
              </span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {results.slice(0, 50).map((r, idx) => (
                <motion.div
                  key={r.frame}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`rounded-xl p-3 ${
                    r.shiny ? 'shiny-border' : 'glass-card'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-white font-bold text-sm">#{r.frame}</span>
                      {r.shiny && (
                        <span className="badge animate-glow-pulse" style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.4)' }}>
                          <Sparkles size={9} className="mr-1" /> Shiny
                        </span>
                      )}
                    </div>
                    <span className={`badge ${NATURE_STAT[r.nature] || 'nature-neu'}`}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {r.nature}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-mono text-xs text-violet-400">{formatPID(r.pid)}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-xs text-slate-400">{r.gender}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
