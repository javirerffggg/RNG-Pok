import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Settings2, SlidersHorizontal, Save } from 'lucide-react'
import { useProfile } from '../../hooks/useProfile'
import { useGame } from '../../context/GameContext'
import { AutoCalibrate } from './AutoCalibrate'
import { Gen5ParamsPanel } from './Gen5ParamsPanel'
import { ShinyEquation } from '../../components/ShinyEquation'

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function CircularProgress({ pct, danger, nearEnd }: { pct: number; danger: boolean; nearEnd: boolean }) {
  const offset = CIRCUMFERENCE * (1 - pct / 100)
  const strokeColor = danger
    ? '#e94560'
    : nearEnd
    ? '#fbbf24'
    : 'url(#timerGrad)'
  return (
    <svg width="140" height="140" className="absolute inset-0 m-auto" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      <motion.circle
        cx="70" cy="70" r={RADIUS} fill="none"
        stroke={strokeColor}
        strokeWidth={nearEnd ? 8 : 6}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        animate={{ strokeDashoffset: offset }}
        transition={{ ease: 'linear', duration: 0.016 }}
      />
      <defs>
        <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function EonTimer() {
  const { profile, activeProfile, effectiveDelay, setConsole, setCalibration } = useProfile()
  const { activeGen } = useGame()

  const [targetFrame, setTargetFrame] = useState('')
  const [seed,        setSeed]        = useState('')
  const [fps,         setFps]         = useState(60)
  const [calibInput,  setCalibInput]  = useState(String(activeProfile.calibration))
  const [showCalib,   setShowCalib]   = useState(false)
  const [timeLeft,    setTimeLeft]    = useState<number | null>(null)
  const [totalTime,   setTotalTime]   = useState(1)
  const [running,     setRunning]     = useState(false)
  const [finished,    setFinished]    = useState(false)
  const [savedCalib,  setSavedCalib]  = useState(false)

  const intervalRef    = useRef<number | null>(null)
  const audioCtxRef    = useRef<AudioContext | null>(null)
  const lastBeepSecRef = useRef(-1)
  const lastBeepMsRef  = useRef(-1)

  useEffect(() => { setCalibInput(String(activeProfile.calibration)) }, [activeProfile.id, activeProfile.calibration])

  /** Beep con frecuencia y duración precisos */
  const playBeep = useCallback((freq = 880, dur = 0.08, vol = 0.3, type: OscillatorType = 'sine') => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed')
      audioCtxRef.current = new AudioContext()
    const ctx  = audioCtxRef.current
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur)
  }, [])

  /**
   * Audio progresivo de alta precisión (Feedback Acústico-Neuromotor):
   * - 10s–5s: pitido por segundo @ 440Hz
   * - 5s–2s: pitido por segundo @ 660Hz, más intenso
   * - 2s–0.5s: pitidos cada 250ms @ 880Hz (metrónomo visual-auditivo)
   * - 0.5s–0: tono continuo @ 1320Hz hasta impacto
   */
  const handleCountdown = useCallback((remaining: number) => {
    if (remaining >= 10000) return

    // Zona 10s-5s: 1 pitido/segundo @ 440Hz suave
    if (remaining > 5000) {
      const sec = Math.ceil(remaining / 1000)
      if (sec !== lastBeepSecRef.current) {
        lastBeepSecRef.current = sec
        if (navigator.vibrate) navigator.vibrate(20)
        playBeep(440, 0.06, 0.2, 'sine')
      }
      return
    }

    // Zona 5s-2s: 1 pitido/segundo @ 660Hz más alto
    if (remaining > 2000) {
      const sec = Math.ceil(remaining / 1000)
      if (sec !== lastBeepSecRef.current) {
        lastBeepSecRef.current = sec
        if (navigator.vibrate) navigator.vibrate(30)
        playBeep(660, 0.07, 0.35, 'sine')
      }
      return
    }

    // Zona 2s-500ms: pitidos cada 250ms @ 880Hz (metrónomo denso)
    if (remaining > 500) {
      const slot = Math.floor(remaining / 250)
      if (slot !== lastBeepMsRef.current) {
        lastBeepMsRef.current = slot
        if (navigator.vibrate) navigator.vibrate(15)
        playBeep(880, 0.05, 0.45, 'square')
      }
      return
    }

    // Zona 500ms-0: tono continuo ascendente @ 1100–1760Hz
    const slot500 = Math.floor(remaining / 50)
    if (slot500 !== lastBeepMsRef.current) {
      lastBeepMsRef.current = slot500
      const freq = 1100 + Math.round((1 - remaining / 500) * 660)
      playBeep(freq, 0.06, 0.6, 'sawtooth')
    }
  }, [playBeep])

  const startTimer = useCallback(() => {
    const frame = parseInt(targetFrame)
    if (!frame) return
    const totalMs = ((frame + effectiveDelay) / fps) * 1000
    const endTime = Date.now() + totalMs
    setTotalTime(totalMs); setRunning(true); setFinished(false)
    lastBeepSecRef.current = -1; lastBeepMsRef.current = -1
    playBeep(440, 0.1, 0.2)
    intervalRef.current = window.setInterval(() => {
      const remaining = endTime - Date.now()
      if (remaining <= 0) {
        clearInterval(intervalRef.current!)
        setTimeLeft(0); setRunning(false); setFinished(true)
        if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 200])
        playBeep(1320, 0.15, 0.6, 'sine')
        setTimeout(() => playBeep(1760, 0.3, 0.5, 'sine'), 150)
        setTimeout(() => playBeep(2093, 0.4, 0.4, 'sine'), 300)
        return
      }
      setTimeLeft(remaining)
      handleCountdown(remaining)
    }, 16)
  }, [targetFrame, fps, effectiveDelay, playBeep, handleCountdown])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false); setTimeLeft(null); setFinished(false)
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const saveCalibration = () => {
    const ms = parseInt(calibInput) || 0
    setCalibration(activeProfile.id, ms)
    setSavedCalib(true)
    setTimeout(() => setSavedCalib(false), 1500)
  }

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000), m = Math.floor(s / 60), rem = ms % 1000
    return `${m.toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}.${Math.floor(rem/10).toString().padStart(2,'0')}`
  }

  const pct     = timeLeft !== null && totalTime > 0 ? Math.max(0, Math.min(100, (timeLeft / totalTime) * 100)) : 100
  const danger  = timeLeft !== null && timeLeft < 2000 && !finished
  const nearEnd = timeLeft !== null && timeLeft < 10000 && timeLeft >= 2000 && !finished
  const display = timeLeft !== null ? formatTime(timeLeft) : '--:--.--'
  const CONSOLES = profile.profiles

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient-accent">Eon</span>
          <span className="text-white ml-2">Timer</span>
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Sincroniza tu pulsación con el frame exacto.</p>
      </div>

      {/* Main display — metrónomo visual adaptativo */}
      <motion.div
        animate={{
          boxShadow: finished
            ? '0 0 40px rgba(74,222,128,0.5)'
            : danger
            ? '0 0 35px rgba(233,69,96,0.5)'
            : nearEnd
            ? '0 0 25px rgba(251,191,36,0.3)'
            : '0 0 20px rgba(0,0,0,0.3)'
        }}
        className={`glass-card rounded-3xl p-8 flex flex-col items-center gap-4 relative ${
          finished ? 'border-poke-green/40' : danger ? 'border-poke-accent/40' : nearEnd ? 'border-yellow-400/30' : ''
        }`}
      >
        {/* Barrón de color (gradiente Rojo->Amarillo->Verde) */}
        {(nearEnd || danger) && (
          <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl overflow-hidden">
            <motion.div
              animate={{ width: `${100 - pct}%` }}
              className="h-full"
              style={{
                background: danger
                  ? 'linear-gradient(90deg,#e94560,#ff6b35)'
                  : 'linear-gradient(90deg,#22c55e,#fbbf24)'
              }}
            />
          </div>
        )}

        <div className="relative w-36 h-36 flex items-center justify-center">
          <CircularProgress pct={pct} danger={danger} nearEnd={nearEnd} />
          <div className="text-center z-10">
            <AnimatePresence mode="wait">
              <motion.p key={display} initial={{opacity:0.7,scale:0.97}} animate={{opacity:1,scale:1}}
                className={`timer-display text-xl font-black tracking-widest ${
                  finished ? 'text-poke-green' : danger ? 'text-poke-accent' : nearEnd ? 'text-yellow-300' : 'text-white'
                }`}>{display}
              </motion.p>
            </AnimatePresence>
            {running && <p className="text-[9px] text-slate-500 mt-0.5 font-mono">{Math.round(pct)}%</p>}
          </div>
        </div>

        <AnimatePresence>
          {finished && (
            <motion.div initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="text-center">
              <p className="text-poke-green font-black text-lg tracking-wide">¡PULSA AHORA!</p>
              <p className="text-xs text-slate-400 mt-0.5">Frame alcanzado ✅</p>
            </motion.div>
          )}
          {danger && !finished && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center">
              <motion.p animate={{scale:[1,1.08,1]}} transition={{repeat:Infinity,duration:0.25}}
                className="text-poke-accent font-black text-base">⚠️ AHORA</motion.p>
            </motion.div>
          )}
          {nearEnd && !danger && !finished && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center">
              <motion.p animate={{opacity:[1,0.6,1]}} transition={{repeat:Infinity,duration:0.5}}
                className="text-yellow-300 font-bold text-sm">⏳ ¡PREPÁRATE!</motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Selector de consola + calibración */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium uppercase tracking-wider">
            <Settings2 size={12} /> Consola
          </div>
          <button onClick={() => setShowCalib(p=>!p)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-poke-violet transition-colors">
            <SlidersHorizontal size={12}/> Calibrar
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {CONSOLES.map(c => (
            <motion.button key={c.id} whileTap={{scale:0.94}} onClick={() => setConsole(c.id)}
              className={`py-2.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                profile.activeConsole === c.id ? 'btn-primary text-white' : 'glass-card-hover text-slate-400'
              }`}>
              <span className="font-bold text-sm">{c.id}</span>
              <span className="text-[9px] opacity-60">{c.baseDelay}f</span>
              {c.calibration !== 0 && (
                <span className="text-[8px]" style={{color: c.calibration>0?'#4ade80':'#f87171'}}>
                  {c.calibration>0?'+':''}{c.calibration}ms
                </span>
              )}
            </motion.button>
          ))}
        </div>
        <AnimatePresence>
          {showCalib && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
              className="overflow-hidden">
              <div className="glass-card rounded-xl p-3 space-y-3 border border-poke-violet/20">
                <p className="text-xs text-slate-400">
                  Ajusta el delay de <span className="text-poke-violet font-semibold">{activeProfile.label}</span>.
                  Si siempre llegas <strong>tarde</strong>, pon valor <strong>negativo</strong>. Si llegas <strong>pronto</strong>, positivo.
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase tracking-wider">Calibración (ms)</label>
                    <input type="number" value={calibInput} onChange={e=>setCalibInput(e.target.value)}
                      min="-500" max="500" step="1" placeholder="0"
                      className="input-premium w-full rounded-xl px-3 py-2 text-sm font-mono" />
                  </div>
                  <div className="flex-1 glass-card rounded-xl p-2.5 text-center">
                    <p className="text-[10px] text-slate-500">Delay efectivo</p>
                    <p className="timer-display text-lg font-bold text-poke-violet">
                      {effectiveDelay}<span className="text-xs text-slate-500 ml-1">f</span>
                    </p>
                    <p className="text-[9px] text-slate-600">({Math.round(effectiveDelay/fps*1000)}ms)</p>
                  </div>
                </div>
                <input type="range" min="-500" max="500" step="1" value={calibInput||'0'}
                  onChange={e=>setCalibInput(e.target.value)} className="w-full accent-violet-500" />
                <div className="flex justify-between text-[9px] text-slate-600">
                  <span>-500ms (tarde)</span><span>0</span><span>+500ms (pronto)</span>
                </div>
                <motion.button whileTap={{scale:0.95}} onClick={saveCalibration}
                  className="btn-primary w-full py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2">
                  <Save size={13}/> {savedCalib?'✓ Guardado':'Guardar calibración'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Frame config */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium uppercase tracking-wider">
          <Settings2 size={12}/> Configuración del Timer
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Frame objetivo</label>
            <input type="number" value={targetFrame} onChange={e=>setTargetFrame(e.target.value)}
              placeholder="3842" className="input-premium w-full rounded-xl px-3 py-2.5 text-sm" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">FPS</label>
            <select value={fps} onChange={e=>setFps(Number(e.target.value))}
              className="input-premium w-full rounded-xl px-3 py-2.5 text-sm">
              <option value={60}>60 fps (GBA/DS)</option>
              <option value={30}>30 fps</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium">Semilla (para autocalibración)</label>
          <input type="text" value={seed} onChange={e=>setSeed(e.target.value)}
            placeholder="0x..." className="input-premium w-full rounded-xl px-3 py-2.5 text-sm font-mono" />
        </div>
        {targetFrame && (
          <div className="glass-card rounded-xl px-3 py-2 flex justify-between text-xs text-slate-500">
            <span>Tiempo total estimado</span>
            <span className="font-mono text-slate-300">{((parseInt(targetFrame)+effectiveDelay)/fps).toFixed(2)}s</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <motion.button whileTap={{scale:0.96}} onClick={startTimer} disabled={running||!targetFrame}
            className="btn-success text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
            <Play size={16} fill="currentColor"/> Iniciar
          </motion.button>
          <motion.button whileTap={{scale:0.96}} onClick={stopTimer} disabled={!running}
            className="btn-danger text-poke-accent font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
            <Square size={16} fill="currentColor"/> Parar
          </motion.button>
        </div>
      </div>

      {/* Autocalibración dinámica */}
      {targetFrame && seed && (
        <AutoCalibrate
          targetFrame={parseInt(targetFrame)}
          seed={parseInt(seed, 16)}
          fps={fps}
        />
      )}

      {/* Variables Gen 5 */}
      {activeGen === 5 && <Gen5ParamsPanel />}

      {/* Ecuación Shiny visual */}
      <ShinyEquation
        tid={parseInt(profile.tid) || 0}
        sid={parseInt(profile.sid) || 0}
        fps={fps}
      />
    </div>
  )
}
