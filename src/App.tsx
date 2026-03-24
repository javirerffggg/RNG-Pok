import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Target, Timer, Database } from 'lucide-react'
import { SeedFinder } from './modules/SeedFinder/SeedFinder'
import { TargetFinder } from './modules/TargetFinder/TargetFinder'
import { EonTimer } from './modules/EonTimer/EonTimer'
import { EventDB } from './modules/EventDB/EventDB'

type Module = 'seed-finder' | 'target-finder' | 'eon-timer' | 'event-db'

const NAV_ITEMS = [
  { id: 'seed-finder'  as Module, label: 'Seed Finder',    Icon: Search   },
  { id: 'target-finder'as Module, label: 'Target Finder',  Icon: Target   },
  { id: 'eon-timer'   as Module, label: 'Eon Timer',      Icon: Timer    },
  { id: 'event-db'    as Module, label: 'Event DB',       Icon: Database },
]

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.15 } },
}

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('seed-finder')

  const handleNav = useCallback((id: Module) => {
    if (navigator.vibrate) navigator.vibrate(8)
    setActiveModule(id)
  }, [])

  return (
    <div className="min-h-dvh flex flex-col aurora-bg relative">

      {/* Header */}
      <header className="glass-card border-x-0 border-t-0 px-5 py-4 flex items-center gap-3 relative z-10">
        <div className="relative">
          <span className="text-2xl animate-float inline-block">✨</span>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-wide leading-none">
            <span className="text-gradient-shiny">Shiny</span>
            <span className="text-white ml-1.5">RNG Tool</span>
          </h1>
          <p className="text-[10px] text-slate-500 mt-0.5 font-mono">Gen 3 · 4 · 5</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="badge" style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', border: '1px solid rgba(124,58,237,0.3)' }}>
            v0.2.0
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto px-4 py-5 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div key={activeModule} variants={pageVariants} initial="initial" animate="animate" exit="exit">
            {activeModule === 'seed-finder'   && <SeedFinder />}
            {activeModule === 'target-finder' && <TargetFinder />}
            {activeModule === 'eon-timer'     && <EonTimer />}
            {activeModule === 'event-db'      && <EventDB />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="glass-card border-x-0 border-b-0 relative z-10">
        <div className="grid grid-cols-4 relative">
          {/* Sliding pill indicator */}
          <motion.div
            className="absolute top-0 left-0 h-0.5 bg-gradient-to-r from-poke-accent to-poke-violet rounded-full"
            style={{ width: '25%' }}
            animate={{ x: `${NAV_ITEMS.findIndex(i => i.id === activeModule) * 100}%` }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          />
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeModule === id
            return (
              <button
                key={id}
                onClick={() => handleNav(id)}
                className="flex flex-col items-center gap-1 py-3.5 text-[11px] font-medium transition-colors relative"
              >
                <motion.div
                  animate={{ scale: active ? 1.15 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.5 : 1.5}
                    className={active ? 'text-poke-accent' : 'text-slate-500'}
                  />
                </motion.div>
                <span className={active ? 'text-white font-semibold' : 'text-slate-500'}>{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
