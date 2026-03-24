import { useState, useRef, useCallback, useEffect } from 'react'

export function EonTimer() {
  const [targetFrame, setTargetFrame] = useState('')
  const [fps, setFps] = useState(60)
  const [delay, setDelay] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)

  const intervalRef = useRef<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playBeep = useCallback((frequency = 880, duration = 0.08) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }, [])

  const startTimer = useCallback(() => {
    const frame = parseInt(targetFrame)
    if (!frame) return
    const totalMs = ((frame + delay) / fps) * 1000
    const endTime = Date.now() + totalMs

    setRunning(true)
    setFinished(false)

    intervalRef.current = window.setInterval(() => {
      const remaining = endTime - Date.now()
      if (remaining <= 0) {
        clearInterval(intervalRef.current!)
        setTimeLeft(0)
        setRunning(false)
        setFinished(true)
        playBeep(1320, 0.3)
        return
      }
      setTimeLeft(remaining)
      // Pitidos en los últimos 10 segundos
      if (remaining < 10000 && remaining % 1000 < 50) playBeep()
    }, 16)
  }, [targetFrame, fps, delay, playBeep])

  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setRunning(false)
    setTimeLeft(null)
  }, [])

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000)
    const m = Math.floor(s / 60)
    const rem = ms % 1000
    return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}.${Math.floor(rem / 10).toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <h2 className="text-poke-shiny font-bold text-xl">⏱️ Eon Timer</h2>
      <p className="text-slate-400 text-sm">Sincroniza tu pulsación con el frame exacto.</p>

      <div className="bg-poke-mid rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Frame objetivo</label>
            <input
              type="number"
              value={targetFrame}
              onChange={e => setTargetFrame(e.target.value)}
              placeholder="ej: 3842"
              className="w-full bg-poke-card text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-poke-accent outline-none"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">FPS</label>
            <select
              value={fps}
              onChange={e => setFps(Number(e.target.value))}
              className="w-full bg-poke-card text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-poke-accent outline-none"
            >
              <option value={60}>60 fps</option>
              <option value={30}>30 fps</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Delay (frames)</label>
            <input
              type="number"
              value={delay}
              onChange={e => setDelay(Number(e.target.value))}
              className="w-full bg-poke-card text-white rounded-lg px-3 py-2 text-sm border border-slate-700 focus:border-poke-accent outline-none"
            />
          </div>
        </div>

        {/* Display principal */}
        <div className={`rounded-2xl p-6 text-center border-2 transition-all ${
          finished ? 'border-poke-green bg-green-950' :
          running && timeLeft! < 10000 ? 'border-poke-accent bg-red-950 animate-pulse' :
          'border-poke-card bg-poke-card'
        }`}>
          <div className="font-mono text-5xl font-bold tracking-wider text-white">
            {timeLeft === null ? '--:--.--' : formatTime(timeLeft)}
          </div>
          {finished && <p className="text-poke-green font-bold mt-2">¡PULSA AHORA! ✅</p>}
          {running && timeLeft! < 10000 && !finished && (
            <p className="text-poke-accent font-bold mt-2 animate-pulse">⚠️ ¡PREPÁRATE!</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={startTimer}
            disabled={running || !targetFrame}
            className="bg-poke-green hover:bg-green-400 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition-colors"
          >
            ▶ Iniciar
          </button>
          <button
            onClick={stopTimer}
            disabled={!running}
            className="bg-poke-accent hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors"
          >
            ⬛ Parar
          </button>
        </div>
      </div>
    </div>
  )
}
