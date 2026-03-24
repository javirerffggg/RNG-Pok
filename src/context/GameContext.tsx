/**
 * GameContext — Bus global de datos para toda la app.
 * Controla la generación activa y expone el motor RNG correcto.
 */
import { createContext, useContext, useState, type ReactNode } from 'react'
import { useProfile } from '../hooks/useProfile'

export type GameGen = 3 | 4 | 5

export interface GameInfo {
  gen:    GameGen
  title:  string
  engine: 'LCG' | 'MT+LCG'
  color:  string
  games:  string[]
}

export const GAME_CATALOG: GameInfo[] = [
  {
    gen:    3,
    title:  'Generación III',
    engine: 'LCG',
    color:  '#e94560',
    games:  ['Ruby', 'Sapphire', 'Emerald', 'FireRed', 'LeafGreen'],
  },
  {
    gen:    4,
    title:  'Generación IV',
    engine: 'LCG',
    color:  '#7c3aed',
    games:  ['Diamond', 'Pearl', 'Platinum', 'HeartGold', 'SoulSilver'],
  },
  {
    gen:    5,
    title:  'Generación V',
    engine: 'MT+LCG',
    color:  '#22d3ee',
    games:  ['Black', 'White', 'Black 2', 'White 2'],
  },
]

interface GameCtx {
  activeGen:    GameGen
  gameInfo:     GameInfo
  setGen:       (g: GameGen) => void
  /** Semilla fija para Esmeralda (siempre 0) */
  isEmerald:    boolean
  setEmerald:   (v: boolean) => void
  /** Índice del juego activo dentro de gameInfo.games */
  activeGame:   number
  setActiveGame:(i: number) => void
}

const Ctx = createContext<GameCtx | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [activeGen,   setGen]        = useState<GameGen>(4)
  const [isEmerald,   setEmerald]    = useState(false)
  const [activeGame,  setActiveGame] = useState(0)

  const gameInfo = GAME_CATALOG.find(g => g.gen === activeGen)!

  return (
    <Ctx.Provider value={{ activeGen, gameInfo, setGen, isEmerald, setEmerald, activeGame, setActiveGame }}>
      {children}
    </Ctx.Provider>
  )
}

export function useGame() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useGame must be inside GameProvider')
  return ctx
}
