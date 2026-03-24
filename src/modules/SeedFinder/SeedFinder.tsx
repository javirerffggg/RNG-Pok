import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Cpu, Calendar, Clock, Dna, ChevronRight } from 'lucide-react'
import { lcgNext, calcPID } from '../../utils/lcg'
import { getNature } from '../../utils/shiny'

const CONSOLES = [
  { id: 'GBA'  as const, label: 'GBA', delay: 0,    icon: '🎮' },
  { id: 'DS'   as const, label: 'DS',  delay: 629,  icon: '📟' },
  { id: 'DSi'  as const, label: 'DSi', delay: 664,  icon: '📱' },
  { id: '3DS'  as const, label: '3DS', delay: 1000, icon: '🕹️' },
]

type ConsoleType = typeof CONSOLES[number]['id']

export function SeedFinder() {
  const [consoleType, setConsoleType] = useState<ConsoleType>('DS')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [nature, setNature] = useState('')
  const [foundSeed, setFoundSeed] = useState<number | null>(null)
  const [searching, setSearching] = useState(false)

  const selectedConsole = CONSOLES.find(c => c.id === consoleType)!

  const handleSearch = async () => {
    setSearching(true)
    setFoundSeed(null)
    await new Promise(resolve => setTimeout(resolve, 120))
    const baseDelay = selectedConsole.delay
    const timestamp = new Date(`${date}T${time}`).getTime()
    let testSeed = ((timestamp + baseDelay) & 0xFFFFFFFF) >>> 0
    let found = false
    for (let i = 0; i < 10000; i++) {
      const rng1 = lcgNext(testSeed)
      const rng2 = lcgNext(rng1)
      const pid = calcPID(rng1, rng2)
      if (getNature(pid).toLowerCase() === nature.toLowerCase()) {
        setFoundSeed(testSeed)
        found = true
        break
      }
      testSeed = lcgNext(testSeed)
    }
    if (!found) setFoundSeed(-1)
    setSearching(false)
  }

  const hex = foundSeed !== null && foundSeed >= 0
    ? '0x' + foundSeed.toString(16).toUpperCase().padStart(8, '0')
    : null

  return (
    <div className="space-y-5">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient-accent">Seed</span>
          <span className="text-white ml-2">Finder</span>
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Identifica tu semilla inicial a partir de los datos del juego.</p>
      </div>

      {/* Console selector */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium uppercase tracking-wider">
          <Cpu size={12} />
          <span>Consola</span>
          <span className="ml-auto text-slate-500">Delay: {selectedConsole.delay} frames</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CONSOLES.map(c => (
            <motion.button
              key={c.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => setConsoleType(c.id)}
              className={`py-2.5 rounded-xl text-sm font-semibold transition-all relative overflow-hidden ${
                consoleType === c.id
                  ? 'btn-primary text-white'
                  : 'glass-card-hover text-slate-400'
              }`}
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-base">{c.icon}</span>
                <span>{c.label}</span>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Date / Time */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Calendar size={11} /> Fecha consola
            </label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="input-premium w-full rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <Clock size={11} /> Hora consola
            </label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="input-premium w-full rounded-xl px-3 py-2.5 text-sm" />
          </div>
        </div>

        {/* Nature */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Dna size={11} /> Naturaleza del 1er Pokémon capturado
          </label>
          <input type="text" value={nature} onChange={e => setNature(e.target.value)}
            placeholder="ej: Adamant, Timid, Bold..."
            className="input-premium w-full rounded-xl px-3 py-2.5 text-sm" />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSearch}
          disabled={searching || !date || !time || !nature}
          className="btn-primary w-full text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2"
        >
          {searching ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              Buscando semilla...
            </>
          ) : (
            <>
              <Search size={16} />
              Buscar Semilla
              <ChevronRight size={14} className="ml-auto opacity-60" />
            </>
          )}
        </motion.button>
      </div>

      {/* Result */}
      <AnimatePresence>
        {foundSeed !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {foundSeed >= 0 ? (
              <div className="shiny-border rounded-2xl p-5 text-center">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">✨ Semilla encontrada</p>
                <p className="timer-display text-3xl font-bold text-gradient-shiny">{hex}</p>
                <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
                  <span>Decimal: <span className="text-slate-300 font-mono">{foundSeed}</span></span>
                  <span>Consola: <span className="text-slate-300">{consoleType}</span></span>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl p-4 border-red-500/30 text-center">
                <p className="text-poke-accent font-semibold">No se encontró semilla</p>
                <p className="text-xs text-slate-500 mt-1">Verifica la fecha, hora y naturaleza</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
