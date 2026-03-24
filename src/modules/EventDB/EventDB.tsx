import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, RotateCcw, Search } from 'lucide-react'

const EVENTS = [
  { gen: 'Gen 2/4', action: 'Girar la radio',             frames: '+1',       notes: 'Acción manual',        icon: '📻' },
  { gen: 'Gen 4',   action: 'Llamada telefónica NPC',      frames: 'Variable', notes: 'Depende del NPC',      icon: '📞' },
  { gen: 'Gen 3/4', action: 'Caminar en hierba',           frames: '+1 o +2',  notes: 'Por paso',             icon: '🌿' },
  { gen: 'Gen 4',   action: 'Parpadeo de NPC (ruta)',       frames: 'Variable', notes: 'Según ruta',           icon: '👁️' },
  { gen: 'Gen 3',   action: 'Interactuar con objeto',       frames: '+1',       notes: '',                     icon: '📦' },
  { gen: 'Gen 4',   action: 'Abrir menú',                  frames: '+1',       notes: '',                     icon: '📋' },
  { gen: 'Gen 4',   action: 'Registrar Pokétch',           frames: '+2',       notes: '',                     icon: '⌚' },
  { gen: 'Gen 5',   action: 'Hablar con NPC',              frames: 'Variable', notes: 'MT-dependiente',       icon: '💬' },
  { gen: 'Gen 3',   action: 'Encuentro salvaje (hierba)',  frames: '+1',       notes: 'Por nivel de hierba',  icon: '⚡' },
  { gen: 'Gen 4',   action: 'Usar repelente',              frames: '+1',       notes: '',                     icon: '🧴' },
  { gen: 'Gen 3/4', action: 'Subir de nivel',              frames: '+2',       notes: '',                     icon: '⬆️' },
  { gen: 'Gen 4',   action: 'Curar en Centro Pokémon',     frames: '+3',       notes: 'Aprox.',               icon: '🏥' },
]

const GEN_COLORS: Record<string, string> = {
  'Gen 3':   'rgba(74,222,128,0.15)',
  'Gen 4':   'rgba(34,211,238,0.15)',
  'Gen 5':   'rgba(167,139,250,0.15)',
  'Gen 2/4': 'rgba(251,191,36,0.15)',
  'Gen 3/4': 'rgba(52,211,153,0.15)',
}
const GEN_TEXT: Record<string, string> = {
  'Gen 3':   '#4ade80', 'Gen 4': '#22d3ee',
  'Gen 5':   '#a78bfa', 'Gen 2/4': '#fbbf24', 'Gen 3/4': '#34d399',
}

const GENS = ['Todos', 'Gen 2/4', 'Gen 3', 'Gen 3/4', 'Gen 4', 'Gen 5']

export function EventDB() {
  const [search, setSearch] = useState('')
  const [genFilter, setGenFilter] = useState('Todos')
  const [frameCounter, setFrameCounter] = useState(0)
  const [actionLog, setActionLog] = useState<{ text: string; inc: number }[]>([])
  const [lastAdded, setLastAdded] = useState<number | null>(null)

  const filtered = EVENTS.filter(e => {
    const matchesSearch = e.action.toLowerCase().includes(search.toLowerCase())
    const matchesGen = genFilter === 'Todos' || e.gen === genFilter
    return matchesSearch && matchesGen
  })

  const addAction = (event: typeof EVENTS[0]) => {
    const inc = event.frames.includes('+') ? parseInt(event.frames.replace('+', '').split(' ')[0]) : 1
    setFrameCounter(p => p + inc)
    setLastAdded(inc)
    setActionLog(p => [{ text: event.action, inc }, ...p.slice(0, 9)])
    if (navigator.vibrate) navigator.vibrate(10)
    setTimeout(() => setLastAdded(null), 600)
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient-accent">Event</span>
          <span className="text-white ml-2">Database</span>
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Frames que avanza cada acción. Toca para sumar al contador.</p>
      </div>

      {/* Frame counter */}
      <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(255,215,0,0.3) 0%, transparent 70%)' }} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">Frame actual</p>
            <div className="flex items-end gap-3">
              <AnimatePresence mode="wait">
                <motion.p
                  key={frameCounter}
                  initial={{ y: -8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="timer-display text-5xl font-black text-gradient-shiny leading-none"
                >
                  {frameCounter}
                </motion.p>
              </AnimatePresence>
              <AnimatePresence>
                {lastAdded !== null && (
                  <motion.span
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -16 }}
                    exit={{ opacity: 0, y: -28 }}
                    className="text-poke-green font-bold text-lg mb-1"
                  >
                    +{lastAdded}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.9, rotate: -180 }}
            transition={{ duration: 0.3 }}
            onClick={() => { setFrameCounter(0); setActionLog([]); setLastAdded(null) }}
            className="glass-card-hover p-2.5 rounded-xl text-slate-500 hover:text-poke-accent"
          >
            <RotateCcw size={16} />
          </motion.button>
        </div>
        {/* Log */}
        {actionLog.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
            {actionLog.slice(0, 4).map((log, i) => (
              <motion.p
                key={i}
                initial={i === 0 ? { opacity: 0, x: -8 } : false}
                animate={{ opacity: 1, x: 0 }}
                className={`text-xs font-mono flex justify-between ${
                  i === 0 ? 'text-poke-green' : 'text-slate-600'
                }`}
              >
                <span>{log.text}</span>
                <span>+{log.inc}</span>
              </motion.p>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar acción..."
            className="input-premium w-full rounded-xl pl-8 pr-4 py-2.5 text-sm" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {GENS.map(g => (
            <motion.button key={g} whileTap={{ scale: 0.92 }} onClick={() => setGenFilter(g)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap font-medium transition-all ${
                genFilter === g
                  ? 'btn-primary text-white'
                  : 'glass-card text-slate-400 hover:text-white'
              }`}
            >{g}</motion.button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((event, i) => (
            <motion.button
              key={event.action}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => addAction(event)}
              className="w-full glass-card-hover rounded-xl p-3 text-left"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{event.icon}</span>
                  <span className="text-white text-sm font-medium">{event.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="font-mono font-black text-sm"
                    style={{ color: event.frames === 'Variable' ? '#94a3b8' : '#ffd700' }}
                  >
                    {event.frames}
                  </span>
                  <Plus size={14} className="text-slate-600" />
                </div>
              </div>
              <div className="flex gap-2 mt-1.5">
                <span className="badge text-[10px]"
                  style={{ background: GEN_COLORS[event.gen] || 'rgba(255,255,255,0.05)', color: GEN_TEXT[event.gen] || '#94a3b8', border: `1px solid ${GEN_TEXT[event.gen] || '#94a3b8'}30` }}>
                  {event.gen}
                </span>
                {event.notes && (
                  <span className="text-xs text-slate-600">{event.notes}</span>
                )}
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
