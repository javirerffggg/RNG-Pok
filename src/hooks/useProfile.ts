/**
 * Perfil de usuario persistido en localStorage.
 * Guarda TID/SID, consola preferida, calibración de delay y último Pokémon.
 */
import { useLocalStorage } from './useLocalStorage'

export interface ConsoleProfile {
  id:          'GBA' | 'DS' | 'DSi' | '3DS'
  label:       string
  baseDelay:   number  // delay base de la consola (frames)
  calibration: number  // ajuste usuario en ms (+/-)
}

export const DEFAULT_PROFILES: ConsoleProfile[] = [
  { id: 'GBA',  label: 'GBA / SP',  baseDelay: 0,    calibration: 0 },
  { id: 'DS',   label: 'DS Lite',   baseDelay: 629,  calibration: 0 },
  { id: 'DSi',  label: 'DSi / XL',  baseDelay: 664,  calibration: 0 },
  { id: '3DS',  label: '3DS / 2DS', baseDelay: 1000, calibration: 0 },
]

export interface UserProfile {
  tid:            string
  sid:            string
  activeConsole:  ConsoleProfile['id']
  profiles:       ConsoleProfile[]
  lastPokemonId:  number | null
  lastPokemonName: string | null
}

const DEFAULT_PROFILE: UserProfile = {
  tid:             '',
  sid:             '',
  activeConsole:   'DS',
  profiles:        DEFAULT_PROFILES,
  lastPokemonId:   null,
  lastPokemonName: null,
}

export function useProfile() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('rng-pok-profile', DEFAULT_PROFILE)

  const updateTID  = (tid: string)  => setProfile(p => ({ ...p, tid }))
  const updateSID  = (sid: string)  => setProfile(p => ({ ...p, sid }))
  const setConsole = (id: ConsoleProfile['id']) => setProfile(p => ({ ...p, activeConsole: id }))

  const setCalibration = (id: ConsoleProfile['id'], ms: number) =>
    setProfile(p => ({
      ...p,
      profiles: p.profiles.map(c => c.id === id ? { ...c, calibration: ms } : c)
    }))

  const setLastPokemon = (id: number, name: string) =>
    setProfile(p => ({ ...p, lastPokemonId: id, lastPokemonName: name }))

  const activeProfile = profile.profiles.find(c => c.id === profile.activeConsole)!
  /** Delay efectivo = baseDelay + calibración convertida a frames (calibración en ms, fps=60) */
  const effectiveDelay = activeProfile.baseDelay + Math.round(activeProfile.calibration / (1000 / 60))

  return { profile, activeProfile, effectiveDelay, updateTID, updateSID, setConsole, setCalibration, setLastPokemon }
}
