import { useState } from 'react'
import { lcgNext, calcPID } from '../../utils/lcg'
import { getNature } from '../../utils/shiny'

export function SeedFinder() {
  const [consoleType, setConsoleType] = useState<'GBA' | 'DS' | 'DSi' | '3DS'>('DS')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [nature, setNature] = useState('')
  const [foundSeed, setFoundSeed] = useState<number | null>(null)
  const [searching, setSearching] = useState(false)

  const DELAY_MAP = { GBA: 0, DS: 629, DSi: 664, '3DS': 1000 }

  const handleSearch = async () => {
    setSearching(true)
    setFoundSeed(null)

    // Búsqueda simplificada: iterar seeds basadas en timestamp
    await new Promise(resolve => setTimeout(resolve, 100))

    // Placeholder: en producción se usa el timestamp + delay de consola
    const baseDelay = DELAY_MAP[consoleType]
    const timestamp = new Date(`${date}T${time}`).getTime()
    let testSeed = ((timestamp + baseDelay) & 0xFFFFFFFF) >>> 0

    for (let i = 0; i < 10000; i++) {
      const rng1 = lcgNext(testSeed)
      const rng2 = lcgNext(rng1)
      const pid = calcPID(rng1, rng2)
      if (getNature(pid).toLowerCase() === nature.toLowerCase()) {
        setFoundSeed(testSeed)
        break
      }
      testSeed = lcgNext(testSeed)
    }

    setSearching(false)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-poke-shiny font-bold text-xl">🔍 Seed Finder</h2>
      <p className="text-slate-400 text-sm">Identifica tu semilla inicial a partir de los datos del juego.</p>

      <div className="bg-poke-mid rounded-xl p-4 space-y-3">
        <div>
          <label className="text-xs text-slate-400 block mb-1">Consola</label>
          <div className="grid grid-cols-4 gap-2">
            {(['GBA', 'DS', 'DSi', '3DS'] as const).map(c => (
              <button
                key={c}
                onClick={() => setConsoleType(c)}
                className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                  consoleType === c ? 'bg-poke-accent text-white' : 'bg-poke-card text-slate-300'
                }`}
              >{c}</button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Fecha consola</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-poke-card text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-poke-accent outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Hora consola</label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full bg-poke-card text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-poke-accent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 block mb-1">Naturaleza del 1er Pokémon capturado</label>
          <input
            type="text"
            value={nature}
            onChange={e => setNature(e.target.value)}
            placeholder="ej: Adamant, Timid, Bold..."
            className="w-full bg-poke-card text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-poke-accent outline-none"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={searching || !date || !time || !nature}
          className="w-full bg-poke-accent hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
        >
          {searching ? 'Buscando...' : 'Buscar Semilla'}
        </button>
      </div>

      {foundSeed !== null && (
        <div className="bg-poke-card rounded-xl p-4 border border-poke-shiny shiny-glow">
          <p className="text-xs text-slate-400">Semilla encontrada</p>
          <p className="text-poke-shiny font-mono text-2xl font-bold">
            0x{foundSeed.toString(16).toUpperCase().padStart(8, '0')}
          </p>
          <p className="text-xs text-slate-400 mt-1">Frame decimal: {foundSeed}</p>
        </div>
      )}
    </div>
  )
}
