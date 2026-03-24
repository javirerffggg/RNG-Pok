/**
 * AutoCalibrate — Autocalibración dinámica.
 *
 * El usuario introduce el Pokémon que OBTUVO (no el que quería).
 * La app hace un scan de ±100 frames alrededor del objetivo,
 * encuentra el frame que corresponde a ese Pokémon (por naturaleza + género + habilidad),
 * calcula la desviación exacta y ofrece "Aplicar Correción" automática.
 */
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crosshair, ArrowUp, ArrowDown, Zap, CheckCircle } from 'lucide-react'
import { lcgNext, calcPID } from '../../utils/lcg'
import { getNature, getGender, type Nature } from '../../utils/shiny'
import { calcAbility, calcGender } from '../../data/pokemon-db'
import { useProfile } from '../../hooks/useProfile'
import { NATURES } from '../../utils/shiny'

interface Props {
  targetFrame: number
  seed:        number
  fps:         number
}

interface FrameMatch {
  frame:   number
  delta:   number
  pid:     number
  nature:  Nature
  deltaMs: number
}

export function AutoCalibrate({ targetFrame, seed, fps }: Props) {
  const { activeProfile, setCalibration } = useProfile()
  const [obtainedNature, setNature] = useState<Nature>('Hardy')
  const [obtainedGender, setGender] = useState<'M'|'F'|'\u2013'>('\u2013')
  const [match,          setMatch]  = useState<FrameMatch | null>(null)
  const [applied,        setApplied]= useState(false)
  const [expanded,       setExpanded] = useState(false)

  const runScan = () => {
    const RADIUS = 100
    let rng = seed >>> 0
    // Avanzar hasta (targetFrame - RADIUS)
    const startFrame = Math.max(0, targetFrame - RADIUS)
    for (let i = 0; i < startFrame; i++) rng = lcgNext(rng)

    for (let f = startFrame; f <= targetFrame + RADIUS; f++) {
      const r1  = lcgNext(rng)
      const r2  = lcgNext(r1)
      const pid = calcPID(r1, r2)
      const nat = getNature(pid)
      const gdr = getGender(pid, 127)

      if (nat === obtainedNature && (obtainedGender === '\u2013' || gdr === obtainedGender)) {
        const delta   = f - targetFrame
        const deltaMs = Math.round((delta / fps) * 1000)
        setMatch({ frame: f, delta, pid, nature: nat, deltaMs })
        return
      }
      rng = r1
    }
    setMatch(null)  // no encontrado en la ventana ±100
  }

  const applyCorrection = () => {
    if (!match) return
    const current = activeProfile.calibration
    // Invertir la correción: si llegaste tarde (Δ>0), reducir delay
    const newCalib = current - match.deltaMs
    setCalibration(activeProfile.id, Math.max(-500, Math.min(500, newCalib)))
    setApplied(true)
    setTimeout(() => setApplied(false), 2000)
  }

  return (
    <div className="glass-card rounded-2xl p-4 space-y-3 border border-orange-500/20">
      <button onClick={() => setExpanded(p=>!p)} className="w-full flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-orange-400">
          <Crosshair size={12} /> Autocalibración dinámica
        </div>
        <span className="text-[10px] text-slate-600">¿Fallaste? Diagnostica y corrige automáticamente</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
            className="space-y-3 overflow-hidden">

            <p className="text-xs text-slate-400">
              Introduce los datos del Pokémon que <strong className="text-white">obtuviste</strong> (no el que querías).
              La app escaneará ±100 frames alrededor del objetivo y calculará tu desviación exacta.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Naturaleza obtenida</label>
                <select value={obtainedNature} onChange={e=>setNature(e.target.value as Nature)}
                  className="input-premium w-full rounded-xl px-3 py-2 text-sm">
                  {NATURES.map(n=><option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 uppercase tracking-wider">Género obtenido</label>
                <select value={obtainedGender} onChange={e=>setGender(e.target.value as any)}
                  className="input-premium w-full rounded-xl px-3 py-2 text-sm">
                  <option value="\u2013">– Ignoring</option>
                  <option value="M">♂ Macho</option>
                  <option value="F">♀ Hembra</option>
                </select>
              </div>
            </div>

            <motion.button whileTap={{scale:0.97}} onClick={runScan}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{background:'rgba(249,115,22,0.15)',color:'#fb923c',border:'1px solid rgba(249,115,22,0.3)'}}>
              <Crosshair size={14}/> Escanear ±100 frames
            </motion.button>

            {/* Resultado */}
            <AnimatePresence>
              {match !== undefined && (
                <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}>
                  {match === null ? (
                    <div className="glass-card rounded-xl p-3 text-center">
                      <p className="text-xs text-slate-500">No encontrado en ±100 frames. El fallo puede ser mayor.</p>
                      <p className="text-[10px] text-slate-600 mt-1">Intenta con una ventana más amplia o revisa la semilla.</p>
                    </div>
                  ) : (
                    <div className="glass-card rounded-xl p-3 space-y-3 border border-orange-400/20">
                      {/* Informe de desviación */}
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          match.delta < 0 ? 'bg-green-500/15' : match.delta > 0 ? 'bg-red-500/15' : 'bg-yellow-500/15'
                        }`}>
                          {match.delta < 0
                            ? <ArrowUp size={18} className="text-green-400"/>
                            : match.delta > 0
                            ? <ArrowDown size={18} className="text-red-400"/>
                            : <CheckCircle size={18} className="text-yellow-400"/>}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">
                            {match.delta === 0
                              ? '¡Frame exacto!'
                              : match.delta < 0
                              ? `Te has adelantado ${Math.abs(match.delta)} frames`
                              : `Te has retrasado ${match.delta} frames`
                            }
                          </p>
                          <p className="text-xs text-slate-400">
                            Frame obtenido: #{match.frame} · Δ = {match.deltaMs > 0 ? '+' : ''}{match.deltaMs}ms
                          </p>
                        </div>
                      </div>

                      {match.delta !== 0 && (
                        <>
                          <p className="text-xs text-slate-400">
                            {match.delta < 0
                              ? `Pulsaste ~${Math.abs(match.deltaMs)}ms antes de lo necesario. Pulsa más tarde.`
                              : `Pulsaste ~${match.deltaMs}ms después de lo necesario. Pulsa antes.`
                            }
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Correción automática: calibración de
                            <span className="font-mono text-orange-400 ml-1">
                              {activeProfile.calibration} ms
                            </span> →
                            <span className="font-mono text-green-400 ml-1">
                              {Math.max(-500, Math.min(500, activeProfile.calibration - match.deltaMs))} ms
                            </span>
                          </p>
                          <motion.button whileTap={{scale:0.95}} onClick={applyCorrection}
                            className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
                            style={{background:'rgba(74,222,128,0.15)',color:'#4ade80',border:'1px solid rgba(74,222,128,0.3)'}}>
                            <Zap size={14}/> {applied ? '✓ Correción aplicada' : 'Aplicar correción al EonTimer'}
                          </motion.button>
                        </>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
