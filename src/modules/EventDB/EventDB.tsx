import { useState } from 'react'

const EVENTS = [
  { gen: 'Gen 2/4', action: 'Girar la radio', frames: '+1', notes: 'Acción manual' },
  { gen: 'Gen 4', action: 'Llamada telefónica NPC', frames: 'Variable', notes: 'Depende del NPC' },
  { gen: 'Gen 3/4', action: 'Caminar en hierba', frames: '+1 o +2', notes: 'Por paso' },
  { gen: 'Gen 4', action: 'Parpadeo de NPC (ruta)', frames: 'Variable', notes: 'Según ruta' },
  { gen: 'Gen 3', action: 'Interactuar con objeto', frames: '+1', notes: '' },
  { gen: 'Gen 4', action: 'Abrir menú', frames: '+1', notes: '' },
  { gen: 'Gen 4', action: 'Registrar Pokétch', frames: '+2', notes: '' },
  { gen: 'Gen 5', action: 'Hablar con NPC', frames: 'Variable', notes: 'MT-dependiente' },
  { gen: 'Gen 3', action: 'Encuentro salvaje (hierba)', frames: '+1', notes: 'Por nivel de hierba' },
  { gen: 'Gen 4', action: 'Usar repelente', frames: '+1', notes: '' },
  { gen: 'Gen 3/4', action: 'Subir de nivel', frames: '+2', notes: '' },
  { gen: 'Gen 4', action: 'Curar en Centro Pokémon', frames: '+3', notes: 'Aprox.' },
]

const GENS = ['Todos', 'Gen 2/4', 'Gen 3', 'Gen 4', 'Gen 5']

export function EventDB() {
  const [search, setSearch] = useState('')
  const [genFilter, setGenFilter] = useState('Todos')
  const [frameCounter, setFrameCounter] = useState(0)
  const [actionLog, setActionLog] = useState<string[]>([])

  const filtered = EVENTS.filter(e => {
    const matchesSearch = e.action.toLowerCase().includes(search.toLowerCase())
    const matchesGen = genFilter === 'Todos' || e.gen.includes(genFilter.replace('Gen ', ''))
    return matchesSearch && matchesGen
  })

  const addAction = (event: typeof EVENTS[0]) => {
    const frameInc = event.frames.includes('+') ? parseInt(event.frames.replace('+', '').split(' ')[0]) : 1
    setFrameCounter(p => p + frameInc)
    setActionLog(p => [`+${frameInc} — ${event.action}`, ...p.slice(0, 9)])
  }

  return (
    <div className="space-y-4">
      <h2 className="text-poke-shiny font-bold text-xl">📊 Event Database</h2>
      <p className="text-slate-400 text-sm">Frames que avanza cada acción. Toca para sumar al contador.</p>

      {/* Contador de frames */}
      <div className="bg-poke-card rounded-xl p-4 border border-poke-card">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400">Frame actual estimado</p>
            <p className="text-3xl font-mono font-bold text-poke-shiny">{frameCounter}</p>
          </div>
          <button
            onClick={() => { setFrameCounter(0); setActionLog([]) }}
            className="text-xs text-slate-500 hover:text-poke-accent transition-colors"
          >Reset</button>
        </div>
        {actionLog.length > 0 && (
          <div className="mt-2 space-y-0.5">
            {actionLog.slice(0, 3).map((log, i) => (
              <p key={i} className={`text-xs font-mono ${
                i === 0 ? 'text-poke-green' : 'text-slate-500'
              }`}>{log}</p>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="space-y-2">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar acción..."
          className="w-full bg-poke-mid text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-poke-accent outline-none"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {GENS.map(g => (
            <button
              key={g}
              onClick={() => setGenFilter(g)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                genFilter === g ? 'bg-poke-accent text-white' : 'bg-poke-card text-slate-400'
              }`}
            >{g}</button>
          ))}
        </div>
      </div>

      {/* Lista de eventos */}
      <div className="space-y-2">
        {filtered.map((event, i) => (
          <button
            key={i}
            onClick={() => addAction(event)}
            className="w-full bg-poke-mid hover:bg-poke-card rounded-xl p-3 text-left transition-colors border border-transparent hover:border-poke-accent group"
          >
            <div className="flex justify-between items-center">
              <span className="text-white text-sm font-medium group-hover:text-poke-shiny transition-colors">
                {event.action}
              </span>
              <span className="font-mono font-bold text-poke-accent text-sm">{event.frames}</span>
            </div>
            <div className="flex gap-2 mt-1">
              <span className="text-xs text-slate-500 bg-poke-card px-2 py-0.5 rounded">{event.gen}</span>
              {event.notes && <span className="text-xs text-slate-500">{event.notes}</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
