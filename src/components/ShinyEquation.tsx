/**
 * ShinyEquation — Panel interactivo que muestra la ecuación XOR de la shiny check
 * con desglose bit a bit animado, probabilidad dinámica y simulador de frames.
 */
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Binary, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { isShiny, getShinyValue } from '../utils/shiny'
import { lcgNext, calcPID } from '../utils/lcg'

interface Props {
  tid: number
  sid: number
  fps?: number
}

function toBin(n: number, bits = 16): string {
  return n.toString(2).padStart(bits, '0')
}

function BitRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const bin = toBin(value)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-500 w-16 text-right font-mono shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {bin.split('').map((bit, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.015 }}
            className={`text-[9px] font-mono w-3 text-center rounded ${
              highlight && bit === '1' ? 'text-yellow-400 font-bold' :
              bit === '1' ? 'text-violet-300' : 'text-slate-700'
            }`}>{bit}</motion.span>
        ))}
      </div>
      <span className="text-[10px] font-mono text-slate-600">({value.toString(16).toUpperCase().padStart(4,'0')}h)</span>
    </div>
  )
}

export function ShinyEquation({ tid, sid, fps = 60 }: Props) {
  const [pid,         setPid]         = useState(0x1A2B3C4D)
  const [expanded,    setExpanded]    = useState(false)
  const [showSim,     setShowSim]     = useState(false)
  const [simFrames,   setSimFrames]   = useState<{frame:number;pid:number;sv:number}[]>([])
  const [simMinutes,  setSimMinutes]  = useState(10)

  const pidH  = (pid >>> 16) & 0xFFFF
  const pidL  =  pid & 0xFFFF
  const sv    = tid ^ sid ^ pidH ^ pidL
  const shiny = sv < 8

  const xorStep1 = tid ^ sid
  const xorStep2 = xorStep1 ^ pidH
  const xorFinal = xorStep2 ^ pidL

  const runSim = useCallback(() => {
    const maxFrames = Math.round(simMinutes * 60 * fps)
    const results: {frame:number;pid:number;sv:number}[] = []
    let rng = 0x12345678 >>> 0
    for (let f = 0; f < maxFrames; f++) {
      const r1 = lcgNext(rng)
      const r2 = lcgNext(r1)
      const p  = calcPID(r1, r2)
      const s  = getShinyValue(p, tid, sid)
      if (s < 8) results.push({ frame: f, pid: p, sv: s })
      rng = r1
      if (results.length >= 50) break
    }
    setSimFrames(results)
  }, [tid, sid, fps, simMinutes])

  return (
    <div className="space-y-3">
      <div className="glass-card rounded-2xl p-4 space-y-4">
        {/* Header */}
        <button onClick={() => setExpanded(p=>!p)} className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-yellow-400" />
            <span className="text-sm font-bold text-white">Ecuación Shiny</span>
            <span className="text-[10px] text-slate-500">XOR desglose bit a bit</span>
          </div>
          {expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
        </button>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
              className="space-y-4 overflow-hidden">

              {/* PID input interactivo */}
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">PID (prueba cualquier valor)</label>
                  <input
                    type="text"
                    value={'0x' + pid.toString(16).toUpperCase().padStart(8,'0')}
                    onChange={e => { const v = parseInt(e.target.value,16); if(!isNaN(v)) setPid(v>>>0) }}
                    className="input-premium w-full rounded-xl px-3 py-2 text-sm font-mono"
                  />
                </div>
                <motion.div
                  animate={{ scale: shiny ? [1,1.15,1] : 1, opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-center ${
                    shiny
                      ? 'bg-yellow-400/20 border border-yellow-400/50'
                      : 'bg-white/5 border border-white/10'
                  }`}>
                  <span className="text-lg">{shiny ? '\u2728' : '\u2b1b'}</span>
                  <span className={`text-[9px] font-bold ${shiny ? 'text-yellow-400' : 'text-slate-600'}`}>
                    {shiny ? 'SHINY' : 'NORMAL'}
                  </span>
                </motion.div>
              </div>

              {/* Desglose binario */}
              <div className="glass-card rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-2">
                  <Binary size={10}/> Operación XOR paso a paso
                </div>
                <BitRow label="TID" value={tid} />
                <div className="flex items-center gap-2 pl-[72px]">
                  <span className="text-[10px] text-yellow-600 font-mono">XOR</span>
                </div>
                <BitRow label="SID" value={sid} />
                <div className="border-t border-white/5 pt-1">
                  <BitRow label="T\u2295S" value={xorStep1} highlight />
                </div>
                <div className="flex items-center gap-2 pl-[72px]">
                  <span className="text-[10px] text-yellow-600 font-mono">XOR</span>
                </div>
                <BitRow label="PID\u2191" value={pidH} />
                <div className="border-t border-white/5 pt-1">
                  <BitRow label="paso2" value={xorStep2} highlight />
                </div>
                <div className="flex items-center gap-2 pl-[72px]">
                  <span className="text-[10px] text-yellow-600 font-mono">XOR</span>
                </div>
                <BitRow label="PID\u2193" value={pidL} />
                <div className="border-t border-white/10 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-16 text-right font-mono shrink-0">SV =</span>
                    <motion.span
                      key={xorFinal}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-sm font-black font-mono ${
                        xorFinal < 8 ? 'text-yellow-400' : 'text-slate-300'
                      }`}>
                      {xorFinal}
                    </motion.span>
                    <span className={`text-xs ${
                      xorFinal < 8 ? 'text-yellow-400' : 'text-slate-500'
                    }`}>
                      {xorFinal < 8 ? '< 8 \u2192 \u00a1SHINY!' : '\u2265 8 \u2192 Normal'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info probabilidad */}
              <div className="glass-card rounded-xl p-3 flex gap-3 items-start">
                <Sparkles size={12} className="text-yellow-400 mt-0.5 shrink-0"/>
                <div className="text-xs text-slate-400 space-y-0.5">
                  <p><span className="text-white font-semibold">1/8192</span> frames generan un SV &lt; 8.</p>
                  <p>Tu TID+SID = <span className="font-mono text-violet-300">{(tid^sid).toString(16).toUpperCase().padStart(4,'0')}h</span>.  {' '}
                    Los PID con SV=0 son los más raros ({' '}
                    <span className="text-yellow-400">1/65536</span>).
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Algunos TID/SID tienen más colisiones XOR naturales, haciendoles estadísticamente mejores.
                  </p>
                </div>
              </div>

              {/* Simulador de probabilidad */}
              <button onClick={() => setShowSim(p=>!p)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                <BarChart3 size={12}/> Simulador de frames shiny
                <span className="text-[10px] text-slate-600">{showSim?'\u25b2':'\u25bc'}</span>
              </button>

              <AnimatePresence>
                {showSim && (
                  <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
                    className="overflow-hidden space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] text-slate-500 uppercase tracking-wider">Minutos a simular</label>
                        <input type="number" min="1" max="60" value={simMinutes}
                          onChange={e=>setSimMinutes(parseInt(e.target.value)||10)}
                          className="input-premium w-full rounded-lg px-3 py-2 text-sm" />
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        <p>{(simMinutes*60*fps).toLocaleString()}</p>
                        <p className="text-[9px]">frames totales</p>
                      </div>
                    </div>
                    <motion.button whileTap={{scale:0.97}} onClick={runSim}
                      className="btn-primary w-full text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2">
                      <BarChart3 size={14}/> Simular
                    </motion.button>
                    {simFrames.length > 0 && (
                      <div className="glass-card rounded-xl overflow-hidden">
                        <div className="px-3 py-2 border-b border-white/5 text-xs text-slate-400">
                          {simFrames.length} frames shiny en ~{simMinutes}min
                          <span className="ml-2 text-[10px] text-slate-600">
                            (~1 cada {Math.round(simMinutes*60*fps/simFrames.length).toLocaleString()} frames)
                          </span>
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="text-[9px] text-slate-600 uppercase">
                                <th className="px-3 py-1.5 text-left">Frame</th>
                                <th className="px-3 py-1.5 text-left">PID</th>
                                <th className="px-3 py-1.5 text-left">SV</th>
                              </tr>
                            </thead>
                            <tbody>
                              {simFrames.map(f => (
                                <tr key={f.frame} className="border-t border-white/5">
                                  <td className="px-3 py-1.5 font-mono text-white">#{f.frame.toLocaleString()}</td>
                                  <td className="px-3 py-1.5 font-mono text-violet-400 text-[10px]">
                                    {f.pid.toString(16).toUpperCase().padStart(8,'0')}
                                  </td>
                                  <td className="px-3 py-1.5">
                                    <span className="text-yellow-400 font-bold">{f.sv}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
