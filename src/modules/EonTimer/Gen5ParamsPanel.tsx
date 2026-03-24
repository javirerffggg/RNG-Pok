/**
 * Gen5ParamsPanel — Panel de configuración de parámetros hardware Gen 5.
 * Solo visible cuando Gen 5 está activo.
 * Muestra VCount, Timer0, VFrame, GxStat y Refresh Rate.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, Save, Info } from 'lucide-react'
import { useProfile, type Gen5Params } from '../../hooks/useProfile'
import { HW_RANGES } from '../../utils/gen5seed'

const PARAM_INFO: Record<keyof Gen5Params, string> = {
  vcount:      'Registro vertical count. Varía por modelo y ROM. Rango típico: 0x52–0x9C.',
  timer0:      'Temporizador hardware. Cambia con la temperatura. Calibrar tras varias sesiones.',
  vframe:      'Frame vertical al inicio. Normalmente 0 ó 1.',
  gxstat:      'Estado del motor gráfico al arrancar. Casi siempre 0x06.',
  refreshRate: 'Hz reales de la pantalla. Consola real: 59.82. Emulador: 60.00.',
}

const PARAM_LABELS: Record<keyof Gen5Params, string> = {
  vcount: 'VCount', timer0: 'Timer0', vframe: 'VFrame', gxstat: 'GxStat', refreshRate: 'Refresh Rate'
}

export function Gen5ParamsPanel() {
  const { activeProfile, setGen5Params } = useProfile()
  const [local, setLocal] = useState<Gen5Params>({ ...activeProfile.gen5 })
  const [saved, setSaved] = useState(false)
  const [tooltip, setTooltip] = useState<keyof Gen5Params | null>(null)

  const hw = HW_RANGES[activeProfile.id === 'GBA' ? 'DSLite' : activeProfile.id as 'DSi'|'3DS'] ?? HW_RANGES['DSLite']

  const save = () => {
    setGen5Params(activeProfile.id, local)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const hexFields: (keyof Gen5Params)[] = ['vcount','timer0','vframe','gxstat']

  return (
    <div className="glass-card rounded-2xl p-4 space-y-4 border border-cyan-500/20">
      <div className="flex items-center gap-1.5 text-xs font-medium" style={{color:'#22d3ee'}}>
        <Cpu size={12} /> Parámetros Gen 5 (hardware)
      </div>

      <div className="grid grid-cols-2 gap-3">
        {hexFields.map(key => (
          <div key={key} className="space-y-1">
            <div className="flex items-center gap-1">
              <label className="text-[10px] text-slate-400 uppercase tracking-wider">{PARAM_LABELS[key]}</label>
              <button onMouseEnter={() => setTooltip(key)} onMouseLeave={() => setTooltip(null)}
                className="text-slate-600 hover:text-slate-400"><Info size={9}/></button>
            </div>
            {tooltip === key && (
              <p className="text-[9px] text-slate-500 italic">{PARAM_INFO[key]}</p>
            )}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={'0x' + local[key].toString(16).toUpperCase().padStart(2,'0')}
                onChange={e => {
                  const v = parseInt(e.target.value, 16)
                  if (!isNaN(v)) setLocal(p => ({...p, [key]: v}))
                }}
                className="input-premium w-full rounded-lg px-2 py-1.5 text-xs font-mono"
              />
              <span className="text-[9px] text-slate-600 whitespace-nowrap">
                {hw[key as 'vcount'|'timer0'] ? `${hw[key as 'vcount'|'timer0'][0].toString(16).toUpperCase()}–${hw[key as 'vcount'|'timer0'][1].toString(16).toUpperCase()}` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Refresh Rate */}
      <div className="space-y-1.5">
        <label className="text-[10px] text-slate-400 uppercase tracking-wider">Refresh Rate (Hz)</label>
        <div className="flex gap-2">
          {[59.82, 60.00].map(hz => (
            <motion.button key={hz} whileTap={{scale:0.93}}
              onClick={() => setLocal(p=>({...p, refreshRate: hz}))}
              className={`flex-1 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                local.refreshRate === hz ? 'text-white' : 'glass-card text-slate-500'
              }`}
              style={local.refreshRate === hz ? {background:'rgba(34,211,238,0.15)', border:'1px solid rgba(34,211,238,0.3)'} : {}}>
              {hz.toFixed(2)} Hz
              <span className="text-[9px] opacity-60 ml-1">{hz < 60 ? '(real)' : '(emu)'}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <motion.button whileTap={{scale:0.95}} onClick={save}
        className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2"
        style={{background:'rgba(34,211,238,0.15)',color:'#22d3ee',border:'1px solid rgba(34,211,238,0.3)'}}>
        <Save size={12}/> {saved ? '✓ Guardado' : 'Guardar parámetros'}
      </motion.button>
    </div>
  )
}
