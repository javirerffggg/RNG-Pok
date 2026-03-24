import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { searchPokemon, type PokemonData } from '../data/pokemon-db'

const TYPE_COLORS: Record<string, string> = {
  fire:'#f97316', water:'#38bdf8', grass:'#4ade80', electric:'#facc15',
  psychic:'#e879f9', ice:'#67e8f9', dragon:'#818cf8', dark:'#78716c',
  fighting:'#ef4444', poison:'#c084fc', ground:'#d97706', flying:'#93c5fd',
  bug:'#a3e635', rock:'#a8a29e', ghost:'#818cf8', steel:'#94a3b8',
  normal:'#d1d5db', fairy:'#f9a8d4',
}

interface Props {
  value:    PokemonData | null
  onChange: (p: PokemonData | null) => void
  label?:   string
  genFilter?: number  // máx generación (e.g. 3 para Gen1-3)
}

export function PokemonPicker({ value, onChange, label = 'Pokémon', genFilter }: Props) {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<PokemonData[]>([])
  const [open, setOpen]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const inputRef                = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(() => {
      let res = searchPokemon(query)
      if (genFilter) res = res.filter(p => p.gen <= genFilter)
      setResults(res)
      setLoading(false)
    }, 150)
    return () => clearTimeout(t)
  }, [query, genFilter])

  const select = (p: PokemonData) => {
    onChange(p)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const clear = () => { onChange(null); setQuery('') }

  return (
    <div className="relative">
      <label className="text-xs text-slate-400 font-medium block mb-1.5">{label}</label>

      {value ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card rounded-xl px-3 py-2.5 flex items-center gap-3"
        >
          {/* Sprite */}
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${value.id}.png`}
            alt={value.name}
            className="w-10 h-10 object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">
              #{String(value.id).padStart(3,'0')} {value.name}
            </p>
            <div className="flex gap-1 mt-0.5">
              {[value.type1, value.type2].filter(Boolean).map(t => (
                <span key={t} className="badge text-[10px] font-bold"
                  style={{ background: (TYPE_COLORS[t!]||'#666')+'28', color: TYPE_COLORS[t!]||'#aaa',
                           border: `1px solid ${TYPE_COLORS[t!]||'#666'}50` }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button onClick={clear} className="text-slate-500 hover:text-poke-accent transition-colors">
            <X size={16} />
          </button>
        </motion.div>
      ) : (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Buscar por nombre, nº o habilidad..."
            className="input-premium w-full rounded-xl pl-8 pr-4 py-2.5 text-sm"
          />
        </div>
      )}

      {/* Dropdown */}
      <AnimatePresence>
        {open && results.length > 0 && !value && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute z-50 w-full mt-1 glass-card rounded-xl overflow-hidden shadow-glass"
            style={{ maxHeight: '280px', overflowY: 'auto' }}
          >
            {loading ? (
              <div className="p-3 text-xs text-slate-500">Buscando...</div>
            ) : results.map(p => (
              <button
                key={p.id}
                onClick={() => select(p)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                  alt={p.name} className="w-9 h-9 object-contain flex-shrink-0"
                  style={{ imageRendering: 'pixelated' }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">
                    <span className="text-slate-500 text-xs mr-1">#{String(p.id).padStart(3,'0')}</span>
                    {p.name}
                  </p>
                  <p className="text-slate-500 text-xs truncate">{p.abilities.join(' · ')}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {[p.type1, p.type2].filter(Boolean).map(t => (
                    <span key={t} className="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: (TYPE_COLORS[t!]||'#666')+'28', color: TYPE_COLORS[t!]||'#aaa' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
