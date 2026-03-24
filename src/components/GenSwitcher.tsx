/**
 * GenSwitcher — Selector de generación activo en el header.
 * Cambia el motor RNG de toda la app.
 */
import { motion } from 'framer-motion'
import { useGame, GAME_CATALOG } from '../context/GameContext'

export function GenSwitcher() {
  const { activeGen, setGen, gameInfo } = useGame()

  return (
    <div className="flex items-center gap-1 bg-black/30 rounded-xl p-1">
      {GAME_CATALOG.map(g => (
        <motion.button
          key={g.gen}
          whileTap={{ scale: 0.92 }}
          onClick={() => setGen(g.gen as any)}
          className={`relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeGen === g.gen ? 'text-white' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {activeGen === g.gen && (
            <motion.div
              layoutId="gen-pill"
              className="absolute inset-0 rounded-lg"
              style={{ background: g.color + '30', border: `1px solid ${g.color}60` }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            />
          )}
          <span className="relative z-10">Gen {g.gen}</span>
        </motion.button>
      ))}
      <div className="ml-1 text-[9px] font-mono px-1.5 py-0.5 rounded"
        style={{ background: gameInfo.color + '20', color: gameInfo.color }}>
        {gameInfo.engine}
      </div>
    </div>
  )
}
