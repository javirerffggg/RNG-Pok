import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Target, Timer, Database } from 'lucide-react'
import { GameProvider } from './context/GameContext'
import { GenSwitcher } from './components/GenSwitcher'
import { SeedFinder }  from './modules/SeedFinder/SeedFinder'
import { TargetFinder } from './modules/TargetFinder/TargetFinder'
import { EonTimer }    from './modules/EonTimer/EonTimer'
import { EventDB }     from './modules/EventDB/EventDB'

const TABS = [
  { id: 'seed'   as const, label: 'Semillas',  icon: Search,  color: '#e94560' },
  { id: 'target' as const, label: 'Frames',    icon: Target,  color: '#7c3aed' },
  { id: 'timer'  as const, label: 'Timer',     icon: Timer,   color: '#ffd700' },
  { id: 'db'     as const, label: 'Eventos',   icon: Database, color: '#22d3ee' },
]
type TabId = typeof TABS[number]['id']

export default function App() {
  const [tab, setTab] = useState<TabId>('seed')
  const activeTab = TABS.find(t => t.id === tab)!

  return (
    <GameProvider>
      <div className="min-h-screen bg-poke-bg text-white">
        <div className="max-w-md mx-auto px-4 pt-safe">

          {/* Header */}
          <header className="py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #e94560, #7c3aed)' }}>
                  <span className="text-white text-sm">RNG</span>
                </div>
                <div>
                  <h1 className="font-black text-base tracking-tight">PokéRNG</h1>
                  <p className="text-[10px] text-slate-600 -mt-0.5 font-mono">v0.3.0</p>
                </div>
              </div>
              {/* Gen Switcher global */}
              <GenSwitcher />
            </div>
          </header>

          {/* Tab content */}
          <main className="pb-28">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {tab === 'seed'   && <SeedFinder />}
                {tab === 'target' && <TargetFinder />}
                {tab === 'timer'  && <EonTimer />}
                {tab === 'db'     && <EventDB />}
              </motion.div>
            </AnimatePresence>
          </main>

          {/* Bottom Nav */}
          <nav className="fixed bottom-0 left-0 right-0 pb-safe z-50">
            <div className="max-w-md mx-auto px-4 pb-4">
              <div className="glass-card rounded-2xl p-1.5 flex">
                {TABS.map(t => {
                  const Icon  = t.icon
                  const active = tab === t.id
                  return (
                    <motion.button
                      key={t.id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => { setTab(t.id); if (navigator.vibrate) navigator.vibrate(8) }}
                      className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl relative transition-all"
                    >
                      {active && (
                        <motion.div
                          layoutId="tab-pill"
                          className="absolute inset-0 rounded-xl"
                          style={{ background: t.color + '15', border: `1px solid ${t.color}30` }}
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <Icon
                        size={18}
                        className="relative z-10 transition-colors"
                        style={{ color: active ? t.color : '#475569' }}
                      />
                      <span
                        className="relative z-10 text-[10px] font-semibold transition-colors"
                        style={{ color: active ? t.color : '#475569' }}
                      >
                        {t.label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </GameProvider>
  )
}
