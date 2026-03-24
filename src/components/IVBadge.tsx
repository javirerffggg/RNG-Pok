import { motion } from 'framer-motion'

const IV_COLOR = (iv: number) => {
  if (iv === 31) return { bg: 'rgba(255,215,0,0.15)', text: '#ffd700', border: 'rgba(255,215,0,0.4)' }
  if (iv >= 26)  return { bg: 'rgba(74,222,128,0.15)', text: '#4ade80', border: 'rgba(74,222,128,0.4)' }
  if (iv >= 20)  return { bg: 'rgba(34,211,238,0.15)', text: '#22d3ee', border: 'rgba(34,211,238,0.3)' }
  if (iv >= 10)  return { bg: 'rgba(148,163,184,0.1)',  text: '#94a3b8', border: 'rgba(148,163,184,0.2)' }
  if (iv === -1) return { bg: 'rgba(148,163,184,0.05)', text: '#475569', border: 'rgba(148,163,184,0.1)' }
  return        { bg: 'rgba(233,69,96,0.1)',  text: '#e94560', border: 'rgba(233,69,96,0.3)' }
}

const STAT_LABELS = { hp:'HP', atk:'ATK', def:'DEF', spa:'SpA', spd:'SpD', spe:'SPE' }

interface Props {
  stat:   keyof typeof STAT_LABELS
  iv:     number
  delay?: number
}

export function IVBadge({ stat, iv, delay = 0 }: Props) {
  const c = IV_COLOR(iv)
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 400, damping: 25 }}
      className="flex flex-col items-center gap-0.5 rounded-xl p-2"
      style={{ background: c.bg, border: `1px solid ${c.border}` }}
    >
      <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
        {STAT_LABELS[stat]}
      </span>
      <span className="font-mono font-black text-lg leading-none" style={{ color: c.text }}>
        {iv === -1 ? '?' : iv}
      </span>
      {iv === 31 && <span className="text-[8px]" style={{ color: c.text }}>✦ MAX</span>}
    </motion.div>
  )
}
