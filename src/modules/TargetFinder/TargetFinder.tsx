import { useState, useRef } from 'react'
import type { FrameResult, SearchFilters } from '../../workers/rngWorker'
import { NATURES } from '../../utils/shiny'

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
      tid: parseInt(tid),
      sid: parseInt(sid),
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
      }
    }
  }

  const toggleNature = (n: string) =>
    setSelectedNatures(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n])

  return (
    <div className="space-y-4">
      <h2 className="text-poke-shiny font-bold text-xl">🎯 Target Finder</h2>
      <p className="text-slate-400 text-sm">Escanea frames para encontrar tu Pokémon objetivo.</p>

      <div className="bg-poke-mid rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {[['TID', tid, setTid], ['SID', sid, setSid], ['Seed (hex)', seed, setSeed]].map(([label, val, setter]) => (
            <div key={label as string}>
              <label className="text-xs text-slate-400 block mb-1">{label as string}</label>
              <input
                value={val as string}
                onChange={e => (setter as any)(e.target.value)}
                placeholder={label === 'Seed (hex)' ? '0x...' : '0'}
                className="w-full bg-poke-card text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-poke-accent outline-none font-mono"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Objetivo Shiny</span>
          <button
            onClick={() => setTargetShiny(p => !p)}
            className={`w-12 h-6 rounded-full transition-colors ${
              targetShiny ? 'bg-poke-shiny' : 'bg-slate-600'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${
              targetShiny ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
          {targetShiny && <span className="text-poke-shiny text-sm">✨ Shiny</span>}
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-2">Naturalezas (opcional)</label>
          <div className="flex flex-wrap gap-1">
            {NATURES.map(n => (
              <button
                key={n}
                onClick={() => toggleNature(n)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  selectedNatures.includes(n) ? 'bg-poke-accent text-white' : 'bg-poke-card text-slate-400'
                }`}
              >{n}</button>
            ))}
          </div>
        </div>

        {searching && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Escaneando frames...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-poke-card rounded-full overflow-hidden">
              <div className="h-full bg-poke-accent transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <button
          onClick={handleSearch}
          disabled={searching || !tid || !sid || !seed}
          className="w-full bg-poke-accent hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {searching ? `Buscando... ${progress}%` : 'Escanear Frames'}
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{results.length} frames encontrados</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {results.slice(0, 50).map(r => (
              <div key={r.frame} className={`bg-poke-card rounded-lg p-3 border ${
                r.shiny ? 'border-poke-shiny shiny-glow' : 'border-slate-700'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-mono text-white font-bold">Frame #{r.frame}</span>
                  {r.shiny && <span className="text-poke-shiny text-sm">✨ SHINY</span>}
                </div>
                <div className="text-xs text-slate-400 mt-1 font-mono">
                  PID: {r.pid.toString(16).toUpperCase().padStart(8, '0')} | {r.nature} | {r.gender}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
