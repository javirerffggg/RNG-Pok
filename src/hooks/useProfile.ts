/**
 * Perfil de usuario persistido en localStorage.
 * Incluye TID/SID, perfiles de consola con calibración
 * y parámetros Gen 5 (VCount, Timer0, VFrame, GxStat).
 */
import { useLocalStorage } from './useLocalStorage'

export interface Gen5Params {
  vcount:  number
  timer0:  number
  vframe:  number
  gxstat:  number
  /** Frecuencia real del hardware (59.82 real vs 60.00 emulador) */
  refreshRate: number
}

export interface ConsoleProfile {
  id:          'GBA' | 'DS' | 'DSi' | '3DS'
  label:       string
  baseDelay:   number
  calibration: number
  gen5:        Gen5Params
}

export const DEFAULT_PROFILES: ConsoleProfile[] = [
  {
    id: 'GBA',  label: 'GBA / SP',  baseDelay: 0,    calibration: 0,
    gen5: { vcount: 0x00, timer0: 0x00, vframe: 0, gxstat: 0x06, refreshRate: 59.82 }
  },
  {
    id: 'DS',   label: 'DS Lite',   baseDelay: 629,  calibration: 0,
    gen5: { vcount: 0x5F, timer0: 0x18, vframe: 0, gxstat: 0x06, refreshRate: 59.82 }
  },
  {
    id: 'DSi',  label: 'DSi / XL',  baseDelay: 664,  calibration: 0,
    gen5: { vcount: 0x82, timer0: 0x60, vframe: 0, gxstat: 0x06, refreshRate: 59.82 }
  },
  {
    id: '3DS',  label: '3DS / 2DS', baseDelay: 1000, calibration: 0,
    gen5: { vcount: 0x52, timer0: 0xC7, vframe: 0, gxstat: 0x06, refreshRate: 59.82 }
  },
]

export interface UserProfile {
  tid:              string
  sid:              string
  activeConsole:    ConsoleProfile['id']
  profiles:         ConsoleProfile[]
  lastPokemonId:    number | null
  lastPokemonName:  string | null
}

const DEFAULT_PROFILE: UserProfile = {
  tid: '', sid: '',
  activeConsole:  'DS',
  profiles:       DEFAULT_PROFILES,
  lastPokemonId:  null,
  lastPokemonName: null,
}

export function useProfile() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('rng-pok-profile', DEFAULT_PROFILE)

  const updateTID  = (tid: string)  => setProfile(p => ({ ...p, tid }))
  const updateSID  = (sid: string)  => setProfile(p => ({ ...p, sid }))
  const setConsole = (id: ConsoleProfile['id']) => setProfile(p => ({ ...p, activeConsole: id }))

  const setCalibration = (id: ConsoleProfile['id'], ms: number) =>
    setProfile(p => ({ ...p, profiles: p.profiles.map(c => c.id === id ? { ...c, calibration: ms } : c) }))

  const setGen5Params = (id: ConsoleProfile['id'], params: Partial<Gen5Params>) =>
    setProfile(p => ({
      ...p,
      profiles: p.profiles.map(c =>
        c.id === id ? { ...c, gen5: { ...c.gen5, ...params } } : c
      )
    }))

  const setLastPokemon = (id: number, name: string) =>
    setProfile(p => ({ ...p, lastPokemonId: id, lastPokemonName: name }))

  const activeProfile  = profile.profiles.find(c => c.id === profile.activeConsole)!
  const effectiveDelay = activeProfile.baseDelay + Math.round(activeProfile.calibration / (1000 / 60))

  return { profile, activeProfile, effectiveDelay, updateTID, updateSID, setConsole, setCalibration, setGen5Params, setLastPokemon }
}
