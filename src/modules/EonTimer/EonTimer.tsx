import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Settings2 } from 'lucide-react'

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function CircularProgress({ pct, danger }: { pct: number; danger: boolean }) {
  const offset = CIRCUMFERENCE * (1 - pct / 100)
  return (
    <svg width="140" height="140" className="absolute inset-0 m-auto" style={{ transform: 'rotate(-90deg)' }}>
      {/* Track */}
      <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
      {/* Progress */}
      <motion.circle
        cx="70" cy="70" r={RADIUS}
        fill="none"
        stroke={danger ? '#e94560' : 'url(#timerGrad)'}
        strokeWidth="6"
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
  const [targetFrame, setTargetFrame] = useState('')
  const [fps, setFps] = useState(60)
  const [delay, setDelay] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [totalTime, setTotalTime] = useState<number>(1)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  const intervalRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastBeepSecRef = useRef(-1)

  const playBeep = useCallback((frequency = 880, duration = 0.08, volume = 0.3) => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }, [])

  const startTimer = useCallback(() => {
    const frame = parseInt(targetFrame)
    if (!frame) return
    const totalMs = ((frame + delay) / fps) * 1000
    const endTime = Date.now() + totalMs
    setTotalTime(totalMs)
    setRunning(true)
    setFinished(false)
    lastBeepSecRef.current = -1
    playBeep(440, 0.1, 0.2)
    intervalRef.current = window.setInterval(() => {
      const remaining = endTime - Date.now()
      if (remaining <= 0) {
        clearInterval(intervalRef.current!)
        setTimeLeft(0)
        setRunning(false)
        setFinished(true)
        if (navigator.vibrate) navigator.vibrate([120, 60, 120, 60, 200])
        playBeep(1320, 0.4, 0.5)
        setTimeout(() => playBeep(1760, 0.3, 0.4), 200)
        return
      }
      setTimeLeft(remaining)
      // Pitidos en los últimos 10 segundos (uno por segundo)
      if (remaining < 10000) {
        const sec = Math.ceil(remaining / 1000)
        if (sec !== lastBeepSecRef.current) {
          lastBeepSecRef.current = sec
          const freq = sec <= 3 ? 1100 : 880
          if (navigator.vibrate) navigator.vibrate(30)
          playBeep(freq, 0.07, sec <= 3 ? 0.5 : 0.3)
        }
      }
    }, 16)
  }, [targetFrame, fps, delay, playBeep])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setTimeLeft(null)
    setFinished(false)
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const rem = ms % 1000
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}.${Math.floor(rem / 10).toString().padStart(2, '0')}`
  }

  const pct = timeLeft !== null && totalTime > 0
    ? Math.max(0, Math.min(100, (timeLeft / totalTime) * 100))
    : 100
  const danger = timeLeft !== null && timeLeft < 10000 && !finished
  const displayTime = timeLeft !== null ? formatTime(timeLeft) : '--:--.--'

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          <span className="text-gradient-accent">Eon</span>
          <span className="text-white ml-2">Timer</span>
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Sincroniza tu pulsación con el frame exacto.</p>
      </div>

      {/* Main display */}
      <motion.div
        animate={{
          boxShadow: finished
            ? '0 0 40px rgba(74,222,128,0.4)'
            : danger
            ? '0 0 30px rgba(233,69,96,0.4)'
            : '0 0 20px rgba(0,0,0,0.3)'
        }}
        className={`glass-card rounded-3xl p-8 flex flex-col items-center gap-4 relative ${
          finished ? 'border-poke-green/40' : danger ? 'border-poke-accent/40' : ''
        }`}
      >
        {/* Circular progress + display */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          <CircularProgress pct={pct} danger={danger} />
          <div className="text-center z-10">
            <AnimatePresence mode="wait">
              <motion.p
                key={displayTime}
                initial={{ opacity: 0.7, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`timer-display text-xl font-black tracking-widest ${
                  finished ? 'text-poke-green' : danger ? 'text-poke-accent' : 'text-white'
                }`}
              >
                {displayTime}
              </motion.p>
            </AnimatePresence>
            {running && (
              <p className="text-[9px] text-slate-500 mt-0.5 font-mono">{Math.round(pct)}%</p>
            )}
          </div>
        </div>

        {/* Status messages */}
        <AnimatePresence>
          {finished && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="text-center">
              <p className="text-poke-green font-black text-lg tracking-wide">¡PULSA AHORA!</p>
              <p className="text-xs text-slate-400 mt-0.5">Frame alcanzado ✅</p>
            </motion.div>
          )}
          {danger && !finished && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center">
              <motion.p
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="text-poke-accent font-bold text-sm"
              >⚠️ ¡PREPÁRATE!</motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Config */}
      <div className="glass-card rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium uppercase tracking-wider">
          <Settings2 size={12} /> Configuración
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Frame objetivo', value: targetFrame, setter: setTargetFrame, type: 'number', placeholder: '3842' },
            { label: 'Delay (frames)',  value: delay,       setter: (v: any) => setDelay(Number(v)), type: 'number', placeholder: '0' },
          ].map(({ label, value, setter, type, placeholder }) => (
            <div key={label} className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium">{label}</label>
              <input type={type} value={value} onChange={e => setter(e.target.value)}
                placeholder={placeholder}
                className="input-premium w-full rounded-xl px-3 py-2.5 text-sm" />
            </div>
          ))}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">FPS</label>
            <select value={fps} onChange={e => setFps(Number(e.target.value))}
              className="input-premium w-full rounded-xl px-3 py-2.5 text-sm">
              <option value={60}>60 fps</option>
              <option value={30}>30 fps</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={startTimer}
            disabled={running || !targetFrame}
            className="btn-success text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
            <Play size={16} fill="currentColor" /> Iniciar
          </motion.button>
          <motion.button whileTap={{ scale: 0.96 }} onClick={stopTimer}
            disabled={!running}
            className="btn-danger text-poke-accent font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
            <Square size={16} fill="currentColor" /> Parar
          </motion.button>
        </div>
      </div>
    </div>
  )
}
