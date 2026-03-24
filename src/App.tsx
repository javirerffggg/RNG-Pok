import { useState } from 'react'
import { SeedFinder } from './modules/SeedFinder/SeedFinder'
import { TargetFinder } from './modules/TargetFinder/TargetFinder'
import { EonTimer } from './modules/EonTimer/EonTimer'
import { EventDB } from './modules/EventDB/EventDB'

type Module = 'seed-finder' | 'target-finder' | 'eon-timer' | 'event-db'

const NAV_ITEMS: { id: Module; label: string; emoji: string }[] = [
  { id: 'seed-finder', label: 'Seed Finder', emoji: '🔍' },
  { id: 'target-finder', label: 'Target Finder', emoji: '🎯' },
  { id: 'eon-timer', label: 'Eon Timer', emoji: '⏱️' },
  { id: 'event-db', label: 'Event DB', emoji: '📊' },
]

export default function App() {
  const [activeModule, setActiveModule] = useState<Module>('seed-finder')

  return (
    <div className="min-h-dvh flex flex-col bg-poke-dark">
      {/* Header */}
      <header className="bg-poke-mid border-b border-poke-card px-4 py-3 flex items-center gap-3">
        <span className="text-poke-shiny text-2xl">✨</span>
        <h1 className="text-lg font-bold text-white tracking-wide">Shiny RNG Tool</h1>
        <span className="ml-auto text-xs text-slate-400 font-mono">Gen 3/4/5</span>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto p-4">
        {activeModule === 'seed-finder' && <SeedFinder />}
        {activeModule === 'target-finder' && <TargetFinder />}
        {activeModule === 'eon-timer' && <EonTimer />}
        {activeModule === 'event-db' && <EventDB />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-poke-mid border-t border-poke-card">
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                activeModule === item.id
                  ? 'text-poke-shiny border-t-2 border-poke-shiny -mt-0.5'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.emoji}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
